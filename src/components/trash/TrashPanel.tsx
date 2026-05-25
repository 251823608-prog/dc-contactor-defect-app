import { useStore } from '../../store/useStore';
import { Trash2, Undo2, X, Folder, FileText } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function TrashPanel() {
  const trash = useStore((s) => s.trash);
  const isTrashOpen = useStore((s) => s.isTrashOpen);
  const setTrashOpen = useStore((s) => s.setTrashOpen);
  const restoreFromTrash = useStore((s) => s.restoreFromTrash);
  const permanentlyDelete = useStore((s) => s.permanentlyDelete);

  if (!isTrashOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={() => setTrashOpen(false)} />
      <div className="relative w-80 bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-sm text-slate-800">回收站</h3>
            {trash.length > 0 && (
              <span className="bg-slate-100 text-xs px-1.5 py-0.5 rounded-full">{trash.length}</span>
            )}
          </div>
          <button
            onClick={() => setTrashOpen(false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {trash.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Trash2 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">回收站为空</p>
            </div>
          ) : (
            <div className="py-2">
              {trash.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 group"
                >
                  {item.itemType === 'FOLDER' ? (
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{item.originalName}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(item.deletedAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 rounded hover:bg-green-50 text-green-600"
                      title="恢复"
                      onClick={() => restoreFromTrash(item.id)}
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-red-50 text-red-500"
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

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
          回收站中的内容 30 天后自动清除
        </div>
      </div>
    </div>
  );
}
