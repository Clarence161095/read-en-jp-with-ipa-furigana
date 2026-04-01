import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as any;

  // Admin routes - require editor or admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    // User management - admin only
    if (pathname.startsWith('/admin/users') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    // Other admin pages - editor or admin
    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/account')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // API protection for write operations
  if (pathname.startsWith('/api/articles') && req.method !== 'GET') {
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/users')) {
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/categories') && req.method !== 'GET') {
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/series') && req.method !== 'GET') {
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/parts')) {
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/account')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/api/articles/:path*', '/api/users/:path*', '/api/categories/:path*', '/api/series/:path*', '/api/parts/:path*', '/api/account/:path*'],
};
