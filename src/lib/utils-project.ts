// 项目工具函数
import type { Project, DailyRecord, ProjectStatus, ProjectCategory } from '@/types';
import { CATEGORY_COLORS } from '@/types';

// 检查项目是否完成
export function checkProjectCompleted(project: Project, record: DailyRecord | null): boolean {
  if (!record || record.value === null) return false;

  // 记录型项目：有记录即完成
  if (project.projectType === '记录型') {
    if (project.measureType === '是否型') {
      return record.value === true;
    }
    if (project.measureType === '数值型') {
      return typeof record.value === 'number' && record.value > 0;
    }
    if (project.measureType === '文本型') {
      return typeof record.value === 'string' && record.value.trim().length > 0;
    }
    return false;
  }

  // 目标型项目
  if (project.measureType === '是否型') {
    return record.value === true;
  }

  if (project.measureType === '数值型') {
    const val = typeof record.value === 'number' ? record.value : 0;

    switch (project.targetType) {
      case '下限型':
        return project.targetValue !== undefined && val >= project.targetValue;
      case '上限型':
        return project.targetValue !== undefined && val <= project.targetValue;
      case '区间型':
        return (
          project.targetMin !== undefined &&
          project.targetMax !== undefined &&
          val >= project.targetMin &&
          val <= project.targetMax
        );
      default:
        return val > 0;
    }
  }

  return false;
}

// 检查是否超标（仅上限型项目）
export function checkOverLimit(project: Project, record: DailyRecord | null): boolean {
  if (!record || project.projectType !== '目标型' || project.targetType !== '上限型') {
    return false;
  }
  if (project.measureType !== '数值型') return false;

  const val = typeof record.value === 'number' ? record.value : 0;
  return project.targetValue !== undefined && val > project.targetValue;
}

// 计算进度百分比
export function calculateProgress(project: Project, record: DailyRecord | null): number {
  if (!record || record.value === null) return 0;

  if (project.measureType === '是否型') {
    return record.value === true ? 100 : 0;
  }

  if (project.measureType === '数值型') {
    const val = typeof record.value === 'number' ? record.value : 0;

    if (project.targetType === '下限型' && project.targetValue) {
      return Math.min(100, (val / project.targetValue) * 100);
    }
    if (project.targetType === '上限型' && project.targetValue) {
      return project.targetValue > 0 ? Math.min(100, (val / project.targetValue) * 100) : 0;
    }
    if (project.targetType === '区间型' && project.targetMin !== undefined && project.targetMax) {
      const mid = (project.targetMin + project.targetMax) / 2;
      return mid > 0 ? Math.min(100, (val / mid) * 100) : 0;
    }
  }

  return 0;
}

// 获取项目状态
export function getProjectStatus(project: Project, record: DailyRecord | null): ProjectStatus {
  const isCompleted = checkProjectCompleted(project, record);
  const isOverLimit = checkOverLimit(project, record);
  const progress = calculateProgress(project, record);

  let currentValue: number | string | undefined;
  if (record && record.value !== null) {
    currentValue = record.value as number | string;
  }

  return {
    project,
    record,
    isCompleted,
    isOverLimit,
    currentValue,
    targetValue: project.targetValue,
    progress,
  };
}

// 获取分类颜色
export function getCategoryColor(category: ProjectCategory): string {
  return CATEGORY_COLORS[category] || '#6b7280';
}

// 格式化显示值
export function formatDisplayValue(
  value: boolean | number | string | null,
  measureType: string,
  unit: string
): string {
  if (value === null) return '-';

  if (measureType === '是否型') {
    return value === true ? '已完成' : '未完成';
  }

  if (measureType === '数值型') {
    const num = typeof value === 'number' ? value : parseFloat(value as string);
    if (isNaN(num)) return '-';
    return unit ? `${num}${unit}` : String(num);
  }

  return String(value);
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 按分类分组项目
export function groupProjectsByCategory(projects: Project[]): Record<ProjectCategory, Project[]> {
  const grouped: Record<string, Project[]> = {};

  projects.forEach((p) => {
    if (!grouped[p.category]) {
      grouped[p.category] = [];
    }
    grouped[p.category].push(p);
  });

  // 按 sort 排序
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => a.sort - b.sort);
  });

  return grouped as Record<ProjectCategory, Project[]>;
}

// 检查连续未记录天数
export function checkConsecutiveMissing(
  records: Record<string, { records: Record<string, DailyRecord> }>,
  pid: string,
  currentDate: string,
  days: number
): boolean {
  const current = new Date(currentDate);

  for (let i = 1; i <= days; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dateData = records[dateStr];

    if (!dateData || !dateData.records[pid] || dateData.records[pid].value === null) {
      if (i === days) return true;
    } else {
      return false;
    }
  }

  return false;
}

// 检查连续未达标天数
export function checkConsecutiveFailed(
  records: Record<string, { records: Record<string, DailyRecord> }>,
  project: Project,
  currentDate: string,
  days: number
): boolean {
  const current = new Date(currentDate);
  const pid = project.id;

  for (let i = 1; i <= days; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dateData = records[dateStr];

    if (!dateData || !dateData.records[pid]) {
      if (i === days) return true;
      continue;
    }

    const record = dateData.records[pid];
    const isCompleted = checkProjectCompleted(project, record);

    if (isCompleted) {
      return false;
    } else if (i === days) {
      return true;
    }
  }

  return false;
}
