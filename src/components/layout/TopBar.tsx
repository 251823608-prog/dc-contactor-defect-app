import { useState, useRef, useEffect } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { RecordItem } from '../../types';

function useUniqueValues(records: RecordItem[]) {
  const active = records.filter((r) => !r.isTemplate);
  const models = [...new Set(active.map((r) => r.productModel).filter(Boolean))].sort();
  const stations = [...new Set(active.map((r) => r.processStation).filter(Boolean))].sort();
  const defects = [...new Set(active.map((r) => r.defectCategory).filter(Boolean))].sort();
  const orders = [...new Set(active.map((r) => r.workOrderNumber).filter(Boolean))].sort();
  return { models, stations, defects, orders };
}

const SECTION_LABELS: Record<string, string> = {
  models: '产品型号',
  stations: '工序',
  defects: '缺陷分类',
  orders: '工单号',
};

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const records = useStore((s) => s.records);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { models, stations, defects, orders } = useUniqueValues(records);

  const sections: { key: string; values: string[] }[] = [
    { key: 'models', values: models },
    { key: 'stations', values: stations },
    { key: 'defects', values: defects },
    { key: 'orders', values: orders },
  ].filter((s) => s.values.length > 0);

  const showDropdown = focused && sections.length > 0;

  // Parse current query into individual tags for visual feedback
  const activeTags = searchQuery ? searchQuery.split(/\s+/).filter(Boolean) : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addTag = (value: string) => {
    if (activeTags.includes(value)) return; // already selected
    const next = [...activeTags, value].join(' ');
    setSearchQuery(next);
  };

  const removeTag = (tag: string) => {
    const next = activeTags.filter((t) => t !== tag).join(' ');
    setSearchQuery(next);
  };

  const isTagSelected = (value: string) => activeTags.includes(value);

  return (
    <header className="h-11 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0">
      <button
        className="mobile-only p-1 -ml-1 text-slate-600 hover:text-slate-800 rounded-md"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white text-[11px] font-bold">D</div>
        <span className="text-[13px] font-semibold text-slate-700 whitespace-nowrap">
          <span className="hidden md:inline">不良品处理系统</span>
          <span className="md:hidden">不良品处理</span>
        </span>
      </div>

      <div ref={containerRef} className="flex-1 max-w-lg relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 z-10" />
          <input
            placeholder={activeTags.length > 0 ? '' : '搜索型号、工序、缺陷、工单...'}
            className="w-full h-8 pl-9 pr-8 text-[13px] bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all placeholder:text-slate-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setFocused(true)}
          />
          {searchQuery && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active filter tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {activeTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {tag}
                <button className="text-slate-400 hover:text-slate-600" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
            {activeTags.length > 1 && (
              <button
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
                onClick={() => setSearchQuery('')}
              >
                清除全部
              </button>
            )}
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-slate-100 shadow-lg z-30 py-3 max-h-72 overflow-y-auto min-w-[320px]">
            {sections.map(({ key, values }) => (
              <div key={key} className="px-3 mb-2 last:mb-0">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{SECTION_LABELS[key]}</div>
                <div className="flex flex-wrap gap-1">
                  {values.slice(0, 15).map((v) => {
                    const selected = isTagSelected(v);
                    return (
                      <button
                        key={v}
                        className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                          selected
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-800'
                        }`}
                        onClick={() => addTag(v)}
                      >
                        {v}
                      </button>
                    );
                  })}
                  {values.length > 15 && (
                    <span className="text-[10px] text-slate-300 px-2 py-1 self-center">+{values.length - 15}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
