'use client';

import { useEffect, useState, useCallback } from 'react';

interface FolderInfo {
  name: string;
  suggestedTitle: string;
  hasSubfolders: boolean;
  totalHtml: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ImportResult {
  success: boolean;
  series: { id: string; title: string; slug: string };
  parts: { title: string; articles: number }[];
  totalArticles: number;
  errors: string[];
}

export default function ImportFolderPage() {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  // Form state
  const [selectedFolder, setSelectedFolder] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  // Status
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch('/api/admin/import-folder');
      const data = await res.json();
      setFolders(data.folders ?? []);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, [loadFolders]);

  // Auto-fill title when folder is selected
  const handleFolderChange = (name: string) => {
    setSelectedFolder(name);
    const info = folders.find((f) => f.name === name);
    if (info) setSeriesTitle(info.suggestedTitle);
    setResult(null);
    setImportError('');
  };

  const handleImport = async () => {
    if (!selectedFolder) return;
    setImporting(true);
    setResult(null);
    setImportError('');

    try {
      const res = await fetch('/api/admin/import-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: selectedFolder,
          seriesTitle: seriesTitle.trim() || undefined,
          categorySlug: categorySlug || undefined,
          overwrite,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error ?? `Error ${res.status}`);
      } else {
        setResult(data);
        loadFolders(); // Refresh folder list
      }
    } catch (e: any) {
      setImportError(e?.message ?? 'Unknown error');
    } finally {
      setImporting(false);
    }
  };

  const selectedInfo = folders.find((f) => f.name === selectedFolder);

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import từ thư mục</h1>
      <p className="text-sm text-gray-500 mb-6">
        Import toàn bộ file HTML trong thư mục{' '}
        <code className="bg-gray-100 px-1 rounded">data/</code> vào hệ thống.
        Cấu trúc được nhận diện tự động:
        <br />
        <code className="bg-gray-100 px-1 rounded text-xs">
          data/tuyển-tập/phần-1/chương-1.html
        </code>{' '}
        → Tuyển tập / Phần / Bài viết
        <br />
        <code className="bg-gray-100 px-1 rounded text-xs">
          data/tuyển-tập/bai-1.html
        </code>{' '}
        → Tuyển tập / Bài viết (không có phần)
      </p>

      {/* ── Folder list ── */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">
          Thư mục có sẵn trong{' '}
          <code className="bg-gray-100 px-1 rounded text-sm">data/</code>
        </h2>

        {loadingFolders ? (
          <p className="text-sm text-gray-400">Đang tải...</p>
        ) : folders.length === 0 ? (
          <p className="text-sm text-gray-500">
            Không tìm thấy thư mục nào. Hãy tạo thư mục trong{' '}
            <code className="bg-gray-100 px-1 rounded">data/</code>.
          </p>
        ) : (
          <div className="space-y-2">
            {folders.map((f) => (
              <button
                key={f.name}
                onClick={() => handleFolderChange(f.name)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors text-sm ${
                  selectedFolder === f.name
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">📁 {f.name}</span>
                  <span className="text-xs text-gray-400">
                    {f.totalHtml} file HTML
                    {f.hasSubfolders ? ' · có thư mục con' : ' · không có phần'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Import form ── */}
      {selectedFolder && (
        <div className="bg-white border rounded-lg p-4 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-700">
            Cấu hình import: <span className="text-blue-600">{selectedFolder}</span>
          </h2>

          {/* Structure preview */}
          {selectedInfo && (
            <div className="bg-gray-50 border rounded p-3 text-xs text-gray-600">
              {selectedInfo.hasSubfolders ? (
                <>
                  Sẽ tạo:{' '}
                  <strong>1 tuyển tập</strong> /{' '}
                  <strong>nhiều phần (thư mục con)</strong> /{' '}
                  <strong>{selectedInfo.totalHtml} bài viết</strong>
                </>
              ) : (
                <>
                  Sẽ tạo:{' '}
                  <strong>1 tuyển tập</strong> /{' '}
                  <strong>{selectedInfo.totalHtml} bài viết</strong> (không có phần trung gian)
                </>
              )}
            </div>
          )}

          {/* Series title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên tuyển tập
            </label>
            <input
              type="text"
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              placeholder="Tự động từ tên thư mục"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục (tùy chọn)
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Không có danh mục --</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Overwrite */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded"
            />
            <span className="text-sm text-gray-700">
              <span className="font-medium text-red-600">Ghi đè</span> — xóa tuyển tập cùng tên
              và import lại từ đầu
            </span>
          </label>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? '⏳ Đang import...' : `🚀 Import "${selectedFolder}"`}
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm font-medium">❌ Lỗi</p>
          <p className="text-red-600 text-sm mt-1">{importError}</p>
        </div>
      )}

      {/* ── Success result ── */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold mb-2">
            ✅ Import thành công!
          </p>
          <p className="text-sm text-green-700">
            Tuyển tập:{' '}
            <a
              href={`/series/${result.series.slug}`}
              className="underline font-medium"
              target="_blank"
              rel="noreferrer"
            >
              {result.series.title}
            </a>
          </p>
          <p className="text-sm text-green-700">
            Tổng bài viết: <strong>{result.totalArticles}</strong>
          </p>

          {result.parts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.parts.map((p, i) => (
                <li key={i} className="text-sm text-green-700">
                  📂 {p.title}: <strong>{p.articles}</strong> bài
                </li>
              ))}
            </ul>
          )}

          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-yellow-700 font-medium">
                ⚠️ {result.errors.length} lỗi khi import:
              </p>
              <ul className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-yellow-600">
                    • {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <a
              href={`/series/${result.series.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Xem tuyển tập →
            </a>
            <a
              href="/admin/series"
              className="text-xs px-3 py-1 bg-white border border-green-600 text-green-700 rounded hover:bg-green-50 transition-colors"
            >
              Quản lý tuyển tập
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
