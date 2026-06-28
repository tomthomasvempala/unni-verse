#!/usr/bin/env bash
# host.sh — Build and serve Unni-verse on the local WiFi network.
# Usage: bash host.sh
set -e

echo ""
echo "  Building Unni-verse for production..."
npm run build

# Detect local WiFi IP (macOS: en0 = WiFi, en1 = fallback)
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │  Unni-verse is live on your WiFi network!   │"
echo "  │                                             │"
echo "  │  Local:    http://localhost:4173            │"
printf "  │  Network:  http://%-26s│\n" "${IP}:4173"
echo "  │                                             │"
echo "  │  Share the Network URL with your players.  │"
echo "  └─────────────────────────────────────────────┘"
echo ""

npx vite preview --host 0.0.0.0 --port 4173
