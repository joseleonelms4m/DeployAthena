import { NodeSSH } from "node-ssh";
import { Tools } from "../tools/tools.js";

const {logToFile, ensureVibrationParams, connectSSH} = Tools

export async function vibrationOff(hub) {
  const ssh = new NodeSSH();
  const log = (msg) => logToFile(hub, `[VIB-OFF] ${msg}`);
  try {
    log("🔌 conectando...");
    await connectSSH(ssh, hub, 15000);
    log("✅ conexión OK");

    log("💾 backup de fcs.db...");
    const bak = await ssh.execCommand("DATE=$(date +%Y%m%d_%H%M%S) && cp ~/fcs/fcs.db ~/fcs/fcs.db.bak_$DATE && echo $DATE");
    log("✅ backup creado: fcs.db.bak_" + bak.stdout.trim());

    await ensureVibrationParams(ssh, log);

    log("🔕 desactivando vibración microsueño...");
    const r = await ssh.execCommand("sqlite3 ~/fcs/fcs.db \"UPDATE interface SET value=0 WHERE field='microsleep_vibration';\"");
    if (r.stderr) log("⚠ " + r.stderr.trim());

    const verify = await ssh.execCommand("sqlite3 ~/fcs/fcs.db \"SELECT * FROM interface WHERE field like '%vibration%' or field like '%drowsy%';\"");
    log("vibración → " + (verify.stdout.trim() || "(vacío)"));

    log("🔄 reiniciando fcs.service...");
    await ssh.execCommand("systemctl --user restart fcs.service");
    log("✅ vibración desactivada");

    ssh.dispose();
    return "VIB_OFF_OK";
  } catch (e) {
    ssh.dispose();
    log("❌ ERROR: " + e.message);
    if (e.message.includes("Timed out") || e.message.includes("ECONNREFUSED") || e.message.includes("EHOSTUNREACH")) return "OFFLINE";
    return "VIB_OFF_FAILED";
  }
}