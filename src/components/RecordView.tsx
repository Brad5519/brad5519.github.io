import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon, Copy, Moon, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project, DateData, DailyRecord } from '@/types';
import { PRESET_TAGS, QUICK_ADD_VALUES } from '@/types';
import {
  getDateData,
  saveDateRecord,
  saveDateNote,
  copyYesterdayToToday,
  clearTodayData,
} from '@/lib/storage';
import { getCategoryColor, checkOverLimit, checkProjectCompleted } from '@/lib/utils-project';

interface RecordViewProps {
  projects: Project[];
  records: Record<string, DateData>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRecordsChange: (records: Record<string, DateData>) => void;
}

export function RecordView({
  projects,
  records,
  selectedDate,
  onDateChange,
  onRecordsChange,
}: RecordViewProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const todayData = useMemo(() => getDateData(records, selectedDate), [records, selectedDate]);

  const enabledProjects = useMemo(
    () => projects.filter((p) => p.enabled).sort((a, b) => a.sort - b.sort),
    [projects]
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(format(date, 'yyyy-MM-dd'));
      setCalendarOpen(false);
    }
  };

  const handleRecordChange = (projectId: string, value: boolean | number | string | null) => {
    const newRecords = saveDateRecord(records, selectedDate, projectId, value);
    onRecordsChange(newRecords);
  };

  const handleNoteChange = (note: string) => {
    const newRecords = saveDateNote(records, selectedDate, note);
    onRecordsChange(newRecords);
  };

  const handleCopyYesterday = () => {
    const newRecords = copyYesterdayToToday(records, selectedDate);
    onRecordsChange(newRecords);
  };

  const handleRestDay = () => {
    const newRecords = clearTodayData(records, selectedDate, projects);
    onRecordsChange(newRecords);
  };

  // 计算某一天的铜板数
  const calculateDayCoins = (dateStr: string): number => {
    const dayData = getDateData(records, dateStr);
    let completed = 0;
    enabledProjects.forEach((project) => {
      const record = dayData.records[project.id];
      if (checkProjectCompleted(project, record)) {
        completed++;
      }
    });
    return completed * 3; // 每项3铜板
  };

  // 计算最大铜板数（用于渐变计算）
  const maxCoins = enabledProjects.length * 3;

  // 获取日期背景色（柔和层级系统）
  const getDayVisual = (date: Date): { bg: string; border: string; text: string; showBadge: boolean } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const coins = calculateDayCoins(dateStr);
    const ratio = maxCoins > 0 ? coins / maxCoins : 0;

    if (coins === 0) {
      return { bg: 'transparent', border: 'transparent', text: '#9ca3af', showBadge: false };
    }
    if (ratio >= 1) {
      return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#7c3aed', showBadge: true };
    }
    if (ratio >= 0.6) {
      return { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', text: '#4f46e5', showBadge: true };
    }
    if (ratio >= 0.3) {
      return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.25)', text: '#2563eb', showBadge: true };
    }
    return { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.2)', text: '#16a34a', showBadge: true };
  };

  const addTag = (tag: string) => {
    const currentNote = todayData.note || '';
    if (!currentNote.includes(tag)) {
      handleNoteChange(currentNote ? `${currentNote} ${tag}` : tag);
    }
  };

  const renderProjectInput = (project: Project) => {
    const record = todayData.records[project.id];
    const value = record?.value ?? null;

    if (project.measureType === '是否型') {
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {value === true ? '已完成' : '未完成'}
          </span>
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => handleRecordChange(project.id, checked)}
          />
        </div>
      );
    }

    if (project.measureType === '数值型') {
      const numValue = typeof value === 'number' ? value : '';
      const isOver = checkOverLimit(project, record);
      const quickAdds = QUICK_ADD_VALUES[project.name] || [];

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={numValue}
              onChange={(e) =>
                handleRecordChange(project.id, e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder={`输入${project.unit}`}
              className={cn('flex-1', isOver && 'border-red-500 focus-visible:ring-red-500')}
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">{project.unit}</span>
          </div>
          {quickAdds.length > 0 && (
            <div className="flex gap-2">
              {quickAdds.map((add) => (
                <Button
                  key={add}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = typeof value === 'number' ? value : 0;
                    handleRecordChange(project.id, current + add);
                  }}
                  className="text-xs"
                >
                  <Plus size={12} className="mr-1" />
                  {add}{project.unit}
                </Button>
              ))}
            </div>
          )}
          {project.projectType === '目标型' && (
            <div className="text-xs text-gray-500">
              {project.targetType === '下限型' && `目标: ≥${project.targetValue}${project.unit}`}
              {project.targetType === '上限型' && (
                <span className={isOver ? 'text-red-500 font-medium' : ''}>
                  {numValue}/{project.targetValue}
                  {project.unit}
                  {isOver && ' (超标)'}
                </span>
              )}
              {project.targetType === '区间型' &&
                `目标: ${project.targetMin}-${project.targetMax}${project.unit}`}
            </div>
          )}
        </div>
      );
    }

    if (project.measureType === '文本型') {
      return (
        <Input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => handleRecordChange(project.id, e.target.value || null)}
          placeholder={project.placeholder || '请输入'}
          className="w-full"
        />
      );
    }

    return null;
  };

  const getCardStatus = (project: Project) => {
    const record = todayData.records[project.id];
    if (project.projectType === '记录型') {
      const hasValue = record?.value !== null && record?.value !== '';
      return hasValue ? 'recorded' : 'unrecorded';
    }
    const isCompleted = checkProjectCompleted(project, record);
    const isOver = checkOverLimit(project, record);
    if (isOver) return 'over';
    if (isCompleted) return 'completed';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">每日记录</h2>
        <div className="flex items-center gap-3">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(new Date(selectedDate), 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="start" style={{ maxWidth: '340px' }}>
              <div className="w-[320px] p-3">
                <Calendar
                  mode="single"
                  selected={new Date(selectedDate)}
                  onSelect={handleDateSelect}
                  initialFocus
                  weekStartsOn={1}
                  className="w-full"
                  modifiers={{
                    hasCoins: (date) => calculateDayCoins(format(date, 'yyyy-MM-dd')) > 0,
                  }}
                  modifiersStyles={{
                    hasCoins: {
                      backgroundColor: 'transparent',
                    },
                  }}
                  components={{
                    DayButton: ({ day, ...props }) => {
                      const visual = getDayVisual(day.date);
                      const coins = calculateDayCoins(format(day.date, 'yyyy-MM-dd'));
                      return (
                        <button
                          {...props}
                          style={{
                            ...props.style,
                            backgroundColor: visual.bg,
                            borderColor: visual.border,
                            color: visual.text,
                          }}
                          className={cn(
                            props.className,
                            'relative flex flex-col items-center justify-center rounded-lg transition-all hover:opacity-80'
                          )}
                        >
                          <span className="text-sm font-medium">{day.date.getDate()}</span>
                          {visual.showBadge && (
                            <span className="text-[10px] mt-0.5 opacity-70">{coins}</span>
                          )}
                        </button>
                      );
                    },
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={handleCopyYesterday}>
            <Copy size={16} />
          </Button>
          <Button variant="outline" onClick={handleRestDay}>
            <Moon size={16} className="mr-2" />
            今天休息
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledProjects.map((project) => {
          const status = getCardStatus(project);
          const categoryColor = getCategoryColor(project.category);

          return (
            <Card
              key={project.id}
              className={cn(
                'border-2 transition-all hover:shadow-md',
                status === 'completed' && 'border-green-500 bg-green-50/30',
                status === 'over' && 'border-red-500 bg-red-50/30',
                status === 'recorded' && 'border-blue-500 bg-blue-50/30',
                status === 'pending' && 'border-gray-200',
                status === 'unrecorded' && 'border-gray-200'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    {project.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: categoryColor, color: categoryColor }}
                  >
                    {project.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>{renderProjectInput(project)}</CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">今日备注</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={todayData.note || ''}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="添加备注..."
            className="w-full"
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-300 transition-colors"
                onClick={() => addTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
