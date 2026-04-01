'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type ThemeMode = 'default' | 'dark' | 'sepia';
type LayoutMode = 'default' | 'wide';

interface SettingsState {
  theme: ThemeMode;
  fontScale: number;
  layout: LayoutMode;
}

interface SearchResultItem {
  id: string;
  type: 'series' | 'part' | 'chapter' | 'article';
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
}

const SETTINGS_KEY = 'html-reader-app-settings';
const defaultSettings: SettingsState = {
  theme: 'default',
  fontScale: 1,
  layout: 'default',
};

function getTypeLabel(type: SearchResultItem['type']) {
  switch (type) {
    case 'series':
      return '📚 Tuyển tập';
    case 'part':
      return '📖 Phần';
    case 'chapter':
      return '📄 Chương';
    default:
      return '📝 Bài viết';
  }
}

export default function AppChromeTools() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  const hideTools = pathname.startsWith('/read/');
  const isManager = ['admin', 'editor'].includes((session?.user as any)?.role || '');

  const applySettings = (nextSettings: SettingsState) => {
    const root = document.documentElement;
    root.dataset.appTheme = nextSettings.theme;
    root.dataset.appLayout = nextSettings.layout;
    root.style.setProperty('--app-font-scale', String(nextSettings.fontScale));
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SETTINGS_KEY);
      const parsed = saved ? (JSON.parse(saved) as SettingsState) : defaultSettings;
      setSettings(parsed);
      applySettings(parsed);
    } catch {
      applySettings(defaultSettings);
    }
  }, []);

  useEffect(() => {
    if (hideTools) {
      setPaletteOpen(false);
      setSettingsOpen(false);
    }
  }, [hideTools]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!hideTools) setPaletteOpen(true);
      }

      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hideTools]);

  useEffect(() => {
    if (!paletteOpen || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ query: query.trim() });
      if (isManager) params.set('scope', 'admin');
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setLoading(false);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [paletteOpen, query, isManager]);

  const updateSettings = (partial: Partial<SettingsState>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      applySettings(next);
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  };

  const groupedResults = useMemo(() => {
    const order: SearchResultItem['type'][] = ['series', 'part', 'chapter', 'article'];
    return order
      .map((type) => ({ type, items: results.filter((item) => item.type === type) }))
      .filter((group) => group.items.length > 0);
  }, [results]);

  if (hideTools) {
    return null;
  }

  return (
    <>
      <div className="fixed right-4 bottom-20 md:bottom-4 z-40 flex flex-col gap-2 md:hidden">
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          aria-label="Mở tìm kiếm nhanh"
        >
          ⌕
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-12 h-12 rounded-full bg-white text-gray-700 border shadow-lg hover:bg-gray-50"
          aria-label="Mở thiết lập app"
        >
          ⚙️
        </button>
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 md:p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border shadow-2xl overflow-hidden">
            <div className="border-b px-4 py-3">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tuyển tập, phần, chương, bài viết..."
                className="w-full bg-transparent text-sm outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">Ctrl+K hoặc Cmd+K để mở nhanh</p>
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-sm text-gray-400 text-center">Đang tìm...</div>
              ) : query.trim().length < 2 ? (
                <div className="px-4 py-8 text-sm text-gray-400 text-center">
                  Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm.
                </div>
              ) : groupedResults.length === 0 ? (
                <div className="px-4 py-8 text-sm text-gray-400 text-center">Không tìm thấy kết quả phù hợp.</div>
              ) : (
                groupedResults.map((group) => (
                  <div key={group.type} className="border-b last:border-b-0">
                    <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-gray-400 bg-gray-50">
                      {getTypeLabel(group.type)}
                    </div>
                    <div className="divide-y">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            router.push(item.href);
                            setPaletteOpen(false);
                            setQuery('');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                              <div className="text-xs text-gray-400 truncate">{item.subtitle}</div>
                            </div>
                            {item.meta && (
                              <div className="text-[11px] text-gray-300 whitespace-nowrap">{item.meta}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Tìm kiếm nhanh kiểu command palette cho toàn app.</span>
              <button onClick={() => setPaletteOpen(false)} className="hover:text-gray-600">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl border shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Thiết lập app</h2>
                <p className="text-xs text-gray-400 mt-1">Lưu trong localStorage, chỉ áp dụng cho giao diện app.</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['default', 'dark', 'sepia'] as ThemeMode[]).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateSettings({ theme })}
                      className={`px-3 py-2 rounded-lg border text-sm capitalize ${
                        settings.theme === theme
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cỡ chữ app: {Math.round(settings.fontScale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.9"
                  max="1.15"
                  step="0.05"
                  value={settings.fontScale}
                  onChange={(event) =>
                    updateSettings({ fontScale: parseFloat(event.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bề rộng giao diện</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['default', 'wide'] as LayoutMode[]).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => updateSettings({ layout })}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        settings.layout === layout
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {layout === 'default' ? 'Mặc định' : 'Rộng hơn'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t flex justify-between gap-2">
              <button
                onClick={resetSettings}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}