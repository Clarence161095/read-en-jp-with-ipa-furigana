'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [htmlContent, setHtmlContent] = useState('');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories));
  }, []);

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

    if (inputMode === 'upload' && htmlFile) {
      formData.set('htmlFile', htmlFile);
    } else if (inputMode === 'paste' && htmlContent) {
      formData.set('htmlContent', htmlContent);
    } else {
      setError('Vui lòng nhập nội dung HTML');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/articles', { method: 'POST', body: formData });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Có lỗi xảy ra');
      setSaving(false);
      return;
    }

    router.push('/admin/articles');
  };

  return (
    <div className="pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Thêm bài viết mới</h1>

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
            <span className="text-sm text-gray-700">Xuất bản ngay</span>
          </label>
        </div>

        {/* HTML Input */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700">Nội dung HTML *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1 text-xs rounded-full ${inputMode === 'paste' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Paste code
              </button>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1 text-xs rounded-full ${inputMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Upload file
              </button>
            </div>
          </div>

          {inputMode === 'paste' ? (
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={12}
              placeholder="Paste nội dung HTML vào đây..."
              className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          ) : (
            <div>
              <input
                type="file"
                accept=".html,.htm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setHtmlFile(file);
                    // Also read content for preview
                    file.text().then(setHtmlContent);
                  }
                }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {htmlFile && (
                <p className="text-xs text-gray-500 mt-2">📎 {htmlFile.name}</p>
              )}
            </div>
          )}

          {htmlContent && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="mt-3 px-4 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              {showPreview ? 'Ẩn preview' : '👁 Preview'}
            </button>
          )}

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
            {saving ? 'Đang lưu...' : 'Lưu bài viết'}
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
