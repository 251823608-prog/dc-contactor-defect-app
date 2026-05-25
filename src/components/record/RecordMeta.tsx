import { useStore } from '../../store/useStore';
import {
  PRODUCT_MODELS,
  PROCESS_STATIONS,
  SEVERITY_OPTIONS,
  DISPOSITION_OPTIONS,
  RECTIFICATION_STATUS_OPTIONS,
} from '../../lib/constants';
import type { Severity, Disposition, RectificationStatus } from '../../types';
import { injectMetadataIntoContent } from '../../lib/utils';
import { Trash2 } from 'lucide-react';

export function RecordMeta() {
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const records = useStore((s) => s.records);
  const record = records.find((r) => r.id === selectedRecordId) || null;
  const updateRecord = useStore((s) => s.updateRecord);
  const deleteRecord = useStore((s) => s.deleteRecord);
  const setSelectedRecord = useStore((s) => s.setSelectedRecord);
  const saveRecordContent = useStore((s) => s.saveRecordContent);
  const autoTitle = (data: { workOrderNumber?: string; productModel?: string; recordDate?: string }): string => {
    if (!record) return '';
    const parts: string[] = [];
    const wo = data.workOrderNumber ?? record.workOrderNumber;
    const model = data.productModel ?? record.productModel;
    const date = data.recordDate ?? record.recordDate;
    if (wo) parts.push(wo);
    if (model) parts.push(model);
    if (date) parts.push(date);
    return parts.join(' ') || record.title;
  };

  const syncMetadataToContent = (field: 'productModel' | 'defectCategory', value: string) => {
    const state = useStore.getState();
    const rec = state.records.find((r) => r.id === state.selectedRecordId);
    if (!rec || rec.isTemplate) return;
    updateRecord(rec.id, { [field]: value });
    const updated = injectMetadataIntoContent(rec.content as Record<string, unknown>, field, value);
    saveRecordContent(rec.id, updated);
  };

  if (!record || record.isTemplate) {
    return (
      <div className="w-full md:w-56 bg-white md:border-l border-t md:border-t-0 border-slate-100 overflow-y-auto shrink-0 flex items-center justify-center">
        <p className="text-[12px] text-slate-300">选择一条记录</p>
      </div>
    );
  }

  const labelClass = "block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1";
  const fieldClass = "w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all placeholder:text-slate-300";

  const handleDelete = () => {
    if (confirm('确定要删除此记录吗？将移入回收站。')) {
      deleteRecord(record.id);
      setSelectedRecord(null);
    }
  };

  return (
    <div className="w-full md:w-56 bg-white md:border-l border-t md:border-t-0 border-slate-100 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-[13px] font-semibold text-slate-700">属性</h3>
        <button className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors" onClick={handleDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Record Number */}
        <div>
          <label className={labelClass}>编号</label>
          <input className={`${fieldClass} bg-slate-50 text-slate-400`} value={record.recordNumber} disabled />
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>标题</label>
          <input
            className={fieldClass}
            value={record.title}
            onChange={(e) => updateRecord(record.id, { title: e.target.value })}
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>日期</label>
          <input
            className={fieldClass}
            type="date"
            value={record.recordDate}
            onChange={(e) => updateRecord(record.id, { recordDate: e.target.value, title: autoTitle({ recordDate: e.target.value }) })}
          />
        </div>

        {/* Product Model */}
        <div>
          <label className={labelClass}>产品型号</label>
          <input
            className={fieldClass}
            list="product-model-list"
            value={record.productModel}
            onChange={(e) => {
              const val = e.target.value;
              updateRecord(record.id, { productModel: val, title: autoTitle({ productModel: val }) });
              const updated = injectMetadataIntoContent(record.content as Record<string, unknown>, 'productModel', val);
              saveRecordContent(record.id, updated);
            }}
            placeholder="输入或选择..."
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
          <label className={labelClass}>工序</label>
          <select
            className={fieldClass}
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
          <label className={labelClass}>缺陷分类</label>
          <input
            className={fieldClass}
            list="defect-category-list"
            value={record.defectCategory}
            onChange={(e) => syncMetadataToContent('defectCategory', e.target.value)}
            placeholder="输入或选择..."
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
          <label className={labelClass}>严重程度</label>
          <div className="flex gap-1">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s.value}
                className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-colors ${
                  record.severity === s.value
                    ? 'border-current'
                    : 'border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-400'
                }`}
                style={record.severity === s.value ? { color: s.color, backgroundColor: s.color + '0f' } : {}}
                onClick={() => updateRecord(record.id, { severity: s.value as Severity })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Disposition */}
        <div>
          <label className={labelClass}>处理决策</label>
          <select
            className={fieldClass}
            value={record.disposition}
            onChange={(e) => updateRecord(record.id, { disposition: e.target.value as Disposition })}
          >
            {DISPOSITION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Rectification Status */}
        <div>
          <label className={labelClass}>整改状态</label>
          <select
            className={fieldClass}
            value={record.rectificationStatus}
            onChange={(e) => updateRecord(record.id, { rectificationStatus: e.target.value as RectificationStatus })}
          >
            {RECTIFICATION_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Responsible Person */}
        <div>
          <label className={labelClass}>责任人</label>
          <input
            className={fieldClass}
            value={record.responsiblePerson}
            onChange={(e) => updateRecord(record.id, { responsiblePerson: e.target.value })}
            placeholder="输入姓名..."
          />
        </div>

        {/* Work Order */}
        <div>
          <label className={labelClass}>工单号</label>
          <input
            className={fieldClass}
            value={record.workOrderNumber}
            onChange={(e) => updateRecord(record.id, { workOrderNumber: e.target.value, title: autoTitle({ workOrderNumber: e.target.value }) })}
            placeholder="WO-..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className={labelClass}>标签</label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md"
              >
                {tag}
                <button
                  className="text-slate-300 hover:text-slate-600"
                  onClick={() => updateRecord(record.id, { tags: record.tags.filter((t) => t !== tag) })}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            className={fieldClass}
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
