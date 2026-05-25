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
import { FileText } from 'lucide-react';

export function Editor() {
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
        placeholder: '输入 "/" 选择块类型，或直接开始记录不良品信息...',
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

  // Auto-save every 30 seconds
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

  // Reload content when switching records or when content is updated externally
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
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white">
        <FileText className="w-16 h-16 mb-3 opacity-30" />
        <p className="text-base font-medium">选择一个记录开始编辑</p>
        <p className="text-sm mt-1">从左侧文件夹中点击一条记录，或新建一条记录</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Record header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
        <div className="flex-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">
            {record.recordNumber} · {record.recordDate}
          </div>
          <input
            className="text-base font-semibold text-slate-800 w-full bg-transparent outline-none mt-0.5"
            value={record.title}
            onChange={(e) => useStore.getState().updateRecord(record.id, { title: e.target.value })}
          />
        </div>
        {record.tags.length > 0 && (
          <div className="flex gap-1">
            {record.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status bar */}
      <div className="h-7 bg-slate-50 border-t border-slate-100 flex items-center px-4 text-[10px] text-slate-400 gap-3 shrink-0">
        <span>已自动保存</span>
        <span>·</span>
        <span>字数: {editor?.getText().length || 0}</span>
        {record.productModel && (<><span>·</span><span>{record.productModel}</span></>)}
        {record.processStation && (<><span>·</span><span>{record.processStation}</span></>)}
      </div>
    </div>
  );
}
