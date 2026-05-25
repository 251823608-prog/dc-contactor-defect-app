import { useState, useRef } from 'react';
import { ChevronRight, Folder, FolderOpen, FileText, Plus, MoreHorizontal } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import type { Folder as FolderType } from '../../types';

interface FolderTreeProps {
  parentId: string | null;
  depth?: number;
  onItemClick?: () => void;
}

export function FolderTree({ parentId, depth = 0, onItemClick }: FolderTreeProps) {
  const folders = useStore((s) => s.folders);
  const records = useStore((s) => s.records);
  const selectedFolderId = useStore((s) => s.selectedFolderId);
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const setSelectedFolder = useStore((s) => s.setSelectedFolder);
  const setSelectedRecord = useStore((s) => s.setSelectedRecord);
  const createFolder = useStore((s) => s.createFolder);
  const deleteFolder = useStore((s) => s.deleteFolder);
  const renameFolder = useStore((s) => s.renameFolder);
  const createRecord = useStore((s) => s.createRecord);

  const childFolders = folders
    .filter((f) => f.parentId === parentId && !f.isTemplateFolder)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const childRecords = records.filter(
    (r) => r.folderId === parentId && !r.isTemplate && !r.isArchived
  );

  return (
    <div>
      {childFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          depth={depth}
          isSelected={selectedFolderId === folder.id}
          onSelect={() => { setSelectedFolder(folder.id); onItemClick?.(); }}
          onCreateFolder={(name) => createFolder(name, folder.id)}
          onDelete={() => deleteFolder(folder.id)}
          onRename={(name) => renameFolder(folder.id, name)}
          onCreateRecord={() => { createRecord(folder.id); onItemClick?.(); }}
          onItemClick={onItemClick}
        />
      ))}
      {childRecords.map((record) => (
        <div
          key={record.id}
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors',
            selectedRecordId === record.id
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          style={{ paddingLeft: `${12 + depth * 16 + 24}px` }}
          onClick={() => { setSelectedRecord(record.id); onItemClick?.(); }}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate text-xs">{record.title}</span>
        </div>
      ))}
    </div>
  );
}

function FolderItem({
  folder,
  depth,
  isSelected,
  onSelect,
  onCreateFolder,
  onDelete,
  onRename,
  onCreateRecord,
  onItemClick,
}: {
  folder: FolderType;
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
  onCreateFolder: (name: string) => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onCreateRecord: () => void;
  onItemClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const moreRef = useRef<HTMLButtonElement>(null);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = moreRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ x: rect.right - 8, y: rect.bottom + 4 });
    }
    setMenuOpen(!menuOpen);
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer text-sm transition-colors',
          isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={onSelect}
      >
        <button
          className="p-0.5 rounded hover:bg-slate-200/60 shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          <ChevronRight
            className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', expanded && 'rotate-90')}
          />
        </button>

        {expanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-amber-500" />
        )}

        {editing ? (
          <input
            className="flex-1 text-xs bg-white border border-blue-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
            value={editName}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(editName); setEditing(false); }
              if (e.key === 'Escape') { setEditName(folder.name); setEditing(false); }
            }}
            onBlur={() => { onRename(editName); setEditing(false); }}
            onChange={(e) => setEditName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-xs font-medium">{folder.name}</span>
        )}

        {/* Hover action buttons */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-0.5 rounded hover:bg-slate-200"
            title="新建记录"
            onClick={(e) => { e.stopPropagation(); onCreateRecord(); }}
          >
            <Plus className="w-3 h-3 text-slate-500" />
          </button>
          <button
            ref={moreRef}
            className="p-0.5 rounded hover:bg-slate-200"
            title="更多"
            onClick={handleMenuToggle}
          >
            <MoreHorizontal className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Children — recursive */}
      {expanded && (
        <FolderTree parentId={folder.id} depth={depth + 1} onItemClick={onItemClick} />
      )}

      {/* Context menu — rendered at trigger position */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs min-w-[130px]"
            style={{ left: menuPos.x, top: menuPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50"
              onClick={() => { setEditing(true); setMenuOpen(false); }}
            >
              重命名
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50"
              onClick={() => { onCreateFolder('新建子文件夹'); setMenuOpen(false); }}
            >
              新建子文件夹
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
              onClick={() => { onDelete(); setMenuOpen(false); }}
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
