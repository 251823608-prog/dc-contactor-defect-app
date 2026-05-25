import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import ImageExtension from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { EditorToolbar } from './EditorToolbar';
import { SlidersHorizontal } from 'lucide-react';

export function Editor({ onOpenMeta }: { onOpenMeta?: () => void }) {
  const selectedRecordId = useStore((s) => s.selectedRecordId);
  const records = useStore((s) => s.records);
  const record = records.find((r) => r.id === selectedRecordId) || null;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: '开始记录不良品信息...',
      }),
      Highlight,
      ImageExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: record?.content || { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: !record?.isArchived,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
    onUpdate: ({ editor }) => {
      const currentId = useStore.getState().selectedRecordId;
      const current = currentId ? useStore.getState().records.find((r) => r.id === currentId) : null;
      if (current && !current.isTemplate) {
        useStore.getState().saveRecordContent(current.id, editor.getJSON());
      }
    },
    onCreate: ({ editor }) => {
      const state = useStore.getState();
      const rec = state.records.find((r) => r.id === state.selectedRecordId);
      if (rec?.content && Object.keys(rec.content).length > 1) {
        editor.commands.setContent(rec.content);
      }
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      if (editor && state.selectedRecordId) {
        const rec = state.records.find((r) => r.id === state.selectedRecordId);
        if (rec && !rec.isTemplate) {
          state.saveRecordContent(rec.id, editor.getJSON());
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [editor]);

  useEffect(() => {
    if (editor && record) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const recordJSON = JSON.stringify(record.content);
      if (currentJSON !== recordJSON) {
        editor.commands.setContent(record.content || { type: 'doc', content: [{ type: 'paragraph' }] });
      }
    }
  }, [record?.id, record?.content]);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-[14px] font-medium text-slate-400">选择一条记录开始编辑</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Record header */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
        <div className="flex-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            {record.recordNumber} &middot; {record.recordDate}
          </div>
          <input
            className="text-[15px] font-semibold text-slate-800 w-full bg-transparent outline-none mt-0.5 placeholder:text-slate-300"
            value={record.title}
            onChange={(e) => useStore.getState().updateRecord(record.id, { title: e.target.value })}
          />
        </div>
        {record.tags.length > 0 && (
          <div className="flex gap-1">
            {record.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                {t}
              </span>
            ))}
          </div>
        )}
        {onOpenMeta && (
          <button
            className="mobile-only p-1.5 text-slate-400 hover:text-slate-600 active:bg-slate-50 rounded-lg transition-colors"
            onClick={onOpenMeta}
            title="属性"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      <EditorToolbar editor={editor} />

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status bar */}
      <div className="h-7 bg-white border-t border-slate-50 flex items-center px-6 text-[10px] text-slate-300 gap-3 shrink-0">
        <span>已自动保存</span>
        <span>{editor?.getText().length || 0} 字</span>
        {record.productModel && <span>{record.productModel}</span>}
        {record.processStation && <span>{record.processStation}</span>}
      </div>
    </div>
  );
}
