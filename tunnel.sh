#!/usr/bin/env bash
# tunnel.sh — Expose the Unni-verse preview server to the public internet via ngrok.
# Prerequisites: ngrok must be installed and authenticated (ngrok config add-authtoken <token>).
# Usage: bash tunnel.sh
set -e

PORT=4173

# Verify ngrok is available
if ! command -v ngrok &>/dev/null; then
  echo ""
  echo "  ngrok not found. Install it first:"
  echo "    brew install ngrok/ngrok/ngrok"
  echo "  Then authenticate:"
  echo "    ngrok config add-authtoken <YOUR_TOKEN>"
  echo ""
  exit 1
fi

# Start the preview server in the background if nothing is already listening on PORT
if ! lsof -iTCP:${PORT} -sTCP:LISTEN -t &>/dev/null; then
  echo ""
  echo "  Starting Vite preview server on port ${PORT}..."
  npm run build
  npx vite preview --host 0.0.0.0 --port ${PORT} &
  SERVER_PID=$!
  echo "  Preview server PID: ${SERVER_PID}"
  # Give the server a moment to start
  sleep 2
else
  echo ""
  echo "  Preview server already running on port ${PORT}."
fi

echo ""
echo "  Starting ngrok tunnel → http://localhost:${PORT}"
echo "  Press Ctrl+C to stop."
echo ""

# Trap Ctrl+C to clean up the background server if we started it
cleanup() {
  echo ""
  echo "  Stopping tunnel..."
  if [[ -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" 2>/dev/null || true
    echo "  Preview server stopped."
  fi
  exit 0
}
trap cleanup INT TERM

ngrok http ${PORT}
