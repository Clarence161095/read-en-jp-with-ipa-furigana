'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Chapter {
  id: string;
  title: string;
  slug: string;
  orderInPart: number;
  viewCount: number;
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

export default function AdminSeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parts, setParts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());

  const fetchSeries = () => {
    fetch('/api/series?includeChapters=true')
      .then((r) => r.json())
      .then((data) => {
        setSeriesList(data);
        setLoading(false);
      });
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
    setExpandedSeries(new Set(seriesList.map((s) => s.id)));
    setExpandedParts(new Set(seriesList.flatMap((s) => s.parts.map((p) => p.id))));
  };

  const collapseAll = () => {
    setExpandedSeries(new Set());
    setExpandedParts(new Set());
  };

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setParts(['']);
    setShowModal(true);
  };

  const openEdit = (s: Series) => {
    setEditingId(s.id);
    setTitle(s.title);
    setDescription(s.description || '');
    setParts(s.parts.map((p) => p.title));
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const validParts = parts.filter((p) => p.trim());

    if (editingId) {
      await fetch(`/api/series/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
    } else {
      await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          parts: validParts.map((p) => ({ title: p })),
        }),
      });
    }

    setSaving(false);
    setShowModal(false);
    fetchSeries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa tuyển tập này? Các bài viết sẽ được gỡ liên kết.')) return;
    await fetch(`/api/series/${id}`, { method: 'DELETE' });
    fetchSeries();
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">📚 Quản lý tuyển tập</h1>
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
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            + Tạo tuyển tập
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse border">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📚</div>
          <p>Chưa có tuyển tập nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seriesList.map((s) => {
            const totalChapters = s.parts.reduce(
              (sum, p) => sum + (p.articles?.length || p._count?.articles || 0),
              0
            );
            const isExpanded = expandedSeries.has(s.id);

            return (
              <div key={s.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Series header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSeries(s.id)}
                >
                  <span className={`text-gray-400 transition-transform text-sm ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📚</span>
                      <h3 className="font-semibold text-gray-800">{s.title}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          s.isPublished ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 ml-7">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                    <span>📖 {s.parts.length} phần</span>
                    <span>📄 {totalChapters} chương</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 text-xs hover:bg-blue-50 rounded-lg"
                      title="Sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-xs hover:bg-red-50 rounded-lg"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Parts tree */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50">
                    {s.parts.length === 0 ? (
                      <div className="p-4 pl-12 text-xs text-gray-400">Chưa có phần nào</div>
                    ) : (
                      s.parts.map((part, partIdx) => {
                        const isPartExpanded = expandedParts.has(part.id);
                        const chapterCount = part.articles?.length || part._count?.articles || 0;
                        const isLastPart = partIdx === s.parts.length - 1;

                        return (
                          <div key={part.id}>
                            {/* Part row */}
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
                              <span className="text-sm font-medium text-gray-700 flex-1">{part.title}</span>
                              <span className="text-xs text-gray-400">{chapterCount} chương</span>
                            </div>

                            {/* Chapters tree */}
                            {isPartExpanded && part.articles && part.articles.length > 0 && (
                              <div className="bg-white/60">
                                {part.articles.map((ch, chIdx) => {
                                  const isLastChapter = chIdx === part.articles!.length - 1;
                                  return (
                                    <div
                                      key={ch.id}
                                      className="flex items-center gap-2 px-4 py-1.5 hover:bg-blue-50/30 transition-colors group"
                                    >
                                      <div className="w-8 text-center text-gray-300 text-xs select-none font-mono">
                                        {isLastPart ? '   ' : '│  '}
                                      </div>
                                      <div className="w-8 text-center text-gray-300 text-xs select-none font-mono">
                                        {isLastChapter ? '└─' : '├─'}
                                      </div>
                                      <span className="text-xs">📄</span>
                                      <Link
                                        href={`/read/${ch.slug}`}
                                        className="text-sm text-gray-600 hover:text-blue-600 flex-1 truncate"
                                        target="_blank"
                                      >
                                        {ch.title}
                                      </Link>
                                      <span className="text-xs text-gray-300 group-hover:text-gray-400">
                                        👁 {ch.viewCount}
                                      </span>
                                    </div>
                                  );
                                })}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold">
                {editingId ? 'Chỉnh sửa tuyển tập' : 'Tạo tuyển tập mới'}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tên tuyển tập *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="VD: Không Gia Đình"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="Mô tả ngắn về tuyển tập..."
                />
              </div>
              {!editingId && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Các phần</label>
                  {parts.map((p, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={p}
                        onChange={(e) => {
                          const newParts = [...parts];
                          newParts[i] = e.target.value;
                          setParts(newParts);
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder={`Phần ${i + 1}`}
                      />
                      {parts.length > 1 && (
                        <button
                          onClick={() => setParts(parts.filter((_, j) => j !== i))}
                          className="px-2 text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setParts([...parts, ''])}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Thêm phần
                  </button>
                </div>
              )}
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!title || saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
