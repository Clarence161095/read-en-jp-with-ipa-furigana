import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

// GET /api/series - List all series
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeChapters = searchParams.get('includeChapters') === 'true';

  const series = await prisma.series.findMany({
    where: { isPublished: true },
    include: {
      author: { select: { id: true, username: true } },
      parts: {
        orderBy: { order: 'asc' },
        include: includeChapters
          ? {
              articles: {
                where: { isPublished: true },
                orderBy: { orderInPart: 'asc' },
                select: { id: true, title: true, slug: true, orderInPart: true, viewCount: true },
              },
            }
          : { _count: { select: { articles: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(series);
}

// POST /api/series - Create series
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, parts } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  let slug = generateSlug(title);
  const existing = await prisma.series.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const series = await prisma.series.create({
    data: {
      title,
      slug,
      description: description || null,
      authorId: session.user.id,
      parts: parts?.length
        ? {
            create: parts.map((p: { title: string }, i: number) => ({
              title: p.title,
              order: i + 1,
            })),
          }
        : undefined,
    },
    include: { parts: { orderBy: { order: 'asc' } } },
  });

  return NextResponse.json(series, { status: 201 });
}
