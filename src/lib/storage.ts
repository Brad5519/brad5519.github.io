// localStorage 数据管理
import type { AppData, Project, DailyRecord, DateData } from '@/types';
import { formatDateLocal } from './utils';

const STORAGE_KEY = 'daily-review-workbench-v1';

// 预置项目
export const PRESET_PROJECTS: Project[] = [
  {
    id: 'sleep',
    name: '睡眠时长',
    category: '运动健康',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '区间型',
    unit: '小时',
    targetMin: 7,
    targetMax: 9,
    cardColor: '#22c55e',
    sort: 0,
    enabled: true,
  },
  {
    id: 'weight',
    name: '体征-体重',
    category: '体征参数',
    measureType: '是否型',
    projectType: '记录型',
    targetType: '无目标',
    unit: '',
    cardColor: '#eab308',
    sort: 1,
    enabled: true,
  },
  {
    id: 'gcs',
    name: '体征-GCS',
    category: '体征参数',
    measureType: '是否型',
    projectType: '记录型',
    targetType: '无目标',
    unit: '',
    cardColor: '#eab308',
    sort: 2,
    enabled: true,
  },
  {
    id: 'bp',
    name: '体征-血压',
    category: '体征参数',
    measureType: '是否型',
    projectType: '记录型',
    targetType: '无目标',
    unit: '',
    cardColor: '#eab308',
    sort: 3,
    enabled: true,
  },
  {
    id: 'mood',
    name: '情绪签到',
    category: '体征参数',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '次',
    targetValue: 1,
    cardColor: '#eab308',
    sort: 4,
    enabled: true,
  },
  {
    id: 'fat-burn',
    name: '减脂时间',
    category: '运动健康',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '分钟',
    targetValue: 40,
    cardColor: '#22c55e',
    sort: 5,
    enabled: true,
  },
  {
    id: 'muscle',
    name: '增肌时间',
    category: '运动健康',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '分钟',
    targetValue: 40,
    cardColor: '#22c55e',
    sort: 6,
    enabled: true,
  },
  {
    id: 'water',
    name: '喝水量',
    category: '饮食管理',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '毫升',
    targetValue: 2000,
    cardColor: '#f97316',
    sort: 7,
    enabled: true,
  },
  {
    id: 'calories',
    name: '饮食热量',
    category: '饮食管理',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '上限型',
    unit: '千卡',
    targetValue: 1800,
    cardColor: '#f97316',
    sort: 8,
    enabled: true,
  },
  {
    id: 'words',
    name: '背单词',
    category: '学习成长',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '分钟',
    targetValue: 5,
    cardColor: '#3b82f6',
    sort: 9,
    enabled: true,
  },
  {
    id: 'calligraphy',
    name: '练字',
    category: '学习成长',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '行',
    targetValue: 5,
    cardColor: '#3b82f6',
    sort: 10,
    enabled: true,
  },
  {
    id: 'python',
    name: 'Python技能学习',
    category: '学习成长',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '分钟',
    targetValue: 5,
    cardColor: '#3b82f6',
    sort: 11,
    enabled: true,
  },
  {
    id: 'piano',
    name: '钢琴练习',
    category: '兴趣技能',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '分钟',
    targetValue: 5,
    cardColor: '#a855f7',
    sort: 12,
    enabled: true,
  },
  {
    id: 'video',
    name: '拍一段视频',
    category: '兴趣技能',
    measureType: '数值型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '分钟',
    targetValue: 10,
    cardColor: '#a855f7',
    sort: 13,
    enabled: true,
  },
];

// 生成昨天的日期
function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateLocal(d);
}

// 预置昨天数据
export function getPresetYesterdayData(): Record<string, DateData> {
  const yesterday = getYesterday();
  return {
    [yesterday]: {
      date: yesterday,
      records: {
        sleep: { projectId: 'sleep', date: yesterday, value: 7.5 },
        weight: { projectId: 'weight', date: yesterday, value: true },
        gcs: { projectId: 'gcs', date: yesterday, value: true },
        bp: { projectId: 'bp', date: yesterday, value: true },
        mood: { projectId: 'mood', date: yesterday, value: true },
        fitness: { projectId: 'fitness', date: yesterday, value: true },
        'fat-burn': { projectId: 'fat-burn', date: yesterday, value: 35 },
        muscle: { projectId: 'muscle', date: yesterday, value: 40 },
        water: { projectId: 'water', date: yesterday, value: 1750 },
        calories: { projectId: 'calories', date: yesterday, value: 1650 },
        words: { projectId: 'words', date: yesterday, value: true },
        calligraphy: { projectId: 'calligraphy', date: yesterday, value: 5 },
        piano: { projectId: 'piano', date: yesterday, value: 30 },
        video: { projectId: 'video', date: yesterday, value: 10 },
      },
      note: '',
    },
  };
}

// 初始化数据
export function initData(): AppData {
  return {
    projects: [...PRESET_PROJECTS],
    records: getPresetYesterdayData(),
  };
}

// 从 localStorage 加载数据
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AppData;
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return initData();
}

// 保存数据到 localStorage
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

// 导出数据为 JSON 文件
export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

// 从 JSON 导入数据
export function importData(json: string): AppData {
  return JSON.parse(json) as AppData;
}

// 清空数据
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 获取指定日期的数据
export function getDateData(records: Record<string, DateData>, date: string): DateData {
  return records[date] || { date, records: {}, note: '' };
}

// 保存指定日期的记录
export function saveDateRecord(
  records: Record<string, DateData>,
  date: string,
  projectId: string,
  value: boolean | number | string | null
): Record<string, DateData> {
  const dateData = getDateData(records, date);
  return {
    ...records,
    [date]: {
      ...dateData,
      records: {
        ...dateData.records,
        [projectId]: { projectId, date, value },
      },
    },
  };
}

// 保存指定日期的备注
export function saveDateNote(
  records: Record<string, DateData>,
  date: string,
  note: string
): Record<string, DateData> {
  const dateData = getDateData(records, date);
  return {
    ...records,
    [date]: {
      ...dateData,
      note,
    },
  };
}

// 复制昨天数据到今天
export function copyYesterdayToToday(
  records: Record<string, DateData>,
  today: string
): Record<string, DateData> {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateLocal(yesterday);
  const yesterdayData = getDateData(records, yesterdayStr);

  return {
    ...records,
    [today]: {
      date: today,
      records: { ...yesterdayData.records },
      note: '',
    },
  };
}

// 清空今天数据（休息模式）
export function clearTodayData(
  records: Record<string, DateData>,
  today: string,
  projects: Project[]
): Record<string, DateData> {
  const emptyRecords: Record<string, DailyRecord> = {};
  projects.forEach((p) => {
    emptyRecords[p.id] = { projectId: p.id, date: today, value: null };
  });

  return {
    ...records,
    [today]: {
      date: today,
      records: emptyRecords,
      note: '#cheatday',
    },
  };
}
