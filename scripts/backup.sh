#!/bin/bash
set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup..."

# Backup database
if [ -f prisma/dev.db ]; then
    cp prisma/dev.db "$BACKUP_DIR/db_${TIMESTAMP}.db"
    echo "  ✅ Database backed up"
fi

# Backup storage (HTML files)
if [ -d storage/articles ]; then
    tar -czf "$BACKUP_DIR/articles_${TIMESTAMP}.tar.gz" storage/articles/
    echo "  ✅ Articles backed up"
fi

# Backup .env
if [ -f .env ]; then
    cp .env "$BACKUP_DIR/env_${TIMESTAMP}.bak"
    echo "  ✅ Environment backed up"
fi

echo ""
echo "✅ Backup complete! Files in: $BACKUP_DIR/"
ls -la "$BACKUP_DIR/"
