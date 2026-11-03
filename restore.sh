#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/opt/tsm-store"
[ -d "$INSTALL_DIR" ] || INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "${1:-}" ]; then
  echo "Usage: bash restore.sh <path-to-backup-file.tar.gz>"
  echo "Available backups in $INSTALL_DIR/data/backups:"
  ls -lh "$INSTALL_DIR/data/backups" || true
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo ">>> Restoring backup from $BACKUP_FILE..."
tar -xzf "$BACKUP_FILE" -C "$INSTALL_DIR"

echo ">>> Restarting service..."
systemctl restart tsm-store

echo "✓ Backup restored successfully!"
