'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Chapter</title>
</head>
<body>
  <div class="story-content">
    <p>Your HTML content here...</p>
  </div>
</body>
</html>`;

interface Chapter {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  orderInPart: number;
  viewCount: number;
  isPublished: boolean;
}

interface Part {
  id: string;
  title: string;
  order: number;
  _count?: { articles: number };
  articles?: Chapter[];
}

interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  parts: Part[];
  createdAt: string;
}

interface SeriesEditorState {
  open: boolean;
  id: string | null;
  title: string;
  description: string;
  parts: string[];
  saving: boolean;
}

interface PartEditorState {
  open: boolean;
  mode: 'create' | 'edit';
  id: string | null;
  seriesId: string;
  title: string;
  order: number;
  saving: boolean;
}

interface ChapterEditorState {
  open: boolean;
  mode: 'create' | 'edit';
  id: string | null;
  partId: string;
  title: string;
  description: string;
  orderInPart: number;
  htmlContent: string;
  isPublished: boolean;
  saving: boolean;
  loadingSource: boolean;
  preview: boolean;
}

const initialSeriesEditor: SeriesEditorState = {
  open: false,
  id: null,
  title: '',
  description: '',
  parts: [''],
  saving: false,
};

const initialPartEditor: PartEditorState = {
  open: false,
  mode: 'create',
  id: null,
  seriesId: '',
  title: '',
  order: 1,
  saving: false,
};

const initialChapterEditor: ChapterEditorState = {
  open: false,
  mode: 'create',
  id: null,
  partId: '',
  title: '',
  description: '',
  orderInPart: 1,
  htmlContent: DEFAULT_HTML_TEMPLATE,
  isPublished: true,
  saving: false,
  loadingSource: false,
  preview: false,
};

export default function AdminSeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [seriesEditor, setSeriesEditor] = useState<SeriesEditorState>(initialSeriesEditor);
  const [partEditor, setPartEditor] = useState<PartEditorState>(initialPartEditor);
  const [chapterEditor, setChapterEditor] = useState<ChapterEditorState>(initialChapterEditor);

  const fetchSeries = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/series?includeChapters=true&scope=admin');
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu tuyển tập');
      }

      const data = await response.json();
      setSeriesList(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const toggleSeries = (id: string) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePart = (id: string) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSeries(new Set(seriesList.map((series) => series.id)));
    setExpandedParts(new Set(seriesList.flatMap((series) => series.parts.map((part) => part.id))));
  };

  const collapseAll = () => {
    setExpandedSeries(new Set());
    setExpandedParts(new Set());
  };

  const openSeriesCreate = () => {
    setSeriesEditor({ ...initialSeriesEditor, open: true });
  };

  const openSeriesEdit = (series: Series) => {
    setSeriesEditor({
      open: true,
      id: series.id,
      title: series.title,
      description: series.description || '',
      parts: series.parts.length > 0 ? series.parts.map((part) => part.title) : [''],
      saving: false,
    });
  };

  const handleSeriesSave = async () => {
    if (!seriesEditor.title.trim()) return;

    setSeriesEditor((prev) => ({ ...prev, saving: true }));

    try {
      const validParts = seriesEditor.parts.filter((part) => part.trim());
      const response = await fetch(
        seriesEditor.id ? `/api/series/${seriesEditor.id}` : '/api/series',
        {
          method: seriesEditor.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: seriesEditor.title,
            description: seriesEditor.description,
            parts: validParts.map((part) => ({ title: part })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Không thể lưu tuyển tập');
      }

      setSeriesEditor(initialSeriesEditor);
      await fetchSeries();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu tuyển tập');
      setSeriesEditor((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleSeriesDelete = async (id: string) => {
    if (!confirm('Xóa tuyển tập này? Các phần sẽ bị xóa và các chương sẽ bị gỡ khỏi tuyển tập.')) {
      return;
    }

    const response = await fetch(`/api/series/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Không thể xóa tuyển tập');
      return;
    }

    await fetchSeries();
  };

  const openPartCreate = (seriesId: string, nextOrder: number) => {
    setPartEditor({
      ...initialPartEditor,
      open: true,
      mode: 'create',
      seriesId,
      order: nextOrder,
    });
    setExpandedSeries((prev) => new Set(prev).add(seriesId));
  };

  const openPartEdit = (seriesId: string, part: Part) => {
    setPartEditor({
      open: true,
      mode: 'edit',
      id: part.id,
      seriesId,
      title: part.title,
      order: part.order,
      saving: false,
    });
  };

  const handlePartSave = async () => {
    if (!partEditor.title.trim()) return;

    setPartEditor((prev) => ({ ...prev, saving: true }));

    try {
      const response = await fetch(
        partEditor.mode === 'edit' ? `/api/parts/${partEditor.id}` : '/api/parts',
        {
          method: partEditor.mode === 'edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: partEditor.title,
            seriesId: partEditor.seriesId,
            order: partEditor.order,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Không thể lưu phần');
      }

      setPartEditor(initialPartEditor);
      setExpandedSeries((prev) => new Set(prev).add(partEditor.seriesId));
      await fetchSeries();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu phần');
      setPartEditor((prev) => ({ ...prev, saving: false }));
    }
  };

  const handlePartDelete = async (partId: string) => {
    if (!confirm('Xóa phần này? Các chương sẽ được gỡ khỏi phần này nhưng không bị xóa.')) {
      return;
    }

    const response = await fetch(`/api/parts/${partId}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Không thể xóa phần');
      return;
    }

    await fetchSeries();
  };

  const openChapterCreate = (partId: string, nextOrder: number) => {
    setChapterEditor({
      ...initialChapterEditor,
      open: true,
      mode: 'create',
      partId,
      orderInPart: nextOrder,
      htmlContent: DEFAULT_HTML_TEMPLATE,
    });
    setExpandedParts((prev) => new Set(prev).add(partId));
  };

  const openChapterEdit = async (partId: string, chapterId: string) => {
    setChapterEditor({
      ...initialChapterEditor,
      open: true,
      mode: 'edit',
      id: chapterId,
      partId,
      loadingSource: true,
    });

    try {
      const [articleResponse, sourceResponse] = await Promise.all([
        fetch(`/api/articles/${chapterId}`),
        fetch(`/api/articles/${chapterId}/source`),
      ]);

      if (!articleResponse.ok || !sourceResponse.ok) {
        throw new Error('Không thể tải nội dung chương');
      }

      const article = await articleResponse.json();
      const source = await sourceResponse.json();

      setChapterEditor({
        open: true,
        mode: 'edit',
        id: chapterId,
        partId: article.part?.id || partId,
        title: article.title,
        description: article.description || '',
        orderInPart: article.orderInPart || 1,
        htmlContent: source.content || DEFAULT_HTML_TEMPLATE,
        isPublished: article.isPublished,
        saving: false,
        loadingSource: false,
        preview: false,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải chương');
      setChapterEditor(initialChapterEditor);
    }
  };

  const handleChapterSave = async () => {
    if (!chapterEditor.title.trim() || !chapterEditor.htmlContent.trim()) return;

    setChapterEditor((prev) => ({ ...prev, saving: true }));

    try {
      const formData = new FormData();
      formData.set('title', chapterEditor.title);
      formData.set('description', chapterEditor.description);
      formData.set('htmlContent', chapterEditor.htmlContent);
      formData.set('partId', chapterEditor.partId);
      formData.set('orderInPart', String(chapterEditor.orderInPart));
      formData.set('isPublished', String(chapterEditor.isPublished));
      formData.set('categoryId', '');
      formData.set('tags', '');

      const response = await fetch(
        chapterEditor.mode === 'edit' ? `/api/articles/${chapterEditor.id}` : '/api/articles',
        {
          method: chapterEditor.mode === 'edit' ? 'PUT' : 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Không thể lưu chương');
      }

      setChapterEditor(initialChapterEditor);
      setExpandedParts((prev) => new Set(prev).add(chapterEditor.partId));
      await fetchSeries();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu chương');
      setChapterEditor((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleChapterDelete = async (chapterId: string, chapterTitle: string) => {
    if (!confirm(`Xóa chương "${chapterTitle}"? File HTML và metadata sẽ bị xóa vĩnh viễn.`)) {
      return;
    }

    const response = await fetch(`/api/articles/${chapterId}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Không thể xóa chương');
      return;
    }

    await fetchSeries();
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📚 Quản lý tuyển tập</h1>
          <p className="text-sm text-gray-400 mt-1">
            CRUD tuyển tập, phần và chương trực tiếp tại chỗ, không cần rời khỏi cây quản lý.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {seriesList.length > 0 && (
            <>
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg border"
              >
                Mở tất cả
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg border"
              >
                Đóng tất cả
              </button>
            </>
          )}
          <button
            onClick={openSeriesCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            + Tạo tuyển tập
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((index) => (
            <div key={index} className="bg-white rounded-xl p-5 animate-pulse border">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white border rounded-xl">
          <div className="text-5xl mb-4">📚</div>
          <p>Chưa có tuyển tập nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seriesList.map((series) => {
            const totalChapters = series.parts.reduce(
              (sum, part) => sum + (part.articles?.length || part._count?.articles || 0),
              0
            );
            const isExpanded = expandedSeries.has(series.id);

            return (
              <div key={series.id} className="bg-white rounded-xl border overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSeries(series.id)}
                >
                  <span className={`text-gray-400 transition-transform text-sm ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📚</span>
                      <h3 className="font-semibold text-gray-800">{series.title}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          series.isPublished ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {series.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {series.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 ml-7">{series.description}</p>
                    )}
                  </div>
                  <div className="hidden lg:flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                    <span>📖 {series.parts.length} phần</span>
                    <span>📄 {totalChapters} chương</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                    <button
                      onClick={() => openPartCreate(series.id, series.parts.length + 1)}
                      className="px-2.5 py-1.5 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded-lg"
                      title="Thêm phần"
                    >
                      + Phần
                    </button>
                    <button
                      onClick={() => openSeriesEdit(series)}
                      className="p-1.5 text-xs hover:bg-blue-50 rounded-lg"
                      title="Sửa tuyển tập"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleSeriesDelete(series.id)}
                      className="p-1.5 text-xs hover:bg-red-50 rounded-lg"
                      title="Xóa tuyển tập"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-gray-50/50">
                    {series.parts.length === 0 ? (
                      <div className="p-4 pl-12 text-xs text-gray-400 flex items-center justify-between gap-3">
                        <span>Chưa có phần nào</span>
                        <button
                          onClick={() => openPartCreate(series.id, 1)}
                          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          + Tạo phần đầu tiên
                        </button>
                      </div>
                    ) : (
                      series.parts.map((part, partIndex) => {
                        const isPartExpanded = expandedParts.has(part.id);
                        const chapterCount = part.articles?.length || part._count?.articles || 0;
                        const isLastPart = partIndex === series.parts.length - 1;

                        return (
                          <div key={part.id}>
                            <div
                              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-blue-50/50 transition-colors"
                              onClick={() => togglePart(part.id)}
                            >
                              <div className="w-8 text-center text-gray-300 text-xs select-none font-mono">
                                {isLastPart ? '└─' : '├─'}
                              </div>
                              <span className={`text-gray-400 transition-transform text-xs ${isPartExpanded ? 'rotate-90' : ''}`}>
                                {chapterCount > 0 ? '▶' : ''}
                              </span>
                              <span className="text-sm">📖</span>
                              <span className="text-sm font-medium text-gray-700 flex-1">
                                {part.title}
                              </span>
                              <span className="hidden sm:inline text-xs text-gray-400">
                                thứ tự {part.order}
                              </span>
                              <span className="text-xs text-gray-400">{chapterCount} chương</span>
                              <div
                                className="flex items-center gap-1 flex-shrink-0"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  onClick={() => openChapterCreate(part.id, chapterCount + 1)}
                                  className="px-2 py-1 text-[11px] bg-green-50 text-green-600 hover:bg-green-100 rounded-lg"
                                  title="Thêm chương"
                                >
                                  + Chương
                                </button>
                                <button
                                  onClick={() => openPartEdit(series.id, part)}
                                  className="p-1.5 text-xs hover:bg-blue-50 rounded-lg"
                                  title="Sửa phần"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handlePartDelete(part.id)}
                                  className="p-1.5 text-xs hover:bg-red-50 rounded-lg"
                                  title="Xóa phần"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {isPartExpanded && (
                              <div className="bg-white/60">
                                {part.articles && part.articles.length > 0 ? (
                                  part.articles.map((chapter, chapterIndex) => {
                                    const isLastChapter = chapterIndex === part.articles!.length - 1;

                                    return (
                                      <div
                                        key={chapter.id}
                                        className="flex items-start gap-2 px-4 py-2 hover:bg-blue-50/30 transition-colors group"
                                      >
                                        <div className="w-8 text-center text-gray-300 text-xs select-none font-mono pt-1">
                                          {isLastPart ? '   ' : '│  '}
                                        </div>
                                        <div className="w-8 text-center text-gray-300 text-xs select-none font-mono pt-1">
                                          {isLastChapter ? '└─' : '├─'}
                                        </div>
                                        <span className="text-xs pt-1">📄</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-mono w-7">
                                              #{chapter.orderInPart}
                                            </span>
                                            <span className="text-sm text-gray-700 truncate">
                                              {chapter.title}
                                            </span>
                                            <span
                                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                chapter.isPublished
                                                  ? 'bg-green-50 text-green-600'
                                                  : 'bg-gray-100 text-gray-500'
                                              }`}
                                            >
                                              {chapter.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                          </div>
                                          {chapter.description && (
                                            <p className="text-xs text-gray-400 truncate mt-0.5 ml-9">
                                              {chapter.description}
                                            </p>
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-300 group-hover:text-gray-400 pt-1">
                                          👁 {chapter.viewCount}
                                        </span>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Link
                                            href={`/read/${chapter.slug}`}
                                            target="_blank"
                                            className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 rounded-lg"
                                          >
                                            Xem
                                          </Link>
                                          <button
                                            onClick={() => openChapterEdit(part.id, chapter.id)}
                                            className="p-1.5 text-xs hover:bg-blue-50 rounded-lg"
                                            title="Sửa chương"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            onClick={() => handleChapterDelete(chapter.id, chapter.title)}
                                            className="p-1.5 text-xs hover:bg-red-50 rounded-lg"
                                            title="Xóa chương"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="flex items-center justify-between gap-3 px-16 py-3 text-xs text-gray-400">
                                    <span>Phần này chưa có chương nào.</span>
                                    <button
                                      onClick={() => openChapterCreate(part.id, 1)}
                                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                      + Thêm chương đầu tiên
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {seriesEditor.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold">
                {seriesEditor.id ? 'Chỉnh sửa tuyển tập' : 'Tạo tuyển tập mới'}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tên tuyển tập *</label>
                <input
                  type="text"
                  value={seriesEditor.title}
                  onChange={(event) =>
                    setSeriesEditor((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="VD: Không Gia Đình"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả</label>
                <textarea
                  value={seriesEditor.description}
                  onChange={(event) =>
                    setSeriesEditor((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="Mô tả ngắn về tuyển tập..."
                />
              </div>
              {!seriesEditor.id && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Các phần khởi tạo</label>
                  {seriesEditor.parts.map((part, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={part}
                        onChange={(event) => {
                          const nextParts = [...seriesEditor.parts];
                          nextParts[index] = event.target.value;
                          setSeriesEditor((prev) => ({ ...prev, parts: nextParts }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder={`Phần ${index + 1}`}
                      />
                      {seriesEditor.parts.length > 1 && (
                        <button
                          onClick={() =>
                            setSeriesEditor((prev) => ({
                              ...prev,
                              parts: prev.parts.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                          className="px-2 text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setSeriesEditor((prev) => ({ ...prev, parts: [...prev.parts, ''] }))
                    }
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Thêm phần
                  </button>
                </div>
              )}
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => setSeriesEditor(initialSeriesEditor)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSeriesSave}
                disabled={!seriesEditor.title.trim() || seriesEditor.saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {seriesEditor.saving ? 'Đang lưu...' : seriesEditor.id ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {partEditor.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold">
                {partEditor.mode === 'edit' ? 'Chỉnh sửa phần' : 'Tạo phần mới'}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tên phần *</label>
                <input
                  type="text"
                  value={partEditor.title}
                  onChange={(event) =>
                    setPartEditor((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="VD: Phần 1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Thứ tự</label>
                <input
                  type="number"
                  min={1}
                  value={partEditor.order}
                  onChange={(event) =>
                    setPartEditor((prev) => ({
                      ...prev,
                      order: Math.max(1, parseInt(event.target.value, 10) || 1),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => setPartEditor(initialPartEditor)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handlePartSave}
                disabled={!partEditor.title.trim() || partEditor.saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {partEditor.saving ? 'Đang lưu...' : partEditor.mode === 'edit' ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {chapterEditor.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {chapterEditor.mode === 'edit' ? 'Chỉnh sửa chương' : 'Tạo chương mới'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Chỉnh trực tiếp metadata và HTML nguồn của chương ngay trong trang tuyển tập.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setChapterEditor((prev) => ({ ...prev, preview: !prev.preview }))
                  }
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  {chapterEditor.preview ? 'Ẩn preview' : '👁 Preview'}
                </button>
                <button
                  onClick={() => setChapterEditor(initialChapterEditor)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {chapterEditor.loadingSource ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Tiêu đề *</label>
                        <input
                          type="text"
                          value={chapterEditor.title}
                          onChange={(event) =>
                            setChapterEditor((prev) => ({ ...prev, title: event.target.value }))
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả</label>
                        <textarea
                          value={chapterEditor.description}
                          onChange={(event) =>
                            setChapterEditor((prev) => ({ ...prev, description: event.target.value }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Thứ tự trong phần</label>
                        <input
                          type="number"
                          min={1}
                          value={chapterEditor.orderInPart}
                          onChange={(event) =>
                            setChapterEditor((prev) => ({
                              ...prev,
                              orderInPart: Math.max(1, parseInt(event.target.value, 10) || 1),
                            }))
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={chapterEditor.isPublished}
                          onChange={(event) =>
                            setChapterEditor((prev) => ({ ...prev, isPublished: event.target.checked }))
                          }
                        />
                        Xuất bản chương này
                      </label>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Chương được lưu trực tiếp về file HTML gốc trên server.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Nội dung HTML *</label>
                    <textarea
                      value={chapterEditor.htmlContent}
                      onChange={(event) =>
                        setChapterEditor((prev) => ({ ...prev, htmlContent: event.target.value }))
                      }
                      rows={18}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                  </div>

                  {chapterEditor.preview && chapterEditor.htmlContent && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Preview</label>
                      <div className="border rounded-xl overflow-hidden h-[360px]">
                        <iframe
                          srcDoc={chapterEditor.htmlContent}
                          title="Chapter preview"
                          className="w-full h-full border-0"
                          sandbox="allow-scripts"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t flex justify-end gap-2">
                  <button
                    onClick={() => setChapterEditor(initialChapterEditor)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleChapterSave}
                    disabled={
                      !chapterEditor.title.trim() ||
                      !chapterEditor.htmlContent.trim() ||
                      chapterEditor.saving
                    }
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {chapterEditor.saving ? 'Đang lưu...' : chapterEditor.mode === 'edit' ? 'Cập nhật' : 'Tạo chương'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}