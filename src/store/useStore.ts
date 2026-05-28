import { create } from 'zustand';
import type { Folder, RecordItem, TrashItem, KnowledgeEntry, ViewMode, MainView } from '../types';
import { MOCK_FOLDERS, MOCK_RECORDS } from '../data/mock';
import { generateId, generateRecordNumber, getTodayISO, extractPlainText } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  loadAllData, upsertFolder, deleteFolderDb,
  upsertRecord, deleteRecordDb,
  upsertKnowledgeEntry, deleteKnowledgeEntryDb,
  upsertTrashItem, deleteTrashItemDb,
  subscribeToChanges, seedIfEmpty,
  migrateFolder, migrateRecord, migrateKnowledgeEntry, migrateTrashItem,
} from '../lib/db';

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

interface AppState {
  initialized: boolean;
  folders: Folder[];
  records: RecordItem[];
  trash: TrashItem[];
  knowledgeEntries: KnowledgeEntry[];

  selectedFolderId: string | null;
  selectedRecordId: string | null;
  searchQuery: string;
  viewMode: ViewMode;
  mainView: MainView;
  isTrashOpen: boolean;

  init: () => Promise<void>;
  createFolder: (name: string, parentId: string | null) => void;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  createRecord: (folderId: string, templateId?: string) => string;
  updateRecord: (id: string, data: Partial<RecordItem>) => void;
  batchUpdateRecords: (ids: string[], data: Partial<RecordItem>) => void;
  batchDeleteRecords: (ids: string[]) => void;
  deleteRecord: (id: string) => void;
  saveRecordContent: (id: string, content: Record<string, unknown>) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  clearAllTrash: () => void;
  addKnowledgeEntry: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateKnowledgeEntry: (id: string, data: Partial<Omit<KnowledgeEntry, 'id' | 'createdAt'>>) => void;
  deleteKnowledgeEntry: (id: string) => void;
  setSelectedFolder: (id: string | null) => void;
  setSelectedRecord: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setMainView: (view: MainView) => void;
  setTrashOpen: (open: boolean) => void;
  getFolderPath: (folderId: string) => Folder[];
  getRecordsByFolder: (folderId: string) => RecordItem[];
  getFilteredRecords: () => RecordItem[];
}

let _lastCreateTime = 0;
const CREATE_GUARD_MS = 600;

const LS_KEY = 'dc-defect-v2-state';

function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function dedupeBy<T extends { id: string }>(a: T[], b: T[]): T[] {
  const ids = new Set(b.map((x) => x.id));
  return [...b, ...a.filter((x) => !ids.has(x.id))];
}

function saveToLS(state: { folders: unknown; records: unknown; trash: unknown; knowledgeEntries: unknown }) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      folders: state.folders,
      records: state.records,
      trash: state.trash,
      knowledgeEntries: state.knowledgeEntries,
    }));
  } catch { /* ignore */ }
}

export const useStore = create<AppState>()((set, get) => ({
  initialized: false,
  folders: MOCK_FOLDERS,
  records: MOCK_RECORDS,
  trash: [],
  knowledgeEntries: MOCK_KNOWLEDGE_ENTRIES,

  selectedFolderId: null,
  selectedRecordId: null,
  searchQuery: '',
  viewMode: 'list' as ViewMode,
  mainView: 'records' as MainView,
  isTrashOpen: false,

  // ── Init ──
  init: async () => {
    console.log('[init] Starting...');
    let data = await loadAllData();
    console.log('[init] loadAllData result:', data ? `folders=${data.folders.length} records=${data.records.length}` : 'NULL');
    if (data) {
      // Supabase is available — migrate any unsynced localStorage data
      const saved = loadFromLS();
      if (saved) {
        console.log('[init] Found localStorage data, migrating to Supabase...');
        try {
          // Use migrate* functions (not upsert*) so errors propagate — if any fail, we keep localStorage
          await Promise.all([
            ...(saved.folders as Folder[]).map((f) => migrateFolder(f)),
            ...(saved.records as RecordItem[]).map((r) => migrateRecord(r)),
            ...(saved.knowledgeEntries as KnowledgeEntry[]).map((k: KnowledgeEntry) => migrateKnowledgeEntry(k)),
            ...(saved.trash as TrashItem[]).map((t: TrashItem) => migrateTrashItem(t)),
          ]);
          // Only clear localStorage after confirmed success
          console.log('[init] Migration complete, clearing localStorage');
          localStorage.removeItem(LS_KEY);
          // Reload merged data from Supabase
          const merged = await loadAllData();
          if (merged) data = merged;
        } catch (e) {
          console.warn('[init] Migration failed — localStorage preserved', e);
          // Merge Supabase data with localStorage data so nothing is lost
          data = {
            folders: dedupeBy(saved.folders as Folder[], data.folders),
            records: dedupeBy(saved.records as RecordItem[], data.records),
            knowledgeEntries: dedupeBy(saved.knowledgeEntries as KnowledgeEntry[], data.knowledgeEntries),
            trash: dedupeBy(saved.trash as TrashItem[], data.trash),
          };
        }
      }
      set({ ...data, initialized: true });
      console.log('[init] State set from Supabase, seeding...');
      await seedIfEmpty();
      const fresh = await loadAllData();
      console.log('[init] Reload result:', fresh ? `records=${fresh.records.length}` : 'NULL');
      if (fresh) set({ ...fresh });
    } else {
      console.log('[init] Supabase unavailable, trying localStorage...');
      const saved = loadFromLS();
      if (saved) {
        console.log('[init] Loaded from localStorage, records:', (saved.records as unknown[]).length);
        set({ ...saved, initialized: true });
      } else {
        console.log('[init] No localStorage data, using mock data');
        set({ initialized: true });
      }
    }
    console.log('[init] Done. State records:', get().records.length);

    // Set up realtime subscription for changes from other clients
    subscribeToChanges(
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const f = payload.new as Record<string, unknown>;
          set((s) => ({ folders: [...s.folders, { id: f.id as string, name: f.name as string, parentId: (f.parent_id as string) || null, sortOrder: (f.sort_order as number) || 0, isTemplateFolder: (f.is_template_folder as boolean) || false, createdAt: f.created_at as string }] }));
        } else if (payload.eventType === 'UPDATE') {
          const f = payload.new as Record<string, unknown>;
          set((s) => ({ folders: s.folders.map((x) => x.id === f.id ? { id: f.id as string, name: f.name as string, parentId: (f.parent_id as string) || null, sortOrder: (f.sort_order as number) || 0, isTemplateFolder: (f.is_template_folder as boolean) || false, createdAt: f.created_at as string } : x) }));
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as Record<string, unknown>;
          set((s) => ({ folders: s.folders.filter((x) => x.id !== old.id) }));
        }
      },
      (payload) => {
        const r = payload.new as Record<string, unknown>;
        if (payload.eventType === 'INSERT') {
          set((s) => {
            const exists = s.records.find((x) => x.id === r.id);
            if (exists) return s;
            const rec: RecordItem = { id: r.id as string, recordNumber: r.record_number as string, title: r.title as string, content: (r.content as Record<string, unknown>) || {}, plainText: (r.plain_text as string) || '', folderId: r.folder_id as string, recordDate: r.record_date as string, productModel: (r.product_model as string) || '', processStation: (r.process_station as string) || '', defectCategory: (r.defect_category as string) || '', severity: (r.severity as never) || 'MINOR', disposition: (r.disposition as never) || 'REWORK', rectificationStatus: (r.rectification_status as never) || 'NONE', responsiblePerson: (r.responsible_person as string) || '', workOrderNumber: (r.work_order_number as string) || '', tags: (r.tags as string[]) || [], isArchived: (r.is_archived as boolean) || false, isTemplate: (r.is_template as boolean) || false, createdAt: r.created_at as string, updatedAt: r.updated_at as string };
            return { records: [...s.records, rec] };
          });
        } else if (payload.eventType === 'UPDATE') {
          set((s) => ({ records: s.records.map((x) => x.id === r.id ? { ...x, recordNumber: r.record_number as string, title: r.title as string, content: (r.content as Record<string, unknown>) || {}, plainText: (r.plain_text as string) || '', productModel: (r.product_model as string) || '', processStation: (r.process_station as string) || '', defectCategory: (r.defect_category as string) || '', severity: (r.severity as never) || x.severity, disposition: (r.disposition as never) || x.disposition, rectificationStatus: (r.rectification_status as never) || x.rectificationStatus, responsiblePerson: (r.responsible_person as string) || '', workOrderNumber: (r.work_order_number as string) || '', tags: (r.tags as string[]) || [], updatedAt: r.updated_at as string } : x) }));
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as Record<string, unknown>;
          set((s) => ({ records: s.records.filter((x) => x.id !== old.id) }));
        }
      },
      (payload) => {
        const k = payload.new as Record<string, unknown>;
        if (payload.eventType === 'INSERT') {
          set((s) => {
            if (s.knowledgeEntries.find((x) => x.id === k.id)) return s;
            const entry: KnowledgeEntry = { id: k.id as string, category: k.category as string, title: k.title as string, content: (k.content as string) || '', severity: (k.severity as never) || 'MINOR', tags: (k.tags as string[]) || [], sourceRecordIds: (k.source_record_ids as string[]) || [], createdAt: k.created_at as string, updatedAt: k.updated_at as string };
            return { knowledgeEntries: [...s.knowledgeEntries, entry] };
          });
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as Record<string, unknown>;
          set((s) => ({ knowledgeEntries: s.knowledgeEntries.filter((x) => x.id !== old.id) }));
        }
      },
      (payload) => {
        const t = payload.new as Record<string, unknown>;
        if (payload.eventType === 'INSERT') {
          set((s) => {
            if (s.trash.find((x) => x.id === t.id)) return s;
            const item: TrashItem = { id: t.id as string, originalId: t.original_id as string, itemType: t.item_type as 'RECORD' | 'FOLDER', originalName: t.original_name as string, originalParentId: (t.original_parent_id as string) || null, deletedAt: t.deleted_at as string, originalData: t.original_data as RecordItem | Folder | undefined };
            return { trash: [...s.trash, item] };
          });
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as Record<string, unknown>;
          set((s) => ({ trash: s.trash.filter((x) => x.id !== old.id) }));
        }
      },
    );
  },

  // ── Folder Actions ──
  createFolder: (name, parentId) => {
    const folder: Folder = { id: generateId(), name, parentId, sortOrder: 0, isTemplateFolder: false, createdAt: new Date().toISOString() };
    set((s) => ({ folders: [...s.folders, folder] }));
    void upsertFolder(folder);
  },

  deleteFolder: (id) => {
    const state = get();
    const folder = state.folders.find((f) => f.id === id);
    if (!folder) return;
    const idsToDelete = new Set<string>();
    const collectIds = (folderId: string) => {
      idsToDelete.add(folderId);
      state.folders.filter((f) => f.parentId === folderId).forEach((f) => collectIds(f.id));
      state.records.filter((r) => r.folderId === folderId).forEach((r) => idsToDelete.add(r.id));
    };
    collectIds(id);

    const trashItems: TrashItem[] = [
      ...state.folders.filter((f) => idsToDelete.has(f.id)).map((f) => ({
        id: generateId(), originalId: f.id, itemType: 'FOLDER' as const,
        originalName: f.name, originalParentId: f.parentId,
        deletedAt: new Date().toISOString(), originalData: { ...f },
      })),
      ...state.records.filter((r) => idsToDelete.has(r.id) && !r.isTemplate).map((r) => ({
        id: generateId(), originalId: r.id, itemType: 'RECORD' as const,
        originalName: r.title, originalParentId: r.folderId,
        deletedAt: new Date().toISOString(), originalData: { ...r },
      })),
    ];

    for (const fid of idsToDelete) void deleteFolderDb(fid);
    for (const rid of idsToDelete) void deleteRecordDb(rid);
    for (const ti of trashItems) void upsertTrashItem(ti);

    set((s) => ({
      folders: s.folders.filter((f) => !idsToDelete.has(f.id)),
      records: s.records.filter((r) => !idsToDelete.has(r.id)),
      trash: [...s.trash, ...trashItems],
      selectedFolderId: s.selectedFolderId === id ? null : s.selectedFolderId,
      selectedRecordId: idsToDelete.has(s.selectedRecordId || '') ? null : s.selectedRecordId,
    }));
  },

  renameFolder: (id, name) => {
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) }));
    const updated = get().folders.find((f) => f.id === id);
    if (updated) void upsertFolder(updated);
  },

  // ── Record Actions ──
  createRecord: (folderId, templateId) => {
    const now = Date.now();
    if (now - _lastCreateTime < CREATE_GUARD_MS) return '';
    _lastCreateTime = now;

    const state = get();
    const id = generateId();
    const today = new Date();
    const existingInFolder = state.records.filter((r) => r.folderId === folderId).length;
    let newRecord: RecordItem;

    if (templateId) {
      const template = state.records.find((r) => r.id === templateId);
      if (template) {
        newRecord = { ...template, id, recordNumber: generateRecordNumber(today, existingInFolder + 1), title: `新建记录 - ${template.title}`, folderId, recordDate: getTodayISO(), isTemplate: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: template.content, plainText: template.plainText };
        set((s) => s.records.find((r) => r.id === id) ? s : { records: [...s.records, newRecord], selectedRecordId: id });
        void upsertRecord(newRecord);
        return id;
      }
    }

    newRecord = {
      id, recordNumber: generateRecordNumber(today, existingInFolder + 1), title: '新建不良品记录',
      content: { type: 'doc', content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '不良品处理记录' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '产品型号：待填写' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '缺陷分类：待填写' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '问题描述' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '（描述发现的不良现象、发生时间、涉及批次号、数量等信息）' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '原因分析' }] },
        { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '（列出可能的原因，逐条分析）' }] }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '处理措施' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '（填写处理措施）' }] }] }] },
        { type: 'horizontalRule' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '验证结果' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '（描述处理后复测结果，包括关键指标数据）' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '后续预防' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '（填写预防措施）' }] }] }] },
      ]},
      plainText: '不良品处理记录 产品型号 缺陷分类 问题描述 原因分析 处理措施 验证结果 后续预防',
      folderId, recordDate: getTodayISO(), productModel: '', processStation: '', defectCategory: '',
      severity: 'MINOR', disposition: 'REWORK', rectificationStatus: 'NONE', responsiblePerson: '', workOrderNumber: '',
      tags: [], isArchived: false, isTemplate: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    set((s) => s.records.find((r) => r.id === id) ? s : { records: [...s.records, newRecord], selectedRecordId: id });
    void upsertRecord(newRecord);
    return id;
  },

  updateRecord: (id, data) => {
    set((s) => ({ records: s.records.map((r) => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r) }));
    const updated = get().records.find((r) => r.id === id);
    if (updated) void upsertRecord(updated);
  },

  batchUpdateRecords: (ids, data) => {
    const idSet = new Set(ids);
    set((s) => ({ records: s.records.map((r) => idSet.has(r.id) ? { ...r, ...data, updatedAt: new Date().toISOString() } : r) }));
    const updated = get().records.filter((r) => idSet.has(r.id));
    for (const r of updated) void upsertRecord(r);
  },

  batchDeleteRecords: (ids) => {
    const state = get();
    const idSet = new Set(ids);
    const trashItems: TrashItem[] = state.records
      .filter((r) => idSet.has(r.id) && !r.isTemplate)
      .map((r) => ({ id: generateId(), originalId: r.id, itemType: 'RECORD' as const, originalName: r.title, originalParentId: r.folderId, deletedAt: new Date().toISOString(), originalData: { ...r } }));
    set((s) => ({ records: s.records.filter((r) => !idSet.has(r.id)), trash: [...s.trash, ...trashItems], selectedRecordId: idSet.has(s.selectedRecordId || '') ? null : s.selectedRecordId }));
    for (const id of ids) void deleteRecordDb(id);
    for (const ti of trashItems) void upsertTrashItem(ti);
  },

  deleteRecord: (id) => {
    const state = get();
    const record = state.records.find((r) => r.id === id);
    if (!record) return;
    const trashItem: TrashItem = { id: generateId(), originalId: record.id, itemType: 'RECORD', originalName: record.title, originalParentId: record.folderId, deletedAt: new Date().toISOString(), originalData: { ...record } };
    set((s) => ({ records: s.records.filter((r) => r.id !== id), trash: [...s.trash, trashItem], selectedRecordId: s.selectedRecordId === id ? null : s.selectedRecordId }));
    void deleteRecordDb(id);
    void upsertTrashItem(trashItem);
  },

  saveRecordContent: (id, content) => {
    const plainText = extractPlainText(content);
    set((s) => ({ records: s.records.map((r) => r.id === id ? { ...r, content, plainText, updatedAt: new Date().toISOString() } : r) }));
  },

  // ── Trash Actions ──
  restoreFromTrash: (trashId) => {
    const state = get();
    const trashItem = state.trash.find((t) => t.id === trashId);
    if (!trashItem) return;
    if (trashItem.itemType === 'FOLDER' && trashItem.originalData && 'parentId' in trashItem.originalData) {
      const folder = trashItem.originalData as Folder;
      set((s) => ({ folders: [...s.folders, folder], trash: s.trash.filter((t) => t.id !== trashId) }));
      void upsertFolder(folder);
      void deleteTrashItemDb(trashId);
    } else if (trashItem.itemType === 'RECORD' && trashItem.originalData && 'recordNumber' in trashItem.originalData) {
      const record = trashItem.originalData as RecordItem;
      set((s) => ({ records: [...s.records, record], trash: s.trash.filter((t) => t.id !== trashId) }));
      void upsertRecord(record);
      void deleteTrashItemDb(trashId);
    }
  },

  permanentlyDelete: (id) => {
    set((s) => ({ trash: s.trash.filter((t) => t.id !== id) }));
    void deleteTrashItemDb(id);
  },

  clearAllTrash: () => {
    const { trash } = get();
    for (const item of trash) void deleteTrashItemDb(item.id);
    set({ trash: [] });
  },

  // ── Knowledge Actions ──
  addKnowledgeEntry: (entryData) => {
    const now = new Date().toISOString();
    const entry: KnowledgeEntry = { ...entryData, id: generateId(), createdAt: now, updatedAt: now };
    set((s) => ({ knowledgeEntries: [...s.knowledgeEntries, entry] }));
    void upsertKnowledgeEntry(entry);
  },

  updateKnowledgeEntry: (id, data) => {
    set((s) => ({ knowledgeEntries: s.knowledgeEntries.map((e) => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e) }));
    const updated = get().knowledgeEntries.find((e) => e.id === id);
    if (updated) void upsertKnowledgeEntry(updated);
  },

  deleteKnowledgeEntry: (id) => {
    set((s) => ({ knowledgeEntries: s.knowledgeEntries.filter((e) => e.id !== id) }));
    void deleteKnowledgeEntryDb(id);
  },

  // ── UI Actions ──
  setSelectedFolder: (id) => { set({ selectedFolderId: id, selectedRecordId: null, viewMode: 'list', searchQuery: '' }); },
  setSelectedRecord: (id) => { set({ selectedRecordId: id, viewMode: id ? 'editor' : 'list' }); },
  setSearchQuery: (query) => { set({ searchQuery: query }); },
  setViewMode: (mode) => { set({ viewMode: mode }); },
  setMainView: (view) => { set({ mainView: view }); },
  setTrashOpen: (open) => { set({ isTrashOpen: open }); },

  // ── Computed Helpers ──
  getFolderPath: (folderId) => {
    const path: Folder[] = [];
    let current = get().folders.find((f) => f.id === folderId);
    while (current) { path.unshift(current); current = get().folders.find((f) => f.id === current!.parentId); }
    return path;
  },
  getRecordsByFolder: (folderId) => get().records.filter((r) => r.folderId === folderId && !r.isTemplate),
  getFilteredRecords: () => {
    const { records, searchQuery, selectedFolderId } = get();
    let filtered = records.filter((r) => !r.isTemplate);
    if (selectedFolderId) filtered = filtered.filter((r) => r.folderId === selectedFolderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) =>
        r.title.toLowerCase().includes(q) || r.recordNumber.toLowerCase().includes(q) ||
        r.plainText.toLowerCase().includes(q) || r.productModel.toLowerCase().includes(q) ||
        r.defectCategory.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  },
}));

// Auto-save to localStorage when Supabase is not configured
useStore.subscribe((state) => {
  if (!isSupabaseConfigured() && state.initialized) {
    saveToLS(state);
  }
});
