import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateSlug } from '@/lib/utils';

// PUT /api/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug: generateSlug(name) },
    });

    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Unlink articles from this category
    await prisma.article.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: 'Category deleted' });
  } catch {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
}
