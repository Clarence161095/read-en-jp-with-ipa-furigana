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

async function main() {
  console.log('📚 Importing "Không Gia Đình" series...\n');

  const storageDir = path.join(process.cwd(), 'storage', 'articles');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    console.error('❌ No admin user found. Run prisma db seed first.');
    process.exit(1);
  }

  // Ensure "English Reading" category exists
  let category = await prisma.category.findUnique({ where: { slug: 'english-reading' } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'English Reading', slug: 'english-reading' },
    });
  }

  // Check if series already exists
  const existingSeries = await prisma.series.findUnique({ where: { slug: 'khong-gia-dinh' } });
  if (existingSeries) {
    console.log('⚠️  Series "Không Gia Đình" already exists. Cleaning up and re-importing...');
    
    // Delete existing articles linked to this series' parts
    const existingParts = await prisma.part.findMany({ where: { seriesId: existingSeries.id } });
    for (const part of existingParts) {
      const articles = await prisma.article.findMany({ where: { partId: part.id } });
      for (const article of articles) {
        // Delete file
        const filePath = path.join(process.cwd(), article.htmlFilePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await prisma.article.delete({ where: { id: article.id } });
      }
    }
    // Delete parts and series
    await prisma.part.deleteMany({ where: { seriesId: existingSeries.id } });
    await prisma.series.delete({ where: { id: existingSeries.id } });
    console.log('  ✅ Cleaned up existing series\n');
  }

  // Create series
  const series = await prisma.series.create({
    data: {
      title: 'Không Gia Đình',
      slug: 'khong-gia-dinh',
      description: 'Truyện "Không Gia Đình" (Sans Famille) của Hector Malot - Bản dịch song ngữ Anh-Việt với IPA.',
      isPublished: true,
      authorId: admin.id,
    },
  });
  console.log(`✅ Created series: "${series.title}"`);

  // Define parts
  const partsConfig = [
    { title: 'Phần 1', order: 1, folder: 'part-1', chapters: 21 },
    { title: 'Phần 2', order: 2, folder: 'part-2', chapters: 8 },
  ];

  // Detect actual chapter count from filesystem
  for (const partConfig of partsConfig) {
    const partDir = path.join(process.cwd(), 'data', 'khong-gia-dinh', partConfig.folder);
    if (fs.existsSync(partDir)) {
      const files = fs.readdirSync(partDir).filter(f => f.startsWith('chapter-') && f.endsWith('.html'));
      partConfig.chapters = files.length;
    }
  }

  for (const partConfig of partsConfig) {
    const part = await prisma.part.create({
      data: {
        title: partConfig.title,
        order: partConfig.order,
        seriesId: series.id,
      },
    });
    console.log(`\n📂 Created ${partConfig.title} (${partConfig.chapters} chapters)`);

    for (let i = 1; i <= partConfig.chapters; i++) {
      const sourceFile = path.join(
        process.cwd(),
        'data',
        'khong-gia-dinh',
        partConfig.folder,
        `chapter-${i}.html`
      );

      if (!fs.existsSync(sourceFile)) {
        console.log(`  ⚠️  Skipping chapter ${i} - file not found`);
        continue;
      }

      const chapterTitle = `Chương ${i}`;
      const slug = `khong-gia-dinh-phan-${partConfig.order}-chuong-${i}`;

      // Check if slug already exists
      const existing = await prisma.article.findUnique({ where: { slug } });
      if (existing) {
        console.log(`  ⏭️  Skipping chapter ${i} - already exists`);
        continue;
      }

      // Copy HTML file to storage
      const filename = `${randomUUID()}-${slug}.html`;
      const destPath = path.join(storageDir, filename);
      fs.copyFileSync(sourceFile, destPath);

      // Create article
      await prisma.article.create({
        data: {
          title: chapterTitle,
          slug,
          description: `${partConfig.title} - ${chapterTitle} của truyện Không Gia Đình`,
          htmlFilePath: `storage/articles/${filename}`,
          tags: 'khong-gia-dinh,english,vietnamese,ipa',
          isPublished: true,
          categoryId: category!.id,
          authorId: admin.id,
          partId: part.id,
          orderInPart: i,
        },
      });

      console.log(`  ✅ Imported: ${partConfig.title} - ${chapterTitle}`);
    }
  }

  console.log('\n🎉 Import complete!');

  // Print summary
  const totalArticles = await prisma.article.count({
    where: { part: { seriesId: series.id } },
  });
  console.log(`📊 Total chapters imported: ${totalArticles}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
