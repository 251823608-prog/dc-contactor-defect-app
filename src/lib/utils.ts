import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function generateRecordNumber(date: Date, index: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(index).padStart(3, '0');
  return `NG-${y}${m}${d}-${seq}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function extractPlainText(json: Record<string, unknown>): string {
  const texts: string[] = [];
  function walk(node: Record<string, unknown>) {
    if (node.text && typeof node.text === 'string') {
      texts.push(node.text);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content as Record<string, unknown>[]) {
        walk(child);
      }
    }
  }
  walk(json);
  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Replace metadata placeholder text in ProseMirror JSON content */
export function injectMetadataIntoContent(
  content: Record<string, unknown>,
  field: 'productModel' | 'defectCategory',
  value: string,
): Record<string, unknown> {
  const placeholderMap: Record<string, string> = {
    productModel: '产品型号',
    defectCategory: '缺陷分类',
  };
  const prefix = placeholderMap[field];

  function walk(node: Record<string, unknown>): Record<string, unknown> {
    if (typeof node.text === 'string') {
      // Replace "产品型号：xxx" or "产品型号: xxx" with updated value
      const regex = new RegExp(`${prefix}[：:]\\s*.*`, 'g');
      if (regex.test(node.text)) {
        return { ...node, text: node.text.replace(regex, value ? `${prefix}：${value}` : `${prefix}：待填写`) };
      }
    }
    if (Array.isArray(node.content)) {
      return { ...node, content: (node.content as Record<string, unknown>[]).map(walk) };
    }
    return node;
  }

  return walk(content);
}
