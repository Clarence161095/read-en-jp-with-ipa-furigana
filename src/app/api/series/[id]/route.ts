import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

// GET /api/series/[id] - Get series by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const series = await prisma.series.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      author: { select: { id: true, username: true } },
      parts: {
        orderBy: { order: 'asc' },
        include: {
          articles: {
            where: { isPublished: true },
            orderBy: { orderInPart: 'asc' },
            select: {
              id: true,
              title: true,
              slug: true,
              orderInPart: true,
              viewCount: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!series) {
    return NextResponse.json({ error: 'Series not found' }, { status: 404 });
  }

  return NextResponse.json(series);
}

// PUT /api/series/[id] - Update series
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, isPublished } = body;

  const updateData: any = {};
  if (title) {
    updateData.title = title;
    updateData.slug = generateSlug(title);
  }
  if (description !== undefined) updateData.description = description || null;
  if (isPublished !== undefined) updateData.isPublished = isPublished;

  const series = await prisma.series.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(series);
}

// DELETE /api/series/[id] - Delete series (cascades to parts)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Unlink articles from parts first
  await prisma.article.updateMany({
    where: { part: { seriesId: id } },
    data: { partId: null, orderInPart: 0 },
  });

  await prisma.series.delete({ where: { id } });

  return NextResponse.json({ message: 'Series deleted' });
}
