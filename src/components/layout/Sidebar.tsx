import { Plus, FolderPlus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { FolderTree } from '../folder/FolderTree';
import { useStore } from '../../store/useStore';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  const createFolder = useStore((s) => s.createFolder);
  const createRecord = useStore((s) => s.createRecord);
  const trashCount = useStore((s) => s.trash.length);
  const isTrashOpen = useStore((s) => s.isTrashOpen);
  const setTrashOpen = useStore((s) => s.setTrashOpen);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleNewRecord = () => {
    const state = useStore.getState();
    let id = state.selectedFolderId;
    if (!id && state.folders.length > 0) id = state.folders[0].id;
    if (id) {
      createRecord(id);
      onItemClick?.();
    }
  };

  return (
    <aside className="w-56 bg-white border-r border-slate-100 flex flex-col shrink-0">
      {/* Actions */}
      <div className="p-2.5 space-y-1 border-b border-slate-100">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          onClick={handleNewRecord}
        >
          <Plus className="w-4 h-4" />
          新建记录
        </button>
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          onClick={() => { setShowNewFolder(true); }}
        >
          <FolderPlus className="w-4 h-4" />
          新建文件夹
        </button>
      </div>

      {/* Folder tree */}
      <div className="flex-1 overflow-y-auto py-1.5">
        <FolderTree parentId={null} onItemClick={onItemClick} />
      </div>

      {/* Trash */}
      <div className="border-t border-slate-100 p-1.5">
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors',
            isTrashOpen
              ? 'bg-slate-100 text-slate-700'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          )}
          onClick={() => setTrashOpen(!isTrashOpen)}
        >
          <Trash2 className="w-4 h-4" />
          <span>回收站</span>
          {trashCount > 0 && (
            <span className="ml-auto bg-slate-200 text-slate-500 text-[11px] px-1.5 py-0.5 rounded-full font-medium">
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onClose={() => setShowNewFolder(false)} title="新建文件夹">
        <div className="space-y-3">
          <Input
            placeholder="文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newFolderName.trim()) {
                createFolder(newFolderName.trim(), null);
                setNewFolderName('');
                setShowNewFolder(false);
              }
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowNewFolder(false)}>取消</Button>
            <Button
              size="sm"
              disabled={!newFolderName.trim()}
              onClick={() => {
                createFolder(newFolderName.trim(), null);
                setNewFolderName('');
                setShowNewFolder(false);
                onItemClick?.();
              }}
            >
              创建
            </Button>
          </div>
        </div>
      </Dialog>
    </aside>
  );
}
