import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const sampleArticles = [
  {
    title: 'IPA Reading Practice - Sample',
    description: 'Sample IPA reading practice with English text and phonetic annotations.',
    sourcePath: 'data/sample.html',
    categorySlug: 'english-reading',
    tags: 'ipa,english,reading,practice',
  },
  {
    title: 'Không Gia Đình - Chương 2',
    description: 'Chapter 2 of "Không Gia Đình" with IPA and furigana annotations.',
    sourcePath: 'data/khong-gia-dinh/chapter-2.html',
    categorySlug: 'general',
    tags: 'vietnamese,reading,khong-gia-dinh',
  },
];

async function main() {
  console.log('📥 Importing sample articles...\n');

  const storageDir = path.join(process.cwd(), 'storage', 'articles');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    console.error('❌ No admin user found. Run prisma db seed first.');
    process.exit(1);
  }

  for (const article of sampleArticles) {
    const sourceFull = path.join(process.cwd(), article.sourcePath);
    if (!fs.existsSync(sourceFull)) {
      console.log(`⚠️  Skipping "${article.title}" - source file not found: ${article.sourcePath}`);
      continue;
    }

    const slug = generateSlug(article.title);
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      console.log(`⏭️  Skipping "${article.title}" - already exists`);
      continue;
    }

    const category = await prisma.category.findUnique({ where: { slug: article.categorySlug } });

    const filename = `${randomUUID()}-${slug}.html`;
    const destPath = path.join(storageDir, filename);
    fs.copyFileSync(sourceFull, destPath);

    await prisma.article.create({
      data: {
        title: article.title,
        slug,
        description: article.description,
        htmlFilePath: `storage/articles/${filename}`,
        tags: article.tags,
        isPublished: true,
        categoryId: category?.id,
        authorId: admin.id,
      },
    });

    console.log(`✅ Imported: "${article.title}"`);
  }

  console.log('\n📥 Import complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
