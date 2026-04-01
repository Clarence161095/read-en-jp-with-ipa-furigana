import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { writeFile, unlink } from 'fs/promises';
import { canManageContent } from '@/lib/permissions';
import { getArticleAbsolutePath } from '@/lib/article-storage';

// GET /api/articles/[id] - Get article by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
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
  });

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  return NextResponse.json(article);
}

// PUT /api/articles/[id] - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || !canManageContent((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const categoryId = formData.get('categoryId') as string | null;
    const tags = formData.get('tags') as string | null;
    const isPublished = formData.get('isPublished');
    const htmlFile = formData.get('htmlFile') as File | null;
    const htmlContent = formData.get('htmlContent') as string | null;
    const partId = formData.get('partId');
    const orderInPart = formData.get('orderInPart');

    const updateData: any = {};

    if (title) {
      updateData.title = title;
      const newSlug = generateSlug(title);
      if (newSlug !== article.slug) {
        const existing = await prisma.article.findUnique({ where: { slug: newSlug } });
        updateData.slug = existing ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }

    if (description !== null) updateData.description = description || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (tags !== null) updateData.tags = tags || null;
    if (isPublished !== null) updateData.isPublished = isPublished !== 'false';
    if (partId !== null) updateData.partId = (partId as string) || null;
    if (orderInPart !== null) {
      updateData.orderInPart = parseInt(orderInPart as string, 10) || 0;
    }

    // Update HTML file if provided
    if (htmlFile || htmlContent) {
      const content = htmlFile ? await htmlFile.text() : htmlContent!;
      const filePath = getArticleAbsolutePath(article.htmlFilePath);
      await writeFile(filePath, content, 'utf-8');
    }

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ id: updated.id, slug: updated.slug, message: 'Article updated' });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || !canManageContent((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Delete HTML file
    try {
      const filePath = getArticleAbsolutePath(article.htmlFilePath);
      await unlink(filePath);
    } catch {
      // File may not exist, continue
    }

    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ message: 'Article deleted' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
