#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const usage = () => {
  console.log(
    [
      "Uso:",
      "  node scripts/deploy-sftp-profile.mjs <profile> [--dry-run]",
      "",
      "Ejemplos:",
      "  node scripts/deploy-sftp-profile.mjs website",
      "  node scripts/deploy-sftp-profile.mjs server_php",
      "  node scripts/deploy-sftp-profile.mjs website --dry-run",
    ].join("\n"),
  );
};

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
  usage();
  process.exit(args.length === 0 ? 1 : 0);
}

const profileName = args[0];
const dryRun = args.includes("--dry-run");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const configPath = path.join(workspaceRoot, ".vscode", "sftp.json");

if (!fs.existsSync(configPath)) {
  console.error(`No existe ${configPath}.`);
  console.error("Crea primero .vscode/sftp.json con host, usuario y perfiles.");
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (error) {
  console.error("No se pudo leer/parsear .vscode/sftp.json.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const profiles = config.profiles ?? {};
const profile = profiles[profileName];
if (!profile || typeof profile !== "object") {
  console.error(`No existe el perfil "${profileName}" en .vscode/sftp.json.`);
  process.exit(1);
}

const pick = (key, fallback = "") => {
  if (profile[key] !== undefined && profile[key] !== null && profile[key] !== "") {
    return profile[key];
  }
  if (config[key] !== undefined && config[key] !== null && config[key] !== "") {
    return config[key];
  }
  return fallback;
};

const protocol = String(pick("protocol", "sftp")).toLowerCase();
const host = String(pick("host", ""));
const port = Number(pick("port", protocol === "sftp" ? 22 : 21));
const username = String(pick("username", ""));
const password = String(pick("password", ""));
const context = String(pick("context", "."));
const remotePath = String(pick("remotePath", "~"));

if (!host || !username || !password) {
  console.error("Faltan host/username/password en .vscode/sftp.json.");
  process.exit(1);
}

if (!["sftp", "ftp", "ftps"].includes(protocol)) {
  console.error(`Protocolo no soportado para este script: "${protocol}".`);
  process.exit(1);
}

const localDir = path.resolve(workspaceRoot, context);
if (!fs.existsSync(localDir) || !fs.statSync(localDir).isDirectory()) {
  console.error(`No existe el directorio local del perfil: ${localDir}`);
  process.exit(1);
}

const lftpTarget = `${protocol}://${host}`;

const commands = [
  "set cmd:fail-exit true",
  "set net:max-retries 2",
  "set net:timeout 20",
  "set xfer:clobber on",
  `open -u "${username}","${password}" -p ${port} ${lftpTarget}`,
  `lcd "${localDir}"`,
  `mkdir -p "${remotePath}"`,
  `cd "${remotePath}"`,
  'mirror -R --only-newer --verbose --exclude-glob ".git/**" --exclude-glob ".vscode/**" --exclude-glob "node_modules/**" --exclude-glob ".DS_Store" . .',
  "bye",
];

if (dryRun) {
  console.log(`[DRY-RUN] Perfil: ${profileName}`);
  console.log(`[DRY-RUN] Local: ${localDir}`);
  console.log(`[DRY-RUN] Remoto: ${remotePath}`);
  const redacted = commands.map((line) => line.replace(password, "***"));
  console.log(redacted.join("\n"));
  process.exit(0);
}

console.log(`[DEPLOY] Perfil: ${profileName}`);
console.log(`[DEPLOY] ${localDir} -> ${remotePath}`);

try {
  execFileSync("lftp", ["-f", "-"], {
    input: commands.join("\n") + "\n",
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log("[DEPLOY] Subida completada.");
} catch (error) {
  console.error("[DEPLOY] Fallo en la subida.");
  if (error instanceof Error && error.message) {
    console.error(error.message);
  }
  process.exit(1);
}
