# 🚀 Deployment Guide - AWS EC2

## Target Environment
- **AMI:** amazon/al2023-ami-2023.9.20251014.0-kernel-6.1-x86_64
- **OS:** Amazon Linux 2023
- **Port:** 5678
- **Process Manager:** PM2
- **Reverse Proxy:** Không cần (truy cập trực tiếp port 5678)

---

## Quy trình deploy (Người dùng chỉ cần làm)

```bash
# 1. Khởi động EC2 instance

# 2. Mở port 5678 trong Security Group (Inbound Rules)
#    Type: Custom TCP
#    Port: 5678
#    Source: 0.0.0.0/0

# 3. SSH vào EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# 4. Clone repo
git clone https://github.com/your-username/read-en-jp-with-ipa-furigana.git
cd read-en-jp-with-ipa-furigana

# 5. Chạy script deploy
chmod +x scripts/*.sh
./scripts/deploy.sh
```

**Xong!** App sẽ chạy tại `http://your-ec2-ip:5678`

---

## Scripts

### 1. `scripts/deploy.sh` - Deploy lần đầu

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# --- 1. Install Node.js 20 (via dnf) ---
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    sudo dnf install -y nodejs20 npm
fi
node --version
npm --version

# --- 2. Install PM2 globally ---
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# --- 3. Install dependencies ---
echo "📦 Installing app dependencies..."
npm ci --production=false  # Need devDeps for build

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
pm2 start npm --name "html-reader" -- start -- -p 5678
pm2 save
pm2 startup  # Auto-start on reboot

echo ""
echo "✅ Deployment complete!"
echo "🌐 App running at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5678"
echo ""
```

### 2. `scripts/update.sh` - Update app

```bash
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
```

### 3. `scripts/migrate.sh` - Migration database

```bash
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

# --- 4. Run seed (if needed, won't duplicate due to upsert) ---
echo "🌱 Running seed..."
npx prisma db seed

echo ""
echo "✅ Migration complete!"
echo ""

# --- 5. Show migration status ---
echo "📊 Migration status:"
npx prisma migrate status
```

### 4. `scripts/backup.sh` - Backup data

```bash
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
```

---

## .env.example

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="change-this-to-a-random-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:5678"

# Admin Account (used for initial seeding)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-to-a-secure-password"
ADMIN_EMAIL="admin@example.com"

# App Configuration
PORT=5678
NODE_ENV="production"
```

---

## PM2 Commands (Tham khảo)

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs html-reader

# Restart
pm2 restart html-reader

# Stop
pm2 stop html-reader

# Delete
pm2 delete html-reader

# Monitor
pm2 monit
```

---

## Security Notes

1. **Security Group:** Chỉ mở port 5678 (và 22 cho SSH)
2. **NEXTAUTH_SECRET:** Đặt random string dài ≥ 32 ký tự
3. **ADMIN_PASSWORD:** Đặt mật khẩu mạnh
4. **Firewall:** Amazon Linux 2023 mặc định không có firewall local (dùng Security Group)

---

## System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 1 vCPU  | 2 vCPU      |
| RAM      | 1 GB    | 2 GB        |
| Storage  | 8 GB    | 20 GB       |
| Instance | t3.micro| t3.small    |
