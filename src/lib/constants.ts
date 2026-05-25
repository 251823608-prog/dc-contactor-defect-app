import type { DefectCategory, Severity, Disposition } from '../types';

export const PRODUCT_MODELS = [
  { value: '陶瓷1000', label: '陶瓷1000', spec: '', app: '' },
];

export const PROCESS_STATIONS = [
  'S1 装下短路板',
  'S2 装动触头组件',
  'S3 装动铁芯组件',
  'S4 动铁芯组件烘烤',
  'S5 机械参数检查',
  'S6 激光焊接',
  'M13 剪切',
  'M14 检漏',
  'S7 压轴套',
  'S8 绕线圈',
  'S9 搪锡',
  'S10 电阻测试',
  'M1 总装 (劈铆)',
  'M2 测线圈耐压',
  'M16 测触点耐压',
  'S11 焊转接板端子',
  'S12 剥线',
  'S13 拧线沾锡',
  'S14 焊节能板引线',
  'M3 焊辅助转接板',
  'M3-1 焊节能板',
  'M4 装磁钢',
  'M5 内芯性能测试',
  'M5-1 内腔检漏',
  'M6 涂胶装外壳',
  'S15 打磨铜排',
  'M7 装铜排',
  'M8 半成品测试',
  'M9 装底板',
  'M10 烘烤',
  'S17 铆端子',
  'S18 端子插胶壳',
  'M11 插端子',
  'M15 机械老化',
  'M17 成品综测',
  'M12 装上盖',
  'M18 外观检查',
  'M19 入库抽检',
  'M20 入库包装',
  'M21 贴标签',
  'M23 出库抽验',
  'M24 出货包装',
];

export const DEFECT_CATEGORIES: DefectCategory[] = [
  {
    name: '接触系统缺陷',
    children: [
      { name: '接触电阻超标' },
      { name: '触点熔焊' },
      { name: '触点烧蚀/磨损' },
      { name: '触点间隙异常' },
      { name: '触点压力不足' },
    ],
  },
  {
    name: '电磁系统缺陷',
    children: [
      { name: '线圈断路' },
      { name: '线圈短路' },
      { name: '线圈电阻偏差' },
      { name: '铁芯卡滞/异响' },
      { name: '衔铁吸合不良' },
    ],
  },
  {
    name: '灭弧系统缺陷',
    children: [
      { name: '灭弧室破损' },
      { name: '灭弧栅片变形' },
      { name: '灭弧材料异常' },
      { name: '灭弧能力不足' },
    ],
  },
  {
    name: '机械结构缺陷',
    children: [
      { name: '弹簧疲劳/断裂' },
      { name: '机构卡死/动作不灵活' },
      { name: '外壳裂纹/破损' },
      { name: '端子松动/脱落' },
      { name: '紧固件缺失' },
    ],
  },
  {
    name: '电气性能缺陷',
    children: [
      { name: '绝缘电阻不合格' },
      { name: '介电强度击穿' },
      { name: '吸合电压异常' },
      { name: '释放电压异常' },
      { name: '温升超标' },
      { name: '线圈功耗异常' },
    ],
  },
  {
    name: '外观缺陷',
    children: [
      { name: '表面划痕' },
      { name: '漆面剥落/气泡' },
      { name: '氧化/锈蚀' },
      { name: '标识不清/错误' },
      { name: '包装损伤' },
    ],
  },
];

export const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: 'CRITICAL', label: '致命', color: '#DC2626' },
  { value: 'MAJOR', label: '严重', color: '#EA580C' },
  { value: 'MINOR', label: '一般', color: '#CA8A04' },
  { value: 'TRIVIAL', label: '轻微', color: '#16A34A' },
];

export const DISPOSITION_OPTIONS: { value: Disposition; label: string }[] = [
  { value: 'SCRAP', label: '报废' },
  { value: 'REWORK', label: '返工' },
  { value: 'CONCESSION', label: '让步接收' },
  { value: 'RETURN', label: '退货' },
];

export function getSeverityInfo(severity: Severity) {
  return SEVERITY_OPTIONS.find((s) => s.value === severity) || SEVERITY_OPTIONS[2];
}

export function getDispositionLabel(disposition: Disposition): string {
  return DISPOSITION_OPTIONS.find((d) => d.value === disposition)?.label || disposition;
}

export function flattenDefectCategories(categories: DefectCategory[], prefix = ''): string[] {
  const result: string[] = [];
  for (const cat of categories) {
    const path = prefix ? `${prefix}/${cat.name}` : cat.name;
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenDefectCategories(cat.children, path));
    } else {
      result.push(path);
    }
  }
  return result;
}
