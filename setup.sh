#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
#  envtunnel – local setup script
# ─────────────────────────────────────────────

REPO_URL="https://github.com/YOUR_USERNAME/envtunnel.git"  # ← update this
PROJECT_DIR="envtunnel"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}→ $1${RESET}"; }
ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
err()  { echo -e "${RED}✗ $1${RESET}"; exit 1; }

# ── 1. Check deps ──────────────────────────────
step "Checking dependencies"

command -v bun  >/dev/null 2>&1 || err "bun not found. Install: https://bun.sh"
command -v git  >/dev/null 2>&1 || err "git not found."
command -v node >/dev/null 2>&1 || err "node not found."
ok "bun $(bun --version), node $(node --version)"

# ── 2. Clone ───────────────────────────────────
step "Cloning repo"

if [ -d "$PROJECT_DIR" ]; then
  echo "Directory '$PROJECT_DIR' already exists — skipping clone."
else
  git clone "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# ── 3. Install deps ────────────────────────────
step "Installing dependencies"
bun install
ok "Dependencies installed"

# ── 4. Env setup ──────────────────────────────
step "Setting up environment"

ENV_FILE="packages/web/.env"

if [ -f "$ENV_FILE" ]; then
  echo ".env already exists — skipping."
else
  cat > "$ENV_FILE" << 'EOF'
# Get these from https://console.upstash.com → Redis → REST API
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
EOF
  ok "Created $ENV_FILE"

  echo ""
  echo -e "${BOLD}You need Upstash Redis credentials.${RESET}"
  echo "  1. Go to https://console.upstash.com"
  echo "  2. Create a Redis database (free tier works)"
  echo "  3. Copy REST URL + REST Token into: $ENV_FILE"
  echo ""

  read -p "Do you want to enter them now? [y/N] " FILL_NOW
  if [[ "$FILL_NOW" =~ ^[Yy]$ ]]; then
    read -p "  UPSTASH_REDIS_REST_URL:   " REDIS_URL
    read -p "  UPSTASH_REDIS_REST_TOKEN: " REDIS_TOKEN
    printf "UPSTASH_REDIS_REST_URL=%s\nUPSTASH_REDIS_REST_TOKEN=%s\n" \
      "$REDIS_URL" "$REDIS_TOKEN" > "$ENV_FILE"
    ok "Credentials saved"
  else
    echo "Edit $ENV_FILE before starting the dev server."
  fi
fi

# ── 5. Build CLI ───────────────────────────────
step "Building CLI"
cd packages/cli
bun run build
ok "CLI built → dist/index.js"

# Optional: global link
read -p "Link CLI globally? (makes 'envtunnel' available everywhere) [y/N] " LINK_CLI
if [[ "$LINK_CLI" =~ ^[Yy]$ ]]; then
  npm link
  ok "'envtunnel' linked globally"
  echo "  Test with: envtunnel --help"
fi

cd ../..

# ── 6. Done ────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  envtunnel ready!${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo "  Start dev server:  bun run dev"
echo "  Web UI:            http://localhost:5173"
echo ""
echo "  CLI usage:"
echo "    envtunnel push .env"
echo "    envtunnel pull <token>"
echo ""
