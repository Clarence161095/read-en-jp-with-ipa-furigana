# ✅ Development Checklist

## Phase 1: Project Setup
- [ ] Khởi tạo Next.js project với TypeScript
- [ ] Cài đặt dependencies (Prisma, NextAuth, bcrypt, Tailwind CSS)
- [ ] Cấu hình `next.config.js` (port 5678, standalone output)
- [ ] Cấu hình Tailwind CSS
- [ ] Tạo `.env.example` và `.env`
- [ ] Tạo `.gitignore` (bao gồm .env, node_modules, .next, prisma/dev.db, storage/)
- [ ] Tạo thư mục `storage/articles/`

## Phase 2: Database & Auth
- [ ] Viết Prisma schema (`prisma/schema.prisma`)
- [ ] Chạy `prisma migrate dev --name init`
- [ ] Viết seed script (`prisma/seed.ts`) - tạo admin account + default categories
- [ ] Tạo Prisma client singleton (`src/lib/prisma.ts`)
- [ ] Cấu hình NextAuth (`src/lib/auth.ts`) - Credentials provider + JWT
- [ ] Tạo auth API route (`src/app/api/auth/[...nextauth]/route.ts`)
- [ ] Tạo middleware (`src/middleware.ts`) - bảo vệ routes admin
- [ ] Test login/logout flow

## Phase 3: API Endpoints
- [ ] **Articles API:**
  - [ ] GET `/api/articles` - Danh sách (phân trang, search, filter)
  - [ ] GET `/api/articles/[id]` - Chi tiết metadata
  - [ ] GET `/api/articles/[id]/raw` - Raw HTML content (cho iframe)
  - [ ] GET `/api/articles/slug/[slug]` - Lấy theo slug
  - [ ] POST `/api/articles` - Tạo mới (upload HTML file/paste content)
  - [ ] PUT `/api/articles/[id]` - Cập nhật
  - [ ] DELETE `/api/articles/[id]` - Xóa (+ xóa file HTML)
- [ ] **Users API:**
  - [ ] GET `/api/users` - Danh sách users
  - [ ] POST `/api/users` - Tạo user
  - [ ] PUT `/api/users/[id]` - Cập nhật user
  - [ ] DELETE `/api/users/[id]` - Xóa user
- [ ] **Categories API:**
  - [ ] GET `/api/categories` - Danh sách
  - [ ] POST `/api/categories` - Tạo
  - [ ] PUT `/api/categories/[id]` - Cập nhật
  - [ ] DELETE `/api/categories/[id]` - Xóa

## Phase 4: Frontend - Public Pages
- [ ] Tạo root layout (`src/app/layout.tsx`) - Tailwind, fonts, metadata
- [ ] **Navbar Component** - Logo, login button, responsive
- [ ] **Trang chủ `/`:**
  - [ ] Search bar
  - [ ] Category filter tabs
  - [ ] Article cards grid (responsive: 1/2/3 cols)
  - [ ] Pagination
  - [ ] Loading states
- [ ] **Trang đọc `/read/[slug]`:**
  - [ ] Full screen layout (100vw x 100vh)
  - [ ] iframe load `/api/articles/[id]/raw`
  - [ ] Back button (fixed, top-right, semi-transparent)
  - [ ] Tăng viewCount khi mở đọc
  - [ ] **TEST:** Verify HTML renders đúng nguyên bản, không bị ảnh hưởng CSS
- [ ] **Trang Login `/login`:**
  - [ ] Form: username + password
  - [ ] Error messages
  - [ ] Redirect sau login

## Phase 5: Frontend - Admin Panel
- [ ] **Admin Layout** (`src/app/admin/layout.tsx`):
  - [ ] Sidebar navigation (desktop)
  - [ ] Bottom nav hoặc hamburger (mobile)
  - [ ] Auth check - redirect nếu không phải editor+
- [ ] **Dashboard `/admin`:**
  - [ ] Stats cards (total articles, users, views)
  - [ ] Recent articles list
- [ ] **Articles Management `/admin/articles`:**
  - [ ] Table/List bài viết (responsive)
  - [ ] Search & filter
  - [ ] Actions: Edit, Delete (with confirmation)
  - [ ] Pagination
- [ ] **New Article `/admin/articles/new`:**
  - [ ] Form: title, description, category, tags
  - [ ] HTML input: upload file HOẶC paste code
  - [ ] Preview button (mở iframe preview)
  - [ ] Submit & validation
- [ ] **Edit Article `/admin/articles/[id]/edit`:**
  - [ ] Pre-populate form với data hiện tại
  - [ ] Cho phép update HTML content
  - [ ] Preview
- [ ] **Users Management `/admin/users`** (Admin only):
  - [ ] Users table
  - [ ] Add user modal/form
  - [ ] Edit user (change role, reset password)
  - [ ] Delete user (with confirmation)
  - [ ] Không cho xóa chính mình
  - [ ] Không cho thay đổi admin role của mình

## Phase 6: Polish & UX
- [ ] Mobile responsive test tất cả trang
- [ ] Loading skeletons / spinners
- [ ] Toast notifications cho actions (created, updated, deleted)
- [ ] Error pages (404, 500)
- [ ] Empty states (no articles, no results)
- [ ] Confirm dialog trước khi delete
- [ ] Auto-generate slug từ title

## Phase 7: Deploy Scripts
- [ ] Tạo `scripts/deploy.sh`
- [ ] Tạo `scripts/update.sh`
- [ ] Tạo `scripts/migrate.sh`
- [ ] Tạo `scripts/backup.sh`
- [ ] Tạo `.env.example` hoàn chỉnh
- [ ] Test scripts trên Amazon Linux 2023 (hoặc tương đương)

## Phase 8: Testing & Final
- [ ] Import sample HTML files (data/sample.html, data/khong-gia-dinh/chapter-2.html)
- [ ] Test full flow: login → create article → view trên trang chủ → đọc → edit → delete
- [ ] Test roles: admin vs editor vs user
- [ ] Test mobile (Chrome DevTools)
- [ ] Test iframe HTML rendering (CSS isolation)
- [ ] Verify deploy script hoạt động
- [ ] Cập nhật README.md

---

## Dependencies cần cài

### Production
```json
{
  "next": "^14",
  "react": "^18",
  "react-dom": "^18",
  "@prisma/client": "^5",
  "next-auth": "^5",
  "bcrypt": "^5",
  "uuid": "^9"
}
```

### Development
```json
{
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/bcrypt": "^5",
  "@types/uuid": "^9",
  "prisma": "^5",
  "tailwindcss": "^3",
  "postcss": "^8",
  "autoprefixer": "^10",
  "ts-node": "^10"
}
```

---

## Thứ tự phát triển khuyến nghị

```
Phase 1 (Setup) → Phase 2 (DB & Auth) → Phase 3 (APIs) 
→ Phase 4 (Public Pages) → Phase 5 (Admin) 
→ Phase 6 (Polish) → Phase 7 (Deploy) → Phase 8 (Test)
```

Mỗi phase nên hoàn thành và test trước khi chuyển sang phase tiếp theo.
