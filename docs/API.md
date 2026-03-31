# 🔌 API Endpoints

## Base URL
```
http://localhost:5678/api
```

## Authentication

Sử dụng NextAuth.js v5 - session cookie (JWT strategy).

---

## Auth Routes (NextAuth handles)

| Method | Endpoint                   | Mô tả              | Auth |
|--------|----------------------------|---------------------|------|
| POST   | `/api/auth/signin`         | Đăng nhập           | ❌   |
| POST   | `/api/auth/signout`        | Đăng xuất           | ✅   |
| GET    | `/api/auth/session`        | Lấy session hiện tại| ❌   |

---

## Articles API

### Public Endpoints (không cần auth)

| Method | Endpoint                     | Mô tả                          |
|--------|------------------------------|---------------------------------|
| GET    | `/api/articles`              | Danh sách bài viết (có phân trang, tìm kiếm) |
| GET    | `/api/articles/[id]`         | Chi tiết bài viết (metadata)    |
| GET    | `/api/articles/[id]/raw`     | Nội dung HTML nguyên bản (cho iframe) |
| GET    | `/api/articles/slug/[slug]`  | Lấy bài theo slug               |

### Protected Endpoints (cần auth: editor+)

| Method | Endpoint                     | Mô tả                          | Role      |
|--------|------------------------------|---------------------------------|-----------|
| POST   | `/api/articles`              | Tạo bài mới                    | editor+   |
| PUT    | `/api/articles/[id]`         | Cập nhật bài (metadata + HTML)  | editor+   |
| DELETE | `/api/articles/[id]`         | Xóa bài (+ xóa file HTML)      | editor+   |

---

### GET /api/articles - Danh sách bài viết

**Query Parameters:**

| Param      | Type   | Default | Mô tả |
|------------|--------|---------|--------|
| page       | number | 1       | Trang hiện tại |
| limit      | number | 12      | Số bài mỗi trang |
| search     | string | -       | Tìm theo title, description |
| category   | string | -       | Filter theo category slug |
| tag        | string | -       | Filter theo tag |
| sort       | string | "newest"| Sắp xếp: newest, oldest, popular |

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "IPA Reading Practice - Chapter 2",
      "slug": "ipa-reading-practice-chapter-2",
      "description": "Chương 2 của truyện Không Gia Đình...",
      "thumbnail": null,
      "tags": "english,ipa,chapter-2",
      "viewCount": 42,
      "isPublished": true,
      "category": { "id": "uuid", "name": "English Reading", "slug": "english-reading" },
      "author": { "id": "uuid", "username": "admin" },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### POST /api/articles - Tạo bài mới

**Request:** `multipart/form-data`

| Field       | Type   | Required | Mô tả |
|-------------|--------|----------|--------|
| title       | string | ✅       | Tiêu đề bài |
| description | string | ❌       | Mô tả ngắn |
| htmlFile    | file   | ✅ (1)   | File HTML upload |
| htmlContent | string | ✅ (1)   | Hoặc paste nội dung HTML |
| categoryId  | string | ❌       | ID danh mục |
| tags        | string | ❌       | Tags, phân cách bằng dấu phẩy |
| isPublished | bool   | ❌       | Default: true |

> (1): Phải có một trong hai: `htmlFile` hoặc `htmlContent`

**Response:**
```json
{
  "id": "uuid",
  "title": "...",
  "slug": "...",
  "message": "Article created successfully"
}
```

---

### PUT /api/articles/[id] - Cập nhật bài

**Request:** `multipart/form-data`

Tương tự POST nhưng tất cả fields đều optional.

---

### DELETE /api/articles/[id] - Xóa bài

**Response:**
```json
{
  "message": "Article deleted successfully"
}
```

---

### GET /api/articles/[id]/raw - Nội dung HTML nguyên bản

**Response:** Raw HTML content  
**Content-Type:** `text/html; charset=utf-8`

Đây là endpoint mà iframe sẽ load. Response là nội dung file HTML nguyên bản, không wrap thêm gì.

---

## Users API (Admin only)

| Method | Endpoint                | Mô tả                    | Role  |
|--------|-------------------------|---------------------------|-------|
| GET    | `/api/users`            | Danh sách users           | admin |
| POST   | `/api/users`            | Tạo user mới              | admin |
| PUT    | `/api/users/[id]`       | Cập nhật user             | admin |
| DELETE | `/api/users/[id]`       | Xóa user                  | admin |

---

### GET /api/users

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "editor1",
      "email": "editor1@example.com",
      "role": "editor",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/users - Tạo user

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "editor"
}
```

### PUT /api/users/[id] - Cập nhật user

**Request:**
```json
{
  "username": "updated",
  "email": "updated@example.com",
  "role": "user",
  "password": "newpassword"  // optional, chỉ khi đổi password
}
```

---

## Categories API

| Method | Endpoint                    | Mô tả                  | Role    |
|--------|-----------------------------|-------------------------|---------|
| GET    | `/api/categories`           | Danh sách categories    | public  |
| POST   | `/api/categories`           | Tạo category mới        | admin   |
| PUT    | `/api/categories/[id]`      | Cập nhật category       | admin   |
| DELETE | `/api/categories/[id]`      | Xóa category            | admin   |

---

## Error Response Format

Tất cả API errors trả về format thống nhất:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
| Code | Mô tả |
|------|--------|
| 200  | Success |
| 201  | Created |
| 400  | Bad request (validation error) |
| 401  | Unauthorized (chưa đăng nhập) |
| 403  | Forbidden (không đủ quyền) |
| 404  | Not found |
| 500  | Server error |
