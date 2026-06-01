import { useState, useEffect } from 'react';
import { getDiagLog } from '../../lib/diagnostics';
import { X, ChevronUp } from 'lucide-react';

export function DiagnosticsBar() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const entries = getDiagLog();
      setLogs(entries.slice(-6).map((e) => e.msg));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasErrors = logs.some((l) => l.includes('FAILED') || l.includes('SKIPPED'));
  const hasContent = logs.length > 0;

  return (
    <>
      {!visible && (
        <button
          className={`fixed bottom-4 left-4 z-50 text-[10px] px-2 py-1 rounded-full font-mono ${
            hasErrors ? 'bg-red-500 text-white' : hasContent ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-300'
          }`}
          onClick={() => setVisible(true)}
        >
          {hasErrors ? 'DIAG: ERRORS' : hasContent ? 'DIAG: OK' : 'DIAG'}
        </button>
      )}
      {visible && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900 text-green-400 text-[11px] font-mono rounded-lg shadow-2xl max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700 sticky top-0 bg-slate-900">
            <span className="text-slate-400 text-[10px]">DIAGNOSTICS LOG</span>
            <button className="text-slate-400 hover:text-white p-0.5" onClick={() => setVisible(false)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-2 space-y-0.5">
            {logs.length === 0 ? (
              <span className="text-slate-500">No logs yet — app may not have initialized</span>
            ) : (
              logs.map((msg, i) => (
                <div
                  key={i}
                  className={msg.includes('FAILED') || msg.includes('SKIPPED') ? 'text-red-400' : 'text-green-400/80'}
                >
                  {msg}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-center py-1 border-t border-slate-700 sticky bottom-0 bg-slate-900">
            <ChevronUp className="w-3 h-3 text-slate-600" />
          </div>
        </div>
      )}
    </>
  );
}
