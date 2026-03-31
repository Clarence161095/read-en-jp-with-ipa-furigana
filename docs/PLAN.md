# 📖 HTML Reader App - Master Plan

## Tổng quan dự án

**Tên ứng dụng:** HTML Reader  
**Mục đích:** Ứng dụng đọc nội dung HTML (tương tự app đọc báo), cho phép lưu trữ, quản lý và hiển thị các file HTML đầy đủ CSS/JS đúng nguyên bản.  
**Port:** 5678  
**Framework:** Next.js 14 (App Router) - fullstack  
**Database:** SQLite (qua Prisma ORM)  
**Deploy target:** AWS EC2 - Amazon Linux 2023  

---

## Nguyên tắc thiết kế cốt lõi

### 1. HTML Isolation (Cách ly hoàn toàn)
- Khi hiển thị nội dung HTML, sử dụng **iframe** (srcdoc hoặc API endpoint) để CSS/JS của file HTML **KHÔNG bị ảnh hưởng** bởi CSS của app
- **KHÔNG thêm bất kỳ CSS, margin, padding** nào vào nội dung HTML
- Chỉ hiển thị **1 nút Back ở góc phải trên** (floating, nằm ngoài iframe)

### 2. Mobile-First
- Giao diện app (trang chủ, admin, danh sách bài) được thiết kế **mobile-first** với Tailwind CSS
- Responsive trên mọi thiết bị

### 3. Đơn giản & Dễ sử dụng
- UX tối giản, trực quan
- Trang đọc HTML = fullscreen + back button, không gì khác

---

## Phân quyền người dùng (Roles)

| Role    | Xem bài | CRUD bài viết | Quản lý user | Quản lý app |
|---------|---------|---------------|--------------|-------------|
| User    | ✅      | ❌            | ❌           | ❌          |
| Editor  | ✅      | ✅            | ❌           | ❌          |
| Admin   | ✅      | ✅            | ✅           | ✅          |

- **Admin**: Tài khoản đầu tiên được seed từ `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`)
- **Editor**: Được admin tạo, có quyền CRUD nội dung HTML
- **User**: Được admin tạo, chỉ xem nội dung

---

## Tech Stack

| Component       | Technology                        |
|----------------|-----------------------------------|
| Framework      | Next.js 14+ (App Router)          |
| Language       | TypeScript                        |
| Database       | SQLite                            |
| ORM            | Prisma                            |
| Authentication | NextAuth.js v5 (Auth.js)          |
| Password Hash  | bcrypt                            |
| UI Framework   | Tailwind CSS                      |
| File Storage   | Local filesystem (`storage/articles/`) |
| Deploy         | PM2 + Nginx (hoặc chỉ PM2)       |

---

## Cấu trúc thư mục dự kiến

```
/
├── docs/                    # Tài liệu dự án
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed admin account
├── public/                  # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Trang chủ - danh sách bài
│   │   ├── login/
│   │   │   └── page.tsx     # Trang đăng nhập
│   │   ├── read/
│   │   │   └── [slug]/
│   │   │       └── page.tsx # Trang đọc HTML (iframe + back btn)
│   │   ├── admin/
│   │   │   ├── layout.tsx   # Admin layout
│   │   │   ├── page.tsx     # Dashboard
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx         # Quản lý bài viết
│   │   │   │   ├── new/page.tsx     # Thêm bài mới
│   │   │   │   └── [id]/edit/page.tsx # Sửa bài
│   │   │   └── users/
│   │   │       └── page.tsx         # Quản lý user (admin only)
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # Auth API
│   │       ├── articles/            # Articles CRUD API
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── raw/route.ts # Serve raw HTML content
│   │       └── users/               # Users CRUD API
│   │           └── route.ts
│   ├── components/
│   │   ├── ArticleCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── SearchBar.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── utils.ts         # Utility functions
│   └── middleware.ts        # Route protection
├── storage/
│   └── articles/            # Lưu trữ file HTML
├── scripts/
│   ├── deploy.sh            # Script deploy EC2
│   ├── update.sh            # Script update app
│   └── migrate.sh           # Script migration DB
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Luồng hoạt động chính

### 1. Người dùng (User) đọc bài
```
Trang chủ → Chọn bài → Trang đọc (iframe fullscreen + back button)
```

### 2. Editor thêm bài mới
```
Login → Admin Panel → Articles → New → Upload/Paste HTML → Save
```

### 3. Admin quản lý
```
Login → Admin Panel → Dashboard
                     → Articles (CRUD)
                     → Users (CRUD, assign roles)
```

---

## Cách render HTML content

```
┌──────────────────────────────────────┐
│  [Back ←]          (floating button) │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │         <iframe>                 │ │
│ │    src="/api/articles/ID/raw"    │ │
│ │                                  │ │
│ │   Hiển thị HTML nguyên bản      │ │
│ │   Không CSS nào từ app           │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

- iframe load HTML từ API endpoint → render đúng 100% nguyên bản
- Back button nằm **ngoài iframe**, position: fixed, z-index cao, góc phải trên
- Không thêm margin, padding hay bất kỳ style nào vào content

---

## Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Kiến trúc kỹ thuật chi tiết |
| [DATABASE.md](./DATABASE.md) | Schema database |
| [API.md](./API.md) | API endpoints |
| [UI-PAGES.md](./UI-PAGES.md) | Thiết kế UI/UX các trang |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Hướng dẫn deploy EC2 |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist phát triển |
