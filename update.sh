#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/opt/tsm-store"
[ -d "$INSTALL_DIR" ] || INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ">>> Creating pre-update backup..."
bash "$INSTALL_DIR/backup.sh" || true

echo ">>> Pulling latest commits from GitHub..."
cd "$INSTALL_DIR"
git pull origin main

echo ">>> Installing updated dependencies..."
npm install --legacy-peer-deps

echo ">>> Building frontend assets..."
npm run build

echo ">>> Restarting TSM STORE service..."
systemctl restart tsm-store

echo ">>> Verifying health..."
sleep 2
curl -s http://127.0.0.1:3000/api/health || true

echo "✓ TSM STORE has been updated successfully!"
