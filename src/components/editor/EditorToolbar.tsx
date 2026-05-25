import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Code, Quote,
  List, ListOrdered, CheckSquare, Heading1, Heading2, Heading3,
  Code2, Minus, Image, Table, Undo, Redo, Highlighter, Pilcrow,
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
    { label: '撤销', icon: Undo, action: (e: Editor) => e.chain().focus().undo().run(), can: (e: Editor) => e.can().undo() },
    { label: '重做', icon: Redo, action: (e: Editor) => e.chain().focus().redo().run(), can: (e: Editor) => e.can().redo() },
  ],
  [
    { label: '段落', icon: Pilcrow, action: (e: Editor) => e.chain().focus().setParagraph().run(), isActive: (e: Editor) => e.isActive('paragraph') },
    { label: '标题1', icon: Heading1, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e: Editor) => e.isActive('heading', { level: 1 }) },
    { label: '标题2', icon: Heading2, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e: Editor) => e.isActive('heading', { level: 2 }) },
    { label: '标题3', icon: Heading3, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e: Editor) => e.isActive('heading', { level: 3 }) },
  ],
  [
    { label: '加粗', icon: Bold, action: (e: Editor) => e.chain().focus().toggleBold().run(), isActive: (e: Editor) => e.isActive('bold') },
    { label: '斜体', icon: Italic, action: (e: Editor) => e.chain().focus().toggleItalic().run(), isActive: (e: Editor) => e.isActive('italic') },
    { label: '下划线', icon: Underline, action: (e: Editor) => e.chain().focus().toggleUnderline().run(), isActive: (e: Editor) => e.isActive('underline') },
    { label: '高亮', icon: Highlighter, action: (e: Editor) => e.chain().focus().toggleHighlight().run(), isActive: (e: Editor) => e.isActive('highlight') },
    { label: '代码', icon: Code, action: (e: Editor) => e.chain().focus().toggleCode().run(), isActive: (e: Editor) => e.isActive('code') },
  ],
  [
    { label: '无序列表', icon: List, action: (e: Editor) => e.chain().focus().toggleBulletList().run(), isActive: (e: Editor) => e.isActive('bulletList') },
    { label: '有序列表', icon: ListOrdered, action: (e: Editor) => e.chain().focus().toggleOrderedList().run(), isActive: (e: Editor) => e.isActive('orderedList') },
    { label: '待办清单', icon: CheckSquare, action: (e: Editor) => e.chain().focus().toggleTaskList().run(), isActive: (e: Editor) => e.isActive('taskList') },
    { label: '引用', icon: Quote, action: (e: Editor) => e.chain().focus().toggleBlockquote().run(), isActive: (e: Editor) => e.isActive('blockquote') },
    { label: '代码块', icon: Code2, action: (e: Editor) => e.chain().focus().toggleCodeBlock().run(), isActive: (e: Editor) => e.isActive('codeBlock') },
  ],
  [
    { label: '分割线', icon: Minus, action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
    { label: '图片', icon: Image, action: (e: Editor) => {
      const url = prompt('输入图片 URL:');
      if (url) e.chain().focus().setImage({ src: url }).run();
    }},
    { label: '表格', icon: Table, action: (e: Editor) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  ],
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-white overflow-x-auto shrink-0">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-5 bg-slate-200 mx-1.5" />}
          {group.map((btn) => {
            const active = btn.isActive ? btn.isActive(editor) : false;
            const disabled = btn.can ? !btn.can(editor) : false;
            return (
              <button
                key={btn.label}
                title={btn.label}
                className={cn(
                  'p-1.5 rounded-md transition-colors text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                  active && 'bg-blue-100 text-blue-700',
                  disabled && 'opacity-30 pointer-events-none'
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  btn.action(editor);
                }}
              >
                <btn.icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      ))}

      {/* Word count */}
      <div className="ml-auto text-[10px] text-slate-400 shrink-0">
        {editor.getText().length ?? 0} 字
      </div>
    </div>
  );
}
