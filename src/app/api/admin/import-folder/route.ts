import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canManageContent } from '@/lib/permissions';
import { generateSlug } from '@/lib/utils';
import { ARTICLE_STORAGE_PREFIX } from '@/lib/article-storage';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Convert a file/folder name into a display title.
 *  "khong-gia-dinh" → "Khong Gia Dinh"
 *  "chapter-21"     → "Chapter 21"
 */
function nameToTitle(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Natural-numeric sort for Dirent objects (chapter-2 before chapter-10). */
function naturalSort(a: fs.Dirent, b: fs.Dirent): number {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

/** Read directory entries sorted naturally. */
function sortedEntries(dir: string): fs.Dirent[] {
  return fs.readdirSync(dir, { withFileTypes: true }).sort(naturalSort);
}

// ─── GET: list importable top-level folders under data/ ───────────────────────
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageContent((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    return NextResponse.json({ folders: [] });
  }

  const entries = sortedEntries(dataDir).filter((e) => e.isDirectory());

  const folders = entries.map((e) => {
    const folderPath = path.join(dataDir, e.name);
    const children = fs.readdirSync(folderPath, { withFileTypes: true });
    const hasSubfolders = children.some((c) => c.isDirectory());
    const htmlCount = children.filter(
      (c) => c.isFile() && c.name.endsWith('.html')
    ).length;

    // Count total HTML files (in root + sub-directories)
    let totalHtml = htmlCount;
    if (hasSubfolders) {
      for (const child of children.filter((c) => c.isDirectory())) {
        const subDir = path.join(folderPath, child.name);
        totalHtml += fs
          .readdirSync(subDir)
          .filter((f) => f.endsWith('.html')).length;
      }
    }

    return {
      name: e.name,
      suggestedTitle: nameToTitle(e.name),
      hasSubfolders,
      totalHtml,
    };
  });

  return NextResponse.json({ folders });
}

// ─── POST: import a folder into the database ──────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageContent((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    folderPath,
    seriesTitle,
    categorySlug,
    overwrite = false,
  }: {
    folderPath: string;
    seriesTitle?: string;
    categorySlug?: string;
    overwrite?: boolean;
  } = body;

  if (!folderPath || typeof folderPath !== 'string') {
    return NextResponse.json({ error: 'folderPath is required' }, { status: 400 });
  }

  // Security: prevent path traversal
  const safeFolder = path.normalize(folderPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const dataDir = path.join(process.cwd(), 'data', safeFolder);
  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    return NextResponse.json(
      { error: `Folder not found: data/${safeFolder}` },
      { status: 400 }
    );
  }

  const userId = (session.user as any).id as string;
  const seriesName = seriesTitle?.trim() || nameToTitle(safeFolder);
  const seriesSlug = generateSlug(seriesName);
  const errors: string[] = [];

  // ── Ensure storage directory exists ─────────────────────────────────────────
  const storageDir = path.join(process.cwd(), 'storage', 'articles');
  fs.mkdirSync(storageDir, { recursive: true });

  // ── Resolve category ─────────────────────────────────────────────────────────
  let categoryId: string | null = null;
  if (categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    categoryId = cat?.id ?? null;
  }

  // ── Handle overwrite ─────────────────────────────────────────────────────────
  const existingSeries = await prisma.series.findUnique({ where: { slug: seriesSlug } });
  if (existingSeries) {
    if (!overwrite) {
      return NextResponse.json(
        {
          error: `Series "${seriesName}" already exists (slug: ${seriesSlug}). Set overwrite=true to re-import.`,
        },
        { status: 409 }
      );
    }
    // Delete all articles + files + parts belonging to this series
    const parts = await prisma.part.findMany({ where: { seriesId: existingSeries.id } });
    for (const part of parts) {
      const articles = await prisma.article.findMany({ where: { partId: part.id } });
      for (const article of articles) {
        const filePath = path.join(process.cwd(), article.htmlFilePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await prisma.article.deleteMany({ where: { partId: part.id } });
    }
    await prisma.part.deleteMany({ where: { seriesId: existingSeries.id } });
    await prisma.series.delete({ where: { id: existingSeries.id } });
  }

  // ── Create series ────────────────────────────────────────────────────────────
  const series = await prisma.series.create({
    data: {
      title: seriesName,
      slug: seriesSlug,
      isPublished: true,
      authorId: userId,
    },
  });

  const rootEntries = sortedEntries(dataDir);
  const subDirs = rootEntries.filter((e) => e.isDirectory());
  const rootHtmlFiles = rootEntries.filter(
    (e) => e.isFile() && e.name.endsWith('.html')
  );

  const importedParts: { title: string; articles: number }[] = [];
  let directArticlesCount = 0;

  // ── Case A: has sub-directories → treat them as Parts ────────────────────────
  for (let pi = 0; pi < subDirs.length; pi++) {
    const subDir = subDirs[pi];
    const partTitle = nameToTitle(subDir.name);

    const part = await prisma.part.create({
      data: {
        title: partTitle,
        order: pi + 1,
        seriesId: series.id,
      },
    });

    const chapterFiles = sortedEntries(path.join(dataDir, subDir.name)).filter(
      (e) => e.isFile() && e.name.endsWith('.html')
    );

    let articleCount = 0;
    for (let ci = 0; ci < chapterFiles.length; ci++) {
      const file = chapterFiles[ci];
      const chapterName = file.name.replace(/\.html$/i, '');
      const articleTitle = nameToTitle(chapterName);
      const articleSlug =
        `${seriesSlug}-${generateSlug(subDir.name)}-${generateSlug(chapterName)}`.substring(0, 160);

      try {
        const htmlContent = fs.readFileSync(
          path.join(dataDir, subDir.name, file.name),
          'utf-8'
        );
        const fileId = randomUUID();
        const fileName = `${fileId}-${generateSlug(seriesName)}-${generateSlug(subDir.name)}-${generateSlug(chapterName)}.html`.substring(0, 200);
        const storagePath = `${ARTICLE_STORAGE_PREFIX}${fileName}`;

        fs.writeFileSync(path.join(process.cwd(), storagePath), htmlContent, 'utf-8');

        await prisma.article.create({
          data: {
            title: articleTitle,
            slug: articleSlug,
            htmlFilePath: storagePath,
            orderInPart: ci + 1,
            partId: part.id,
            authorId: userId,
            categoryId,
            isPublished: true,
          },
        });
        articleCount++;
      } catch (err: any) {
        errors.push(`${subDir.name}/${file.name}: ${err?.message ?? err}`);
      }
    }

    importedParts.push({ title: partTitle, articles: articleCount });
  }

  // ── Case B: direct HTML files in the root folder (no parts) ──────────────────
  // We still need to link them to the series; since the schema routes articles
  // through Parts, we create a single auto-part with the series title.
  if (rootHtmlFiles.length > 0) {
    const autoPart = await prisma.part.create({
      data: {
        title: seriesName,   // "virtual" part — same name as the series
        order: subDirs.length + 1,
        seriesId: series.id,
      },
    });

    for (let ci = 0; ci < rootHtmlFiles.length; ci++) {
      const file = rootHtmlFiles[ci];
      const articleName = file.name.replace(/\.html$/i, '');
      const articleTitle = nameToTitle(articleName);
      const articleSlug =
        `${seriesSlug}-${generateSlug(articleName)}`.substring(0, 160);

      try {
        const htmlContent = fs.readFileSync(
          path.join(dataDir, file.name),
          'utf-8'
        );
        const fileId = randomUUID();
        const fileName = `${fileId}-${generateSlug(seriesName)}-${generateSlug(articleName)}.html`.substring(0, 200);
        const storagePath = `${ARTICLE_STORAGE_PREFIX}${fileName}`;

        fs.writeFileSync(path.join(process.cwd(), storagePath), htmlContent, 'utf-8');

        await prisma.article.create({
          data: {
            title: articleTitle,
            slug: articleSlug,
            htmlFilePath: storagePath,
            orderInPart: ci + 1,
            partId: autoPart.id,
            authorId: userId,
            categoryId,
            isPublished: true,
          },
        });
        directArticlesCount++;
      } catch (err: any) {
        errors.push(`${file.name}: ${err?.message ?? err}`);
      }
    }

    importedParts.push({ title: `${seriesName} (direct)`, articles: directArticlesCount });
  }

  return NextResponse.json(
    {
      success: true,
      series: { id: series.id, title: seriesName, slug: seriesSlug },
      parts: importedParts,
      totalArticles:
        importedParts.reduce((s, p) => s + p.articles, 0),
      errors,
    },
    { status: 201 }
  );
}
