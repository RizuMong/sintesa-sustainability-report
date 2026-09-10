#!/usr/bin/env bash
# Screenshot every tab of the GRI Quantitative dashboard into .temp/shots/ for a human to
# eyeball against the mockup. Same harness as run-dashboard-acceptance.sh (real app + real
# contract payload), but captures instead of asserting.
#
# run: bash scripts/screenshot-dashboard.sh
set -uo pipefail
cd "$(dirname "$0")/.."

APP_PORT=5201
API_PORT=8789
CDP_PORT=9224
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="$(mktemp -d)"
OUT=".temp/shots"

cleanup() {
  [[ -n "${CHROME_PID:-}" ]] && kill "$CHROME_PID" 2>/dev/null
  [[ -n "${VITE_PID:-}" ]] && kill "$VITE_PID" 2>/dev/null
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null
  rm -rf "$PROFILE"
}
trap cleanup EXIT

if [[ ! -f .temp/certs/cert.pem ]]; then
  mkdir -p .temp/certs
  openssl req -x509 -newkey rsa:2048 -keyout .temp/certs/key.pem -out .temp/certs/cert.pem \
    -days 2 -nodes -subj "/CN=api-officeless-dev.mekari.com" \
    -addext "subjectAltName=DNS:api-officeless-dev.mekari.com" 2>/dev/null
fi
mkdir -p "$OUT"

node --experimental-strip-types scripts/mock-api-server.ts "$API_PORT" > /tmp/shot-api.log 2>&1 &
API_PID=$!
pnpm dev --port "$APP_PORT" > /tmp/shot-vite.log 2>&1 &
VITE_PID=$!
sleep 6

"$CHROME" --headless=new --remote-debugging-port="$CDP_PORT" --user-data-dir="$PROFILE" \
  --no-first-run --no-default-browser-check --ignore-certificate-errors \
  --window-size=1440,2400 \
  --host-resolver-rules="MAP api-officeless-dev.mekari.com 127.0.0.1:$API_PORT, MAP api-officeless.mekari.com 127.0.0.1:$API_PORT" \
  about:blank > /tmp/shot-chrome.log 2>&1 &
CHROME_PID=$!

for i in $(seq 1 20); do
  curl -sf "http://localhost:$CDP_PORT/json/version" > /dev/null && break
  sleep 1
done

node --experimental-strip-types scripts/screenshot-tabs.ts "http://localhost:$APP_PORT" "$OUT" "$CDP_PORT"
