# envtunnel

Encrypted one-time env sharing. No Slack DMs with secrets ever again.

## How it works

1. **Push** — encrypt your `.env` locally with a passphrase, get a UUID token (expires in 10 min)
2. **Share** — send the token over any channel. Share the passphrase separately (Signal, phone, etc.)
3. **Pull** — teammate runs `envtunnel pull <token>` + passphrase → vars injected. Token destroyed.

**AES-256-GCM** encryption. Server never sees plaintext. One-time read via Redis GETDEL.

---

## CLI Usage

```bash
# Push your .env
envtunnel push --file .env --label staging

# Push specific shell vars
envtunnel push --env DATABASE_URL,API_KEY

# Pull and print
envtunnel pull <token>

# Pull and save to file
envtunnel pull <token> -o .env

# Pull and export to shell (one-liner)
eval $(envtunnel pull <token> --export)

# Check if token is still alive
envtunnel peek <token>
```

---

## Stack

- **CLI** — Node.js, Commander, Chalk, Ora
- **API** — Hono (Bun)
- **Storage** — Upstash Redis (TTL + GETDEL)
- **Encryption** — AES-256-GCM (PBKDF2 key derivation)
- **Frontend** — React + Vite + Tailwind

---

## Dev Setup

```bash
# Install deps
bun install

# Add Upstash credentials
echo "UPSTASH_REDIS_REST_URL=..." >> packages/web/.env
echo "UPSTASH_REDIS_REST_TOKEN=..." >> packages/web/.env

# Start web dev server
bun run dev

# Build CLI
cd packages/cli && bun run build

# Use CLI against local server
ENVTUNNEL_API=http://localhost:5173 envtunnel push
```
