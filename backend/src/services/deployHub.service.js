import { NodeSSH } from "node-ssh";
import { Tools } from "../tools/tools.js";
import { config } from "../config/config.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { connectSSH, logToFile } = Tools;

// Tries each password in config.passwords against sudo (non-interactively, via stdin)
// until one is accepted. Returns the working password, or null if none worked.
async function findSudoPassword(ssh, hub) {
  const passwords = config.passwords;
  for (let i = 0; i < passwords.length; i++) {
    const res = await ssh.execCommand("sudo -S -p '' -v", {
      stdin: passwords[i] + "\n",
    });
    if (res.code === 0) {
      logToFile(hub, `🔑 sudo aceptó password #${i + 1}`);
      return passwords[i];
    }
    logToFile(hub, `⚠ sudo rechazó password #${i + 1}, probando siguiente...`);
  }
  return null;
}

// Runs a handful of read-only diagnostic commands on the hub and logs their
// output, so a failed validation can be diagnosed from the log file alone.
async function logDiagnostics(ssh, hub, sudoPassword) {
  const checks = [
    ["nginx -t", "nginx -t"],
    ["systemctl status nginx --no-pager -l", "nginx"],
    ["systemctl status athena --no-pager -l", "athena"],
    ["ss -tlnp", "puertos"],
  ];
  for (const [cmd, label] of checks) {
    const res = await ssh.execCommand(`sudo -S -p '' ${cmd}`, {
      stdin: sudoPassword + "\n",
    });
    const out = (res.stdout || res.stderr || "").trim().slice(0, 500).replace(/\n/g, " | ");
    logToFile(hub, `🩺 ${label}: ${out || "(sin salida)"}`);
  }
}

export async function deployHub(hub) {
  const ssh = new NodeSSH();
  try {
    logToFile(hub, "🔌 conectando...");
    await connectSSH(ssh, hub, 10000);

    logToFile(hub, "🔑 verificando sudo...");
    const sudoPassword = await findSudoPassword(ssh, hub);
    if (!sudoPassword) {
      logToFile(hub, "❌ ninguna password funcionó con sudo, abortando");
      ssh.dispose();
      return "FAILED";
    }

    logToFile(hub, "📦 subiendo athena.zip");
    await ssh.putFile(path.join(__dirname, "..", "..", "athena.zip"), `${config.remotePath}/athena.zip`);

    logToFile(hub, "🚀 ejecutando despliegue");
    await ssh.execCommand(`cd ${config.remotePath} && unzip -o athena.zip`);

    // Everything below needs root (dpkg, /etc/nginx, /etc/systemd/system, systemctl),
    // so it runs as one privileged block via sudo, with the password piped through
    // stdin (never embedded in the command string).

    const privilegedScript = `
      export DEBIAN_FRONTEND=noninteractive &&
      cd ${config.remotePath}/athena/helpers && dpkg -i *.deb || true && systemctl restart nginx || true &&
      cd ${config.remotePath}/athena/helpers/nginx &&
      rm -f /etc/nginx/sites-enabled/default && cp default /etc/nginx/sites-enabled/default && cp default /etc/nginx/sites-available/default &&
      systemctl restart nginx &&
      cd ${config.remotePath}/athena/server && mkdir -p captured_images &&
      pip3 install --no-index --find-links=dependencies -r requirements.txt &&
      cd ${config.remotePath}/athena/helpers/system.d &&
      cp athena.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable athena.service && systemctl start athena.service
    `.replace(/'/g, `'\\''`);

    const deployRes = await ssh.execCommand(`sudo -S -p '' bash -c '${privilegedScript}'`, {
      stdin: sudoPassword + "\n",
    });

    logToFile(hub, `🚀 despliegue terminó con exit code=${deployRes.code}`);
    if (deployRes.code !== 0) {
      const stderrExcerpt = (deployRes.stderr || "").slice(-400).replace(/\n/g, " | ");
      logToFile(hub, `⚠ stderr: ${stderrExcerpt || "(vacío)"}`);
    }

    logToFile(hub, "🔍 validando...");
    let res = await ssh.execCommand("curl -s -o /dev/null -w '%{http_code}' http://localhost");
    logToFile(hub, `🔍 http status=${res.stdout.trim() || "(sin respuesta)"}`);
    if (!res.stdout.includes("200")) {
      await logDiagnostics(ssh, hub, sudoPassword);
      ssh.dispose();
      return "FAILED";
    }

    res = await ssh.execCommand("systemctl is-active athena");
    logToFile(hub, `🔍 systemctl is-active=${res.stdout.trim() || "(sin respuesta)"}`);

    if (!res.stdout.includes("active")) {
      await logDiagnostics(ssh, hub, sudoPassword);
      ssh.dispose();
      return "FAILED";
    }
    ssh.dispose();
    return "SUCCESS";
  } catch (e) {
    ssh.dispose();
    if (e.message.includes("Timed out") || e.message.includes("ECONNREFUSED") || e.message.includes("EHOSTUNREACH")) return "OFFLINE";
    logToFile(hub, "❌ ERROR: " + e.message);
    return "FAILED";
  }
}
