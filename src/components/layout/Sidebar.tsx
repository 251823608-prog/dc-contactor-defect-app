import { Plus, FolderPlus, Trash2, FileText } from 'lucide-react';
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
  const records = useStore((s) => s.records);
  const templates = records.filter((r) => r.isTemplate);
  const trashCount = useStore((s) => s.trash.length);
  const isTrashOpen = useStore((s) => s.isTrashOpen);
  const setTrashOpen = useStore((s) => s.setTrashOpen);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleNewRecord = (templateId?: string) => {
    const currentFolderId = useStore.getState().selectedFolderId;
    if (currentFolderId) {
      createRecord(currentFolderId, templateId);
      setShowNewRecord(false);
    }
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Action buttons */}
      <div className="p-3 space-y-1.5 border-b border-slate-100">
        <Button
          className="w-full justify-start text-sm"
          size="sm"
          onClick={() => { const id = useStore.getState().selectedFolderId; if (id) { createRecord(id); } else { setShowNewRecord(true); } onItemClick?.(); }}
        >
          <Plus className="w-4 h-4 mr-2" />
          新建记录
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm"
          size="sm"
          onClick={() => { setShowNewFolder(true); onItemClick?.(); }}
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          新建文件夹
        </Button>
      </div>

      {/* Folder tree */}
      <div className="flex-1 overflow-y-auto py-1">
        <FolderTree parentId={null} onItemClick={onItemClick} />
      </div>

      {/* Trash */}
      <div className="border-t border-slate-100 p-1.5">
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
            isTrashOpen ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-100'
          )}
          onClick={() => setTrashOpen(!isTrashOpen)}
        >
          <Trash2 className="w-4 h-4" />
          <span>回收站</span>
          {trashCount > 0 && (
            <span className="ml-auto bg-slate-200 text-xs px-1.5 py-0.5 rounded-full">
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* New Folder Dialog */}
      <Dialog
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        title="新建文件夹"
      >
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
            <Button variant="ghost" size="sm" onClick={() => setShowNewFolder(false)}>
              取消
            </Button>
            <Button
              size="sm"
              disabled={!newFolderName.trim()}
              onClick={() => {
                createFolder(newFolderName.trim(), null);
                setNewFolderName('');
                setShowNewFolder(false);
              }}
            >
              创建
            </Button>
          </div>
        </div>
      </Dialog>

      {/* New Record Dialog - template selection */}
      <Dialog
        open={showNewRecord}
        onClose={() => setShowNewRecord(false)}
        title="新建记录"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">选择创建方式：</p>
          <button
            className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            onClick={() => handleNewRecord()}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-sm">空白记录</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">创建一个空的记录文档</p>
          </button>
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              onClick={() => handleNewRecord(tpl.id)}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">{tpl.title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">使用此模板快速创建</p>
            </button>
          ))}
        </div>
      </Dialog>
    </aside>
  );
}
