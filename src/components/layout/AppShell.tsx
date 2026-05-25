import { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { RecordList } from '../record/RecordList';
import { Editor } from '../editor/Editor';
import { RecordMeta } from '../record/RecordMeta';
import { TrashPanel } from '../trash/TrashPanel';
import { Dashboard } from '../dashboard/Dashboard';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { FileText, BarChart3, BookOpen, X, Plus } from 'lucide-react';
import type { MainView } from '../../types';

const tabs: { key: MainView; label: string; icon: React.ReactNode }[] = [
  { key: 'records', label: '记录列表', icon: <FileText className="w-4 h-4" /> },
  { key: 'dashboard', label: '统计概览', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'knowledge', label: '知识库', icon: <BookOpen className="w-4 h-4" /> },
];

export function AppShell() {
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const mainView = useStore((s) => s.mainView);
  const setMainView = useStore((s) => s.setMainView);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-700">导航菜单</span>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onItemClick={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop navigation tabs */}
      <div className="desktop-only flex items-center gap-0 px-4 bg-white border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]',
              mainView === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
            onClick={() => setMainView(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden pb-0 md:pb-0">
        {/* Sidebar - desktop only, records view only */}
        <div className="desktop-only">
          {mainView === 'records' && <Sidebar />}
        </div>

        {/* Main content */}
        {mainView === 'records' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Record list - desktop */}
            <div className="w-[480px] min-w-[320px] border-r border-slate-200 bg-white overflow-hidden flex-col desktop-only">
              <RecordList />
            </div>

            {/* Record list - mobile (when no record selected) */}
            {!selectedRecordId && (
              <div className="flex-1 bg-white overflow-hidden flex flex-col mobile-only">
                <RecordList />
              </div>
            )}

            {/* Editor - always on desktop, only when record selected on mobile */}
            <div className={cn(
              'flex-1 overflow-hidden',
              !selectedRecordId && 'hidden md:flex'
            )}>
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Editor />
                </div>
                {selectedRecordId && <RecordMeta />}
              </div>
            </div>
          </div>
        ) : mainView === 'dashboard' ? (
          <div className="flex-1 overflow-hidden">
            <Dashboard />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <KnowledgeBase />
          </div>
        )}
      </div>

      {/* Mobile FAB - create record */}
      {mainView === 'records' && !selectedRecordId && (
        <button
          className="mobile-only fixed bottom-20 right-4 z-30 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
          onClick={() => {
            const state = useStore.getState();
            let folderId = state.selectedFolderId;
            if (!folderId && state.folders.length > 0) {
              folderId = state.folders[0].id;
            }
            if (folderId) {
              state.createRecord(folderId);
            }
          }}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <TrashPanel />
      <MobileNav />
    </div>
  );
}
