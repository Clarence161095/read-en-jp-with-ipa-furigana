'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Chapter {
  id: string;
  title: string;
  slug: string;
  orderInPart: number;
  viewCount: number;
  description: string | null;
}

interface Part {
  id: string;
  title: string;
  order: number;
  articles: Chapter[];
}

interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  parts: Part[];
  author: { id: string; username: string } | null;
}

export default function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());

  useEffect(() => {
    params.then((p) => {
      fetch(`/api/series/${p.slug}`)
        .then((r) => {
          if (!r.ok) throw new Error('Not found');
          return r.json();
        })
        .then((data) => {
          setSeries(data);
          // Expand all parts by default
          setExpandedParts(new Set(data.parts.map((p: Part) => p.id)));
          setLoading(false);
        })
        .catch(() => {
          router.push('/');
        });
    });
  }, [params, router]);

  const togglePart = (partId: string) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            {[1, 2].map((i) => (
              <div key={i} className="mb-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-10 bg-gray-100 rounded mb-2"></div>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!series) return null;

  const totalChapters = series.parts.reduce((sum, p) => sum + p.articles.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-blue-600 mb-4 inline-flex items-center gap-1"
        >
          ← Trang chủ
        </button>

        {/* Series Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{series.title}</h1>
          {series.description && (
            <p className="text-gray-600 mb-3">{series.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>📖 {series.parts.length} phần</span>
            <span>📄 {totalChapters} chương</span>
            {series.author && <span>✍️ {series.author.username}</span>}
          </div>
        </div>

        {/* Parts & Chapters */}
        <div className="space-y-4">
          {series.parts.map((part) => (
            <div key={part.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Part Header */}
              <button
                onClick={() => togglePart(part.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{expandedParts.has(part.id) ? '📂' : '📁'}</span>
                  <h2 className="font-semibold text-gray-800">{part.title}</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {part.articles.length} chương
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {expandedParts.has(part.id) ? '▲' : '▼'}
                </span>
              </button>

              {/* Chapters List */}
              {expandedParts.has(part.id) && (
                <div className="border-t border-gray-50">
                  {part.articles.map((chapter, i) => (
                    <Link
                      key={chapter.id}
                      href={`/read/${chapter.slug}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 group"
                    >
                      <span className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-xs font-medium text-gray-500 group-hover:text-blue-600 flex-shrink-0">
                        {chapter.orderInPart || i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate">
                          {chapter.title}
                        </p>
                        {chapter.description && (
                          <p className="text-xs text-gray-400 truncate">{chapter.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-300 flex-shrink-0">
                        👁 {chapter.viewCount}
                      </span>
                    </Link>
                  ))}
                  {part.articles.length === 0 && (
                    <p className="px-5 py-4 text-sm text-gray-400 text-center">Chưa có chương nào</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
