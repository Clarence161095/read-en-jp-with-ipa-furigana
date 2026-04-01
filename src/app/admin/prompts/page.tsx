'use client';

import { useEffect, useState, useMemo } from 'react';

interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPromptsPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Use/fill state
  const [usingTemplate, setUsingTemplate] = useState<PromptTemplate | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const fetchTemplates = () => {
    fetch('/api/prompt-templates')
      .then((r) => r.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Extract {{placeholders}} from content
  const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(2, -2).trim()))];
  };

  // Placeholders for the template being used
  const activePlaceholders = useMemo(() => {
    if (!usingTemplate) return [];
    return extractPlaceholders(usingTemplate.content);
  }, [usingTemplate]);

  // Build final prompt with placeholders replaced
  const filledContent = useMemo(() => {
    if (!usingTemplate) return '';
    let result = usingTemplate.content;
    for (const key of activePlaceholders) {
      const value = placeholderValues[key] || `{{${key}}}`;
      result = result.replaceAll(`{{${key}}}`, value);
    }
    return result;
  }, [usingTemplate, placeholderValues, activePlaceholders]);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setShowEditor(true);
  };

  const openEdit = (t: PromptTemplate) => {
    setEditingId(t.id);
    setTitle(t.title);
    setContent(t.content);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!title || !content) return;
    setSaving(true);

    if (editingId) {
      await fetch(`/api/prompt-templates/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
    } else {
      await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
    }

    setSaving(false);
    setShowEditor(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa prompt template này?')) return;
    await fetch(`/api/prompt-templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  const openUse = (t: PromptTemplate) => {
    setUsingTemplate(t);
    setPlaceholderValues({});
    setCopied(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(filledContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">💬 Prompt Templates</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + Tạo template
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse border">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">💬</div>
          <p>Chưa có prompt template nào</p>
          <p className="text-sm mt-1">
            Tạo template với <code className="bg-gray-100 px-1 rounded">{'{{placeholder}}'}</code> để dùng lại
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const placeholders = extractPlaceholders(t.content);
            return (
              <div key={t.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1">{t.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 font-mono whitespace-pre-wrap">
                      {t.content.slice(0, 200)}
                      {t.content.length > 200 ? '...' : ''}
                    </p>
                    {placeholders.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {placeholders.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200"
                          >
                            {`{{${p}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-300 mt-2">
                      Cập nhật: {new Date(t.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openUse(t)}
                      className="px-3 py-1.5 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded-lg"
                      title="Sử dụng"
                    >
                      ▶ Dùng
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      className="px-2 py-1.5 text-xs hover:bg-blue-50 rounded-lg"
                      title="Sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-2 py-1.5 text-xs hover:bg-red-50 rounded-lg"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold">
                {editingId ? 'Chỉnh sửa template' : 'Tạo template mới'}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tên template *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="VD: Dịch chương truyện"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nội dung * <span className="text-gray-400 font-normal">(dùng {'{{tên}}'} cho placeholder)</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  rows={12}
                  placeholder={`VD: Dịch đoạn văn sau sang tiếng Việt:\n\n{{nội_dung}}\n\nYêu cầu:\n- Dịch tự nhiên\n- Giữ nguyên tên riêng`}
                />
                {extractPlaceholders(content).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-gray-400 mr-1">Placeholders:</span>
                    {extractPlaceholders(content).map((p) => (
                      <span
                        key={p}
                        className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200"
                      >
                        {`{{${p}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!title || !content || saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Use/Fill Modal */}
      {usingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">▶ {usingTemplate.title}</h2>
              <button
                onClick={() => setUsingTemplate(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* Placeholder inputs */}
              {activePlaceholders.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">📝 Điền placeholder</h3>
                  <div className="space-y-3">
                    {activePlaceholders.map((p) => (
                      <div key={p}>
                        <label className="text-xs font-medium text-amber-600 block mb-1">
                          {`{{${p}}}`}
                        </label>
                        <textarea
                          value={placeholderValues[p] || ''}
                          onChange={(e) =>
                            setPlaceholderValues((prev) => ({ ...prev, [p]: e.target.value }))
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm font-mono border-amber-200 focus:ring-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2"
                          rows={2}
                          placeholder={`Nhập giá trị cho ${p}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">👁 Kết quả</h3>
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono break-words">
                    {filledContent}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => setUsingTemplate(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? '✓ Đã copy!' : '📋 Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
