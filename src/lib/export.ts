import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';
import type { RecordItem } from '../types';
import { SEVERITY_OPTIONS, DISPOSITION_OPTIONS } from './constants';

const COLUMNS = [
  { key: 'recordNumber', label: '编号', w: 14 },
  { key: 'title', label: '标题', w: 28 },
  { key: 'recordDate', label: '日期', w: 12 },
  { key: 'productModel', label: '产品型号', w: 14 },
  { key: 'processStation', label: '工序', w: 10 },
  { key: 'defectCategory', label: '缺陷分类', w: 20 },
  { key: 'severity', label: '严重程度', w: 10 },
  { key: 'disposition', label: '处理决策', w: 10 },
  { key: 'responsiblePerson', label: '责任人', w: 10 },
  { key: 'workOrderNumber', label: '工单号', w: 14 },
  { key: 'tags', label: '标签', w: 20 },
  { key: 'plainText', label: '内容摘要', w: 40 },
];

function getSeverityLabel(value: string) {
  return SEVERITY_OPTIONS.find((s) => s.value === value)?.label || value;
}

function getDispositionLabel(value: string) {
  return DISPOSITION_OPTIONS.find((d) => d.value === value)?.label || value;
}

function recordToRow(r: RecordItem): Record<string, string> {
  return {
    recordNumber: r.recordNumber,
    title: r.title,
    recordDate: r.recordDate,
    productModel: r.productModel,
    processStation: r.processStation,
    defectCategory: r.defectCategory,
    severity: getSeverityLabel(r.severity),
    disposition: getDispositionLabel(r.disposition),
    responsiblePerson: r.responsiblePerson,
    workOrderNumber: r.workOrderNumber,
    tags: r.tags.join(', '),
    plainText: r.plainText.slice(0, 500),
  };
}

export function exportToExcel(records: RecordItem[], filename?: string) {
  const rows = records.map(recordToRow);

  const headerRow: Record<string, string> = {};
  for (const col of COLUMNS) {
    headerRow[col.label] = col.label;
  }

  const data = [headerRow];
  for (const row of rows) {
    const mapped: Record<string, string> = {};
    for (const col of COLUMNS) {
      mapped[col.label] = row[col.key] || '';
    }
    data.push(mapped);
  }

  const ws = XLSX.utils.json_to_sheet(data, { header: COLUMNS.map((c) => c.label), skipHeader: true });
  ws['!cols'] = COLUMNS.map((c) => ({ wch: c.w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '不良品记录');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename || `不良品记录_${date}.xlsx`);
}

export function exportToCSV(records: RecordItem[], filename?: string) {
  const rows = records.map(recordToRow);
  const header = COLUMNS.map((c) => c.label).join(',');

  const body = rows
    .map((row) =>
      COLUMNS.map((c) => {
        const val = (row[c.key] || '').replace(/"/g, '""');
        return /[,"\n]/.test(val) ? `"${val}"` : val;
      }).join(',')
    )
    .join('\n');

  const bom = '﻿';
  const csv = bom + header + '\n' + body;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = filename || `不良品记录_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToWord(records: RecordItem[], filename?: string) {
  const rows = records.map(recordToRow);
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const headerCell = (text: string, width?: number) =>
    new TableCell({
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, font: 'Microsoft YaHei' })], alignment: AlignmentType.CENTER })],
      shading: { fill: 'F8FAFC' },
      borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
    });
  const dataCell = (text: string) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: text || '-', size: 18, font: 'Microsoft YaHei' })] })],
      borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
    });

  const headerCells = COLUMNS.map((c) => headerCell(c.label));
  const tableRows = [
    new TableRow({ children: headerCells, tableHeader: true }),
    ...rows.map((row) =>
      new TableRow({
        children: COLUMNS.map((c) => dataCell(row[c.key] || '')),
      })
    ),
  ];

  const table = new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Microsoft YaHei', size: 18 } } },
    },
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: '不良品记录报表', bold: true, size: 32, font: 'Microsoft YaHei' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `导出日期：${new Date().toISOString().slice(0, 10)}  共 ${records.length} 条`, size: 20, font: 'Microsoft YaHei', color: '64748B' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        table,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = filename || `不良品记录_${date}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
