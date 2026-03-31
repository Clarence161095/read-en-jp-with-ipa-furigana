import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

// GET /api/articles/[id]/raw - Serve raw HTML content for iframe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Increment view count
  await prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  try {
    const filePath = path.join(process.cwd(), article.htmlFilePath);
    const content = await readFile(filePath, 'utf-8');

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
