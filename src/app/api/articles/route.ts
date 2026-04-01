import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { canManageContent } from '@/lib/permissions';
import { ARTICLE_STORAGE_PREFIX } from '@/lib/article-storage';

// GET /api/articles - List articles with pagination, search, filter
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const session = await auth();
  const adminScope = searchParams.get('scope') === 'admin' && canManageContent((session?.user as any)?.role);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'newest';

  const skip = (page - 1) * limit;

  const where: any = adminScope ? {} : { isPublished: true };

  // Optionally exclude articles that belong to a series (standalone only)
  const standalone = searchParams.get('standalone');
  if (standalone === 'true') {
    where.partId = null;
  }

  // Filter by series slug
  const series = searchParams.get('series');
  if (series) {
    where.part = { series: { slug: series } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (tag) {
    where.tags = { contains: tag };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'oldest') orderBy = { createdAt: 'asc' };
  if (sort === 'popular') orderBy = { viewCount: 'desc' };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, username: true } },
        part: {
          select: {
            id: true,
            title: true,
            order: true,
            series: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const categoryId = formData.get('categoryId') as string | null;
    const tags = formData.get('tags') as string | null;
    const isPublished = formData.get('isPublished') !== 'false';
    const htmlFile = formData.get('htmlFile') as File | null;
    const htmlContent = formData.get('htmlContent') as string | null;
    const partId = (formData.get('partId') as string | null) || null;
    const requestedOrder = formData.get('orderInPart');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!htmlFile && !htmlContent) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    // Generate unique slug
    let slug = generateSlug(title);
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Save HTML file
    const fileName = `${uuidv4()}-${slug}.html`;
    const storagePath = path.join(process.cwd(), 'storage', 'articles');
    await mkdir(storagePath, { recursive: true });

    let content: string;
    if (htmlFile) {
      content = await htmlFile.text();
    } else {
      content = htmlContent!;
    }

    await writeFile(path.join(storagePath, fileName), content, 'utf-8');

    let orderInPart = 0;
    if (partId) {
      if (requestedOrder !== null && requestedOrder !== '') {
        orderInPart = parseInt(requestedOrder as string, 10) || 1;
      } else {
        const lastArticle = await prisma.article.findFirst({
          where: { partId },
          orderBy: { orderInPart: 'desc' },
          select: { orderInPart: true },
        });
        orderInPart = (lastArticle?.orderInPart || 0) + 1;
      }
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        description: description || null,
        htmlFilePath: `${ARTICLE_STORAGE_PREFIX}${fileName}`,
        tags: tags || null,
        isPublished,
        categoryId: categoryId || null,
        authorId: session.user.id,
        partId,
        orderInPart,
      },
    });

    return NextResponse.json({ id: article.id, slug: article.slug, message: 'Article created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
