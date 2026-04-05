# 🚀 Deployment Guide — Docker trên AWS EC2 t2.micro

> **Môi trường mục tiêu:** Amazon EC2 t2.micro · Amazon Linux 2023 · x86_64  
> **App port:** 5678  
> **Stack:** Next.js 15 · Prisma · SQLite · Docker Compose

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Lần đầu deploy — từng bước chi tiết](#2-lần-đầu-deploy--từng-bước-chi-tiết)
3. [Cấu hình biến môi trường](#3-cấu-hình-biến-môi-trường)
4. [Mở port 5678](#4-mở-port-5678)
5. [Các lệnh vận hành hàng ngày](#5-các-lệnh-vận-hành-hàng-ngày)
6. [Update app khi có code mới](#6-update-app-khi-có-code-mới)
7. [Import dữ liệu theo thư mục](#7-import-dữ-liệu-theo-thư-mục)
8. [Backup và Restore](#8-backup-và-restore)
9. [Giám sát tài nguyên](#9-giám-sát-tài-nguyên)
10. [Xử lý sự cố](#10-xử-lý-sự-cố)
11. [Tham khảo nhanh](#11-tham-khảo-nhanh)

---

## 1. Tổng quan kiến trúc

```
EC2 t2.micro (1 vCPU · 1 GB RAM + 1 GB swap)
 └── Docker Engine
      └── docker-compose.yml
           └── Container "html-reader"   host:5678 → container:5678
                ├── Next.js 15 standalone server
                ├── startup: prisma migrate deploy   (tự động mỗi lần khởi động)
                └── startup: seed-docker.js          (upsert admin + categories)

Volumes:
 ├── db_data  (named volume)    → /app/db/app.db     SQLite database
 ├── ./storage (bind mount)     → /app/storage/      Article HTML files
 └── ./data    (bind mount :ro) → /app/data/         Nguồn import thư mục
```

**Giới hạn tài nguyên container** (trong `docker-compose.yml`):

| Loại | Giá trị |
|------|---------|
| Memory limit | 512 MB |
| CPU limit | 0.9 core |
| Memory reservation | 128 MB |

> t2.micro có 1 GB RAM. Build Next.js cần ~1.5 GB → bắt buộc phải có **swap 1 GB**
> (script cài đặt tự tạo swap).

---

## 2. Lần đầu deploy — từng bước chi tiết

### Bước 1 — SSH vào EC2

```bash
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### Bước 2 — Clone repo

```bash
cd ~
git clone https://github.com/<username>/<repo>.git
cd <repo>
```

### Bước 3 — Cài Docker và Docker Compose

```bash
chmod +x scripts/install-docker.sh
./scripts/install-docker.sh
```

Script sẽ tự động:
- ✅ Tạo **swap 1 GB** — bắt buộc để build Next.js không bị kill OOM
- ✅ Cài **Docker Engine** từ `dnf`
- ✅ Cài **Docker Compose plugin** v2
- ✅ Thêm user hiện tại vào group `docker`

> ⚠️ **Sau khi script xong**: log out → SSH lại (hoặc chạy `newgrp docker`)
> để quyền group `docker` có hiệu lực mà không cần `sudo`.

### Bước 4 — Tạo file cấu hình môi trường

```bash
cp .env.docker.example .env
nano .env      # Hoặc: vi .env
```

Các giá trị **bắt buộc phải đổi**:

```env
NEXTAUTH_SECRET=<chuỗi random ≥32 ký tự>
NEXTAUTH_URL=http://<EC2-PUBLIC-IP>:5678
ADMIN_PASSWORD=<mật khẩu mạnh>
```

Tạo NEXTAUTH_SECRET ngẫu nhiên:
```bash
openssl rand -base64 32
```

### Bước 5 — Build image và khởi chạy

```bash
docker compose up -d --build
```

Lần đầu build mất **10–20 phút** trên t2.micro (build Next.js + cài npm packages).  
Trong quá trình build, Node.js heap được giới hạn ở 700 MB nhờ `NODE_OPTIONS` trong Dockerfile.

Khi container khởi động, tự động chạy:
1. `prisma migrate deploy` — áp dụng migrations
2. `seed-docker.js` — tạo admin user + categories (idempotent)
3. `node server.js` — khởi động Next.js server

### Bước 6 — Mở port 5678

**A. Mở firewall OS-level:**
```bash
chmod +x scripts/open-port.sh
./scripts/open-port.sh
```

**B. Mở AWS Security Group** (bắt buộc — thường là bước hay quên nhất):
1. AWS Console → **EC2 → Security Groups**
2. Chọn Security Group của instance
3. **Inbound rules → Edit inbound rules → Add rule**
4. `Type: Custom TCP` | `Port: 5678` | `Source: 0.0.0.0/0`
5. **Save rules**

### Bước 7 — Kiểm tra và truy cập

```bash
# Kiểm tra container đang chạy
docker compose ps

# Xem logs
docker compose logs -f --tail=50

# Test từ chính EC2
curl -I http://localhost:5678
```

Truy cập từ trình duyệt:
```
http://<EC2-PUBLIC-IP>:5678
```

Đăng nhập Admin:
```
URL:      http://<EC2-PUBLIC-IP>:5678/login
Username: admin           (hoặc ADMIN_USERNAME trong .env)
Password: <ADMIN_PASSWORD trong .env>
```

---

## 3. Cấu hình biến môi trường

| Biến | Bắt buộc | Giá trị mặc định | Mô tả |
|------|----------|-----------------|-------|
| `DATABASE_URL` | ✅ | `file:/app/db/app.db` | Đường dẫn SQLite trong container |
| `NEXTAUTH_SECRET` | ✅ | — | Random string ≥32 ký tự |
| `NEXTAUTH_URL` | ✅ | — | URL công khai, ví dụ `http://1.2.3.4:5678` |
| `ADMIN_USERNAME` | ✅ | `admin` | Username tài khoản admin |
| `ADMIN_PASSWORD` | ✅ | `admin123` | **Đổi ngay!** |
| `ADMIN_EMAIL` | ✅ | `admin@example.com` | Email admin |

> ⚠️ File `.env` **không được commit** lên Git (đã có trong `.gitignore`).  
> Chỉ file `.env.docker.example` mới được commit.

---

## 4. Mở port 5678

### Script tự động

```bash
./scripts/open-port.sh
```

Script kiểm tra và cấu hình: `iptables`, `firewalld`, `nftables` (tùy cái nào đang chạy).

### Thủ công — iptables

```bash
sudo iptables -I INPUT -p tcp --dport 5678 -j ACCEPT
# Lưu lại để tồn tại qua reboot:
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### Thủ công — firewalld

```bash
sudo firewall-cmd --permanent --add-port=5678/tcp
sudo firewall-cmd --reload
```

### Kiểm tra

```bash
sudo ss -tlnp | grep 5678
curl -I http://localhost:5678
```

---

## 5. Các lệnh vận hành hàng ngày

```bash
# Xem trạng thái
docker compose ps

# Xem logs realtime
docker compose logs -f

# Dừng app (container còn đó, data an toàn)
docker compose stop

# Khởi động lại
docker compose start
docker compose restart          # hoặc restart riêng service

# Xóa container (data vẫn an toàn trong volumes)
docker compose down

# Xem tài nguyên đang dùng (RAM, CPU)
docker stats html-reader --no-stream
```

---

## 6. Update app khi có code mới

```bash
# 1. Pull code mới nhất
git pull

# 2. Build lại image + restart container
docker compose up -d --build
```

Docker sẽ tự động:
- Build image mới với code mới
- Dừng container cũ (graceful stop 30s)
- Khởi động container mới
- `prisma migrate deploy` — áp dụng migrations mới (nếu có)

> 💡 Lần build thứ 2 trở đi nhanh hơn nhờ Docker layer cache.  
> Chỉ những layer thay đổi mới được rebuild.

### Chỉ restart mà không rebuild

```bash
docker compose restart app
```

### Xem migration status

```bash
docker compose exec app node node_modules/prisma/build/index.js migrate status
```

---

## 7. Import dữ liệu theo thư mục

### Cấu trúc thư mục hỗ trợ

**Cấu trúc đầy đủ (Tuyển tập → Phần → Bài viết):**
```
data/
└── ten-tuyen-tap/
    ├── phan-1/
    │   ├── chuong-1.html
    │   ├── chuong-2.html
    │   └── chuong-21.html
    └── phan-2/
        ├── chuong-1.html
        └── chuong-8.html
```

**Cấu trúc đơn giản (Tuyển tập → Bài viết, không qua Phần):**
```
data/
└── ten-tuyen-tap/
    ├── bai-1.html
    ├── bai-2.html
    └── bai-10.html
```

**Có thể kết hợp cả hai** trong cùng một folder.

Tên file/folder được tự động chuyển thành tiêu đề:
- `khong-gia-dinh` → `Khong Gia Dinh`
- `phan-1` → `Phan 1`
- `chuong-21` → `Chuong 21`

### Import qua Admin UI

1. Vào `http://<HOST>:5678/admin/import`
2. Chọn thư mục từ danh sách (hiển thị các folder trong `data/`)
3. Tùy chỉnh tên tuyển tập và danh mục
4. Click **"Import"**

### Thêm dữ liệu mới

```bash
# 1. Tạo thư mục và thêm file HTML
mkdir -p data/ten-truyen/phan-1
cp *.html data/ten-truyen/phan-1/

# 2. Commit và push
git add data/
git commit -m "Add ten-truyen data"
git push

# 3. Trên EC2: pull code mới
git pull
# Container đang mount data/ nên thấy ngay, không cần restart

# 4. Vào Admin → Import thư mục → chọn "ten-truyen"
```

---

## 8. Backup và Restore

### Backup database

```bash
# Backup SQLite DB từ named volume
mkdir -p ~/backups
docker run --rm \
  -v read-en-jp-with-ipa-furigana_db_data:/data \
  -v ~/backups:/backup \
  alpine cp /data/app.db /backup/app-$(date +%Y%m%d-%H%M%S).db

echo "Backup saved to ~/backups/"
```

### Backup article HTML files

```bash
# storage/ là bind mount nên copy trực tiếp từ host
tar -czf ~/backups/storage-$(date +%Y%m%d).tar.gz storage/
```

### Restore database

```bash
# Dừng app trước
docker compose stop

# Restore
docker run --rm \
  -v read-en-jp-with-ipa-furigana_db_data:/data \
  -v ~/backups:/backup \
  alpine cp /backup/app-20260101-120000.db /data/app.db

# Khởi động lại
docker compose start
```

### Cron backup tự động

```bash
# Thêm vào crontab: crontab -e
# Backup mỗi ngày lúc 2 giờ sáng
0 2 * * * cd /home/ec2-user/<repo> && \
  docker run --rm \
    -v read-en-jp-with-ipa-furigana_db_data:/data \
    -v /home/ec2-user/backups:/backup \
    alpine cp /data/app.db /backup/app-$(date +\%Y\%m\%d).db
```

---

## 9. Giám sát tài nguyên

### RAM và swap

```bash
free -h                     # Tổng quan RAM + swap
swapon --show               # Chi tiết swap
docker stats html-reader --no-stream    # Container stats
```

Kết quả mong đợi khi chạy bình thường:
```
CONTAINER      CPU %   MEM USAGE / LIMIT     MEM %
html-reader    0-3%    150-250MiB / 512MiB   30-50%
```

### Nếu container liên tục bị OOM-killed

Triệu chứng: logs hiện `Killed`, container restart liên tục.

Giải pháp theo thứ tự ưu tiên:
```bash
# 1. Thêm swap
sudo fallocate -l 1G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# 2. Tăng memory limit (nếu dùng t2.small với 2GB RAM)
# Sửa docker-compose.yml: memory: 768m

# 3. Upgrade instance lên t2.small
```

---

## 10. Xử lý sự cố

### App không khởi động

```bash
docker compose logs --tail=100
docker compose logs app 2>&1 | grep -iE "error|fatal|killed|panic"
```

### Port 5678 không truy cập được từ ngoài

Checklist:
```bash
# 1. Container đang chạy?
docker compose ps

# 2. Port đã bind?
docker port html-reader

# 3. OS firewall OK?
sudo ss -tlnp | grep 5678

# 4. Chạy lại script mở port
./scripts/open-port.sh

# 5. AWS Security Group đã open port 5678?
#    → AWS Console → EC2 → Security Groups → Inbound rules
```

### Lỗi database

```bash
# Xem migration status
docker compose exec app node node_modules/prisma/build/index.js migrate status

# Restart fix "database is locked"
docker compose restart app
```

### Rebuild hoàn toàn (reset mọi thứ)

```bash
# Giữ data
docker compose down
docker system prune -f          # Xóa cache nhưng KHÔNG xóa volumes
docker compose up -d --build

# Reset luôn cả data (DESTRUCTIVE)
docker compose down -v          # -v xóa named volumes (mất DB!)
docker compose up -d --build
```

---

## 11. Tham khảo nhanh

```bash
# ── DEPLOY LẦN ĐẦU ──────────────────────────────────────────
./scripts/install-docker.sh          # Cài Docker + swap
newgrp docker                        # Áp dụng group docker
cp .env.docker.example .env
nano .env                            # Điền secrets
docker compose up -d --build         # Build + run
./scripts/open-port.sh               # Mở port OS
# → Mở Security Group trên AWS Console

# ── UPDATE CODE ──────────────────────────────────────────────
git pull && docker compose up -d --build

# ── XEM LOGS ─────────────────────────────────────────────────
docker compose logs -f --tail=50

# ── BACKUP DB ────────────────────────────────────────────────
docker run --rm \
  -v read-en-jp-with-ipa-furigana_db_data:/data \
  -v $(pwd)/backups:/b \
  alpine cp /data/app.db /b/app-$(date +%Y%m%d).db

# ── STATS ────────────────────────────────────────────────────
docker stats html-reader --no-stream
free -h

# ── RESTART ──────────────────────────────────────────────────
docker compose restart
```

---

## Phụ lục — Cấu trúc file Docker

| File | Mục đích |
|------|----------|
| `Dockerfile` | Multi-stage build: deps → builder → runner (Alpine) |
| `docker-compose.yml` | Orchestration: port, volumes, resource limits |
| `.env.docker.example` | Template env — copy thành `.env` |
| `docker-entrypoint.sh` | Startup: migrate → seed → start server |
| `prisma/seed-docker.js` | CJS seed (không cần tsx) |
| `.dockerignore` | Loại trừ node_modules, .next, .env, storage |
| `scripts/install-docker.sh` | Cài Docker + swap trên Amazon Linux 2023 |
| `scripts/open-port.sh` | Mở port 5678 qua iptables/firewalld/nftables |

