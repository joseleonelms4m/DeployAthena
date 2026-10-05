# Manual de despliegue Athena

## 1. ¿Para qué sirve?

El script `auto-deploy2.js` automatiza el despliegue de Athena en varios HUBs por SSH.

Por cada HUB hace lo siguiente:

1. Lee la lista de equipos desde `hubs.csv`.
2. Toma las credenciales y la ruta remota desde `config.js`.
3. Se conecta por SSH.
4. Sube el archivo `athena.zip`.
5. Descomprime e instala Athena en el equipo remoto.
6. Reinicia servicios necesarios.
7. Valida que Athena y el servicio web queden funcionando.
8. Guarda el estado en `state.json`.
9. Escribe logs individuales en la carpeta `logs/`.

---

## 2. Archivos involucrados

- `auto-deploy2.js`: script principal de despliegue.
- `config.js`: usuario, contraseña y ruta remota.
- `hubs.csv`: listado de HUBs a desplegar.
- `state.json`: estado persistente de cada HUB.
- `logs/`: logs por HUB.
- `athena.zip`: paquete que se sube al equipo remoto.

---

## 3. Preparación previa

Antes de ejecutar:

1. Verificar que exista `athena.zip` en la carpeta del proyecto.
2. Revisar `config.js`:
   - `username`
   - `password`
   - `remotePath`
3. Revisar `hubs.csv` con el formato:

```csv
name,ip
HUB01,10.112.87.44
HUB02,10.10.10.102
```

4. Confirmar conectividad SSH desde la máquina donde se ejecuta el script.
5. Confirmar que el usuario remoto tenga permisos sobre la ruta configurada.

---

## 4. Ejecución

Para ejecutar:

```bash
node auto-deploy2.js
```

Durante la ejecución se verá en consola:

- inicio del proceso
- conexión SSH por HUB
- subida del ZIP
- porcentaje de avance de upload
- instalación remota
- validación
- resultado final

---

## 5. Estados que maneja el script

En `state.json` cada HUB puede quedar con alguno de estos estados:

- `PENDING`: pendiente de iniciar.
- `UPLOADED`: ZIP cargado correctamente.
- `INSTALLED`: instalación ejecutada.
- `SUCCESS`: despliegue validado correctamente.
- `FAILED`: instalación realizada pero validación fallida.
- `OFFLINE`: error de conexión, timeout o falla durante una etapa.

---

## 6. ¿Por qué demora tanto?

La demora principal está en la transferencia de `athena.zip`.

### Datos observados

- Tamaño del ZIP: **430.95 MB**
- Tamaño descomprimido aproximado: **1187.25 MB**
- Cantidad de archivos: **111288**

### Motivos de la demora

#### 1. El archivo es muy grande
Subir más de 430 MB por SFTP puede tardar bastante dependiendo del ancho de banda.

#### 2. Hay muchísimos archivos internos
Aunque se suba un único ZIP, el contenido real es grande y luego debe descomprimirse en el destino.

#### 3. Después de subir todavía falta instalar
Luego de la subida el script también hace:

- `unzip`
- instalación de paquetes `.deb`
- reinicio de `nginx`
- instalación de dependencias Python offline
- alta y arranque del servicio `athena`
- validación final

#### 4. La red no siempre es estable
En algunos HUBs se observó timeout durante el handshake SSH o durante la transferencia.

---

## 7. ¿Qué trae `athena.zip`?

Se inspeccionó el contenido y el peso se distribuye principalmente así:

| Carpeta | Tamaño aprox. | Archivos |
|---|---:|---:|
| `client` | 985.29 MB | 108394 |
| `server` | 96.90 MB | 1346 |
| `.git` | 80.98 MB | 671 |
| `SO_ZEUS` | 22.55 MB | 858 |
| `helpers` | 1.53 MB | 16 |

### Archivos más pesados detectados

- `athena/client/node_modules/.cache/default-development/11.pack` → **131.90 MB**
- `athena/client/node_modules/.cache/default-development/24.pack` → **93.53 MB**
- `athena/client/node_modules/.cache/default-development/15.pack` → **74.20 MB**
- `athena/client/node_modules/.cache/default-development/13.pack` → **74.10 MB**
- `athena/.git/objects/pack/...pack` → **69.61 MB**
- `athena/server/dependencies/matplotlib-2.1.1.tar.gz` → **44.13 MB**
- `athena/client/node_modules/.cache/default-development/index.pack` → **34.45 MB**
- `athena/server/dependencies/scipy-0.19.1.tar.gz` → **15.35 MB**
- varios archivos grandes de `typescript`, `sass`, `tailwindcss` y mapas `.map`

---

## 8. ¿Por qué pesa demasiado?

El ZIP no contiene solamente el código necesario para producción. También incluye elementos que aumentan mucho el tamaño:

- `.git`
- cachés de compilación (`node_modules/.cache`)
- `node_modules` del cliente
- dependencias Python offline
- archivos PDF y uploads
- mapas `.map` del frontend

Los principales responsables del peso son:

1. **cachés del frontend**
2. **`node_modules` del cliente**
3. **carpeta `.git`**
4. **dependencias offline del backend**

---

## 9. Qué convendría excluir para achicar el ZIP

Si el objetivo es reducir tiempos de despliegue, conviene evaluar excluir del paquete:

- `.git`
- `.vscode`
- `client/node_modules/.cache`
- archivos temporales
- mapas `.map`
- uploads o PDFs no necesarios para producción

### Importante

No conviene quitar `server/dependencies` si el servidor realmente necesita instalar Python sin acceso a Internet usando:

```bash
pip3 install --no-index --find-links=dependencies -r requirements.txt
```

---

## 10. Flujo recomendado de operación

1. Preparar un `athena.zip` limpio.
2. Revisar `config.js`.
3. Revisar `hubs.csv`.
4. Ejecutar `node auto-deploy2.js`.
5. Supervisar la consola.
6. Revisar `state.json` al finalizar.
7. Si un HUB falla, revisar su log en `logs/`.

---

## 11. Problemas observados durante pruebas

### Caso 1: IP con `\r`
Se detectó que el CSV tenía finales de línea Windows y eso agregaba `\r` a la IP. Ya fue corregido limpiando los valores con `trim()`.

### Caso 2: falta de feedback en consola
Se agregó logging por HUB para ver:

- conexión SSH
- subida del ZIP
- porcentaje de upload
- instalación
- validación
- errores reales

### Caso 3: timeout total en una subida larga
Se cambió el timeout de upload para que sea por inactividad y no por duración total.

---

## 12. Resumen ejecutivo

El proceso funciona correctamente, pero demora principalmente porque el archivo `athena.zip` pesa mucho y contiene demasiados elementos no esenciales para un despliegue productivo.

La mayor parte del peso está en `client`, especialmente en cachés y dependencias del frontend. También suma peso la carpeta `.git` y las dependencias offline del backend.

Si se arma un ZIP más limpio, el despliegue puede reducir notablemente su tiempo.
