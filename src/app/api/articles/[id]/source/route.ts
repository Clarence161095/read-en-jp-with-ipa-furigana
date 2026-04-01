import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManageContent } from '@/lib/permissions';
import { getArticleAbsolutePath } from '@/lib/article-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !canManageContent((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true, htmlFilePath: true },
  });

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  try {
    const content = await readFile(getArticleAbsolutePath(article.htmlFilePath), 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}