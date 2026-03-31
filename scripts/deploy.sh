#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# --- 1. Install Node.js 20 (via dnf) ---
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    sudo dnf install -y nodejs20 npm
fi
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# --- 2. Install PM2 globally ---
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# --- 3. Install dependencies ---
echo "📦 Installing app dependencies..."
npm ci --production=false

# --- 4. Setup environment ---
if [ ! -f .env ]; then
    echo "⚙️ Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your settings!"
    echo "   nano .env"
    echo ""
    echo "Then run: ./scripts/deploy.sh again"
    exit 1
fi

# --- 5. Setup database ---
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# --- 6. Create storage directory ---
mkdir -p storage/articles

# --- 7. Build app ---
echo "🔨 Building app..."
npm run build

# --- 8. Start with PM2 ---
echo "🟢 Starting app with PM2..."
pm2 delete html-reader 2>/dev/null || true
pm2 start npm --name "html-reader" -- start
pm2 save

# --- 9. Auto-start on reboot ---
echo "⚙️ Setting up PM2 startup..."
pm2 startup 2>/dev/null || true

echo ""
echo "✅ Deployment complete!"
PUBLIC_IP=$(curl -s --connect-timeout 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_IP")
echo "🌐 App running at: http://${PUBLIC_IP}:5678"
echo ""
