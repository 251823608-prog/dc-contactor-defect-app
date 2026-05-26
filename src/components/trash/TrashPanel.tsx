import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Trash2, Undo2, X, Folder, FileText, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function TrashPanel() {
  const trash = useStore((s) => s.trash);
  const isTrashOpen = useStore((s) => s.isTrashOpen);
  const setTrashOpen = useStore((s) => s.setTrashOpen);
  const restoreFromTrash = useStore((s) => s.restoreFromTrash);
  const permanentlyDelete = useStore((s) => s.permanentlyDelete);
  const clearAllTrash = useStore((s) => s.clearAllTrash);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = () => {
    clearAllTrash();
    setShowClearConfirm(false);
  };

  if (!isTrashOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={() => setTrashOpen(false)} />
      <div className="relative w-80 bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-[14px] text-slate-800">回收站</h3>
            {trash.length > 0 && (
              <span className="bg-slate-50 text-slate-400 text-[11px] px-1.5 py-0.5 rounded-full font-medium">{trash.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {trash.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-2.5 py-1 text-[11px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                清空
              </button>
            )}
            <button
              onClick={() => setTrashOpen(false)}
              className="p-1 rounded-md hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {trash.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-medium">回收站为空</p>
            </div>
          ) : (
            <div className="py-1">
              {trash.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50/50 group transition-colors"
                >
                  {item.itemType === 'FOLDER' ? (
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 truncate">{item.originalName}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{formatDateTime(item.deletedAt)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
                      title="恢复"
                      onClick={() => restoreFromTrash(item.id)}
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                      title="彻底删除"
                      onClick={() => permanentlyDelete(item.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-slate-50 text-[10px] text-slate-300">
          回收站中的内容 30 天后自动清除
        </div>
      </div>

      {/* Clear all confirmation dialog */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 mx-4 w-full max-w-[260px]">
            <div className="flex items-center gap-2 text-amber-500 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-[14px] text-slate-800">确认清空</span>
            </div>
            <p className="text-[13px] text-slate-500 mb-4">
              将永久删除回收站中的 <span className="font-semibold text-slate-700">{trash.length}</span> 个项目，此操作不可撤销。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 text-[12px] font-medium text-slate-500 hover:bg-slate-50 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
