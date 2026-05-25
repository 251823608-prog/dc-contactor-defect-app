export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isTemplateFolder: boolean;
  createdAt: string;
}

export interface RecordItem {
  id: string;
  recordNumber: string;
  title: string;
  content: Record<string, unknown>;
  plainText: string;
  folderId: string;

  recordDate: string;
  productModel: string;
  processStation: string;
  defectCategory: string;
  severity: Severity;
  disposition: Disposition;
  responsiblePerson: string;
  workOrderNumber: string;
  tags: string[];

  isArchived: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrashItem {
  id: string;
  originalId: string;
  itemType: 'RECORD' | 'FOLDER';
  originalName: string;
  originalParentId: string | null;
  deletedAt: string;
  originalData?: Folder | RecordItem;
}

export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';
export type Disposition = 'SCRAP' | 'REWORK' | 'CONCESSION' | 'RETURN';

export interface DefectCategory {
  name: string;
  children?: DefectCategory[];
}

export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  severity: Severity;
  tags: string[];
  sourceRecordIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'list' | 'editor';
export type MainView = 'records' | 'dashboard' | 'knowledge';
