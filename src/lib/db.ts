import type { Folder, RecordItem, KnowledgeEntry, TrashItem } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_FOLDERS, MOCK_RECORDS } from '../data/mock';
import { diagLog } from './diagnostics';

// Mock knowledge entries for seeding
const MOCK_KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'ke-001', category: '接触系统缺陷/接触电阻超标', title: '接触电阻超标的三大常见根因',
    content: '根据历史记录统计，接触电阻超标主要由以下三类原因引起：(1) 铆接压力不足或模具磨损导致接触面未完全贴合；(2) 触点表面氧化或污染（AgCdO/AgSnO₂ 氧化层、SiO₂ 颗粒）；(3) 端子螺栓在热循环后松动。建议优先排查铆接工序参数和清洗工艺，其次检查端子紧固力矩。',
    severity: 'MAJOR', tags: ['接触电阻', '铆接', '氧化', '紧固力矩'], sourceRecordIds: ['r-006'],
    createdAt: '2026-05-20T08:00:00.000Z', updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'ke-002', category: '电磁系统缺陷/线圈短路', title: '线圈匝间短路预防措施总结',
    content: '匝间短路是线圈绕制工序最常见的致命缺陷。预防要点：(1) 漆包线来料必须包含针孔放电试验报告，每批次抽检 5% 的卷轴；(2) 绕线张力控制在 ±5% 以内，张力传感器每季度校准零点；(3) 车间环境控制温度 23±2°C、RH 50±10%；(4) 绕线完成后 100% 进行匝间脉冲耐压测试。',
    severity: 'CRITICAL', tags: ['匝间短路', '漆包线', '张力控制', '预防措施'], sourceRecordIds: ['r-005'],
    createdAt: '2026-05-21T10:00:00.000Z', updatedAt: '2026-05-21T10:00:00.000Z',
  },
  {
    id: 'ke-003', category: '电气性能缺陷/绝缘电阻不合格', title: '老化后绝缘电阻下降的根因与材料升级方案',
    content: 'CZ28-400 在 168 小时老化测试后出现绝缘电阻大幅下降（850MΩ→15MΩ），根因是电弧产生金属蒸汽沉积在灭弧室内壁形成导电通路，同时 FR-4 绝缘隔板在高温下微裂纹进水、PPS 线圈骨架碳化。解决方案：灭弧室增加金属蒸汽过滤网，绝缘隔板升级为 PI（聚酰亚胺），线圈骨架升级为 PEEK。ECN-2026-042 已批准。',
    severity: 'CRITICAL', tags: ['绝缘电阻', '老化测试', '材料升级', 'ECN', 'PI', 'PEEK'], sourceRecordIds: ['r-007'],
    createdAt: '2026-05-22T14:00:00.000Z', updatedAt: '2026-05-22T14:00:00.000Z',
  },
  {
    id: 'ke-004', category: '接触系统缺陷/触点熔焊', title: '8D：触点熔焊的系统性防再发措施',
    content: 'CZ28-200 客户投诉触点熔焊事件（不良率 6.4%，安全等级 A）的完整整改方案：(1) 超声波清洗滤芯每周强制更换 + 每日电导率检测；(2) 触点来料 SEM 抽检表面清洁度和 AgSnO₂ 氧化物分布均匀性；(3) PFMEA 增加"触点表面污染"失效模式，RPN 降至 32；(4) 开发清洗液在线电导率监控系统（2026 Q3 上线）。整改后 CPK = 1.67，连续 3 批次零熔焊。',
    severity: 'CRITICAL', tags: ['触点熔焊', '8D', '客户投诉', 'PFMEA', '超声波清洗'], sourceRecordIds: ['r-010'],
    createdAt: '2026-05-23T09:00:00.000Z', updatedAt: '2026-05-23T09:00:00.000Z',
  },
  {
    id: 'ke-005', category: '灭弧系统缺陷/灭弧能力不足', title: '灭弧能力不足的复合型缺陷分析',
    content: '灭弧能力不足通常是复合型缺陷：(1) 装配错误——灭弧栅片安装方向装反（锐角应朝向电弧入口）；(2) 来料不良——灭弧室陶瓷内壁耐电弧涂层漏涂；(3) 设计防呆不足——磁吹线圈无极性标识。整改方案包括栅片方向图示化作业指导书、涂层全检、极性防呆设计。注意：此类问题往往在分断测试时才暴露，前端装配工序自检难以发现。',
    severity: 'CRITICAL', tags: ['灭弧', '栅片', '磁吹', '复合缺陷', '防呆'], sourceRecordIds: ['r-004'],
    createdAt: '2026-05-24T11:00:00.000Z', updatedAt: '2026-05-24T11:00:00.000Z',
  },
  {
    id: 'ke-006', category: '电气性能缺陷/介电强度击穿', title: '5-Why分析：绝缘垫片混料导致介电击穿',
    content: '介电强度击穿（2800V 击穿，标准 3500V）的 5-Why 分析结论：根因是仓库将 CZ31-600 绝缘垫片（1.2mm）误发为 CZ28-400 垫片（1.5mm），两者外观相似仅厚度不同。纠正措施：(1) CZ28-400 垫片改为红色，CZ31-600 为蓝色，视觉防呆；(2) 来料检验增加垫片厚度检测项（CPK ≥ 1.33）；(3) 相似物料出库增加扫码确认。',
    severity: 'CRITICAL', tags: ['介电击穿', '5-Why', '混料', '防呆', '视觉管理'], sourceRecordIds: ['r-009'],
    createdAt: '2026-05-25T08:00:00.000Z', updatedAt: '2026-05-25T08:00:00.000Z',
  },
  {
    id: 'ke-007', category: '电气性能缺陷/温升超标', title: '高温应力松弛导致温升超标及材料升级方案',
    content: 'CZ28-400 在高温老化下主端子温升 82K（标准 ≤ 65K），根因是触头弹簧在高温下应力松弛（8.0N→5.5N），导致接触压力不足、接触电阻增大。解决方案：弹簧材料升级为 Inconel X-750 耐热合金；端子螺栓增加碟形弹簧垫圈；散热器翅片经 CFD 重设计后效率提升 25%。',
    severity: 'MAJOR', tags: ['温升', '应力松弛', 'Inconel', 'CFD', '弹簧'], sourceRecordIds: ['r-008'],
    createdAt: '2026-05-25T10:00:00.000Z', updatedAt: '2026-05-25T10:00:00.000Z',
  },
  {
    id: 'ke-008', category: '接触系统缺陷/触点间隙异常', title: '装配线弹簧混料根因与BOM防错',
    content: 'CZ28-100 总装后出现批量触点间隙异常（3.2mm vs 标准 6.0±0.5mm）、接触电阻超标、接触压力不足。根因是误用了 CZ28-50 的触头弹簧（刚度 2.1N/mm vs 正确 3.8N/mm）。暴露的问题链：BOM 核对仅确认编码前 5 位→物料外观相似→无扫码校验。改进：MES 增加物料扫码校验、装配线全员 BOM 培训、相似物料分区存放。',
    severity: 'MAJOR', tags: ['弹簧混料', 'BOM防错', 'MES', '扫码校验'], sourceRecordIds: ['r-001'],
    createdAt: '2026-05-24T14:00:00.000Z', updatedAt: '2026-05-24T14:00:00.000Z',
  },
];

// ── Mapping helpers (TS camelCase ↔ DB snake_case) ──
function folderToRow(f: Folder) {
  return {
    id: f.id, name: f.name, parent_id: f.parentId, sort_order: f.sortOrder,
    is_template_folder: f.isTemplateFolder, created_at: f.createdAt,
  };
}
function rowToFolder(row: Record<string, unknown>): Folder {
  return {
    id: row.id as string, name: row.name as string, parentId: (row.parent_id as string) || null,
    sortOrder: (row.sort_order as number) || 0, isTemplateFolder: (row.is_template_folder as boolean) || false,
    createdAt: row.created_at as string,
  };
}
function recordToRow(r: RecordItem) {
  return {
    id: r.id, record_number: r.recordNumber, title: r.title, content: r.content, plain_text: r.plainText,
    folder_id: r.folderId, record_date: r.recordDate, product_model: r.productModel,
    process_station: r.processStation, defect_category: r.defectCategory, severity: r.severity,
    disposition: r.disposition, rectification_status: r.rectificationStatus,
    responsible_person: r.responsiblePerson, work_order_number: r.workOrderNumber,
    tags: r.tags, is_archived: r.isArchived, is_template: r.isTemplate,
    created_at: r.createdAt, updated_at: r.updatedAt,
  };
}
function rowToRecord(row: Record<string, unknown>): RecordItem {
  return {
    id: row.id as string, recordNumber: row.record_number as string, title: row.title as string,
    content: (row.content as Record<string, unknown>) || {}, plainText: (row.plain_text as string) || '',
    folderId: row.folder_id as string, recordDate: row.record_date as string,
    productModel: (row.product_model as string) || '', processStation: (row.process_station as string) || '',
    defectCategory: (row.defect_category as string) || '', severity: (row.severity as never) || 'MINOR',
    disposition: (row.disposition as never) || 'REWORK', rectificationStatus: (row.rectification_status as never) || 'NONE',
    responsiblePerson: (row.responsible_person as string) || '',
    workOrderNumber: (row.work_order_number as string) || '', tags: (row.tags as string[]) || [],
    isArchived: (row.is_archived as boolean) || false, isTemplate: (row.is_template as boolean) || false,
    createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  };
}
function knowledgeToRow(e: KnowledgeEntry) {
  return {
    id: e.id, category: e.category, title: e.title, content: e.content, severity: e.severity,
    tags: e.tags, source_record_ids: e.sourceRecordIds, created_at: e.createdAt, updated_at: e.updatedAt,
  };
}
function rowToKnowledge(row: Record<string, unknown>): KnowledgeEntry {
  return {
    id: row.id as string, category: row.category as string, title: row.title as string,
    content: (row.content as string) || '', severity: (row.severity as never) || 'MINOR',
    tags: (row.tags as string[]) || [], sourceRecordIds: (row.source_record_ids as string[]) || [],
    createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  };
}
function trashToRow(t: TrashItem) {
  return {
    id: t.id, original_id: t.originalId, item_type: t.itemType, original_name: t.originalName,
    original_parent_id: t.originalParentId, deleted_at: t.deletedAt, original_data: t.originalData || {},
  };
}
function rowToTrash(row: Record<string, unknown>): TrashItem {
  return {
    id: row.id as string, originalId: row.original_id as string, itemType: row.item_type as 'RECORD' | 'FOLDER',
    originalName: row.original_name as string, originalParentId: (row.original_parent_id as string) || null,
    deletedAt: row.deleted_at as string, originalData: (row.original_data as Folder | RecordItem) || undefined,
  };
}

// ── Load all data ──
export async function loadAllData(): Promise<{
  folders: Folder[];
  records: RecordItem[];
  knowledgeEntries: KnowledgeEntry[];
  trash: TrashItem[];
} | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const [fRes, rRes, kRes, tRes] = await Promise.all([
      supabase.from('folders').select('*'),
      supabase.from('records').select('*'),
      supabase.from('knowledge_entries').select('*'),
      supabase.from('trash').select('*'),
    ]);
    if (fRes.error || rRes.error) {
      console.error('Supabase load error:', fRes.error || rRes.error);
      return null;
    }
    return {
      folders: (fRes.data as Record<string, unknown>[]).map(rowToFolder),
      records: (rRes.data as Record<string, unknown>[]).map(rowToRecord),
      knowledgeEntries: (kRes.data as Record<string, unknown>[] || []).map(rowToKnowledge),
      trash: (tRes.data as Record<string, unknown>[] || []).map(rowToTrash),
    };
  } catch (e) {
    console.warn('Supabase connection failed, using local data', e);
    return null;
  }
}

// ── Sync operations ──
async function tryOp(op: () => PromiseLike<unknown>): Promise<void> {
  if (!isSupabaseConfigured()) { diagLog('tryOp: Supabase NOT configured — write SKIPPED'); return; }
  try { await op(); } catch (e) { diagLog(`tryOp: write FAILED — ${String(e).substring(0, 100)}`); console.error('Supabase op failed:', e); }
}

export async function upsertFolder(f: Folder): Promise<void> {
  await tryOp(() => supabase.from('folders').upsert(folderToRow(f)));
}

// Migration ops — errors propagate so caller can decide whether to clear localStorage
export async function migrateFolder(f: Folder): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('folders').upsert(folderToRow(f));
  if (error) { diagLog(`migrateFolder FAILED: ${error.message}`); throw error; }
}
export async function migrateRecord(r: RecordItem): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('records').upsert(recordToRow(r));
  if (error) { diagLog(`migrateRecord FAILED: ${error.message}`); throw error; }
}
export async function migrateKnowledgeEntry(e: KnowledgeEntry): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('knowledge_entries').upsert(knowledgeToRow(e));
  if (error) { diagLog(`migrateKnowledge FAILED: ${error.message}`); throw error; }
}
export async function migrateTrashItem(t: TrashItem): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('trash').upsert(trashToRow(t));
  if (error) { diagLog(`migrateTrash FAILED: ${error.message}`); throw error; }
}
export async function deleteFolderDb(id: string): Promise<void> {
  await tryOp(() => supabase.from('folders').delete().eq('id', id));
}

export async function upsertRecord(r: RecordItem): Promise<void> {
  await tryOp(() => supabase.from('records').upsert(recordToRow(r)));
}
export async function deleteRecordDb(id: string): Promise<void> {
  await tryOp(() => supabase.from('records').delete().eq('id', id));
}

export async function upsertKnowledgeEntry(e: KnowledgeEntry): Promise<void> {
  await tryOp(() => supabase.from('knowledge_entries').upsert(knowledgeToRow(e)));
}
export async function deleteKnowledgeEntryDb(id: string): Promise<void> {
  await tryOp(() => supabase.from('knowledge_entries').delete().eq('id', id));
}

export async function upsertTrashItem(t: TrashItem): Promise<void> {
  await tryOp(() => supabase.from('trash').upsert(trashToRow(t)));
}
export async function deleteTrashItemDb(id: string): Promise<void> {
  await tryOp(() => supabase.from('trash').delete().eq('id', id));
}

// ── Realtime subscription ──
export function subscribeToChanges(
  onFolderChange: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
  onRecordChange: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
  onKnowledgeChange: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
  onTrashChange: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
) {
  if (!isSupabaseConfigured()) return () => {};
  const channel = supabase.channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, (payload) => {
      onFolderChange(payload as unknown as { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, (payload) => {
      onRecordChange(payload as unknown as { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_entries' }, (payload) => {
      onKnowledgeChange(payload as unknown as { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trash' }, (payload) => {
      onTrashChange(payload as unknown as { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ── Seed initial data to Supabase (only if truly empty) ──
export async function seedIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    // Check if any mock data already exists
    const mockIds = MOCK_RECORDS.map((r) => r.id);
    const { data: existing, error } = await supabase
      .from('records')
      .select('id')
      .in('id', mockIds)
      .limit(1);

    if (error || (existing && existing.length > 0)) {
      // Data already exists, skip seeding to avoid overwriting user changes
      return;
    }

    // Tables are empty, seed initial data
    await Promise.all([
      ...MOCK_FOLDERS.map((f) => supabase.from('folders').upsert(folderToRow(f))),
      ...MOCK_RECORDS.map((r) => supabase.from('records').upsert(recordToRow(r))),
      ...MOCK_KNOWLEDGE_ENTRIES.map((e) => supabase.from('knowledge_entries').upsert(knowledgeToRow(e))),
    ]);
    console.log('Seeded initial data to Supabase');
  } catch { /* ignore */ }
}
