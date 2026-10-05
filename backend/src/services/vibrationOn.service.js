import { NodeSSH } from "node-ssh";
import { Tools } from "../tools/tools.js";

const {logToFile, ensureVibrationParams, connectSSH} = Tools

export async function vibrationOn(hub) {
  const ssh = new NodeSSH();
  const log = (msg) => logToFile(hub, `[VIB-ON] ${msg}`);
  try {
    log("🔌 conectando...");
    await connectSSH(ssh, hub, 15000);
    log("✅ conexión OK");

    await ensureVibrationParams(ssh, log);

    log("🔔 activando vibración microsueño...");
    const r = await ssh.execCommand("sqlite3 ~/fcs/fcs.db \"UPDATE interface SET value=1 WHERE field='microsleep_vibration';\"");
    if (r.stderr) log("⚠ " + r.stderr.trim());

    const verify = await ssh.execCommand("sqlite3 ~/fcs/fcs.db \"SELECT * FROM interface WHERE field like '%vibration%' or field like '%drowsy%';\"");
    log("vibración → " + (verify.stdout.trim() || "(vacío)"));

    log("🔄 reiniciando fcs.service...");
    await ssh.execCommand("systemctl --user restart fcs.service");
    log("✅ vibración activada");

    ssh.dispose();
    return "VIB_ON_OK";
  } catch (e) {
    ssh.dispose();
    log("❌ ERROR: " + e.message);
    if (e.message.includes("Timed out") || e.message.includes("ECONNREFUSED") || e.message.includes("EHOSTUNREACH")) return "OFFLINE";
    return "VIB_ON_FAILED";
  }
}