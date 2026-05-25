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
import { FileText, BarChart3, BookOpen, X, Plus, SlidersHorizontal } from 'lucide-react';
import type { MainView } from '../../types';
import { BarcodeScanner } from '../scanner/BarcodeScanner';

const tabs: { key: MainView; label: string; icon: React.ReactNode }[] = [
  { key: 'records', label: '记录', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'dashboard', label: '统计', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: 'knowledge', label: '知识库', icon: <BookOpen className="w-3.5 h-3.5" /> },
];

export function AppShell() {
  const initialized = useStore((s) => s.initialized);
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const mainView = useStore((s) => s.mainView);
  const setMainView = useStore((s) => s.setMainView);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [mobileMetaOpen, setMobileMetaOpen] = useState(false);

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">D</div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-[13px] font-semibold text-slate-700">导航</span>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50"
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

      {/* Desktop tabs */}
      <div className="desktop-only flex items-center px-4 bg-white border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors border-b-[1.5px] -mb-[1px]',
              mainView === tab.key
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            )}
            onClick={() => setMainView(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="desktop-only">
          {mainView === 'records' && <Sidebar />}
        </div>

        {/* Main content */}
        {mainView === 'records' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Record list - desktop */}
            <div className="w-[420px] min-w-[300px] border-r border-slate-100 bg-white overflow-hidden flex-col desktop-only">
              <RecordList />
            </div>

            {/* Record list - mobile */}
            {!selectedRecordId && (
              <div className="flex-1 bg-white overflow-hidden flex flex-col mobile-only">
                <RecordList />
              </div>
            )}

            {/* Editor */}
            <div className={cn(
              'flex-1 overflow-hidden',
              !selectedRecordId && 'hidden md:flex'
            )}>
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Editor onOpenMeta={() => setMobileMetaOpen(true)} />
                </div>
                {/* Desktop: RecordMeta always visible; Mobile: hidden, use slideover */}
                <div className="hidden md:block">{selectedRecordId && <RecordMeta />}</div>
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

      {/* Mobile FAB — new record */}
      {mainView === 'records' && !selectedRecordId && (
        <button
          className="mobile-only fixed bottom-20 right-4 z-30 w-12 h-12 bg-slate-800 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-slate-700 active:bg-slate-900 transition-colors"
          onClick={() => {
            const state = useStore.getState();
            let folderId = state.selectedFolderId;
            if (!folderId && state.folders.length > 0) folderId = state.folders[0].id;
            if (folderId) state.createRecord(folderId);
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {scanning && (
        <BarcodeScanner
          onScan={(data) => {
            setScanning(false);
            const state = useStore.getState();
            let folderId = state.selectedFolderId;
            if (!folderId && state.folders.length > 0) folderId = state.folders[0].id;
            if (folderId) {
              const id = state.createRecord(folderId);
              state.updateRecord(id, {
                productModel: data.productModel,
                workOrderNumber: data.workOrderNumber,
                recordDate: data.recordDate,
                title: [data.workOrderNumber, data.productModel, data.recordDate].filter(Boolean).join(' '),
              });
            }
          }}
          onClose={() => setScanning(false)}
        />
      )}

      {/* Mobile properties slideover */}
      {mobileMetaOpen && selectedRecordId && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMetaOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span className="text-[13px] font-semibold text-slate-700">属性</span>
              </div>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                onClick={() => setMobileMetaOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RecordMeta />
            </div>
          </div>
        </div>
      )}

      <TrashPanel />
      <MobileNav onScanClick={() => setScanning(true)} />
    </div>
  );
}
