'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// prisma/seed-docker.js
// Pure-CJS seed script — runs with plain `node`, no tsx required.
// Creates the admin user and default categories (idempotent via upsert).
// ─────────────────────────────────────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email    = process.env.ADMIN_EMAIL    || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await prisma.user.upsert({
    where:  { username },
    update: {},
    create: {
      username,
      email,
      password: hashSync(password, 12),
      role: 'admin',
    },
  });
  console.log(`  ✅ Admin user "${username}" ready`);

  const categories = [
    { name: 'English Reading',  slug: 'english-reading'  },
    { name: 'Japanese Reading', slug: 'japanese-reading' },
    { name: 'General',          slug: 'general'          },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('  ✅ Default categories ready');
}

main()
  .then(() => console.log('✅ Seed complete'))
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
