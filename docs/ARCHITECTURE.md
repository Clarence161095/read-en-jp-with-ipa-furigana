# 🏗️ Architecture - Kiến trúc kỹ thuật

## Stack Overview

```
┌─────────────────────────────────────────────┐
│              Client (Browser)               │
│  ┌───────────────────────────────────────┐  │
│  │  Next.js App (React + Tailwind CSS)   │  │
│  │  - Trang chủ (danh sách bài)          │  │
│  │  - Trang đọc (iframe render HTML)     │  │
│  │  - Admin panel (CRUD articles/users)  │  │
│  └───────────────────────────────────────┘  │
└─────────────┬───────────────────────────────┘
              │ HTTP (port 5678)
┌─────────────▼───────────────────────────────┐
│           Next.js Server (Node.js)          │
│  ┌───────────────────────────────────────┐  │
│  │  API Routes (App Router)              │  │
│  │  - /api/auth/*        (NextAuth)      │  │
│  │  - /api/articles/*    (CRUD + Raw)    │  │
│  │  - /api/users/*       (CRUD)          │  │
│  │  - /api/search        (Search)        │  │
│  └───────────────┬───────────────────────┘  │
│                  │                           │
│  ┌───────────────▼───────────────────────┐  │
│  │         Prisma ORM                    │  │
│  └───────────────┬───────────────────────┘  │
│                  │                           │
│  ┌───────────────▼────┐  ┌───────────────┐  │
│  │  SQLite Database   │  │  File System   │  │
│  │  (prisma/dev.db)   │  │  (storage/)    │  │
│  └────────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Chi tiết các tầng

### 1. Frontend Layer

**Framework:** Next.js 14 App Router  
**UI:** Tailwind CSS  
**State:** React hooks + fetch (không cần state management phức tạp)

Các trang chính:
- **Public:** Trang chủ, trang đọc, trang login
- **Protected (Editor+):** Admin panel, article management  
- **Protected (Admin):** User management

### 2. API Layer

Sử dụng Next.js Route Handlers (`app/api/`):

- **Auth:** NextAuth.js v5 Credentials Provider
- **Articles:** CRUD operations + raw HTML serving
- **Users:** CRUD operations (admin only)
- **Search:** Full-text search trên title, description

### 3. Data Layer

**ORM:** Prisma  
**Database:** SQLite (file-based, zero config)  
**File Storage:** Local filesystem

---

## Authentication Flow

```
┌──────┐     POST /api/auth/signin      ┌──────────┐
│Client│ ─────────────────────────────▶  │ NextAuth │
│      │ ◀─────────────────────────────  │          │
└──────┘     Set session cookie          └────┬─────┘
                                              │
                                    bcrypt.compare()
                                              │
                                         ┌────▼─────┐
                                         │  SQLite  │
                                         │  Users   │
                                         └──────────┘
```

- Sử dụng **JWT strategy** (không cần session table)
- JWT chứa: `id`, `username`, `email`, `role`
- Middleware kiểm tra JWT cho routes protected
- `NEXTAUTH_SECRET` trong `.env`

### Session Strategy: JWT
- Lý do: Đơn giản, không cần thêm table session
- JWT encode/decode bởi NextAuth
- Refresh tự động

---

## HTML Content Rendering Strategy

### Vấn đề
File HTML có CSS riêng (CSS variables, custom styles). Nếu render trực tiếp vào page Next.js, CSS của app sẽ **xung đột** với CSS của file HTML.

### Giải pháp: iframe Isolation

```tsx
// Trang đọc: /read/[slug]/page.tsx
export default function ReadPage({ params }) {
  return (
    <div className="relative w-screen h-screen">
      {/* Back button - NẰM NGOÀI iframe */}
      <button 
        onClick={() => router.back()}
        className="fixed top-4 right-4 z-[9999] bg-black/60 text-white 
                   rounded-full w-10 h-10 flex items-center justify-center
                   hover:bg-black/80 backdrop-blur-sm"
      >
        ←
      </button>
      
      {/* iframe - Render HTML nguyên bản */}
      <iframe
        src={`/api/articles/${articleId}/raw`}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
```

**API endpoint `/api/articles/[id]/raw`:**
- Đọc file HTML từ `storage/articles/`
- Response với `Content-Type: text/html`
- HTML được render nguyên bản trong iframe

### Tại sao iframe?
1. **CSS isolation 100%** - CSS của app không ảnh hưởng HTML content
2. **JS isolation** - Script trong HTML không ảnh hưởng app
3. **Đúng nguyên bản** - HTML render y hệt như mở file trực tiếp
4. **Security** - sandbox attribute giới hạn quyền

---

## File Storage Strategy

```
storage/
└── articles/
    ├── a1b2c3d4-sample.html
    ├── e5f6g7h8-chapter-2.html
    └── ...
```

- Mỗi file được lưu với tên: `{uuid}-{original-slug}.html`
- Path được lưu trong DB field `html_file_path`
- Khi delete article → xóa cả file HTML

---

## Middleware Protection

```typescript
// middleware.ts
// Routes cần auth:
// /admin/*        → role: admin hoặc editor
// /admin/users/*  → role: admin only
// /api/articles/* (POST, PUT, DELETE) → role: editor+
// /api/users/*    → role: admin only

// Routes public:
// /               → trang chủ
// /read/*         → trang đọc
// /login          → trang login
// /api/articles/* (GET) → public
// /api/articles/*/raw   → public
```

---

## Security Considerations

1. **Password hashing:** bcrypt với salt rounds = 12
2. **SQL Injection:** Prisma ORM tự parameterize queries
3. **XSS:** HTML content isolated trong iframe với sandbox
4. **CSRF:** NextAuth tự handle
5. **File upload:** Validate file type (chỉ .html), giới hạn size
6. **Auth:** JWT với NEXTAUTH_SECRET (32+ chars random)
7. **Input validation:** Sanitize title, description trước khi lưu DB

---

## Environment Variables

```env
# Database (Prisma auto-detect)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:5678"

# Admin Account (used for seeding)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-admin-password"
ADMIN_EMAIL="admin@example.com"

# App
PORT=5678
NODE_ENV="production"
```

---

## Build & Run

### Development
```bash
npm run dev -- -p 5678
```

### Production
```bash
npm run build
npm start -- -p 5678
# Hoặc dùng PM2:
pm2 start npm --name "html-reader" -- start -- -p 5678
```
