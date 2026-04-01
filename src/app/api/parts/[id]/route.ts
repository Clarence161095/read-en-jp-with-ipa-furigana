import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManageContent } from '@/lib/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !canManageContent((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, order } = body;

  const part = await prisma.part.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(typeof order === 'number' ? { order } : {}),
    },
  });

  return NextResponse.json(part);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !canManageContent((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await prisma.article.updateMany({
    where: { partId: id },
    data: { partId: null, orderInPart: 0 },
  });

  await prisma.part.delete({ where: { id } });

  return NextResponse.json({ message: 'Part deleted' });
}