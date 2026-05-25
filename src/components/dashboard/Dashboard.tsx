import { useStore } from '../../store/useStore';
import { SEVERITY_OPTIONS } from '../../lib/constants';
import type { RecordItem } from '../../types';

function countBy<T extends string>(records: RecordItem[], fn: (r: RecordItem) => T): Map<T, number> {
  const map = new Map<T, number>();
  for (const r of records) {
    const key = fn(r);
    if (key) map.set(key, (map.get(key) || 0) + 1);
  }
  return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
}

function BarChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-[12px]">
          <div className="w-28 text-right text-slate-500 truncate" title={d.label}>{d.label}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: d.color, opacity: 0.85 }}
            />
          </div>
          <div className="w-8 text-slate-400 font-medium text-right">{d.count}</div>
        </div>
      ))}
      {data.length > 8 && (
        <p className="text-[11px] text-slate-300 pl-32">+{data.length - 8} 项</p>
      )}
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

  const defectCounts = countBy(records, (r) => {
    const parts = r.defectCategory.split('/');
    return parts[0] || r.defectCategory;
  });

  const categoryColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#f59e0b', '#3b82f6', '#64748b'];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
      <h2 className="text-[18px] font-bold text-slate-800 mb-6">统计概览</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="text-[28px] font-bold text-slate-800">{totalRecords}</div>
          <div className="text-[12px] text-slate-400 mt-1">记录总数</div>
        </div>
        {SEVERITY_OPTIONS.map((s) => {
          const count = severityCounts.get(s.value) || 0;
          return (
            <div key={s.value} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="text-[28px] font-bold" style={{ color: s.color }}>{count}</div>
              <div className="text-[12px] text-slate-400 mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Defect category */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-5">缺陷类别分布</h3>
          <BarChart
            data={[...defectCounts.entries()].map(([label, count], i) => ({
              label: label || '未分类',
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>

        {/* Product model */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-5">产品型号分布</h3>
          <BarChart
            data={[...modelCounts.entries()].map(([label, count], i) => ({
              label: label || '未指定',
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>

        {/* Process station */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-5">工序不良分布</h3>
          <BarChart
            data={[...stationCounts.entries()].map(([label, count], i) => ({
              label: label || '未指定',
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>

        {/* Disposition */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-5">处理决策分布</h3>
          <BarChart
            data={[...dispositionCounts.entries()].map(([label, count], i) => ({
              label,
              count,
              color: categoryColors[i % categoryColors.length],
            }))}
          />
        </div>
      </div>
    </div>
  );
}
