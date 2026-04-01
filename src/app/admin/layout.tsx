'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Providers from '@/components/Providers';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊', roles: ['admin', 'editor'] },
  { href: '/admin/articles', label: 'Bài viết', icon: '📄', roles: ['admin', 'editor'] },
  { href: '/admin/series', label: 'Tuyển tập', icon: '📚', roles: ['admin', 'editor'] },
  { href: '/admin/prompts', label: 'Prompt', icon: '💬', roles: ['admin', 'editor'] },
  { href: '/admin/users', label: 'Người dùng', icon: '👥', roles: ['admin'] },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <Link href="/admin" className="font-bold text-blue-600 flex items-center gap-2">
          <span className="text-xl">📖</span> Admin
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600">
          ← Về app
        </Link>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r fixed">
          <div className="p-4 border-b">
            <Link href="/admin" className="font-bold text-blue-600 flex items-center gap-2">
              <span className="text-xl">📖</span> HTML Reader
            </Link>
            <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-50">
              ← Về trang chủ
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 min-h-screen">
          <div className="p-4 lg:p-6 max-w-5xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex z-40">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] ${
              (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
