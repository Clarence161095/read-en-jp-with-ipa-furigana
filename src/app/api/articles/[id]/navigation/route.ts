import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/articles/[id]/navigation - Get next/prev chapter info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      part: {
        include: {
          series: {
            include: {
              parts: {
                orderBy: { order: 'asc' },
                select: { id: true, title: true, order: true },
              },
            },
          },
        },
      },
    },
  });

  if (!article || !article.partId || !article.part) {
    return NextResponse.json({ prev: null, next: null, series: null });
  }

  const part = article.part;
  const series = part.series;
  const allParts = series.parts;

  // Find prev chapter in same part
  const prevInPart = await prisma.article.findFirst({
    where: {
      partId: article.partId,
      orderInPart: { lt: article.orderInPart },
      isPublished: true,
    },
    orderBy: { orderInPart: 'desc' },
    select: { id: true, title: true, slug: true },
  });

  // Find next chapter in same part
  const nextInPart = await prisma.article.findFirst({
    where: {
      partId: article.partId,
      orderInPart: { gt: article.orderInPart },
      isPublished: true,
    },
    orderBy: { orderInPart: 'asc' },
    select: { id: true, title: true, slug: true },
  });

  let prev = prevInPart;
  let next = nextInPart;

  // If no prev in current part, get last chapter of previous part
  if (!prev) {
    const currentPartIndex = allParts.findIndex((p) => p.id === article.partId);
    if (currentPartIndex > 0) {
      const prevPart = allParts[currentPartIndex - 1];
      prev = await prisma.article.findFirst({
        where: { partId: prevPart.id, isPublished: true },
        orderBy: { orderInPart: 'desc' },
        select: { id: true, title: true, slug: true },
      });
    }
  }

  // If no next in current part, get first chapter of next part
  if (!next) {
    const currentPartIndex = allParts.findIndex((p) => p.id === article.partId);
    if (currentPartIndex < allParts.length - 1) {
      const nextPart = allParts[currentPartIndex + 1];
      next = await prisma.article.findFirst({
        where: { partId: nextPart.id, isPublished: true },
        orderBy: { orderInPart: 'asc' },
        select: { id: true, title: true, slug: true },
      });
    }
  }

  return NextResponse.json({
    prev,
    next,
    series: {
      id: series.id,
      title: series.title,
      slug: series.slug,
    },
    currentPart: {
      id: part.id,
      title: part.title,
    },
  });
}
