'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavInfo {
  prev: { id: string; title: string; slug: string } | null;
  next: { id: string; title: string; slug: string } | null;
  series: { id: string; title: string; slug: string } | null;
  currentPart: { id: string; title: string } | null;
}

export default function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nav, setNav] = useState<NavInfo | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/articles/slug/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        setArticleId(data.id);
        // Fetch navigation info
        fetch(`/api/articles/${data.id}/navigation`)
          .then((r) => r.json())
          .then((navData) => setNav(navData));
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!articleId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen">
      {/* Floating Navigation Bubble - Top Right */}
      <div className="fixed top-3 right-3 z-[9999]">
        {/* Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-sm shadow-lg transition-colors text-lg"
          title="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
            <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 min-w-[200px] overflow-hidden">
              {/* Series info */}
              {nav?.series && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                  <p className="text-[10px] text-blue-500 font-medium uppercase">Tuyển tập</p>
                  <p className="text-xs text-blue-700 font-semibold truncate">{nav.series.title}</p>
                  {nav.currentPart && (
                    <p className="text-[10px] text-blue-400">{nav.currentPart.title}</p>
                  )}
                </div>
              )}

              <div className="py-1">
                {/* Previous Chapter */}
                {nav?.prev ? (
                  <button
                    onClick={() => { router.push(`/read/${nav.prev!.slug}`); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm">⬅️</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Chương trước</p>
                      <p className="text-sm text-gray-700 truncate">{nav.prev.title}</p>
                    </div>
                  </button>
                ) : (
                  <div className="px-4 py-2.5 opacity-30">
                    <span className="text-xs text-gray-400">⬅️ Không có chương trước</span>
                  </div>
                )}

                {/* Next Chapter */}
                {nav?.next ? (
                  <button
                    onClick={() => { router.push(`/read/${nav.next!.slug}`); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm">➡️</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Chương sau</p>
                      <p className="text-sm text-gray-700 truncate">{nav.next.title}</p>
                    </div>
                  </button>
                ) : (
                  <div className="px-4 py-2.5 opacity-30">
                    <span className="text-xs text-gray-400">➡️ Không có chương sau</span>
                  </div>
                )}

                <div className="border-t border-gray-100 my-1" />

                {/* Back to Series */}
                {nav?.series && (
                  <button
                    onClick={() => { router.push(`/series/${nav.series!.slug}`); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm">📚</span>
                    <span className="text-sm text-gray-700">Mục lục</span>
                  </button>
                )}

                {/* Back Home */}
                <button
                  onClick={() => { router.push('/'); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <span className="text-sm">🏠</span>
                  <span className="text-sm text-gray-700">Trang chủ</span>
                </button>

                {/* Go Back */}
                <button
                  onClick={() => { router.back(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <span className="text-sm">↩️</span>
                  <span className="text-sm text-gray-700">Quay lại</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* iframe - Render HTML nguyên bản */}
      <iframe
        src={`/api/articles/${articleId}/raw`}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Article content"
      />
    </div>
  );
}
