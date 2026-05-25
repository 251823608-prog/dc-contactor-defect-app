import { useStore } from '../../store/useStore';
import { SEVERITY_OPTIONS } from '../../lib/constants';
import type { RecordItem } from '../../types';

// ── Helper: count records by key ──
function countBy<T extends string>(records: RecordItem[], fn: (r: RecordItem) => T): Map<T, number> {
  const map = new Map<T, number>();
  for (const r of records) {
    const key = fn(r);
    if (key) map.set(key, (map.get(key) || 0) + 1);
  }
  return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
}

// ── Simple horizontal bar chart component ──
function BarChart({ data }: { data: { label: string; count: number; color: string }[]; maxWidth?: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <div className="w-32 text-right text-slate-600 truncate" title={d.label}>{d.label}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
          <div className="w-8 text-slate-500 font-medium">{d.count}</div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const allRecords = useStore((s) => s.records);
  const records = allRecords.filter((r) => !r.isTemplate);

  const totalRecords = records.length;
  const severityCounts = countBy(records, (r) => r.severity);
  const modelCounts = countBy(records, (r) => r.productModel);
  const stationCounts = countBy(records, (r) => r.processStation);
  const dispositionCounts = countBy(records, (r) => r.disposition);

  // Defect category distribution
  const defectCounts = countBy(records, (r) => {
    // Extract top-level category: "接触系统缺陷/接触电阻超标" → "接触系统缺陷"
    const parts = r.defectCategory.split('/');
    return parts[0] || r.defectCategory;
  });

  // Extract keywords from plainText as "常见根因"
  const keywordMap = new Map<string, number>();
  const rootCauseKeywords = [
    '弹簧', '线圈', '触点', '灭弧', '绝缘', '温升', '湿度', '力矩',
    '模具', '夹具', '张力', '清洗', '氧化', '供应商', '材料', '装配',
    '设计', '混料', '参数', '磨损',
  ];
  for (const r of records) {
    for (const kw of rootCauseKeywords) {
      if (r.plainText.includes(kw)) {
        keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
      }
    }
  }
  const topKeywords = [...keywordMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Bar chart colors
  const categoryColors = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#CA8A04', '#0891B2', '#4F46E5'];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-5">不良品统计概览</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
          <div className="text-xs text-slate-500 mt-0.5">不良品记录总数</div>
        </div>
        {SEVERITY_OPTIONS.map((s) => {
          const count = severityCounts.get(s.value) || 0;
          return (
            <div key={s.value} className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{count}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}缺陷</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Defect category distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">缺陷类别分布</h3>
          <BarChart
            maxWidth={400}
            data={[...defectCounts.entries()].map(([label, count], i) => ({
              label,
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>

        {/* Product model distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">产品型号分布</h3>
          <BarChart
            maxWidth={400}
            data={[...modelCounts.entries()].map(([label, count], i) => ({
              label: label || '未指定',
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>

        {/* Process station distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">工序不良分布</h3>
          <BarChart
            maxWidth={400}
            data={[...stationCounts.entries()].map(([label, count], i) => ({
              label: label || '未指定',
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>

        {/* Disposition distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">处理决策分布</h3>
          <BarChart
            maxWidth={400}
            data={[...dispositionCounts.entries()].map(([label, count], i) => ({
              label,
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>

        {/* Common root causes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">🔍 常见根因关键词（基于记录正文提取）</h3>
          {topKeywords.length === 0 ? (
            <p className="text-sm text-slate-400">暂无足够数据</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(([kw, count]) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `rgba(37, 99, 235, ${Math.max(0.08, count / Math.max(...topKeywords.map((x) => x[1])) * 0.3)})`,
                    color: '#1E40AF',
                  }}
                >
                  {kw}
                  <span className="text-xs opacity-60">({count})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
