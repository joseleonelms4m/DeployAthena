import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CSV_FILE = path.join(__dirname, "..", "..", "hubs.csv");
export const LOG_DIR = path.join(__dirname, "..", "..", "logs");
export const STATE_FILE = path.join(__dirname, "..", "..", "state.json");
export const UPDATE_TAR = path.join(__dirname, "..", "..", "fcsv143.tar");
export const TIMEOUT = 10000