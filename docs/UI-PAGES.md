# 🎨 UI/UX - Thiết kế các trang

## Nguyên tắc chung
- **Mobile-first:** Thiết kế cho mobile trước, responsive lên desktop
- **Tailwind CSS:** Cho toàn bộ UI của app (KHÔNG áp dụng cho HTML content)
- **Dark/Light mode:** Hỗ trợ cả hai (optional, nếu kịp)
- **Tối giản:** Không rườm rà, trực quan

---

## 1. Trang chủ `/`

### Layout
```
┌─────────────────────────────────────────┐
│  📖 HTML Reader          [Login] [🔍]  │  ← Navbar
├─────────────────────────────────────────┤
│                                         │
│  🔍 Tìm kiếm bài viết...               │  ← Search bar
│                                         │
│  [Tất cả] [English] [Japanese] [...]    │  ← Category tabs
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────┐  ┌───────────┐          │
│  │ 📄        │  │ 📄        │          │
│  │ Title 1   │  │ Title 2   │          │  ← Article cards
│  │ Desc...   │  │ Desc...   │          │     (grid layout)
│  │ 👁 42     │  │ 👁 18     │          │
│  └───────────┘  └───────────┘          │
│                                         │
│  ┌───────────┐  ┌───────────┐          │
│  │ 📄        │  │ 📄        │          │
│  │ Title 3   │  │ Title 4   │          │
│  │ Desc...   │  │ Desc...   │          │
│  │ 👁 7      │  │ 👁 99     │          │
│  └───────────┘  └───────────┘          │
│                                         │
│  [1] [2] [3] ... [Next →]              │  ← Pagination
│                                         │
└─────────────────────────────────────────┘
```

### Mobile (< 768px)
- Cards: 1 cột
- Navbar: hamburger menu hoặc compact
- Search: full width

### Desktop (>= 768px)
- Cards: 2-3 cột grid
- Navbar: full

### Article Card Component
```
┌─────────────────────────┐
│ [Category Badge]        │
│                         │
│ Title of the article    │  ← font-bold, text-lg
│                         │
│ Short description of    │  ← text-gray-600, line-clamp-2
│ the article content...  │
│                         │
│ 👁 42  •  📅 Jan 01     │  ← text-sm, text-gray-400
│ #english #ipa           │  ← tags
└─────────────────────────┘
```

---

## 2. Trang đọc `/read/[slug]`

### CRITICAL: HTML Isolation

```
┌─────────────────────────────────────────┐
│                              [← Back]   │  ← Floating button
│                                         │     position: fixed
│ ┌─────────────────────────────────────┐ │     top-right corner
│ │                                     │ │     z-index: 9999
│ │                                     │ │
│ │     IFRAME                          │ │
│ │     (100% width, 100% height)       │ │
│ │                                     │ │
│ │     HTML content rendered           │ │
│ │     EXACTLY as original file        │ │
│ │                                     │ │
│ │     No extra CSS/margin/padding     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Back Button Style
- `position: fixed; top: 16px; right: 16px;`
- Semi-transparent background: `bg-black/50 hover:bg-black/70`
- Backdrop blur: `backdrop-blur-sm`
- Border radius: full circle
- Size: `w-10 h-10` (40x40px)
- Color: white icon/text
- `z-index: 9999` (trên cả iframe)

### Page Container
- `width: 100vw; height: 100vh;`
- `overflow: hidden;` (iframe tự scroll)
- `padding: 0; margin: 0;` (KHÔNG thêm style nào)

---

## 3. Trang Login `/login`

```
┌─────────────────────────────────────────┐
│             📖 HTML Reader              │
│                                         │
│        ┌───────────────────┐            │
│        │   Đăng Nhập       │            │
│        │                   │            │
│        │ Username           │           │
│        │ [______________]  │            │
│        │                   │            │
│        │ Password           │           │
│        │ [______________]  │            │
│        │                   │            │
│        │ [  Đăng Nhập  ]  │            │
│        │                   │            │
│        └───────────────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

- Centered card
- Simple form: username + password
- Error message nếu sai
- Redirect về trang chủ sau khi login

---

## 4. Admin Panel `/admin`

### Admin Layout
```
┌──────────────────────────────────────────────────┐
│  📖 HTML Reader Admin    [username ▼] [Logout]   │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ 📊 Dash  │    Content Area                       │
│ 📄 Bài   │                                       │
│ 👥 Users │    (changes based on selected menu)   │
│ 📁 Cats  │                                       │
│          │                                       │
│ ← Back   │                                       │
│   to App │                                       │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│  (mobile: bottom nav hoặc hamburger menu)        │
└──────────────────────────────────────────────────┘
```

### Mobile Admin
- Sidebar → Bottom navigation hoặc hamburger
- Content full width

---

## 5. Admin Dashboard `/admin`

```
┌──────────────────────────────────────┐
│  Dashboard                           │
│                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │  50  │  │  5   │  │ 1.2K │      │
│  │ Bài  │  │Users │  │Views │      │
│  └──────┘  └──────┘  └──────┘      │
│                                      │
│  Bài viết gần đây                    │
│  ┌──────────────────────────────┐   │
│  │ Title 1    │ editor1 │ Edit │   │
│  │ Title 2    │ admin   │ Edit │   │
│  │ Title 3    │ editor2 │ Edit │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

---

## 6. Quản lý bài viết `/admin/articles`

```
┌──────────────────────────────────────────┐
│  Quản lý bài viết          [+ Thêm mới] │
│                                          │
│  🔍 Tìm kiếm...                         │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ Title        │ Cat    │ Views │ Act │ │
│  ├─────────────────────────────────────┤ │
│  │ Chapter 2    │ EN     │ 42    │ ✏🗑 │ │
│  │ Sample       │ EN     │ 18    │ ✏🗑 │ │
│  │ Lesson 1     │ JP     │ 7     │ ✏🗑 │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  [1] [2] [3] [Next →]                   │
└──────────────────────────────────────────┘
```

### Mobile: Thay table bằng card list

---

## 7. Thêm/Sửa bài viết `/admin/articles/new` & `/admin/articles/[id]/edit`

```
┌──────────────────────────────────────────┐
│  Thêm bài viết mới                      │
│                                          │
│  Tiêu đề *                               │
│  [____________________________________] │
│                                          │
│  Mô tả                                   │
│  [____________________________________] │
│  [____________________________________] │
│                                          │
│  Danh mục                                │
│  [English Reading          ▼]            │
│                                          │
│  Tags                                     │
│  [english, ipa, chapter-2_____________] │
│                                          │
│  Nội dung HTML *                          │
│  ○ Upload file HTML                      │
│  ● Paste nội dung HTML                   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  <textarea> hoặc code editor      │  │
│  │  cho nội dung HTML                │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [👁 Preview]                            │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Preview iframe (nếu bấm Preview) │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ☑ Xuất bản ngay                        │
│                                          │
│  [Lưu bài viết]      [Hủy]             │
└──────────────────────────────────────────┘
```

### Tính năng:
- Upload file `.html` HOẶC paste trực tiếp HTML code
- Preview: Mở preview trong iframe nhỏ
- Validate: title required, html content required

---

## 8. Quản lý Users `/admin/users` (Admin only)

```
┌──────────────────────────────────────────┐
│  Quản lý người dùng        [+ Thêm mới] │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ Username │ Email         │ Role │Act│ │
│  ├─────────────────────────────────────┤ │
│  │ admin    │ admin@...     │ admin│ - │ │
│  │ editor1  │ ed1@...       │ editor│✏🗑│ │
│  │ user1    │ u1@...        │ user │✏🗑│ │
│  └─────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

### Modal thêm/sửa user
```
┌────────────────────────┐
│  Thêm người dùng       │
│                        │
│  Username *            │
│  [________________]    │
│                        │
│  Email *               │
│  [________________]    │
│                        │
│  Password *            │
│  [________________]    │
│                        │
│  Role                  │
│  [User      ▼]        │
│   ├ User               │
│   ├ Editor             │
│   └ Admin              │
│                        │
│  [Tạo]     [Hủy]      │
└────────────────────────┘
```

---

## Color Palette (Tailwind)

| Element              | Light          | Mô tả |
|---------------------|----------------|--------|
| Primary             | `blue-600`     | Buttons, links |
| Background          | `gray-50`      | Page background |
| Card                | `white`        | Card background |
| Text                | `gray-900`     | Primary text |
| Text secondary      | `gray-500`     | Secondary text |
| Success             | `green-600`    | Success actions |
| Danger              | `red-600`      | Delete actions |
| Border              | `gray-200`     | Borders |

---

## Responsive Breakpoints

| Breakpoint | Width    | Layout |
|-----------|----------|--------|
| Mobile    | < 640px  | 1 col, stacked |
| Tablet    | 640-1024 | 2 cols |
| Desktop   | > 1024   | 3 cols, sidebar |
