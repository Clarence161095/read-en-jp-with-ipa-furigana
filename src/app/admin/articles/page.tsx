'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;
  category: { name: string } | null;
  author: { username: string };
  part: {
    title: string;
    series: { title: string; slug: string };
  } | null;
}

interface SeriesOption {
  id: string;
  title: string;
  slug: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20', scope: 'admin' });
    if (search) params.set('search', search);
    if (seriesFilter) params.set('series', seriesFilter);
    const res = await fetch(`/api/articles?${params}`);
    const data = await res.json();
    setArticles(data.articles);
    setTotalPages(data.pagination.totalPages);
    setLoading(false);
  }, [page, search, seriesFilter]);

  useEffect(() => {
    fetch('/api/series').then(r => r.json()).then(d => setSeriesOptions(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xóa bài viết "${title}"?`)) return;
    setDeleting(id);
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchArticles();
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý bài viết</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Thêm mới
        </Link>
      </div>

      {/* Search + Series filter */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <select
          value={seriesFilter}
          onChange={(e) => { setSeriesFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả tuyển tập</option>
          {seriesOptions.map((s) => (
            <option key={s.id} value={s.slug}>{s.title}</option>
          ))}
        </select>
      </div>

      {/* Table / Card List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse border">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>Chưa có bài viết nào</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Tiêu đề</th>
                  <th className="text-left px-4 py-3">Tuyển tập</th>
                  <th className="text-left px-4 py-3">Danh mục</th>
                  <th className="text-center px-4 py-3">Lượt xem</th>
                  <th className="text-center px-4 py-3">Ngày tạo</th>
                  <th className="text-right px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{article.title}</div>
                      <div className="text-xs text-gray-400">{article.author.username}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {article.part ? (
                        <div>
                          <div className="text-xs font-medium text-blue-600">{article.part.series.title}</div>
                          <div className="text-xs text-gray-400">{article.part.title}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{article.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500">{article.viewCount}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500">
                      {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/read/${article.slug}`}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                          target="_blank"
                        >
                          👁
                        </Link>
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id, article.title)}
                          disabled={deleting === article.id}
                          className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl p-4 border">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{article.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {article.part ? (
                        <span className="text-blue-500">{article.part.series.title} • {article.part.title} • </span>
                      ) : null}
                      {article.category?.name || 'Không danh mục'} • 👁 {article.viewCount} • {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/read/${article.slug}`}
                    className="flex-1 text-center py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
                    target="_blank"
                  >
                    Xem
                  </Link>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="flex-1 text-center py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id, article.title)}
                    disabled={deleting === article.id}
                    className="flex-1 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-30"
          >
            ←
          </button>
          <span className="px-3 py-1.5 text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
