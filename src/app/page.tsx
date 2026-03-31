'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  tags: string | null;
  viewCount: number;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
  author: { id: string; username: string };
}

interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  parts: {
    id: string;
    title: string;
    _count: { articles: number };
  }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { articles: number };
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '12',
      sort,
    });
    if (search) params.set('search', search);
    if (activeCategory) params.set('category', activeCategory);

    const res = await fetch(`/api/articles?${params}`);
    const data = await res.json();
    setArticles(data.articles);
    setTotalPages(data.pagination.totalPages);
    setLoading(false);
  }, [page, search, activeCategory, sort]);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories));
    fetch('/api/series').then(r => r.json()).then(d => setSeriesList(d));
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Series Section */}
        {seriesList.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3">📚 Tuyển tập</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seriesList.map((s) => {
                const totalChapters = s.parts.reduce((sum, p) => sum + p._count.articles, 0);
                return (
                  <Link
                    key={s.id}
                    href={`/series/${s.slug}`}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 hover:shadow-md hover:border-blue-300 transition-all group"
                  >
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1.5">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{s.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>📖 {s.parts.length} phần</span>
                      <span>📄 {totalChapters} chương</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Standalone Articles Section */}
        <h2 className="text-lg font-bold text-gray-800 mb-3">📝 Bài viết</h2>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </form>

        {/* Category tabs + Sort */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex flex-wrap gap-1.5 flex-1">
            <button
              onClick={() => { setActiveCategory(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeCategory ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat.slug ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                {cat.name} ({cat._count.articles})
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border text-xs bg-white"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="popular">Phổ biến</option>
          </select>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse border">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg">Chưa có bài viết nào</p>
            {search && <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/read/${article.slug}`}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                {article.category && (
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full mb-2">
                    {article.category.name}
                  </span>
                )}
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>👁 {article.viewCount}</span>
                  <span>📅 {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                {article.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.split(',').map((tag) => (
                      <span key={tag.trim()} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-30 hover:bg-gray-100"
            >
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-300">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm ${
                      page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-30 hover:bg-gray-100"
            >
              Sau →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
