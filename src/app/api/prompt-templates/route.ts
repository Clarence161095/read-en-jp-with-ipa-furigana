import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/prompt-templates - List all templates
export async function GET() {
  const templates = await prisma.promptTemplate.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(templates);
}

// POST /api/prompt-templates - Create template
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, content } = await request.json();
  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const template = await prisma.promptTemplate.create({
    data: { title, content },
  });

  return NextResponse.json(template, { status: 201 });
}
