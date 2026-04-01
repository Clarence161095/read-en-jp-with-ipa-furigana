import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManageContent } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageContent((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, seriesId, order } = body;

  if (!title || !seriesId) {
    return NextResponse.json({ error: 'Title and seriesId are required' }, { status: 400 });
  }

  const nextOrder =
    typeof order === 'number'
      ? order
      : ((await prisma.part.findFirst({
          where: { seriesId },
          orderBy: { order: 'desc' },
          select: { order: true },
        }))?.order || 0) + 1;

  const part = await prisma.part.create({
    data: {
      title,
      seriesId,
      order: nextOrder,
    },
  });

  return NextResponse.json(part, { status: 201 });
}