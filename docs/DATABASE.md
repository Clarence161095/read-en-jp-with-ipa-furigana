# 🗄️ Database Schema

## ORM: Prisma + SQLite

### Schema Overview

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  users   │────▶│   articles   │────▶│ categories │
│          │     │              │     │            │
│ id       │     │ id           │     │ id         │
│ username │     │ title        │     │ name       │
│ email    │     │ slug         │     │ slug       │
│ password │     │ description  │     └────────────┘
│ role     │     │ htmlFilePath │
│ ...      │     │ categoryId   │
└──────────┘     │ authorId     │
                 │ ...          │
                 └──────────────┘
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(uuid())
  username  String    @unique
  email     String    @unique
  password  String    // bcrypt hashed
  role      String    @default("user") // "admin" | "editor" | "user"
  
  articles  Article[] @relation("AuthorArticles")
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("users")
}

model Category {
  id        String    @id @default(uuid())
  name      String    @unique
  slug      String    @unique
  
  articles  Article[]
  
  createdAt DateTime  @default(now())

  @@map("categories")
}

model Article {
  id           String    @id @default(uuid())
  title        String
  slug         String    @unique
  description  String?   // Mô tả ngắn cho hiển thị ở danh sách
  htmlFilePath String    // Path relative to storage/articles/
  thumbnail    String?   // URL hoặc path ảnh thumbnail
  tags         String?   // Comma-separated tags: "english,ipa,chapter-2"
  isPublished  Boolean   @default(true)
  viewCount    Int       @default(0)
  
  category     Category? @relation(fields: [categoryId], references: [id])
  categoryId   String?
  
  author       User      @relation("AuthorArticles", fields: [authorId], references: [id])
  authorId     String
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([slug])
  @@index([categoryId])
  @@index([authorId])
  @@index([isPublished])
  @@index([createdAt])
  @@map("articles")
}
```

---

## Giải thích các trường

### User
| Field    | Type   | Mô tả |
|----------|--------|--------|
| id       | UUID   | Primary key |
| username | String | Tên đăng nhập, unique |
| email    | String | Email, unique |
| password | String | Mật khẩu đã hash (bcrypt) |
| role     | String | Phân quyền: `admin`, `editor`, `user` |

### Article
| Field        | Type     | Mô tả |
|--------------|----------|--------|
| id           | UUID     | Primary key |
| title        | String   | Tiêu đề bài viết |
| slug         | String   | URL-friendly identifier, unique |
| description  | String?  | Mô tả ngắn hiển thị ở trang chủ |
| htmlFilePath | String   | Đường dẫn file HTML trong storage/ |
| thumbnail    | String?  | Ảnh đại diện (optional) |
| tags         | String?  | Tags phân cách bằng dấu phẩy |
| isPublished  | Boolean  | Trạng thái xuất bản |
| viewCount    | Int      | Số lượt xem |
| categoryId   | UUID?    | FK → Category |
| authorId     | UUID     | FK → User (người tạo) |

### Category
| Field | Type   | Mô tả |
|-------|--------|--------|
| id    | UUID   | Primary key |
| name  | String | Tên danh mục |
| slug  | String | URL-friendly, unique |

---

## Seed Data

Khi khởi tạo app lần đầu, chạy `prisma db seed`:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Tạo admin account từ .env
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 12);
  
  await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME! },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME!,
      email: process.env.ADMIN_EMAIL!,
      password: adminPassword,
      role: 'admin',
    },
  });

  // 2. Tạo default categories
  const categories = [
    { name: 'English Reading', slug: 'english-reading' },
    { name: 'Japanese Reading', slug: 'japanese-reading' },
    { name: 'General', slug: 'general' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    });
  }
}

main();
```

---

## Migration Commands

```bash
# Tạo migration mới
npx prisma migrate dev --name init

# Apply migration (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Seed data
npx prisma db seed

# Mở Prisma Studio (GUI)
npx prisma studio
```

---

## Lưu ý quan trọng

1. **SQLite file location:** `prisma/dev.db` (dev) hoặc `prisma/prod.db` (production)
2. **Backup:** Chỉ cần copy file `.db` là backup xong
3. **Tags:** Lưu dạng comma-separated string thay vì many-to-many table → đơn giản hóa
4. **viewCount:** Tăng mỗi khi user mở đọc bài → dùng cho sắp xếp "popular"
5. **slug:** Auto-generate từ title, sử dụng cho URL thân thiện
