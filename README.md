# mcp-whatapp

Minimal WhatsApp notifier built on [Baileys](https://github.com/WhiskeySockets/Baileys). It links once as a WhatsApp Web device and then only **sends text** to numbers on an allowlist. It doesn't read, sync, or store chats, contacts, or media.

> Unofficial: Baileys isn't an official WhatsApp API and automating a personal account goes against WhatsApp's terms, so there's a risk of a ban. Use a secondary number and send only a few messages.

## Install

```bash
npm install
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `WA_ALLOW` | (empty, nothing allowed) | Comma-separated numbers in international format without `+` |
| `WA_AUTH_DIR` | `~/.mcp-whatapp/auth` | Where the session is stored. Keep it private. |
| `WA_QR_DIR` | current folder | Where the QR PNG is written |

## Usage

```bash
# Link it once: scan the QR in WhatsApp > Linked devices
node wa.mjs qr
# or with a pairing code
node wa.mjs login 34600000000

# Send
WA_ALLOW=34600000000 node wa.mjs send 34600000000 "Hello"
```

Output: `SENT` if it worked, exit code 3 if the number isn't allowed.

To unlink it, use WhatsApp > Linked devices on your phone, then delete `WA_AUTH_DIR`.
