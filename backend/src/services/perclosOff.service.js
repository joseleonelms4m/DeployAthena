import { NodeSSH } from "node-ssh";
import { Tools } from "../tools/tools.js";

const { logToFile, connectSSH } = Tools

export async function perclosOff(hub) {
  const ssh = new NodeSSH();
  const log = (msg) => logToFile(hub, `[PERCLOS-OFF] ${msg}`);

  try {
    log("🔌 conectando...");
    await connectSSH(ssh, hub, 15000);
    log("✅ conexión OK");

    log("🗄 desactivando PERCLOS (todos los valores a 100)...");
    const updates = [
      "UPDATE interface SET value=100 WHERE field='perclos_high';",
      "UPDATE interface SET value=100 WHERE field='perclos_mid';",
      "UPDATE interface SET value=100 WHERE field='perclos_low';",
    ];
    for (const sql of updates) {
      const r = await ssh.execCommand(`sqlite3 ~/fcs/fcs.db "${sql}"`);
      if (r.stderr) log("⚠ " + r.stderr.trim());
    }

    const verify = await ssh.execCommand("sqlite3 ~/fcs/fcs.db \"SELECT * FROM interface WHERE field like 'perclos%';\"");
    log("perclos → " + (verify.stdout.trim() || "(vacío)"));

    log("🔄 reiniciando fcs.service...");
    await ssh.execCommand("systemctl --user restart fcs.service");
    log("✅ PERCLOS desactivado");

    ssh.dispose();
    return "PERCLOS_OFF_OK";
  } catch (e) {
    ssh.dispose();
    log("❌ ERROR: " + e.message);
    if (e.message.includes("Timed out") || e.message.includes("ECONNREFUSED") || e.message.includes("EHOSTUNREACH")) return "OFFLINE";
    return "PERCLOS_OFF_FAILED";
  }
}