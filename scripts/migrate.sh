#!/bin/bash
set -e

echo "🗄️ Database migration..."

# --- 1. Backup current database ---
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -f prisma/dev.db ]; then
    cp prisma/dev.db "$BACKUP_DIR/dev_${TIMESTAMP}.db"
    echo "💾 Database backed up to: $BACKUP_DIR/dev_${TIMESTAMP}.db"
fi

# --- 2. Generate Prisma client ---
echo "⚙️ Generating Prisma client..."
npx prisma generate

# --- 3. Run migrations ---
echo "📋 Applying migrations..."
npx prisma migrate deploy

# --- 4. Run seed (won't duplicate due to upsert) ---
echo "🌱 Running seed..."
npx prisma db seed

echo ""
echo "✅ Migration complete!"
echo ""

# --- 5. Show migration status ---
echo "📊 Migration status:"
npx prisma migrate status
