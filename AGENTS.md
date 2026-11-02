# AGENTS.md

Guide for coding agents working in this repository.

## What it is

`mcp-whatapp` is a minimal WhatsApp notifier written in Node.js (ESM, Node >= 20) and built on Baileys. It links once as a WhatsApp Web device and can **only send text** to allowlisted numbers.

## Structure

- `wa.mjs`: the whole program. Commands are `qr`, `login <phone>` and `send <phone> <text>`.
- `package.json`: dependencies (`@whiskeysockets/baileys`, `pino`, `qrcode`).
- `README.md`: usage instructions.

## Setup

```bash
npm install
node wa.mjs qr                     # link it by scanning the QR
WA_ALLOW=34600000000 node wa.mjs send 34600000000 "test"
```

Environment variables: `WA_ALLOW` (allowed numbers, comma-separated, without `+`), `WA_AUTH_DIR` (session folder) and `WA_QR_DIR` (where the QR goes).

## Rules that must not be broken

1. **Send only.** Don't add reading, syncing or storing of messages, contacts or media. `syncFullHistory` and `shouldSyncHistoryMessage` stay off.
2. **Mandatory allowlist.** Every send checks `WA_ALLOW`. An empty list sends nothing. Never add a bypass.
3. **No personal data in the repo.** No real numbers, sessions (`auth/`), QR codes or logs. Use example numbers such as `34600000000`.
4. **Don't commit secrets.** Keep `.gitignore` up to date.
5. Keep it minimal: one file, few dependencies, no frameworks.

## Exit codes

`0` OK, `1` usage or logout, `2` timeout, `3` recipient not allowed, `4` connection closed.

## Verification before committing

- `node -e "import('@whiskeysockets/baileys')"` imports without errors.
- `WA_ALLOW=34600000000 node wa.mjs send 34111 x` must exit with code `3`.
- Search the diff for real numbers or session files.
