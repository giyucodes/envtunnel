# envtunnel

Encrypted one-time env sharing via the CLI. No Slack DMs with secrets ever again.

```bash
npm install -g envtunnel
```

> Requires Node.js 18+

---

## Usage

```bash
# Push your .env — get a one-time token
envtunnel push
envtunnel push --file .env --label staging

# Push specific shell vars
envtunnel push --env DATABASE_URL,API_KEY

# Pull and print
envtunnel pull <token>

# Pull and save to file
envtunnel pull <token> -o .env

# Pull and export to current shell
eval $(envtunnel pull <token> --export)

# Check if a token is still alive (non-destructive)
envtunnel peek <token>
```

## How it works

1. **Push** — encrypts your `.env` locally with AES-256-GCM using your passphrase → sends ciphertext to a Redis store → returns a UUID token (expires in 10 min)
2. **Share** — send the token via any channel. Send the passphrase via a **separate** channel (Signal, phone call, etc.)
3. **Pull** — fetches the ciphertext → decrypts locally with passphrase → token consumed. Wrong passphrase = token survives, try again.

Server never sees plaintext. Encryption/decryption happens entirely on your machine.

## Custom Upstash Redis

By default uses the hosted envtunnel server. For full privacy, bring your own [Upstash Redis](https://console.upstash.com):

```bash
envtunnel push --redis-url https://xxx.upstash.io --redis-token AXxx...
envtunnel pull <token> --redis-url https://xxx.upstash.io --redis-token AXxx...
```

## Self-host the server

See the [full repo](https://github.com/giyucodes/envtunnel) to run the API + web dashboard yourself.

```bash
ENVTUNNEL_API=https://your-server.com envtunnel push
```

## Options

| Flag | Commands | Description |
|------|----------|-------------|
| `--file <path>` | push | Path to .env file (default: `.env`) |
| `--label <label>` | push | Label for this tunnel |
| `--env <vars>` | push | Comma-separated shell var names to include |
| `-o, --output <path>` | pull | Write decrypted vars to file |
| `--export` | pull | Print as `export KEY=VAL` for shell eval |
| `--api <url>` | all | Custom API base URL |
| `--redis-url <url>` | all | Custom Upstash Redis REST URL |
| `--redis-token <token>` | all | Custom Upstash Redis REST token |

## License

MIT
