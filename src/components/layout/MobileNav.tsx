import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { FileText, BarChart3, BookOpen, FolderOpen } from 'lucide-react';
import type { MainView } from '../../types';

const tabs: { key: MainView; label: string; icon: React.ReactNode }[] = [
  { key: 'records', label: '记录', icon: <FileText className="w-5 h-5" /> },
  { key: 'dashboard', label: '统计', icon: <BarChart3 className="w-5 h-5" /> },
  { key: 'knowledge', label: '知识库', icon: <BookOpen className="w-5 h-5" /> },
];

export function MobileNav() {
  const mainView = useStore((s) => s.mainView);
  const setMainView = useStore((s) => s.setMainView);
  const setTrashOpen = useStore((s) => s.setTrashOpen);
  const isTrashOpen = useStore((s) => s.isTrashOpen);
  const selectedRecordId = useStore((s) => s.selectedRecordId);

  return (
    <nav className="mobile-only fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              mainView === tab.key ? 'text-blue-600' : 'text-slate-400'
            )}
            onClick={() => setMainView(tab.key)}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}

        {/* Folder menu */}
        {!selectedRecordId && mainView === 'records' && (
          <button
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              isTrashOpen ? 'text-red-500' : 'text-slate-400'
            )}
            onClick={() => setTrashOpen(!isTrashOpen)}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">回收站</span>
          </button>
        )}

        {selectedRecordId && mainView === 'records' && (
          <button
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-slate-400"
            onClick={() => useStore.getState().setSelectedRecord(null)}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">返回</span>
          </button>
        )}
      </div>
    </nav>
  );
}
