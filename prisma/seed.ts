import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

  const hashedPassword = hashSync(adminPassword, 12);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log(`  ✅ Admin user "${adminUsername}" created`);

  // Create default categories
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
  console.log('  ✅ Default categories created');

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
