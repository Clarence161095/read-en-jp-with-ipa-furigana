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
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [notFound, setNotFound] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nav, setNav] = useState<NavInfo | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    setArticleId(null);
    setNav(null);
    setMenuOpen(false);
    fetch(`/api/articles/slug/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        setArticleId(data.id);
        setArticleTitle(data.title);
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
    <>
      {/* Full viewport styles - override any parent constraints */}
      <style jsx global>{`
        html, body { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
        /* Hide Next.js dev indicators on reading page */
        nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast] { display: none !important; }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998 }}>
        {/* Floating Navigation Bubble - Top Right */}
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 10000 }}>
          {/* Toggle Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 42,
              height: 42,
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              transition: 'background 0.2s',
            }}
            title="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position: 'absolute',
                top: 50,
                right: 0,
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(16px)',
                borderRadius: 14,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                border: '1px solid rgba(0,0,0,0.08)',
                minWidth: 220,
                overflow: 'hidden',
              }}>
                {/* Current article title */}
                <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Đang đọc</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#333', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{articleTitle}</p>
                </div>

                {/* Series info */}
                {nav?.series && (
                  <div style={{ padding: '8px 16px', background: '#f0f7ff', borderBottom: '1px solid #e0ecf8' }}>
                    <p style={{ fontSize: 10, color: '#6090c0', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Tuyển tập</p>
                    <p style={{ fontSize: 12, color: '#2060a0', fontWeight: 600, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nav.series.title}</p>
                    {nav.currentPart && (
                      <p style={{ fontSize: 10, color: '#6090c0', margin: '2px 0 0' }}>{nav.currentPart.title}</p>
                    )}
                  </div>
                )}

                <div style={{ padding: '4px 0' }}>
                  {/* Previous Chapter */}
                  {nav?.prev ? (
                    <button
                      onClick={() => { router.push(`/read/${nav.prev!.slug}`); setMenuOpen(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontSize: 14 }}>⬅️</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Chương trước</p>
                        <p style={{ fontSize: 13, color: '#444', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nav.prev.title}</p>
                      </div>
                    </button>
                  ) : (
                    <div style={{ padding: '10px 16px', opacity: 0.3 }}>
                      <span style={{ fontSize: 11, color: '#999' }}>⬅️ Không có chương trước</span>
                    </div>
                  )}

                  {/* Next Chapter */}
                  {nav?.next ? (
                    <button
                      onClick={() => { router.push(`/read/${nav.next!.slug}`); setMenuOpen(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontSize: 14 }}>➡️</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Chương sau</p>
                        <p style={{ fontSize: 13, color: '#444', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nav.next.title}</p>
                      </div>
                    </button>
                  ) : (
                    <div style={{ padding: '10px 16px', opacity: 0.3 }}>
                      <span style={{ fontSize: 11, color: '#999' }}>➡️ Không có chương sau</span>
                    </div>
                  )}

                  <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />

                  {/* Back to Series */}
                  {nav?.series && (
                    <button
                      onClick={() => { router.push(`/series/${nav.series!.slug}`); setMenuOpen(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontSize: 14 }}>📚</span>
                      <span style={{ fontSize: 13, color: '#444' }}>Mục lục</span>
                    </button>
                  )}

                  {/* Back Home */}
                  <button
                    onClick={() => { router.push('/'); setMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 14 }}>🏠</span>
                    <span style={{ fontSize: 13, color: '#444' }}>Trang chủ</span>
                  </button>

                  {/* Go Back */}
                  <button
                    onClick={() => { router.back(); setMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 14 }}>↩️</span>
                    <span style={{ fontSize: 13, color: '#444' }}>Quay lại</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* iframe - Render HTML nguyên bản */}
        <iframe
          src={`/api/articles/${articleId}/raw`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          sandbox="allow-scripts allow-same-origin"
          title="Article content"
        />
      </div>
    </>
  );
}
