import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { FileText, BarChart3, BookOpen, FolderOpen, QrCode } from 'lucide-react';
import type { MainView } from '../../types';

const tabs: { key: MainView; label: string; icon: React.ReactNode }[] = [
  { key: 'records', label: '记录', icon: <FileText className="w-5 h-5" /> },
  { key: 'dashboard', label: '统计', icon: <BarChart3 className="w-5 h-5" /> },
  { key: 'knowledge', label: '知识库', icon: <BookOpen className="w-5 h-5" /> },
];

interface MobileNavProps {
  onScanClick: () => void;
}

export function MobileNav({ onScanClick }: MobileNavProps) {
  const mainView = useStore((s) => s.mainView);
  const setMainView = useStore((s) => s.setMainView);
  const setTrashOpen = useStore((s) => s.setTrashOpen);
  const isTrashOpen = useStore((s) => s.isTrashOpen);
  const selectedRecordId = useStore((s) => s.selectedRecordId);

  return (
    <nav className="mobile-only fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              mainView === tab.key ? 'text-slate-800' : 'text-slate-300'
            )}
            onClick={() => setMainView(tab.key)}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}

        {/* Scan button - prominent center action */}
        {!selectedRecordId && mainView === 'records' && (
          <button
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-slate-600 active:text-slate-800 transition-colors"
            onClick={onScanClick}
          >
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center -mt-3 shadow-lg shadow-slate-800/20">
              <QrCode className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-[10px] font-medium mt-0.5">扫码</span>
          </button>
        )}

        {!selectedRecordId && mainView === 'records' && (
          <button
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              isTrashOpen ? 'text-red-500' : 'text-slate-300'
            )}
            onClick={() => setTrashOpen(!isTrashOpen)}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">回收站</span>
          </button>
        )}

        {selectedRecordId && mainView === 'records' && (
          <button
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-slate-600 active:text-slate-800 transition-colors"
            onClick={() => useStore.getState().setSelectedRecord(null)}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">返回列表</span>
          </button>
        )}
      </div>
    </nav>
  );
}
