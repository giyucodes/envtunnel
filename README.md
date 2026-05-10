# envtunnel

Encrypted one-time env sharing. No Slack DMs with secrets ever again.

## How it works

1. **Push** — encrypt your `.env` locally with a passphrase → get a UUID token (expires in 10 min)
2. **Share** — send the token over any channel. Share the passphrase **separately** (Signal, phone, etc.)
3. **Pull** — teammate enters token + passphrase → vars decrypted locally → token destroyed

**AES-256-GCM** encryption with PBKDF2 key derivation. Server never sees plaintext. Token is consumed only after successful decryption — wrong passphrase leaves it intact.

---

## CLI Usage

```bash
# Push your .env
envtunnel push
envtunnel push --file .env --label staging

# Push specific shell vars
envtunnel push --env DATABASE_URL,API_KEY

# Use your own Upstash Redis
envtunnel push --file .env --redis-url https://xxx.upstash.io --redis-token AXxx...

# Pull and print vars
envtunnel pull <token>

# Pull and save to file
envtunnel pull <token> -o .env

# Pull and export to shell
eval $(envtunnel pull <token> --export)

# Check if a token is still alive (non-destructive)
envtunnel peek <token>

# All commands accept --redis-url / --redis-token for custom Upstash
envtunnel pull <token> --redis-url https://xxx.upstash.io --redis-token AXxx...
```

---

## Web Dashboard

Visit `/dashboard` for a browser UI to push and pull without the CLI.

Features:

- Generate a strong passphrase (word-word-word-word-NN format)
- Paste `.env` contents, encrypt, and get a shareable token
- Pull a token by entering it + passphrase — downloads or displays the decrypted vars
- **Custom Upstash config** — use your own Redis instance per request (expand the "upstash config" panel)
- Active tunnel list with countdown timers

---

## Custom Upstash Redis

By default, all tunnels use the server's built-in Upstash Redis. For full privacy (your data never touches someone else's storage), you can bring your own:

### Via the web dashboard

1. Open the **upstash config** panel at the top of the dashboard
2. Enter your REST URL and REST Token
3. Click **test connection** to verify
4. All push/pull operations on that session will use your Redis

### Via the CLI

Pass `--redis-url` and `--redis-token` to any command:

```bash
envtunnel push --redis-url https://your-db.upstash.io --redis-token AXxx...
envtunnel pull <token> --redis-url https://your-db.upstash.io --redis-token AXxx...
```

### Get free Upstash creds

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create a Redis database (free tier is fine)
3. Copy the **REST URL** and **REST Token** from the database page

---

## Self-Hosting / Dev Setup

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- An [Upstash Redis](https://console.upstash.com) database (free tier works)

### Quick start

```bash
# 1. Clone and install
git clone https://github.com/giyucodes/envtunnel.git
cd envtunnel
bun install

# 2. Set up env
cp packages/web/.env.example packages/web/.env
```

Edit `packages/web/.env`:

```env
UPSTASH_REDIS_REST_URL=https://your-db-name.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_rest_token_here
```

> Get these from [console.upstash.com](https://console.upstash.com) → your database → **REST API** tab.

```bash
# 3. Start web dev server
bun run dev
# → http://localhost:5173

# 4. Build the CLI
cd packages/cli
bun run build

# 5. Link CLI globally (optional)
npm link
# Now you can run: envtunnel push

# 6. Point CLI at local server
ENVTUNNEL_API=http://localhost:5173 envtunnel push
```

### Or use the one-liner setup script

```bash
bash setup.sh
```

The script handles cloning, installing, prompting for Upstash creds, building the CLI, and optionally linking it globally.

---

## Updating Upstash Credentials

### Server-side (self-hosted)

Edit `packages/web/.env`:

```env
UPSTASH_REDIS_REST_URL=https://new-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=new_token_here
```

Then restart the dev server:

```bash
# kill existing server (if running in tmux)
tmux kill-session -t dev

# restart
bun run dev
```

For production deployments, update the environment variables in your hosting provider's dashboard (Vercel, Railway, Fly.io, etc.) and redeploy.

### Per-request (no server restart needed)

Use the custom Upstash config in the web dashboard or pass `--redis-url` / `--redis-token` to the CLI. These are never stored server-side.

---

## Architecture

```
envtunnel/
├── packages/
│   ├── web/          # Hono API + React frontend (Vite)
│   │   ├── src/api/  # API routes (tunnel push/pull/consume/peek)
│   │   └── src/web/  # React dashboard
│   └── cli/          # Node.js CLI (Commander)
│       ├── src/index.ts   # Commands: push, pull, peek
│       ├── src/api.ts     # Fetch wrappers
│       └── src/crypto.ts  # AES-256-GCM encrypt/decrypt
```

### API Endpoints

| Method   | Endpoint                     | Description                               |
| -------- | ---------------------------- | ----------------------------------------- |
| `POST`   | `/api/tunnel/push`           | Encrypt + store, returns token            |
| `GET`    | `/api/tunnel/pull/:token`    | Fetch encrypted payload (does NOT delete) |
| `DELETE` | `/api/tunnel/consume/:token` | Destroy token after successful decrypt    |
| `GET`    | `/api/tunnel/peek/:token`    | Check if token exists + TTL remaining     |
| `POST`   | `/api/tunnel/validate-redis` | Test custom Upstash credentials           |

All endpoints accept optional `redisUrl` / `redisToken` (query params for GET/DELETE, body for POST) to use a custom Redis instance.

---

## Stack

| Layer      | Tech                                |
| ---------- | ----------------------------------- |
| CLI        | Node.js, Commander, Chalk, Ora      |
| API        | Hono (Bun)                          |
| Storage    | Upstash Redis (TTL-based, one-time) |
| Encryption | AES-256-GCM, PBKDF2 key derivation  |
| Frontend   | React + Vite                        |

---

## Security Notes

- Passphrase never leaves the client — encryption/decryption is 100% local
- Server only stores the encrypted ciphertext + IV
- Token TTL: **10 minutes**
- Pull is two-step: fetch → decrypt locally → consume. Wrong passphrase = token survives
- Use a strong, unique passphrase per tunnel and share it via a different channel than the token
