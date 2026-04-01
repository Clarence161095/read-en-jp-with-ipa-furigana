import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManageContent } from '@/lib/permissions';

interface SearchResultItem {
  id: string;
  type: 'series' | 'part' | 'chapter' | 'article';
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || '';
  const session = await auth();
  const includeDrafts =
    request.nextUrl.searchParams.get('scope') === 'admin' &&
    canManageContent((session?.user as any)?.role);

  if (query.length < 2) {
    return NextResponse.json({ results: [] as SearchResultItem[] });
  }

  const [series, parts, chapters, articles] = await Promise.all([
    prisma.series.findMany({
      where: {
        ...(includeDrafts ? {} : { isPublished: true }),
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        parts: { select: { id: true } },
      },
      take: 6,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.part.findMany({
      where: {
        title: { contains: query },
        series: includeDrafts ? undefined : { isPublished: true },
      },
      select: {
        id: true,
        title: true,
        order: true,
        series: { select: { title: true, slug: true } },
        _count: { select: { articles: true } },
      },
      take: 6,
      orderBy: { order: 'asc' },
    }),
    prisma.article.findMany({
      where: {
        partId: { not: null },
        ...(includeDrafts ? {} : { isPublished: true }),
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        part: {
          select: {
            title: true,
            series: { select: { title: true } },
          },
        },
        viewCount: true,
      },
      take: 8,
      orderBy: [{ viewCount: 'desc' }, { updatedAt: 'desc' }],
    }),
    prisma.article.findMany({
      where: {
        partId: null,
        ...(includeDrafts ? {} : { isPublished: true }),
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
      },
      take: 8,
      orderBy: [{ viewCount: 'desc' }, { updatedAt: 'desc' }],
    }),
  ]);

  const results: SearchResultItem[] = [
    ...series.map((item) => ({
      id: item.id,
      type: 'series' as const,
      title: item.title,
      subtitle: item.description || `${item.parts.length} phần`,
      href: `/series/${item.slug}`,
      meta: 'Tuyển tập',
    })),
    ...parts.map((item) => ({
      id: item.id,
      type: 'part' as const,
      title: item.title,
      subtitle: item.series.title,
      href: `/series/${item.series.slug}`,
      meta: `${item._count.articles} chương`,
    })),
    ...chapters.map((item) => ({
      id: item.id,
      type: 'chapter' as const,
      title: item.title,
      subtitle: item.part ? `${item.part.series.title} • ${item.part.title}` : 'Chương',
      href: `/read/${item.slug}`,
      meta: `${item.viewCount} lượt xem`,
    })),
    ...articles.map((item) => ({
      id: item.id,
      type: 'article' as const,
      title: item.title,
      subtitle: 'Bài viết độc lập',
      href: `/read/${item.slug}`,
      meta: `${item.viewCount} lượt xem`,
    })),
  ];

  return NextResponse.json({ results });
}