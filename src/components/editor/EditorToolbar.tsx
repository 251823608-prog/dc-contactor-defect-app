import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Code, Quote,
  List, ListOrdered, CheckSquare,
  Heading1, Heading2, Heading3,
  Minus, Table, Undo, Redo, Highlighter, Pilcrow,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (e: Editor) => void;
  isActive?: (e: Editor) => boolean;
  can?: (e: Editor) => boolean;
}

const groups: ToolbarButton[][] = [
  [
    { label: '撤销', icon: Undo, action: (e) => e.chain().focus().undo().run(), can: (e) => e.can().undo() },
    { label: '重做', icon: Redo, action: (e) => e.chain().focus().redo().run(), can: (e) => e.can().redo() },
  ],
  [
    { label: '正文', icon: Pilcrow, action: (e) => e.chain().focus().setParagraph().run(), isActive: (e) => e.isActive('paragraph') },
    { label: 'H1', icon: Heading1, action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive('heading', { level: 1 }) },
    { label: 'H2', icon: Heading2, action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive('heading', { level: 2 }) },
    { label: 'H3', icon: Heading3, action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive('heading', { level: 3 }) },
  ],
  [
    { label: '加粗', icon: Bold, action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive('bold') },
    { label: '斜体', icon: Italic, action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive('italic') },
    { label: '下划线', icon: Underline, action: (e) => e.chain().focus().toggleUnderline().run(), isActive: (e) => e.isActive('underline') },
    { label: '高亮', icon: Highlighter, action: (e) => e.chain().focus().toggleHighlight().run(), isActive: (e) => e.isActive('highlight') },
    { label: '代码', icon: Code, action: (e) => e.chain().focus().toggleCode().run(), isActive: (e) => e.isActive('code') },
  ],
  [
    { label: '无序列表', icon: List, action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive('bulletList') },
    { label: '有序列表', icon: ListOrdered, action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive('orderedList') },
    { label: '待办', icon: CheckSquare, action: (e) => e.chain().focus().toggleTaskList().run(), isActive: (e) => e.isActive('taskList') },
    { label: '引用', icon: Quote, action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive('blockquote') },
  ],
  [
    { label: '分割线', icon: Minus, action: (e) => e.chain().focus().setHorizontalRule().run() },
    { label: '表格', icon: Table, action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  ],
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-slate-100 bg-white overflow-x-auto shrink-0">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-4 bg-slate-100 mx-1" />}
          {group.map((btn) => {
            const active = btn.isActive ? btn.isActive(editor) : false;
            const disabled = btn.can ? !btn.can(editor) : false;
            return (
              <button
                key={btn.label}
                title={btn.label}
                className={cn(
                  'p-1.5 rounded-md transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                  active && 'bg-slate-100 text-slate-800',
                  disabled && 'opacity-20 pointer-events-none'
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  btn.action(editor);
                }}
              >
                <btn.icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
