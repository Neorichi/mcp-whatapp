#!/usr/bin/env node
// Minimal WhatsApp notifier: link once as a device, then send text ONLY to allowlisted numbers.
// No message reading, no chat storage, no contacts, no media.
import makeWASocket, { fetchLatestBaileysVersion, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QR from "qrcode";
import pino from "pino";
import os from "node:os";
import path from "node:path";

const AUTH = process.env.WA_AUTH_DIR || path.join(os.homedir(), ".mcp-whatapp", "auth");
const QR_DIR = process.env.WA_QR_DIR || process.cwd();
// Comma-separated international numbers without "+", e.g. WA_ALLOW=34600000000,34611111111
const ALLOW = new Set((process.env.WA_ALLOW || "").split(",").map((n) => n.replace(/\D/g, "")).filter(Boolean));
const logger = pino({ level: "silent" });
const [cmd, a1, ...rest] = process.argv.slice(2);

async function sock() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH);
  const { version } = await fetchLatestBaileysVersion();
  const s = makeWASocket({ auth: state, logger, version, syncFullHistory: false, markOnlineOnConnect: false, shouldSyncHistoryMessage: () => false });
  s.ev.on("creds.update", saveCreds);
  return { s, state };
}

if (cmd === "qr") {
  let n = 0;
  const run = async () => {
    const { s } = await sock();
    s.ev.on("connection.update", async (u) => {
      if (u.qr) { n++; const f = path.join(QR_DIR, `wa_qr_${n}.png`); await QR.toFile(f, u.qr, { width: 600, margin: 4 }); console.log("QR " + f); }
      if (u.connection === "open") { console.log("PAIRED " + s.user?.id); setTimeout(() => process.exit(0), 3000); }
      if (u.connection === "close") { const c = u.lastDisconnect?.error?.output?.statusCode; console.log("CLOSED " + c); if (c === 515 || c === 408) run(); else process.exit(1); }
    });
  };
  run(); setTimeout(() => { console.log("TIMEOUT"); process.exit(2); }, 300000);
} else if (cmd === "login") {
  const phone = (a1 || "").replace(/\D/g, "");
  let shown = false;
  const run = async () => {
    const { s, state } = await sock();
    s.ev.on("connection.update", async (u) => {
      if (u.qr && !shown && !state.creds.registered) { shown = true; console.log("CODE " + await s.requestPairingCode(phone)); }
      if (u.connection === "open") { console.log("PAIRED " + s.user?.id); setTimeout(() => process.exit(0), 3000); }
      if (u.connection === "close") { const c = u.lastDisconnect?.error?.output?.statusCode; console.log("CLOSED " + c); if (c === DisconnectReason.restartRequired || c === 515) run(); else if (c === DisconnectReason.loggedOut) process.exit(1); }
    });
  };
  run(); setTimeout(() => { console.log("TIMEOUT"); process.exit(2); }, 180000);
} else if (cmd === "send") {
  const to = (a1 || "").replace(/\D/g, "");
  if (!ALLOW.has(to)) { console.error("Recipient not allowed (set WA_ALLOW)"); process.exit(3); }
  const text = rest.join(" ");
  const { s } = await sock();
  s.ev.on("connection.update", async (u) => {
    if (u.connection === "open") { await s.sendMessage(to + "@s.whatsapp.net", { text }); console.log("SENT"); setTimeout(() => process.exit(0), 3000); }
    if (u.connection === "close") { console.log("CLOSED " + u.lastDisconnect?.error?.output?.statusCode); process.exit(4); }
  });
  setTimeout(() => { console.log("TIMEOUT"); process.exit(2); }, 60000);
} else {
  console.error("usage: qr | login <phone> | send <phone> <text>");
  process.exit(1);
}
