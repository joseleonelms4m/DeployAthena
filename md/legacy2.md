# Manual de Configuración — DeployAthena

> Sistema de despliegue automático de Athena en múltiples HUBs via SSH.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Configuración de credenciales SSH (`config.js`)](#2-configuración-de-credenciales-ssh-configjs)
3. [Configuración de máquinas destino (`hubs.csv`)](#3-configuración-de-máquinas-destino-hubscsv)
4. [Configuración de timeouts (`auto-deploy2.js`)](#4-configuración-de-timeouts-auto-deploy2js)
5. [Gestión del estado (`state.json`)](#5-gestión-del-estado-statejson)
6. [Verificación del paquete (`athena.zip`)](#6-verificación-del-paquete-athenazip)
7. [Configuración por escenario](#7-configuración-por-escenario)
8. [Solución de problemas de configuración](#8-solución-de-problemas-de-configuración)

---

## 1. Requisitos previos

Antes de configurar el sistema, verifica que tienes instalado lo siguiente en la máquina desde la que vas a ejecutar el despliegue:

### Node.js

```bash
node --version   # Requiere 14.0 o superior
npm --version    # Viene incluido con Node.js
```

Si no está instalado, descárgalo desde [https://nodejs.org](https://nodejs.org) (versión LTS recomendada).

### Dependencias del proyecto

Ejecuta esto una sola vez en la carpeta `DeployAthena/`:

```bash
npm install
```

Esto instala `node-ssh`, la única dependencia del sistema.

### Conectividad de red

Verifica que la máquina local puede alcanzar los HUBs por SSH (puerto 22):

```bash
# Ejemplo: verificar alcance a un HUB
ssh ms4m@10.112.87.44
```

### Archivo de paquete

Confirma que `athena.zip` existe en la carpeta del proyecto:

```bash
ls -lh athena.zip   # Debe mostrar ~431 MB
```

---

## 2. Configuración de credenciales SSH (`config.js`)

Este es el archivo de configuración principal del sistema.

**Ubicación:** `DeployAthena/config.js`

### Estructura del archivo

```javascript
module.exports = {
  username: "ms4m",           // Usuario SSH de los HUBs
  password: "-----",           // Contraseña SSH
  remotePath: "/home/ms4m",   // Ruta destino en cada HUB
  maxAttempts: 5,             // Intentos máximos por HUB
};
```

### Descripción de cada campo

| Campo | Tipo | Descripción | Valor por defecto |
|---|---|---|---|
| `username` | string | Usuario con el que se conecta por SSH a cada HUB | `"ms4m"` |
| `password` | string | Contraseña del usuario SSH | `"-----"` |
| `remotePath` | string | Directorio en el HUB donde se sube y descomprime `athena.zip` | `"/home/ms4m"` |
| `maxAttempts` | number | Número máximo de intentos antes de marcar un HUB como fallido definitivamente | `5` |

### Como editar

Abre `config.js` y reemplaza los valores segun tu entorno:

```javascript
module.exports = {
  username: "tu_usuario",          // Cambiar por el usuario real de los HUBs
  password: "tu_contraseña",       // Cambiar por la contraseña real
  remotePath: "/home/tu_usuario",  // Ajustar si el directorio home es diferente
  maxAttempts: 3,                  // Reducir si quieres menos reintentos
};
```

### Recomendaciones de seguridad

### Configuracion de `maxAttempts`

| Valor | Cuando usarlo |
|---|---|
| `3` | Red estable, pocos fallos esperados |
| `5` | Red inestable o HUBs con conectividad intermitente (valor por defecto) |
| `10` | Entornos muy inestables o con cortes frecuentes |

---

## 3. Configuración de máquinas destino (`hubs.csv`)

Este archivo define la lista de todos los HUBs donde se desplegará Athena.

**Ubicación:** `DeployAthena/hubs.csv`

### Estructura del archivo

```csv
name,ip
HUB01,10.112.87.44
HUB02,10.10.10.102
```

- La primera línea es la **cabecera** (obligatoria, no modificar).
- Cada línea siguiente es un HUB: `nombre,IP`.

### Como agregar HUBs

Añade una línea por cada máquina destino:

```csv
name,ip
HUB01,10.112.87.44
HUB02,10.10.10.102
HUB03,10.10.10.103
HUB04,192.168.1.50
SALA_A,172.16.0.10
```

### Reglas del formato

- **No uses espacios** alrededor de las comas.
- El campo `name` puede ser cualquier identificador descriptivo (solo es para los logs).
- El campo `ip` debe ser la dirección IP exacta del HUB (no usar hostnames, a menos que estén en el DNS local).
- **Guarda el archivo con finales de línea Unix (LF)**, no Windows (CRLF). Si usas Notepad en Windows, guarda con "Notepad++" o VS Code para evitar caracteres `\r` invisibles.

### Como quitar un HUB temporalmente

Comenta la línea con `#` o simplemente elimínala:

```csv
name,ip
HUB01,10.112.87.44
# HUB02,10.10.10.102   <- este HUB será ignorado
HUB03,10.10.10.103
```

> **Nota:** El sistema no soporta comentarios nativamente. Si agregas `#`, ese HUB fallará al intentar conectarse. La forma correcta es eliminar la línea.

La forma correcta de excluir un HUB es eliminando la línea del CSV.

---

## 4. Configuración de timeouts (`auto-deploy2.js`)

Los timeouts controlan cuánto tiempo espera el sistema antes de abandonar una operación. Se configuran en las primeras líneas de `auto-deploy2.js`.

**Ubicación:** `DeployAthena/auto-deploy2.js` (líneas ~12-15)

### Variables disponibles

```javascript
const CONNECT_TIMEOUT_MS      = 30000;   // 30 segundos
const UPLOAD_IDLE_TIMEOUT_MS  = 180000;  // 3 minutos
const INSTALL_TIMEOUT_MS      = 600000;  // 10 minutos
const VALIDATE_TIMEOUT_MS     = 20000;   // 20 segundos
```

### Descripción de cada timeout

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `CONNECT_TIMEOUT_MS` | 30,000 (30 seg) | Tiempo máximo para establecer la conexión SSH con un HUB |
| `UPLOAD_IDLE_TIMEOUT_MS` | 180,000 (3 min) | Tiempo máximo sin progreso durante la subida del ZIP. Si el upload se "congela" por mas de este tiempo, se cancela |
| `INSTALL_TIMEOUT_MS` | 600,000 (10 min) | Tiempo máximo para que el script de instalación complete en el HUB |
| `VALIDATE_TIMEOUT_MS` | 20,000 (20 seg) | Tiempo máximo para verificar que los servicios quedaron activos |

### Cuando ajustar cada timeout

**`CONNECT_TIMEOUT_MS`**
- **Aumentar** si los HUBs están en redes lentas o con alta latencia.
- **Reducir** si quieres detectar HUBs caídos más rápido.

```javascript
const CONNECT_TIMEOUT_MS = 60000;  // 1 minuto para redes lentas
```

**`UPLOAD_IDLE_TIMEOUT_MS`**
- **Aumentar** si el upload se cancela prematuramente en conexiones lentas.
- El upload de 431 MB puede demorar 20-40 minutos en redes lentas.

```javascript
const UPLOAD_IDLE_TIMEOUT_MS = 300000;  // 5 minutos sin progreso
```

**`INSTALL_TIMEOUT_MS`**
- **Aumentar** si la instalación falla por timeout (HUBs lentos o muchos paquetes .deb).
- **Reducir** solo si tu entorno es muy rápido y quieres detectar instalaciones colgadas.

```javascript
const INSTALL_TIMEOUT_MS = 900000;  // 15 minutos para HUBs lentos
```

**`VALIDATE_TIMEOUT_MS`**
- Generalmente no necesita ajuste.
- Aumentar solo si los servicios tardan mucho en iniciar.

---

## 5. Gestión del estado (`state.json`)

El sistema guarda el estado de cada HUB en este archivo para poder **reanudar despliegues incompletos** sin repetir pasos ya completados.

**Ubicación:** `DeployAthena/state.json`

### Estados posibles

| Estado | Descripción |
|---|---|
| `PENDING` | El HUB aún no ha sido procesado |
| `UPLOADED` | El archivo `athena.zip` fue subido exitosamente al HUB |
| `INSTALLED` | Athena fue descomprimida e instalada en el HUB |
| `SUCCESS` | Instalación completada y servicios validados correctamente |
| `FAILED` | Falló y se agotaron los intentos (`maxAttempts`) |
| `OFFLINE` | No fue posible conectarse al HUB |

### Cuando reiniciar el estado

Si quieres **forzar que un HUB vuelva a desplegarse desde cero**, edita `state.json` y cambia su estado a `PENDING`:

```json
{
  "10.112.87.44": {
    "status": "PENDING",
    "attempts": 0,
    "lastSeen": null,
    "lastAttempt": null,
    "lastError": null
  }
}
```

### Cuando limpiar todo el estado

Para **reiniciar el despliegue completo** en todos los HUBs:

```bash
# Opcion 1: Borrar el archivo (el sistema lo recreará)
rm state.json

# Opcion 2: Dejar el archivo vacío
echo "{}" > state.json
```

> **Precaución:** Si un HUB ya tiene estado `SUCCESS`, borrarlo del `state.json` hará que el sistema intente desplegar nuevamente en esa máquina.

---

## 6. Verificación del paquete (`athena.zip`)

El archivo `athena.zip` debe estar presente en la carpeta antes de ejecutar el despliegue.

### Verificar que el archivo existe y tiene el tamaño correcto

```bash
ls -lh athena.zip
# Debe mostrar aproximadamente 431 MB
```

### Ubicación esperada

El archivo debe estar en la raíz del proyecto:

```
DeployAthena/
└── athena.zip   ← aquí
```

### Si el archivo está en otra ubicación

Edita `auto-deploy2.js` y busca la línea que define el path del ZIP:

```javascript
const localZip = path.join(__dirname, "athena.zip");
```

Cambia `"athena.zip"` por la ruta relativa o absoluta al archivo:

```javascript
const localZip = "/ruta/completa/a/athena.zip";
```

---

## 7. Configuración por escenario

### Escenario A: Primer despliegue limpio

1. Editar `config.js` con credenciales correctas.
2. Editar `hubs.csv` con la lista de HUBs.
3. Confirmar que `athena.zip` existe.
4. Ejecutar:

```bash
npm install
node auto-deploy2.js
```

### Escenario B: Reanudar despliegue interrumpido

No se necesita ningún cambio. Simplemente volver a ejecutar:

```bash
node auto-deploy2.js
```

El sistema detecta automáticamente los HUBs pendientes y retoma desde donde los dejó.

### Escenario C: Agregar nuevos HUBs a un despliegue ya ejecutado

1. Agregar las nuevas IPs en `hubs.csv`.
2. Ejecutar:

```bash
node auto-deploy2.js
```

El sistema solo procesará los HUBs nuevos (los que no están en `state.json` o están en `PENDING`).

### Escenario D: Re-desplegar en HUBs con fallo

1. Editar `state.json` y cambiar el estado de los HUBs fallidos a `PENDING` y `attempts` a `0`.
2. Ejecutar:

```bash
node auto-deploy2.js
```

### Escenario E: Red lenta (uploads que se cortan)

Aumentar los timeouts en `auto-deploy2.js`:

```javascript
const UPLOAD_IDLE_TIMEOUT_MS  = 300000;   // 5 minutos sin progreso
const INSTALL_TIMEOUT_MS      = 1200000;  // 20 minutos para instalar
```

---

## 8. Solución de problemas de configuración

### El sistema no encuentra los HUBs

**Síntoma:** Todos los HUBs aparecen como `OFFLINE` inmediatamente.

**Verificaciones:**
1. Confirmar que las IPs en `hubs.csv` son correctas.
2. Verificar conectividad desde la máquina local:
   ```bash
   ping 10.112.87.44
   ssh ms4m@10.112.87.44
   ```
3. Revisar que el usuario y contraseña en `config.js` son correctos.
4. Aumentar `CONNECT_TIMEOUT_MS` si la red tiene alta latencia.

### El upload se interrumpe antes de terminar

**Síntoma:** El HUB queda en estado `UPLOADED` pero después falla.

**Soluciones:**
1. Aumentar `UPLOAD_IDLE_TIMEOUT_MS` en `auto-deploy2.js`.
2. Verificar que el disco del HUB tenga al menos 2 GB libres:
   ```bash
   ssh ms4m@10.112.87.44 "df -h /home/ms4m"
   ```

### La instalación falla por timeout

**Síntoma:** El HUB queda en `UPLOADED` después de varios intentos, con error de timeout.

**Solución:** Aumentar `INSTALL_TIMEOUT_MS`:

```javascript
const INSTALL_TIMEOUT_MS = 900000;  // 15 minutos
```

### Los logs muestran IPs con caracteres extraños

**Síntoma:** La IP aparece como `10.112.87.44\r` en los logs.

**Causa:** El archivo `hubs.csv` tiene finales de línea de Windows (CRLF).

**Solución:** Convertir el archivo a formato Unix. En VS Code: clic en `CRLF` en la barra inferior y seleccionar `LF`.

### El sistema intenta desplegar en HUBs ya exitosos

**Síntoma:** HUBs con estado `SUCCESS` vuelven a procesarse.

**Causa:** El `state.json` fue borrado o modificado incorrectamente.

**Solución:** No borrar `state.json` durante un despliegue en curso. Si fue borrado accidentalmente, el sistema repetirá el despliegue completo (lo que es seguro, pero lento).

---

## Referencia rapida de archivos

| Archivo | Qué configura |
|---|---|
| `config.js` | Credenciales SSH, ruta remota, intentos máximos |
| `hubs.csv` | Lista de IPs y nombres de los HUBs destino |
| `auto-deploy2.js` (líneas 12-15) | Timeouts de conexión, upload, instalación y validación |
| `state.json` | Estado actual del despliegue (puede editarse para reiniciar HUBs) |
| `athena.zip` | Paquete a desplegar (debe estar presente antes de ejecutar) |

---

*Generado el 2026-04-13 — DeployAthena v2*
