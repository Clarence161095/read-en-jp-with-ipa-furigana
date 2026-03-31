-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "series_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "seriesId" TEXT NOT NULL,
    CONSTRAINT "parts_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "htmlFilePath" TEXT NOT NULL,
    "tags" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "orderInPart" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "authorId" TEXT NOT NULL,
    "partId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "articles_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_articles" ("authorId", "categoryId", "createdAt", "description", "htmlFilePath", "id", "isPublished", "slug", "tags", "title", "updatedAt", "viewCount") SELECT "authorId", "categoryId", "createdAt", "description", "htmlFilePath", "id", "isPublished", "slug", "tags", "title", "updatedAt", "viewCount" FROM "articles";
DROP TABLE "articles";
ALTER TABLE "new_articles" RENAME TO "articles";
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
CREATE INDEX "articles_slug_idx" ON "articles"("slug");
CREATE INDEX "articles_categoryId_idx" ON "articles"("categoryId");
CREATE INDEX "articles_authorId_idx" ON "articles"("authorId");
CREATE INDEX "articles_isPublished_idx" ON "articles"("isPublished");
CREATE INDEX "articles_createdAt_idx" ON "articles"("createdAt");
CREATE INDEX "articles_partId_orderInPart_idx" ON "articles"("partId", "orderInPart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE INDEX "series_slug_idx" ON "series"("slug");

-- CreateIndex
CREATE INDEX "parts_seriesId_order_idx" ON "parts"("seriesId", "order");
