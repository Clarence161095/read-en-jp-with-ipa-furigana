import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashSync } from 'bcryptjs';

// GET /api/users - List all users
export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { articles: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email and password are required' }, { status: 400 });
    }

    if (!['user', 'editor', 'admin'].includes(role || 'user')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }

    const hashedPassword = hashSync(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || 'user',
      },
      select: { id: true, username: true, email: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
