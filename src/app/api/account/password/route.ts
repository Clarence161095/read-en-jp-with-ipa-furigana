import { NextRequest, NextResponse } from 'next/server';
import { compareSync, hashSync } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!compareSync(currentPassword, user.password)) {
    return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashSync(newPassword, 12) },
  });

  return NextResponse.json({ message: 'Đổi mật khẩu thành công' });
}