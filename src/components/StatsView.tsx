import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppData } from '@/types';
import type { TimeRange } from '@/lib/stats-utils';
import { getDateData } from '@/lib/storage';
import { checkProjectCompleted } from '@/lib/utils-project';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { calculateMonthCompletedDays } from '@/lib/stats-utils';

interface StatsViewProps {
  data: AppData;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onDateSelect?: (date: string) => void;
}

const TIME_RANGES: TimeRange[] = ['本周', '上周', '本月', '上月', '近7天'];

// 铜板等级配置
const COIN_LEVELS = [
  { threshold: 0, bg: 'bg-gray-100', border: 'border-gray-200', label: '无' },
  { threshold: 0.01, bg: 'bg-green-100', border: 'border-green-200', label: '起步' },
  { threshold: 0.31, bg: 'bg-green-200', border: 'border-green-300', label: '良好' },
  { threshold: 0.61, bg: 'bg-green-300', border: 'border-green-400', label: '优秀' },
  { threshold: 1, bg: 'bg-amber-200', border: 'border-amber-400', label: '完美' },
];

export function StatsView({ data, timeRange, onTimeRangeChange, onDateSelect }: StatsViewProps) {
  const enabledProjects = useMemo(() => {
    return data.projects.filter((p) => p.enabled).sort((a, b) => a.sort - b.sort);
  }, [data.projects]);

  const maxCoins = enabledProjects.length * 3;

  // 计算某一天的铜板数
  const calculateDayCoins = (dateStr: string): number => {
    const dayData = getDateData(data.records, dateStr);
    let completed = 0;
    enabledProjects.forEach((project) => {
      const record = dayData.records[project.id];
      if (checkProjectCompleted(project, record)) {
        completed++;
      }
    });
    return completed * 3;
  };

  // 获取铜板等级
  const getCoinLevel = (coins: number) => {
    if (coins === 0) return COIN_LEVELS[0];
    if (coins === maxCoins) return COIN_LEVELS[4];
    const ratio = coins / maxCoins;
    if (ratio < 0.31) return COIN_LEVELS[1];
    if (ratio < 0.61) return COIN_LEVELS[2];
    return COIN_LEVELS[3];
  };

  // 最近7天铜板数据
  const last7DaysData = useMemo(() => {
    const now = new Date();
    const days: { date: string; day: number; coins: number; level: typeof COIN_LEVELS[0]; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const coins = calculateDayCoins(dateStr);
      days.push({
        date: dateStr,
        day: d.getDate(),
        coins,
        level: getCoinLevel(coins),
        isToday: i === 0
      });
    }
    return days;
  }, [data.records, maxCoins]);

  // 当月铜板数据（用于热力图）
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const coins = calculateDayCoins(dateStr);
      return {
        date: dateStr,
        day: day.getDate(),
        coins,
        level: getCoinLevel(coins),
        isToday: format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
      };
    });
  }, [data.records, maxCoins]);

  // 本月概览数据
  const monthStats = useMemo(() => calculateMonthCompletedDays(enabledProjects, data.records), [enabledProjects, data.records]);

  // 平均值只计算有记录的天数
  const recordedDays = last7DaysData.filter(d => d.coins > 0);
  const avgCoins = recordedDays.length > 0
    ? Math.round(recordedDays.reduce((a, b) => a + b.coins, 0) / recordedDays.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* 时间范围选择 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">统计回顾</h2>
        <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as TimeRange)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 本月概览卡片 */}
      <Card
        className="rounded-2xl shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 cursor-pointer hover:shadow-md transition-all"
        onClick={() => onDateSelect?.(new Date().toISOString().split('T')[0])}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">本月概览</p>
              <p className="text-lg font-bold text-gray-900">
                已完成 {monthStats.completed} 天 / 共 {monthStats.total} 天
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </CardContent>
      </Card>

      {/* 月度数据可视化 - 整合铜板趋势和完成度热力图 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            月度数据概览
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 上半部分：最近7天铜板趋势柱状图 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">最近7天铜板趋势</span>
              <span className="text-xs text-gray-500 ml-auto">
                平均: {avgCoins} ({recordedDays.length}天有记录)
              </span>
            </div>
            <div className="h-24 flex items-end justify-between gap-2">
              {last7DaysData.map(({ date, day, coins, level, isToday }) => {
                const height = maxCoins > 0 ? (coins / maxCoins) * 100 : 0;
                return (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                    onClick={() => onDateSelect?.(date)}
                  >
                    <div
                      className={cn(
                        'w-full rounded-t transition-all duration-300 min-h-[4px]',
                        level.bg,
                        coins === maxCoins && maxCoins > 0 && 'ring-1 ring-amber-400'
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className={cn(
                      'text-[10px]',
                      isToday ? 'font-bold text-blue-600' : 'text-gray-400'
                    )}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-200" />

          {/* 下半部分：月度完成度热力图 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">完成度热力图</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {currentMonthData.map(({ date, day, coins, level, isToday }) => (
                <div
                  key={date}
                  className={cn(
                    'aspect-square rounded-md flex items-center justify-center text-xs cursor-pointer transition-all hover:scale-110',
                    level.bg,
                    level.border,
                    isToday && 'ring-2 ring-blue-400'
                  )}
                  onClick={() => onDateSelect?.(date)}
                  title={`${date}: ${coins}铜板`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-gray-100">
            {COIN_LEVELS.slice(1).map((level) => (
              <div key={level.label} className="flex items-center gap-1">
                <div className={cn('w-4 h-4 rounded', level.bg, level.border, 'border')} />
                <span className="text-xs text-gray-600">{level.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded ring-2 ring-blue-400 bg-white" />
              <span className="text-xs text-gray-600">今天</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
