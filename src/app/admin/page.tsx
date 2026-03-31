'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalArticles: number;
  totalUsers: number;
  totalViews: number;
}

interface RecentArticle {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  createdAt: string;
  author: { username: string };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalArticles: 0, totalUsers: 0, totalViews: 0 });
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);

  useEffect(() => {
    // Fetch articles for stats
    fetch('/api/articles?limit=5&sort=newest')
      .then((r) => r.json())
      .then((data) => {
        setRecentArticles(data.articles);
        setStats((prev) => ({ ...prev, totalArticles: data.pagination.total }));
      });

    // Fetch all articles count + views
    fetch('/api/articles?limit=1000')
      .then((r) => r.json())
      .then((data) => {
        const totalViews = data.articles.reduce((sum: number, a: any) => sum + a.viewCount, 0);
        setStats((prev) => ({ ...prev, totalArticles: data.pagination.total, totalViews }));
      });

    // Fetch users count
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        setStats((prev) => ({ ...prev, totalUsers: data.users?.length || 0 }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalArticles}</div>
          <div className="text-xs text-gray-500 mt-1">Bài viết</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1">Người dùng</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
          <div className="text-xs text-gray-500 mt-1">Lượt xem</div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Bài viết gần đây</h2>
          <Link href="/admin/articles" className="text-sm text-blue-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        {recentArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Chưa có bài viết nào</p>
            <Link href="/admin/articles/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              + Thêm bài viết đầu tiên
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentArticles.map((article) => (
              <div key={article.id} className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{article.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {article.author.username} • 👁 {article.viewCount} • {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg ml-3"
                >
                  Sửa
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
