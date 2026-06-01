// Phase 1 diagnostics — collects evidence about data flow
// Will be removed after root cause is identified

const LOG_KEY = 'dc-diag-log';
const MAX_ENTRIES = 50;

interface DiagEntry {
  ts: string;
  msg: string;
}

export function diagLog(msg: string): void {
  const entry: DiagEntry = { ts: new Date().toISOString(), msg };
  console.log(`[DIAG] ${entry.ts} ${msg}`);
  try {
    const existing: DiagEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    existing.push(entry);
    if (existing.length > MAX_ENTRIES) existing.splice(0, existing.length - MAX_ENTRIES);
    localStorage.setItem(LOG_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

export function getDiagLog(): DiagEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}
