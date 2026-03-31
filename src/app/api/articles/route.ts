import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// GET /api/articles - List articles with pagination, search, filter
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'newest';

  const skip = (page - 1) * limit;

  const where: any = { isPublished: true };

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

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        description: description || null,
        htmlFilePath: fileName,
        tags: tags || null,
        isPublished,
        categoryId: categoryId || null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ id: article.id, slug: article.slug, message: 'Article created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
