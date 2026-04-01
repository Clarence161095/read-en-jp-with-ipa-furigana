'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  description: string | null;
  tags: string | null;
  isPublished: boolean;
  categoryId: string | null;
  htmlFilePath: string;
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [articleId, setArticleId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setArticleId(p.id));
  }, [params]);

  useEffect(() => {
    if (!articleId) return;
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch(`/api/articles/${articleId}`).then((r) => r.json()),
      fetch(`/api/articles/${articleId}/source`).then((r) => r.json()),
    ]).then(([catData, articleData, rawHtml]) => {
      setCategories(catData.categories);
      setArticle(articleData);
      setTitle(articleData.title);
      setDescription(articleData.description || '');
      setCategoryId(articleData.categoryId || '');
      setTags(articleData.tags || '');
      setIsPublished(articleData.isPublished);
      setHtmlContent(rawHtml.content || '');
      setLoading(false);
    });
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const formData = new FormData();
    formData.set('title', title);
    formData.set('description', description);
    formData.set('categoryId', categoryId);
    formData.set('tags', tags);
    formData.set('isPublished', String(isPublished));
    formData.set('htmlContent', htmlContent);

    const res = await fetch(`/api/articles/${articleId}`, { method: 'PUT', body: formData });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Có lỗi xảy ra');
      setSaving(false);
      return;
    }

    router.push('/admin/articles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sửa bài viết</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="english, ipa, chapter-2"
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Xuất bản</span>
          </label>
        </div>

        {/* HTML Content Editor */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Nội dung HTML</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                {showPreview ? 'Ẩn preview' : '👁 Preview'}
              </button>
              <label className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer">
                📎 Upload thay thế
                <input
                  type="file"
                  accept=".html,.htm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) file.text().then(setHtmlContent);
                  }}
                />
              </label>
            </div>
          </div>

          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={15}
            className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />

          {showPreview && htmlContent && (
            <div className="mt-3 border rounded-lg overflow-hidden" style={{ height: 400 }}>
              <iframe
                srcDoc={htmlContent}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Preview"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
