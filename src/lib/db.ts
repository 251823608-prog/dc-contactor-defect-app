import type { Folder, RecordItem, KnowledgeEntry, TrashItem } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_FOLDERS, MOCK_RECORDS } from '../data/mock';

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
    disposition: r.disposition, responsible_person: r.responsiblePerson, work_order_number: r.workOrderNumber,
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
    disposition: (row.disposition as never) || 'REWORK', responsiblePerson: (row.responsible_person as string) || '',
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
      console.warn('Supabase load failed, falling back to local', fRes.error || rRes.error);
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
  if (!isSupabaseConfigured()) return;
  try { await op(); } catch { /* silent fail — local state is primary */ }
}

export async function upsertFolder(f: Folder): Promise<void> {
  await tryOp(() => supabase.from('folders').upsert(folderToRow(f)));
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

// ── Seed initial data to empty Supabase ──
export async function seedIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { count } = await supabase.from('records').select('*', { count: 'exact', head: true });
    if (count === 0) {
      await Promise.all([
        ...MOCK_FOLDERS.map((f) => supabase.from('folders').insert(folderToRow(f))),
        ...MOCK_RECORDS.map((r) => supabase.from('records').insert(recordToRow(r))),
      ]);
      console.log('Seeded initial data to Supabase');
    }
  } catch { /* ignore */ }
}
