// 统计工具函数
import type { Project, DailyRecord, DateData, AppData, ProjectCategory } from '@/types';
import { CATEGORY_COLORS } from '@/types';
import { checkProjectCompleted, groupProjectsByCategory } from './utils-project';

export { groupProjectsByCategory };

// 时间段类型
export type TimeRange = '近7天' | '本周' | '上周' | '本月' | '上月';

// 获取日期范围
export function getDateRange(timeRange: TimeRange): { start: string; end: string } {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  switch (timeRange) {
    case '近7天': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: start.toISOString().split('T')[0], end: todayStr };
    }
    case '本周': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek + 1); // 周一
      return { start: start.toISOString().split('T')[0], end: todayStr };
    }
    case '上周': {
      const dayOfWeek = today.getDay();
      const end = new Date(today);
      end.setDate(today.getDate() - dayOfWeek); // 上周日
      const start = new Date(end);
      start.setDate(end.getDate() - 6); // 上周一
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    case '本月': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: start.toISOString().split('T')[0], end: todayStr };
    }
    case '上月': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    default:
      return { start: todayStr, end: todayStr };
  }
}

// 获取日期列表
export function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// 获取周视图日期（周一到周日）
export function getWeekDates(date: string): string[] {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek + 1);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    dates.push(current.toISOString().split('T')[0]);
  }
  return dates;
}

// 获取项目在某日的完成状态
export function getProjectCompletionStatus(
  project: Project,
  records: Record<string, DateData>,
  date: string
): 'completed' | 'incomplete' | 'unrecorded' {
  const dateData = records[date];
  if (!dateData || !dateData.records[project.id]) {
    return 'unrecorded';
  }
  const record = dateData.records[project.id];
  const isCompleted = checkProjectCompleted(project, record);
  return isCompleted ? 'completed' : 'incomplete';
}

// 计算连续打卡天数
export function calculateStreak(
  project: Project,
  records: Record<string, DateData>,
  includeToday: boolean
): number {
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let checkDate = new Date();

  // 如果今天已完成且需要包含今天
  if (includeToday) {
    const todayData = records[today];
    if (todayData && todayData.records[project.id]) {
      const record = todayData.records[project.id];
      if (checkProjectCompleted(project, record)) {
        streak++;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1); // 从昨天开始
  }

  // 向前追溯
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dateData = records[dateStr];

    if (!dateData || !dateData.records[project.id]) {
      break;
    }

    const record = dateData.records[project.id];
    if (checkProjectCompleted(project, record)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// 计算某日的完成度百分比
export function calculateDayCompletion(
  projects: Project[],
  records: Record<string, DateData>,
  date: string
): number {
  const enabledProjects = projects.filter((p) => p.enabled);
  if (enabledProjects.length === 0) return 0;

  const dateData = records[date];
  let completed = 0;

  enabledProjects.forEach((project) => {
    if (dateData && dateData.records[project.id]) {
      const record = dateData.records[project.id];
      if (checkProjectCompleted(project, record)) {
        completed++;
      }
    }
  });

  return Math.round((completed / enabledProjects.length) * 100);
}

// 获取完成度对应的颜色深度
export function getCompletionColor(
  percentage: number,
  baseColor: string
): string {
  if (percentage === 0) return '#f3f4f6'; // gray-100
  if (percentage < 50) return baseColor + '40'; // 25% opacity
  if (percentage < 80) return baseColor + '80'; // 50% opacity
  if (percentage < 100) return baseColor + 'bf'; // 75% opacity
  return baseColor; // 100%
}

// 计算月度统计
export function calculateMonthStats(
  projects: Project[],
  records: Record<string, DateData>,
  year: number,
  month: number
): { dailyCompletion: Record<string, number>; averageCompletion: number } {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyCompletion: Record<string, number> = {};
  let totalCompletion = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const completion = calculateDayCompletion(projects, records, dateStr);
    dailyCompletion[dateStr] = completion;
    totalCompletion += completion;
  }

  const averageCompletion = Math.round(totalCompletion / daysInMonth);
  return { dailyCompletion, averageCompletion };
}

// 计算数值型项目近7天趋势
export function calculateNumericTrend(
  project: Project,
  records: Record<string, DateData>,
  days: number = 7
): { dates: string[]; values: (number | null)[]; average: number; 达标天数: number } {
  const dates: string[] = [];
  const values: (number | null)[] = [];
  const today = new Date();
  let sum = 0;
  let count = 0;
  let 达标天数 = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr);

    const dateData = records[dateStr];
    if (dateData && dateData.records[project.id]) {
      const record = dateData.records[project.id];
      const val = typeof record.value === 'number' ? record.value : null;
      values.push(val);

      if (val !== null) {
        sum += val;
        count++;
        if (checkProjectCompleted(project, record)) {
          达标天数++;
        }
      }
    } else {
      values.push(null);
    }
  }

  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  return { dates, values, average, 达标天数 };
}

// 获取月份日历数据（用于热力图）
export function getMonthCalendar(
  year: number,
  month: number
): { date: string; dayOfWeek: number; week: number }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const calendar: { date: string; dayOfWeek: number; week: number }[] = [];
  let week = 0;

  // 填充月初空白
  for (let i = 0; i < startDayOfWeek; i++) {
    calendar.push({ date: '', dayOfWeek: i, week: 0 });
  }

  // 填充日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    if (dayOfWeek === 0 && day > 1) {
      week++;
    }

    calendar.push({ date: dateStr, dayOfWeek, week });
  }

  return calendar;
}

// 计算本月已完成天数
export function calculateMonthCompletedDays(
  projects: Project[],
  records: Record<string, DateData>
): { completed: number; total: number } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = today.getDate();

  let completed = 0;

  for (let day = 1; day <= currentDay; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const completion = calculateDayCompletion(projects, records, dateStr);
    if (completion === 100) {
      completed++;
    }
  }

  return { completed, total: currentDay };
}
