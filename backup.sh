#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/opt/tsm-store"
[ -d "$INSTALL_DIR" ] || INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKUP_DIR="$INSTALL_DIR/data/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/tsm_backup_${TIMESTAMP}.tar.gz"

echo ">>> Creating backup archive..."
tar -czf "$BACKUP_FILE" -C "$INSTALL_DIR" data/store-db.json .env 2>/dev/null || tar -czf "$BACKUP_FILE" -C "$INSTALL_DIR" data/ 2>/dev/null

echo "✓ Backup created: $BACKUP_FILE"
ls -lh "$BACKUP_FILE"
