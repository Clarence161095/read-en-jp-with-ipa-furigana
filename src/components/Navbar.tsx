'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = (session?.user as any)?.role;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-600">
          <span className="text-2xl">📖</span>
          <span className="hidden sm:inline">HTML Reader</span>
        </Link>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              {(role === 'admin' || role === 'editor') && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Admin
                </Link>
              )}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {session.user?.name}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
