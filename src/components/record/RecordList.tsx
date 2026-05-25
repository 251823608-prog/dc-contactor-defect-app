import { useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import {
  FileText, FolderOpen, Download, Trash2, X, CheckSquare, Square,
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { getSeverityInfo, getDispositionLabel, SEVERITY_OPTIONS, DISPOSITION_OPTIONS } from '../../lib/constants';
import { exportToExcel, exportToCSV, exportToWord } from '../../lib/export';
import type { Severity, Disposition } from '../../types';

export function RecordList() {
  const allRecords = useStore((s) => s.records);
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const setSelectedRecord = useStore((s) => s.setSelectedRecord);
  const selectedFolderId = useStore((s) => s.selectedFolderId);
  const folders = useStore((s) => s.folders);
  const searchQuery = useStore((s) => s.searchQuery);
  const batchUpdateRecords = useStore((s) => s.batchUpdateRecords);
  const batchDeleteRecords = useStore((s) => s.batchDeleteRecords);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);

  const folderPath: { name: string }[] = [];
  let current = selectedFolderId ? folders.find((f) => f.id === selectedFolderId) : undefined;
  while (current) {
    folderPath.unshift(current);
    current = folders.find((f) => f.id === current!.parentId);
  }
  const breadcrumb = folderPath.map((f) => f.name).join(' / ');

  const records = allRecords.filter((r) => {
    if (r.isTemplate) return false;
    if (selectedFolderId && r.folderId !== selectedFolderId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.recordNumber.toLowerCase().includes(q) ||
        r.plainText.toLowerCase().includes(q) ||
        r.productModel.toLowerCase().includes(q) ||
        r.defectCategory.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const allSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  }, [allSelected, records]);

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchSeverity = (severity: Severity) => {
    batchUpdateRecords([...selectedIds], { severity });
    clearSelection();
  };

  const handleBatchDisposition = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      batchUpdateRecords([...selectedIds], { disposition: e.target.value as Disposition });
      clearSelection();
    }
  };

  const handleBatchDelete = () => {
    if (confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？将移入回收站。`)) {
      batchDeleteRecords([...selectedIds]);
      clearSelection();
    }
  };

  const handleExportExcel = () => {
    const toExport = someSelected ? records.filter((r) => selectedIds.has(r.id)) : records;
    exportToExcel(toExport);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const toExport = someSelected ? records.filter((r) => selectedIds.has(r.id)) : records;
    exportToCSV(toExport);
    setShowExportMenu(false);
  };

  const handleExportWord = () => {
    const toExport = someSelected ? records.filter((r) => selectedIds.has(r.id)) : records;
    exportToWord(toExport);
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{breadcrumb || '全部记录'}</span>
          </div>
          <h2 className="text-[15px] font-semibold text-slate-800">
            {searchQuery ? `搜索结果 · ${records.length}` : `记录 · ${records.length}`}
            {someSelected && <span className="text-[12px] font-normal text-slate-400 ml-2">已选 {selectedIds.size} 项</span>}
          </h2>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">导出</span>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-30 min-w-[120px]">
              <button className="w-full text-left px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50" onClick={handleExportExcel}>
                导出 Excel (.xlsx)
              </button>
              <button className="w-full text-left px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50" onClick={handleExportCSV}>
                导出 CSV (.csv)
              </button>
              <button className="w-full text-left px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50" onClick={handleExportWord}>
                导出 Word (.docx)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Batch action bar */}
      {someSelected && (
        <div className="px-5 py-2 bg-slate-800 text-white flex items-center gap-3 text-[12px] shrink-0">
          <button className="text-slate-300 hover:text-white transition-colors" onClick={clearSelection}>
            <X className="w-4 h-4" />
          </button>
          <span className="font-medium">{selectedIds.size} 项已选</span>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-1">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s.value}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium border border-white/20 hover:bg-white/10 transition-colors"
                style={{ color: s.color }}
                onClick={() => handleBatchSeverity(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-white/20" />
          <select
            className="bg-white/10 border border-white/20 rounded-md px-2 py-0.5 text-[11px] outline-none cursor-pointer hover:bg-white/20 transition-colors"
            defaultValue=""
            onChange={handleBatchDisposition}
          >
            <option value="" disabled className="text-slate-800">处置...</option>
            {DISPOSITION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value} className="text-slate-800">{d.label}</option>
            ))}
          </select>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 text-red-300 hover:text-red-100 hover:bg-white/10 px-2 py-0.5 rounded-md transition-colors"
              onClick={handleBatchDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">删除</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="flex-1 overflow-auto desktop-only">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-300">
            <FileText className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-[13px]">暂无记录</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 sticky top-0 bg-white">
                <th className="w-10 px-3 py-2.5">
                  <button onClick={toggleSelectAll} className="text-slate-300 hover:text-slate-500">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide">标题</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide w-[120px]">编号</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide w-[90px]">日期</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide w-[90px]">型号</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide w-[110px]">缺陷分类</th>
                <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide w-[70px]">程度</th>
                <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide w-[70px]">决策</th>
                <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide w-[70px]">整改</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const severity = getSeverityInfo(r.severity);
                const isSelected = selectedIds.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      'border-b border-slate-50 transition-colors hover:bg-slate-50/70',
                      (selectedRecordId === r.id || isSelected) && 'bg-slate-100/70 hover:bg-slate-100/70'
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <button
                        className="text-slate-300 hover:text-slate-500"
                        onClick={(e) => { e.stopPropagation(); toggleSelect(r.id); }}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-2 py-2.5 cursor-pointer" onClick={() => setSelectedRecord(r.id)}>
                      <div className="text-[13px] font-medium text-slate-700 truncate max-w-xs">{r.title}</div>
                      {r.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {r.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-[12px] text-slate-400 font-mono cursor-pointer" onClick={() => setSelectedRecord(r.id)}>{r.recordNumber}</td>
                    <td className="px-2 py-2.5 text-[12px] text-slate-400 cursor-pointer" onClick={() => setSelectedRecord(r.id)}>{formatDate(r.recordDate)}</td>
                    <td className="px-2 py-2.5 text-[12px] text-slate-500 cursor-pointer" onClick={() => setSelectedRecord(r.id)}>{r.productModel || '-'}</td>
                    <td className="px-2 py-2.5 text-[12px] text-slate-500 truncate max-w-[110px] cursor-pointer" onClick={() => setSelectedRecord(r.id)}>{r.defectCategory || '-'}</td>
                    <td className="px-2 py-2.5 text-center cursor-pointer" onClick={() => setSelectedRecord(r.id)}>
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ backgroundColor: severity.color + '12', color: severity.color }}
                      >
                        {severity.label}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-[12px] text-slate-500 cursor-pointer" onClick={() => setSelectedRecord(r.id)}>
                      {getDispositionLabel(r.disposition)}
                    </td>
                    <td className="px-2 py-2.5 text-center cursor-pointer" onClick={() => setSelectedRecord(r.id)}>
                      {r.rectificationStatus !== 'NONE' ? (
                        <span className={cn(
                          'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium',
                          r.rectificationStatus === 'PENDING' && 'bg-amber-50 text-amber-600',
                          r.rectificationStatus === 'IN_PROGRESS' && 'bg-blue-50 text-blue-600',
                          r.rectificationStatus === 'VERIFIED' && 'bg-emerald-50 text-emerald-600',
                        )}>
                          {r.rectificationStatus === 'PENDING' && '待整改'}
                          {r.rectificationStatus === 'IN_PROGRESS' && '整改中'}
                          {r.rectificationStatus === 'VERIFIED' && '已验证'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="flex-1 overflow-auto mobile-only">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-300">
            <FileText className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-[13px]">暂无记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {records.map((r) => {
              const severity = getSeverityInfo(r.severity);
              const isSelected = selectedIds.has(r.id);
              return (
                <div
                  key={r.id}
                  className={cn(
                    'px-4 py-3 transition-colors hover:bg-slate-50 flex items-start gap-2',
                    (selectedRecordId === r.id || isSelected) && 'bg-slate-50'
                  )}
                >
                  <button
                    className="text-slate-300 hover:text-slate-500 mt-0.5 shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(r.id); }}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => setSelectedRecord(r.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-slate-800 truncate">{r.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-mono">{r.recordNumber}</span>
                          <span>{formatDate(r.recordDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {r.rectificationStatus !== 'NONE' && (
                          <span className={cn(
                            'px-1.5 py-0.5 rounded-full text-[9px] font-medium',
                            r.rectificationStatus === 'PENDING' && 'bg-amber-50 text-amber-600',
                            r.rectificationStatus === 'IN_PROGRESS' && 'bg-blue-50 text-blue-600',
                            r.rectificationStatus === 'VERIFIED' && 'bg-emerald-50 text-emerald-600',
                          )}>
                            {r.rectificationStatus === 'PENDING' && '整改'}
                            {r.rectificationStatus === 'IN_PROGRESS' && '进行'}
                            {r.rectificationStatus === 'VERIFIED' && '已验'}
                          </span>
                        )}
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                          style={{ backgroundColor: severity.color + '12', color: severity.color }}
                        >
                          {severity.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
