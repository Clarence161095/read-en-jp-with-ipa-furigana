#!/bin/bash
set -e

echo "🔄 Updating app..."

# --- 1. Pull latest code ---
echo "📥 Pulling latest code..."
git pull origin main

# --- 2. Install dependencies ---
echo "📦 Installing dependencies..."
npm ci --production=false

# --- 3. Run migrations ---
echo "🗄️ Running migrations..."
npx prisma generate
npx prisma migrate deploy

# --- 4. Rebuild ---
echo "🔨 Rebuilding app..."
npm run build

# --- 5. Restart PM2 ---
echo "🔄 Restarting app..."
pm2 restart html-reader

echo ""
echo "✅ Update complete!"
echo "🌐 App restarted successfully"
echo ""
