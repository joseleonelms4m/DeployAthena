import { NodeSSH } from "node-ssh";
import { Tools } from "../tools/tools.js";
import { UPDATE_TAR } from "../config/variables.js";
const {logToFile, connectSSH} = Tools

export async function updateHub(hub) {
  const ssh = new NodeSSH();
  const log = (msg) => logToFile(hub, `[UPDATE] ${msg}`);

  try {

    log("🔌 conectando...");
    await connectSSH(ssh, hub, 15000);
    log("✅ conexión OK");

    // 1. Subir tar
    log("📦 subiendo fcsv143.tar...");
    await ssh.putFile(UPDATE_TAR, "/home/ms4m/fcsv143.tar");
    log("✅ tar subido");

    // 2. Descomprimir en ~/fcs/
    log("📂 descomprimiendo en ~/fcs/...");
    let r = await ssh.execCommand("mkdir -p ~/fcs && tar -xf ~/fcsv143.tar -C ~/fcs/");
    if (r.stderr) log("⚠ tar stderr: " + r.stderr);
    log("✅ descomprimido");

    // 3. Backup de la BD con fecha
    log("💾 backup de fcs.db...");
    r = await ssh.execCommand("DATE=$(date +%Y%m%d_%H%M%S) && cp ~/fcs/fcs.db ~/fcs/fcs.db.bak_$DATE && echo $DATE");
    log("✅ backup creado: fcs.db.bak_" + r.stdout.trim());

    // 4. INSERT parámetros SQLite
    log("🗄 insertando parámetros en SQLite...");
    const inserts = [
      "INSERT INTO interface(idx,field,value) values(0,'light_drowsy_vibration',0);",
      "INSERT INTO interface(idx,field,value) values(0,'very_drowsy_vibration',1);",
      "INSERT INTO interface(idx,field,value) values(0,'microsleep_vibration',0);",
      "INSERT INTO interface(idx,field,value) values(0,'drowsy_vibration_lvl',3);",
      "INSERT INTO interface(idx,field,value) values(0,'microsleep_vibration_lvl',4);",
    ];
    for (const sql of inserts) {
      r = await ssh.execCommand(`sqlite3 ~/fcs/fcs.db "${sql}"`);
      if (r.stderr) log("⚠ " + r.stderr.trim());
    }
    log("✅ parámetros insertados");

    // 5. Verificar parámetros
    log("🔍 verificando parámetros...");
    r = await ssh.execCommand("sqlite3 ~/fcs/fcs.db \"SELECT * FROM interface WHERE field like 'audio' OR field like 'vibrate';\"");
    log("vibrate/audio → " + (r.stdout.trim() || "(vacío)"));
    r = await ssh.execCommand("sqlite3 ~/fcs/fcs.db \"SELECT * FROM interface WHERE field like '%sound%' or field like '%vibration%';\"");
    log("sound/vibration → " + (r.stdout.trim() || "(vacío)"));

    // 6. Despliegue del binario
    log("🚀 reemplazando binario y reiniciando servicio...");
    r = await ssh.execCommand(
      "cd ~/fcs && systemctl --user stop fcs.service && sleep 5 && cp fcs fcsv42 && cp fcsv143 fcs && systemctl --user restart fcs.service && sleep 10 && ./fcs version"
    );
    log("version → " + (r.stdout.trim() || "(sin salida)"));
    if (r.stderr) log("stderr: " + r.stderr.trim());
    log("✅ binario actualizado");

    ssh.dispose();
    return "UPDATE_OK";

  } catch (e) {
    ssh.dispose();
    log("❌ ERROR: " + e.message);
    if (e.message.includes("Timed out") || e.message.includes("ECONNREFUSED") || e.message.includes("EHOSTUNREACH")) return "OFFLINE";
    return "UPDATE_FAILED";
  }
}