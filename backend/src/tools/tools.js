import fs from "fs";
import { config } from "../config/config.js";
import { STATE_FILE, CSV_FILE } from "../config/variables.js";
import path from "path";
import { fileURLToPath } from "url";

// Constants
const TZ_OFFSET = -5; // UTC-5

const VIBRATION_INSERTS = [
    "INSERT INTO interface(idx,field,value) values(0,'light_drowsy_vibration',1);",
    "INSERT INTO interface(idx,field,value) values(0,'very_drowsy_vibration',1);",
    "INSERT INTO interface(idx,field,value) values(0,'microsleep_vibration',1);",
    "INSERT INTO interface(idx,field,value) values(0,'drowsy_vibration_lvl',3);",
    "INSERT INTO interface(idx,field,value) values(0,'microsleep_vibration_lvl',3);",
];


// Get current file/directory in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logs directory
const LOG_DIR = path.join(__dirname, "..", "..", "logs");

// Connections log (WS connect/disconnect events)
const CONNECTIONS_LOG = path.join(__dirname, "..", "..", "connections.log");

// Make sure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}


export class Tools {

    static async connectSSH(ssh, hub, timeoutMs = 15000) {

        const passwords = config.passwords || [config.password];
        for (let i = 0; i < passwords.length; i++) {
            try {

                await ssh.connect({
                    host: hub.ip,
                    port: config.port,
                    username: config.username,
                    password: passwords[i],
                    readyTimeout: timeoutMs
                });
                Tools.logToFile(
                    hub,
                    `🔑 conectado con password #${i + 1}`
                );
                return;

            } catch (e) {

                const isAuthFail =
                    e.message.includes("Authentication") ||
                    e.message.includes("auth");
                if (!isAuthFail) {
                    throw e;
                }
                Tools.logToFile(
                    hub,
                    `⚠ password #${i + 1} rechazada, probando siguiente...`
                );
            }
        }
        throw new Error(
            "Authentication failed: ninguna password funcionó"
        );
    }

    static logToFile(hub, msg) {

        // determine the log file path for the given hub
        const logFile = path.join(
            LOG_DIR,
            `${hub.name}.log`
        );

        // create the log file if it doesn't exist
        if (!fs.existsSync(logFile)){
            fs.writeFileSync(logFile, "");
        }

        // append the log message to the file
        fs.appendFileSync(
            logFile,
            `[${Tools.now()}] ${msg}\n`
        );
    }

    static logConnection(msg){
        // log Web socket connections to the server
        fs.appendFileSync(CONNECTIONS_LOG, `${Tools.now()} ${msg}\n`)
    }

    static now() {
        const d = new Date(
            Date.now() + TZ_OFFSET * 60 * 60 * 1000
        );
        const p = n => String(n).padStart(2, "0");
        return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
    }

    static parseCSV() {

        return fs.readFileSync(CSV_FILE, "utf-8")
            .split("\n")
            .slice(1)
            .filter(line => line.trim())
            .map(line => {
                const [name, ip] = line.split(",");
                return {
                    name: name.trim(),
                    ip: ip.trim()
                };
            });
    }

    static loadState() {

        if (!fs.existsSync(STATE_FILE)) {
            return {};
        }
        return JSON.parse(
            fs.readFileSync(STATE_FILE)
        );
    }

    static saveState(state) {

        fs.writeFileSync(
            STATE_FILE,
            JSON.stringify(state, null, 2)
        );
    }

    static statusBadge(status) {

        const colors = {
            SUCCESS: "#22c55e",
            FAILED: "#ef4444",
            OFFLINE: "#94a3b8",
            IN_PROGRESS: "#f59e0b",
            PENDING: "#64748b"
        };

        const color =
            colors[status] || "#64748b";

        return `
            <span
                style="
                    background:${color};
                    color:#fff;
                    padding:2px 8px;
                    border-radius:4px;
                    font-size:12px
                "
            >
                ${status || "PENDING"}
            </span>
        `;
    }

    static async ensureVibrationParams(ssh, log) {

        const countR = await ssh.execCommand(
            "sqlite3 ~/fcs/fcs.db \"SELECT COUNT(*) FROM interface WHERE field='microsleep_vibration';\""
        );
        const count =
            parseInt(countR.stdout.trim()) || 0;
        if (count === 0) {
            log(
                "📥 parámetros no encontrados, insertando..."
            );
            for (const sql of VIBRATION_INSERTS) {
                const r = await ssh.execCommand(
                    `sqlite3 ~/fcs/fcs.db "${sql}"`
                );

                if (r.stderr) {
                    log("⚠ " + r.stderr.trim());
                }
            }
            await ssh.execCommand(
                "sqlite3 ~/fcs/fcs.db \"DELETE FROM interface WHERE rowid NOT IN (SELECT MAX(rowid) FROM interface GROUP BY field);\""
            );
            log(
                "✅ parámetros insertados y duplicados eliminados"
            );
        }
    }
}