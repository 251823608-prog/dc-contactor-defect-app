import { useStore } from '../../store/useStore';
import { FileText, FolderOpen } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { getSeverityInfo, getDispositionLabel } from '../../lib/constants';

export function RecordList() {
  const allRecords = useStore((s) => s.records);
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const setSelectedRecord = useStore((s) => s.setSelectedRecord);
  const selectedFolderId = useStore((s) => s.selectedFolderId);
  const folders = useStore((s) => s.folders);
  const searchQuery = useStore((s) => s.searchQuery);

  // Compute breadcrumb path
  const folderPath: { name: string }[] = [];
  let current = selectedFolderId ? folders.find((f) => f.id === selectedFolderId) : undefined;
  while (current) {
    folderPath.unshift(current);
    current = folders.find((f) => f.id === current!.parentId);
  }
  const breadcrumb = folderPath.map((f) => f.name).join(' › ');

  // Compute filtered records in render, not in selector
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{breadcrumb || '全部记录'}</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            {searchQuery ? `搜索结果 (${records.length})` : `记录列表 (${records.length})`}
          </h2>
        </div>
      </div>

      {/* Table - desktop */}
      <div className="flex-1 overflow-auto desktop-only">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <FileText className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">暂无记录</p>
            <p className="text-xs mt-0.5">点击左侧"新建记录"开始</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 sticky top-0">
                <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">标题</th>
                <th className="text-left px-2 py-2 font-medium text-slate-500 text-xs w-36">编号</th>
                <th className="text-left px-2 py-2 font-medium text-slate-500 text-xs w-24">日期</th>
                <th className="text-left px-2 py-2 font-medium text-slate-500 text-xs w-24">产品型号</th>
                <th className="text-left px-2 py-2 font-medium text-slate-500 text-xs w-28">缺陷分类</th>
                <th className="text-center px-2 py-2 font-medium text-slate-500 text-xs w-16">严重程度</th>
                <th className="text-center px-2 py-2 font-medium text-slate-500 text-xs w-20">处理决策</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const severity = getSeverityInfo(r.severity);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      'border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50',
                      selectedRecordId === r.id && 'bg-blue-50/70 hover:bg-blue-50/70'
                    )}
                    onClick={() => setSelectedRecord(r.id)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800 truncate max-w-xs">{r.title}</div>
                      {r.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {r.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-slate-500 font-mono">{r.recordNumber}</td>
                    <td className="px-2 py-2.5 text-xs text-slate-500">{formatDate(r.recordDate)}</td>
                    <td className="px-2 py-2.5 text-xs text-slate-600">{r.productModel || '-'}</td>
                    <td className="px-2 py-2.5 text-xs text-slate-600 truncate max-w-[160px]">{r.defectCategory || '-'}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ backgroundColor: severity.color + '18', color: severity.color }}
                      >
                        {severity.label}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-slate-600">
                      {getDispositionLabel(r.disposition)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

      {/* Card list - mobile */}
      <div className="flex-1 overflow-auto mobile-only">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <FileText className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">暂无记录</p>
            <p className="text-xs mt-0.5">点击下方"+ 新建记录"开始</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((r) => {
              const severity = getSeverityInfo(r.severity);
              return (
                <div
                  key={r.id}
                  className={cn(
                    'px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 active:bg-slate-100',
                    selectedRecordId === r.id && 'bg-blue-50/70 hover:bg-blue-50/70'
                  )}
                  onClick={() => setSelectedRecord(r.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{r.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-mono">{r.recordNumber}</span>
                        <span>·</span>
                        <span>{formatDate(r.recordDate)}</span>
                      </div>
                    </div>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                      style={{ backgroundColor: severity.color + '18', color: severity.color }}
                    >
                      {severity.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    {r.productModel && <span className="bg-slate-100 px-1.5 py-0.5 rounded">{r.productModel}</span>}
                    {r.defectCategory && <span className="bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[160px]">{r.defectCategory}</span>}
                    <span className="ml-auto">{getDispositionLabel(r.disposition)}</span>
                  </div>
                  {r.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {r.tags.slice(0, 4).map((t) => (
                        <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
