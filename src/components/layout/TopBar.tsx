import { Search, Sparkles, HelpCircle, Settings, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useStore } from '../../store/useStore';

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);

  return (
    <header className="h-12 bg-white border-b border-slate-200 flex items-center px-3 md:px-4 gap-2 md:gap-3 shrink-0">
      {/* Mobile menu button */}
      <button
        className="mobile-only p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo & Title */}
      <div className="flex items-center gap-2 md:gap-2.5">
        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white text-sm font-bold">
          DC
        </div>
        <h1 className="text-xs md:text-sm font-semibold text-slate-800 whitespace-nowrap">
          <span className="hidden md:inline">直流接触器不良品处理系统</span>
          <span className="md:hidden">不良品处理</span>
        </h1>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-lg relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="搜索..."
          className="pl-9 h-8 text-sm bg-slate-50 border-slate-200 focus:bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Right actions - desktop only */}
      <div className="desktop-only flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
          <Sparkles className="w-4 h-4 mr-1" />
          AI 助手
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
