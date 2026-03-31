import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashSync } from 'bcryptjs';

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { username, email, password, role } = body;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role && ['user', 'editor', 'admin'].includes(role)) updateData.role = role;
    if (password) updateData.password = hashSync(password, 12);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, email: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has articles - reassign to avoid FK issues
    await prisma.article.updateMany({
      where: { authorId: id },
      data: { authorId: (await prisma.user.findFirst({ where: { role: 'admin' } }))!.id },
    });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
