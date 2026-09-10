#!/usr/bin/env bash
# Acceptance run for the GRI Quantitative dashboard.
#
# Boots the real app (vite dev) + a mock API replaying the real contract fixture, points
# headless Chrome at the app with the workflow-API host remapped to the mock, and runs
# scripts/dashboard-acceptance.check.ts against it.
#
# run: bash scripts/run-dashboard-acceptance.sh
set -uo pipefail
cd "$(dirname "$0")/.."

APP_PORT=5199
API_PORT=8787
CDP_PORT=9222
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="$(mktemp -d)"

cleanup() {
  [[ -n "${CHROME_PID:-}" ]] && kill "$CHROME_PID" 2>/dev/null
  [[ -n "${VITE_PID:-}" ]] && kill "$VITE_PID" 2>/dev/null
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null
  rm -rf "$PROFILE"
}
trap cleanup EXIT

echo "--- ensuring self-signed cert for the mock API host (gitignored, regenerated on demand)"
if [[ ! -f .temp/certs/cert.pem ]]; then
  mkdir -p .temp/certs
  openssl req -x509 -newkey rsa:2048 -keyout .temp/certs/key.pem -out .temp/certs/cert.pem \
    -days 2 -nodes -subj "/CN=api-officeless-dev.mekari.com" \
    -addext "subjectAltName=DNS:api-officeless-dev.mekari.com" 2>/dev/null
fi

echo "--- starting mock api (real contract fixture) on :$API_PORT"
node --experimental-strip-types scripts/mock-api-server.ts "$API_PORT" > /tmp/mock-api.log 2>&1 &
API_PID=$!

echo "--- starting vite dev on :$APP_PORT"
pnpm dev --port "$APP_PORT" > /tmp/vite-acceptance.log 2>&1 &
VITE_PID=$!

sleep 6
grep -q "mock api on" /tmp/mock-api.log || { echo "mock api failed:"; cat /tmp/mock-api.log; exit 1; }
head -3 /tmp/mock-api.log

echo "--- starting headless chrome, remapping the workflow API host to the mock"
"$CHROME" \
  --headless=new \
  --remote-debugging-port="$CDP_PORT" \
  --user-data-dir="$PROFILE" \
  --no-first-run --no-default-browser-check \
  --ignore-certificate-errors \
  --host-resolver-rules="MAP api-officeless-dev.mekari.com 127.0.0.1:$API_PORT, MAP api-officeless.mekari.com 127.0.0.1:$API_PORT" \
  about:blank > /tmp/chrome.log 2>&1 &
CHROME_PID=$!

for i in $(seq 1 20); do
  curl -sf "http://localhost:$CDP_PORT/json/version" > /dev/null && break
  sleep 1
done
curl -sf "http://localhost:$CDP_PORT/json/version" > /dev/null || { echo "chrome CDP never came up"; cat /tmp/chrome.log; exit 1; }

echo "--- running acceptance check"
node --experimental-strip-types scripts/dashboard-acceptance.check.ts "http://localhost:$APP_PORT"
STATUS=$?
exit $STATUS
