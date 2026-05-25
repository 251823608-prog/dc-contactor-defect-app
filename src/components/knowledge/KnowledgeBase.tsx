import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DEFECT_CATEGORIES, SEVERITY_OPTIONS, getDispositionLabel } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { RecordItem, KnowledgeEntry, Severity } from '../../types';
import {
  ChevronRight, FileText, Lightbulb, ArrowRight,
  Plus, Trash2, Edit3, Bookmark, Tag,
} from 'lucide-react';

// ── Expanded root cause patterns (~200 keywords covering full DC contactor domain) ──
const CAUSE_PATTERNS = [
  // 接触系统
  '触点', '触头', '接触电阻', '接触压力', '触点间隙', '触点熔焊', '触点烧蚀', '触点磨损',
  '触点材料', '银合金', '银氧化镉', 'AgCdO', '银氧化锡', 'AgSnO₂', '触点粘结', '触点弹跳',
  '动触点', '静触点', '触头温升', '接触不良', '接触面积', '触点侵蚀', '触点转移',
  // 电磁系统
  '线圈', '电磁铁', '铁芯', '衔铁', '磁路', '磁轭', '电磁吸力', '剩磁', '磁滞',
  '励磁', '线圈骨架', '漆包线', '线圈温升', '线圈绝缘', '匝间短路', '层间短路',
  '线圈开路', '线圈电阻', '吸合电压', '释放电压', '保持电压', '吸合时间', '释放时间',
  '铁芯气隙', '铁芯锈蚀', '铁芯噪声', '交流声', '短路环', '铁芯卡滞',
  // 灭弧系统
  '灭弧室', '灭弧栅', '灭弧罩', '电弧', '分断', '熄弧', '吹弧', '磁吹',
  '灭弧介质', '冷却', '去离子', '弧根', '弧柱', '弧压', '燃弧时间', '过电压',
  '电弧重燃', '电弧侵蚀', '灭弧室壁', '灭弧室污染', '栅片烧损', '栅片变形',
  // 机械结构
  '传动机构', '连杆', '转轴', '轴承', '导向', '缓冲', '减震',
  '弹簧', '复位弹簧', '触头弹簧', '反力弹簧', '压簧', '扭簧', '弹性元件',
  '疲劳', '蠕变', '卡滞', '卡死', '松动', '脱落', '断裂', '变形',
  '间隙', '公差不合格', '外壳', '底座', '盖板', '紧固件', '螺栓', '螺母',
  '端子', '接线柱', '引出端', '插接件', '垫圈', '垫片',
  // 电气性能
  '绝缘电阻', '介电强度', '耐压', '击穿', '爬电距离', '电气间隙', '泄漏电流',
  '接触压降', '额定电流', '过载', '短路', '分断能力', '接通能力',
  '电寿命', '机械寿命', '动作电压', '温升', '功耗', '线圈功耗',
  '绝缘材料', '绝缘老化', '局部放电', '表面漏电',
  // 外观与工艺
  '外观划痕', '漆面', '镀层', '氧化', '锈蚀', '腐蚀', '变色', '气泡',
  '缩孔', '裂纹', '毛刺', '飞边', '标识', '标签', '铭牌', '包装',
  '清洁度', '异物', '污染', '油污',
  // 材料与来料
  '供应商', '来料检验', '批次', '批次追溯', '混料', '错料', '材料缺陷',
  '铜材', '银材', '铁材', '磁性材料', '塑料件', '注塑件', '冲压件', '机加工件',
  '热处理', '表面处理', '电镀', 'DMC', 'FR-4', 'PPS', 'PEEK', 'PI', 'Inconel',
  // 工艺制造
  '绕线', '绕线张力', '绕线排线', '线圈浸漆', '烘干', '固化',
  '铆接', '铆接力', '铆接质量', '焊接', '焊点', '虚焊', '锡焊', '电阻焊', '激光焊',
  '装配', '装配精度', '装配力矩', '对中', '定位', '夹具', '工装', '模具',
  '注塑参数', '注塑温度', '注塑压力', '保压', '冷却时间',
  '烧结', '烧结温度', '烧结时间', '清洗', '超声波清洗',
  // 测试与检验
  '测试', '检验', '调试', '校准', '校验', '老化', '老化测试', '出厂检验',
  '型式试验', '例行试验', '抽样', 'AQL', '不合格', '不良率', 'PPM',
  '首件检验', '过程检验', '最终检验', '测量', '量具', '仪器',
  '测试台', 'BOM', 'MES', 'SPC', 'CPK', 'PFMEA',
  // 设计
  '设计', '材料', '工艺参数', '防呆', 'ECN', '设计变更', 'CFD',
];

function groupByCategory(records: RecordItem[]): Map<string, RecordItem[]> {
  const map = new Map<string, RecordItem[]>();
  for (const r of records) {
    const key = r.defectCategory || '未分类';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return new Map([...map.entries()].sort((a, b) => b[1].length - a[1].length));
}

function extractCommonCauses(records: RecordItem[]): { cause: string; count: number; recordIds: string[] }[] {
  const causeMap = new Map<string, { count: number; recordIds: string[] }>();
  for (const r of records) {
    for (const pattern of CAUSE_PATTERNS) {
      if (r.plainText.includes(pattern)) {
        const existing = causeMap.get(pattern);
        if (existing) {
          existing.count++;
          existing.recordIds.push(r.id);
        } else {
          causeMap.set(pattern, { count: 1, recordIds: [r.id] });
        }
      }
    }
  }
  return [...causeMap.entries()]
    .map(([cause, data]) => ({ cause, ...data }))
    .sort((a, b) => b.count - a.count);
}

// ── Inline form for adding/editing knowledge entries ──
function KnowledgeEntryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: KnowledgeEntry;
  category?: string;
  onSave: (data: { title: string; content: string; severity: Severity; tags: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [severity, setSeverity] = useState<Severity>(initial?.severity || 'MINOR');
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-4 space-y-3">
      <input
        className="w-full text-sm font-semibold px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        placeholder="知识条目标题..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        rows={4}
        placeholder="编写经验总结、根因分析、预防措施等内容..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-wide">严重程度</span>
        <div className="flex gap-1">
          {SEVERITY_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded border transition-colors',
                severity === s.value
                  ? 'border-current'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
              )}
              style={severity === s.value ? { color: s.color, backgroundColor: s.color + '12' } : {}}
              onClick={() => setSeverity(s.value as Severity)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-wide shrink-0">标签</span>
        <div className="flex flex-wrap gap-1 flex-1">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded">
              {t}
              <button className="text-blue-400 hover:text-blue-700" onClick={() => setTags(tags.filter((x) => x !== t))}>
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          className="w-24 text-[10px] px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          placeholder="添加标签"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          disabled={!title.trim() || !content.trim()}
          onClick={() => {
            if (title.trim() && content.trim()) {
              onSave({ title: title.trim(), content: content.trim(), severity, tags });
            }
          }}
        >
          {initial ? '保存修改' : '添加条目'}
        </button>
      </div>
    </div>
  );
}

// ── Single knowledge entry card ──
function KnowledgeEntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: KnowledgeEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const severityInfo = SEVERITY_OPTIONS.find((s) => s.value === entry.severity);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 hover:border-slate-300 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <h5 className="text-sm font-semibold text-slate-800 truncate">{entry.title}</h5>
            {severityInfo && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                style={{ backgroundColor: severityInfo.color + '18', color: severityInfo.color }}
              >
                {severityInfo.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map((t) => (
                <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Tag className="w-3 h-3" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            onClick={onEdit}
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category card (expandable) ──
function CategoryCard({ categoryPath, records }: { categoryPath: string; records: RecordItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const setSelectedRecord = useStore((s) => s.setSelectedRecord);
  const setSelectedFolder = useStore((s) => s.setSelectedFolder);
  const knowledgeEntries = useStore((s) => s.knowledgeEntries);
  const addKnowledgeEntry = useStore((s) => s.addKnowledgeEntry);
  const updateKnowledgeEntry = useStore((s) => s.updateKnowledgeEntry);
  const deleteKnowledgeEntry = useStore((s) => s.deleteKnowledgeEntry);

  const commonCauses = extractCommonCauses(records);
  const categoryEntries = knowledgeEntries.filter((e) => e.category === categoryPath);

  const severityCounts = { CRITICAL: 0, MAJOR: 0, MINOR: 0, TRIVIAL: 0 };
  for (const r of records) severityCounts[r.severity]++;

  const handleAdd = (data: { title: string; content: string; severity: Severity; tags: string[] }) => {
    addKnowledgeEntry({
      category: categoryPath,
      title: data.title,
      content: data.content,
      severity: data.severity,
      tags: data.tags,
      sourceRecordIds: [],
    });
    setShowForm(false);
  };

  const handleUpdate = (data: { title: string; content: string; severity: Severity; tags: string[] }) => {
    if (editingId) {
      updateKnowledgeEntry(editingId, data);
      setEditingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 md:py-4 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform', expanded && 'rotate-90')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-slate-800">{categoryPath}</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {records.length} 条记录 · {categoryEntries.length} 条知识
            </span>
          </div>
          <div className="flex gap-3 mt-1">
            {SEVERITY_OPTIONS.map((s) => {
              const count = severityCounts[s.value as keyof typeof severityCounts];
              if (count === 0) return null;
              return (
                <span key={s.value} className="text-[11px]" style={{ color: s.color }}>
                  {s.label} {count}
                </span>
              );
            })}
          </div>
        </div>
        <div className="text-xs text-slate-400">
          {expanded ? '收起' : '展开'}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 px-3 md:px-5 py-4 space-y-4 bg-slate-50/50">
          {/* Auto-extracted common causes */}
          {commonCauses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                常见根因模式（自动提取）
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {commonCauses.slice(0, 15).map(({ cause, count }) => (
                  <span
                    key={cause}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    {cause}
                    <span className="text-amber-400">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Manual knowledge entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                经验总结
              </h4>
              <button
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowForm(true); }}
              >
                <Plus className="w-3 h-3" />
                新增知识
              </button>
            </div>

            <div className="space-y-2">
              {categoryEntries.length === 0 && !showForm && (
                <p className="text-xs text-slate-400 py-2">暂无经验总结，点击"新增知识"添加</p>
              )}

              {categoryEntries.map((entry) =>
                editingId === entry.id ? (
                  <KnowledgeEntryForm
                    key={entry.id}
                    initial={entry}
                    category={categoryPath}
                    onSave={handleUpdate}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <KnowledgeEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => { setEditingId(entry.id); setShowForm(false); }}
                    onDelete={() => {
                      if (confirm('确定要删除这条知识条目吗？')) {
                        deleteKnowledgeEntry(entry.id);
                      }
                    }}
                  />
                )
              )}

              {showForm && (
                <KnowledgeEntryForm
                  category={categoryPath}
                  onSave={handleAdd}
                  onCancel={() => setShowForm(false)}
                />
              )}
            </div>
          </div>

          {/* Related records */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              相关记录
            </h4>
            <div className="space-y-1.5">
              {records.map((r) => (
                <button
                  key={r.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left group border border-transparent hover:border-slate-200"
                  onClick={() => {
                    setSelectedFolder(r.folderId);
                    setTimeout(() => setSelectedRecord(r.id), 100);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{r.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{r.recordNumber}</span>
                      <span>·</span>
                      <span>{r.productModel}</span>
                      <span>·</span>
                      <span>{formatDate(r.recordDate)}</span>
                      <span>·</span>
                      <span>{getDispositionLabel(r.disposition)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main KnowledgeBase component ──
export function KnowledgeBase() {
  const allRecords = useStore((s) => s.records);
  const records = allRecords.filter((r) => !r.isTemplate);
  const grouped = groupByCategory(records);

  const categoryOrder = DEFECT_CATEGORIES.map((c) => c.name);

  const sortedEntries = [...grouped.entries()].sort((a, b) => {
    const ai = categoryOrder.findIndex((c) => a[0].startsWith(c));
    const bi = categoryOrder.findIndex((c) => b[0].startsWith(c));
    if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return b[1].length - a[1].length;
  });

  const totalRecords = records.length;
  const categorizedCount = records.filter((r) => r.defectCategory).length;
  const knowledgeEntries = useStore((s) => s.knowledgeEntries);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-5 gap-2">
        <h2 className="text-lg font-bold text-slate-800">知识库</h2>
        <div className="text-xs md:text-sm text-slate-500">
          已归纳 {categorizedCount}/{totalRecords} 条记录 · {knowledgeEntries.length} 条知识条目
        </div>
      </div>

      <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-5 leading-relaxed">
        按缺陷类别归纳的不良品分析档案。系统自动提取常见根因模式，工程师可手动补充经验总结和预防措施，形成团队共享的知识资产。
      </p>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无记录数据</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEntries.map(([category, recs]) => (
            <CategoryCard key={category} categoryPath={category} records={recs} />
          ))}
        </div>
      )}
    </div>
  );
}
