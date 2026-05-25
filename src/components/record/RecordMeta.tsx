import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  PRODUCT_MODELS,
  PROCESS_STATIONS,
  SEVERITY_OPTIONS,
  DISPOSITION_OPTIONS,
} from '../../lib/constants';
import type { Severity, Disposition } from '../../types';
import { injectMetadataIntoContent } from '../../lib/utils';
import { Trash2, ChevronDown } from 'lucide-react';

export function RecordMeta() {
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const records = useStore((s) => s.records);
  const record = records.find((r) => r.id === selectedRecordId) || null;
  const updateRecord = useStore((s) => s.updateRecord);
  const deleteRecord = useStore((s) => s.deleteRecord);
  const setSelectedRecord = useStore((s) => s.setSelectedRecord);
  const saveRecordContent = useStore((s) => s.saveRecordContent);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const syncMetadataToContent = (field: 'productModel' | 'defectCategory', value: string) => {
    const state = useStore.getState();
    const rec = state.records.find((r) => r.id === state.selectedRecordId);
    if (!rec || rec.isTemplate) return;
    updateRecord(rec.id, { [field]: value });
    const updated = injectMetadataIntoContent(rec.content as Record<string, unknown>, field, value);
    saveRecordContent(rec.id, updated);
  };

  if (!record || record.isTemplate) return null;

  const fieldStyle = "w-full text-xs";
  const labelStyle = "block text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1";

  const handleDelete = () => {
    if (confirm('确定要删除此记录吗？将移入回收站。')) {
      deleteRecord(record.id);
      setSelectedRecord(null);
    }
  };

  return (
    <div className="w-full md:w-64 bg-white md:border-l border-t md:border-t-0 border-slate-200 overflow-y-auto shrink-0">
      {/* Mobile toggle header */}
      <button
        className="mobile-only w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200"
        onClick={() => setMobileExpanded(!mobileExpanded)}
      >
        <span className="text-sm font-semibold text-slate-700">记录属性</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Desktop header */}
      <div className="hidden md:flex items-center justify-between px-4 pt-4 pb-0 mb-2">
        <h3 className="text-sm font-semibold text-slate-700">记录属性</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={handleDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className={`p-4 space-y-3.5 ${mobileExpanded ? '' : 'mobile-only hidden'} md:block`}>

        {/* Record Number (readonly) */}
        <div>
          <label className={labelStyle}>记录编号</label>
          <Input className={fieldStyle} value={record.recordNumber} disabled />
        </div>

        {/* Title */}
        <div>
          <label className={labelStyle}>标题</label>
          <Input
            className={fieldStyle}
            value={record.title}
            onChange={(e) => updateRecord(record.id, { title: e.target.value })}
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelStyle}>日期</label>
          <Input
            className={fieldStyle}
            type="date"
            value={record.recordDate}
            onChange={(e) => updateRecord(record.id, { recordDate: e.target.value })}
          />
        </div>

        {/* Product Model */}
        <div>
          <label className={labelStyle}>产品型号</label>
          <input
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            list="product-model-list"
            value={record.productModel}
            onChange={(e) => syncMetadataToContent('productModel', e.target.value)}
            placeholder="输入或选择型号..."
          />
          <datalist id="product-model-list">
            {[...new Set([
              ...PRODUCT_MODELS.map((m) => m.value),
              ...records.map((r) => r.productModel).filter(Boolean),
            ])].map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </div>

        {/* Process Station */}
        <div>
          <label className={labelStyle}>工序</label>
          <select
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={record.processStation}
            onChange={(e) => updateRecord(record.id, { processStation: e.target.value })}
          >
            <option value="">选择工序...</option>
            {PROCESS_STATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Defect Category */}
        <div>
          <label className={labelStyle}>缺陷分类</label>
          <input
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            list="defect-category-list"
            value={record.defectCategory}
            onChange={(e) => syncMetadataToContent('defectCategory', e.target.value)}
            placeholder="输入或选择分类..."
          />
          <datalist id="defect-category-list">
            {[...new Set(
              records.map((r) => r.defectCategory).filter(Boolean)
            )].map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        {/* Severity */}
        <div>
          <label className={labelStyle}>严重程度</label>
          <div className="flex gap-1.5">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s.value}
                className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-colors ${
                  record.severity === s.value
                    ? 'border-current'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
                style={record.severity === s.value ? { color: s.color, backgroundColor: s.color + '12' } : {}}
                onClick={() => updateRecord(record.id, { severity: s.value as Severity })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Disposition */}
        <div>
          <label className={labelStyle}>处理决策</label>
          <select
            className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={record.disposition}
            onChange={(e) => updateRecord(record.id, { disposition: e.target.value as Disposition })}
          >
            {DISPOSITION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Responsible Person */}
        <div>
          <label className={labelStyle}>责任人</label>
          <Input
            className={fieldStyle}
            value={record.responsiblePerson}
            onChange={(e) => updateRecord(record.id, { responsiblePerson: e.target.value })}
            placeholder="输入姓名..."
          />
        </div>

        {/* Work Order */}
        <div>
          <label className={labelStyle}>关联工单号</label>
          <Input
            className={fieldStyle}
            value={record.workOrderNumber}
            onChange={(e) => updateRecord(record.id, { workOrderNumber: e.target.value })}
            placeholder="WO-YYYY-MMDD..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className={labelStyle}>标签</label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded"
              >
                {tag}
                <button
                  className="text-blue-400 hover:text-blue-700"
                  onClick={() =>
                    updateRecord(record.id, { tags: record.tags.filter((t) => t !== tag) })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <Input
            className={fieldStyle}
            placeholder="输入标签后回车..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.currentTarget;
                const val = input.value.trim();
                if (val && !record.tags.includes(val)) {
                  updateRecord(record.id, { tags: [...record.tags, val] });
                  input.value = '';
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
