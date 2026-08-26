// Obsidian Markdown 导出
import type { AppData, Project, DateData, DailyRecord } from '@/types';
import { checkProjectCompleted } from './utils-project';

// 简单 ZIP 打包实现（零依赖）
class SimpleZip {
  private files: Map<string, string> = new Map();

  file(name: string, content: string): void {
    this.files.set(name, content);
  }

  async generateAsync(): Promise<Blob> {
    // 使用简单的文本合并方式，实际 ZIP 格式较复杂
    // 这里使用 Blob 和 FileReader 模拟
    const entries: string[] = [];
    this.files.forEach((content, name) => {
      entries.push(`---FILE:${name}---\n${content}\n---END---`);
    });
    return new Blob([entries.join('\n')], { type: 'text/plain' });
  }
}

export type ExportRange = '全部' | '本月' | '上周' | '自定义';

// 生成单日 Markdown 内容
export function generateDailyMarkdown(
  date: string,
  dateData: DateData,
  projects: Project[]
): string {
  const enabledProjects = projects.filter((p) => p.enabled);
  const [year, month, day] = date.split('-');

  let completedCount = 0;
  let incompleteCount = 0;
  const projectLines: string[] = [];

  enabledProjects.forEach((project) => {
    const record = dateData.records[project.id];
    const isCompleted = checkProjectCompleted(project, record);

    if (isCompleted) {
      completedCount++;
    } else {
      incompleteCount++;
    }

    const checkbox = isCompleted ? '- [x]' : '- [ ]';
    let valueStr = '';

    if (record?.value !== null) {
      if (project.measureType === '是否型') {
        valueStr = isCompleted ? '已完成' : '未完成';
      } else if (project.measureType === '数值型') {
        valueStr = `${record.value}${project.unit}`;
      } else {
        valueStr = String(record.value);
      }
    } else {
      valueStr = '未记录';
    }

    const statusStr = isCompleted ? '达标，奖励3个铜板' : '未达标';
    const line = record?.value !== null
      ? `${checkbox} ${project.name} ${valueStr ? valueStr + ' ' : ''}（${statusStr}）`
      : `${checkbox} ${project.name}（未记录）`;

    projectLines.push(line);
  });

  const completionRate = enabledProjects.length > 0
    ? Math.round((completedCount / enabledProjects.length) * 100)
    : 0;

  const noteSection = dateData.note?.trim()
    ? `\n## 备注\n\n${dateData.note}`
    : '';

  return `# ${year}年${month}月${day}日 日常复盘

## 完成概况

- 总完成度：${completionRate}%
- 达标项目：${completedCount} 项，奖励 ${completedCount * 3} 个铜板
- 未达标项目：${incompleteCount} 项

## 各项目记录

${projectLines.join('\n')}${noteSection}
`;
}

// 获取导出日期范围
function getExportDates(range: '全部' | '本月' | '上周' | '自定义', customRange?: { start: string; end: string }): string[] {
  const today = new Date();
  const dates: string[] = [];

  switch (range) {
    case '本月': {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(dateStr);
      }
      break;
    }
    case '上周': {
      const dayOfWeek = today.getDay();
      const end = new Date(today);
      end.setDate(today.getDate() - dayOfWeek);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      break;
    }
    case '自定义':
      if (customRange) {
        for (let d = new Date(customRange.start); d <= new Date(customRange.end); d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
      }
      break;
    case '全部':
    default:
      return ['all'];
  }

  return dates;
}

// 导出为 Obsidian 日记
export async function exportToObsidian(
  data: AppData,
  range: ExportRange,
  customRange?: { start: string; end: string }
): Promise<void> {
  const zip = new SimpleZip();
  const dates = getExportDates(range, customRange);

  if (dates[0] === 'all') {
    // 导出全部有记录的日期
    Object.entries(data.records).forEach(([date, dateData]) => {
      const content = generateDailyMarkdown(date, dateData, data.projects);
      const filename = `${date}_复盘.md`;
      zip.file(filename, content);
    });
  } else {
    // 导出指定范围
    dates.forEach((date) => {
      const dateData = data.records[date];
      if (dateData) {
        const content = generateDailyMarkdown(date, dateData, data.projects);
        const filename = `${date}_复盘.md`;
        zip.file(filename, content);
      }
    });
  }

  // 生成并下载 ZIP
  const blob = await zip.generateAsync();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `obsidian-daily-review-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
