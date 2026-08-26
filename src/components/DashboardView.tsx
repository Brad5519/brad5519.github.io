import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, AlertCircle, Coins, Calendar as CalendarIcon, Flame, Sparkles, ScrollText, Bell, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn, formatDateLocal } from '@/lib/utils';
import { Solar } from 'lunar-javascript';
import type { AppData, Project, ProjectCategory, DailyRecord } from '@/types';
import { CATEGORY_COLORS, DAILY_QUOTES } from '@/types';
import { getProjectStatus, checkConsecutiveMissing, checkConsecutiveFailed, groupProjectsByCategory, checkProjectCompleted } from '@/lib/utils-project';
import { getDateData } from '@/lib/storage';
import { calculateStreak, calculateMonthCompletedDays } from '@/lib/stats-utils';

interface DashboardViewProps {
  data: AppData;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onJumpToStats?: () => void;
}

// 铜板等级配置
const COIN_LEVELS = [
  { threshold: 0, bg: 'transparent', border: 'transparent', label: '' },
  { threshold: 0.01, bg: 'bg-green-50', border: 'border-green-200', label: '起步' },
  { threshold: 0.31, bg: 'bg-green-100', border: 'border-green-300', label: '良好' },
  { threshold: 0.61, bg: 'bg-green-200', border: 'border-green-400', label: '优秀' },
  { threshold: 1, bg: 'bg-amber-100', border: 'border-amber-400', label: '完美' },
];

export function DashboardView({ data, selectedDate, onDateChange, onJumpToStats }: DashboardViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [dateOpen, setDateOpen] = useState(false);

  const today = formatDateLocal(new Date());
  const yesterday = formatDateLocal(new Date(Date.now() - 86400000));

  const enabledProjects = useMemo(() => {
    return data.projects.filter((p) => p.enabled).sort((a, b) => a.sort - b.sort);
  }, [data.projects]);

  const groupedProjects = useMemo(() => {
    return groupProjectsByCategory(enabledProjects);
  }, [enabledProjects]);

  const todayData = useMemo(() => getDateData(data.records, selectedDate), [data.records, selectedDate]);
  const yesterdayData = useMemo(() => getDateData(data.records, yesterday), [data.records]);

  const getProjectRecord = (projectId: string, dateData: { records: Record<string, DailyRecord> }) => {
    return dateData.records[projectId] || null;
  };

  const calculateStats = (dateStr: string, dateData: { records: Record<string, DailyRecord> }) => {
    let completed = 0;
    let total = 0;

    enabledProjects.forEach((project) => {
      const record = getProjectRecord(project.id, dateData);
      const status = getProjectStatus(project, record);
      total++;
      if (status.isCompleted) completed++;
    });

    return { completed, total, reward: completed * 3 };
  };

  const todayStats = useMemo(() => calculateStats(selectedDate, todayData), [selectedDate, todayData, enabledProjects]);
  const yesterdayStats = useMemo(() => calculateStats(yesterday, yesterdayData), [yesterday, yesterdayData, enabledProjects]);

  const unrecordedCount = useMemo(() => {
    return enabledProjects.filter((p) => {
      const record = getProjectRecord(p.id, todayData);
      return !record || record.value === null;
    }).length;
  }, [enabledProjects, todayData]);

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const getCardBorderColor = (project: Project) => {
    const record = getProjectRecord(project.id, todayData);
    const isMissing2Days = checkConsecutiveMissing(data.records, project.id, selectedDate, 2);
    const isMissing3Days = checkConsecutiveMissing(data.records, project.id, selectedDate, 3);
    const isFailed3Days = checkConsecutiveFailed(data.records, project, selectedDate, 3);

    if (isFailed3Days || isMissing3Days) return 'border-red-400 ring-2 ring-red-100';
    if (isMissing2Days) return 'border-yellow-400 ring-2 ring-yellow-100';
    return 'border-transparent';
  };

  const renderProjectCard = (project: Project) => {
    const record = getProjectRecord(project.id, todayData);
    const status = getProjectStatus(project, record);
    const categoryColor = CATEGORY_COLORS[project.category];
    const borderClass = getCardBorderColor(project);
    const streak = calculateStreak(project, data.records, selectedDate === today);

    return (
      <Card
        key={project.id}
        className={`rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${borderClass}`}
        style={{ borderLeftWidth: '4px', borderLeftColor: categoryColor }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
              <p className="text-xs text-gray-500">{project.category}</p>
            </div>
            <div className="flex items-center gap-1">
              <StreakBadge streak={streak} categoryColor={categoryColor} />
              {status.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>

          <div className="mt-3">
            {project.projectType === '记录型' ? (
              <div className="flex items-center gap-2">
                {status.isCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">已完成</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5 text-gray-300" />
                    <span className="text-sm text-gray-400">未完成</span>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={status.isCompleted ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    {status.currentValue !== undefined ? status.currentValue : '-'}
                    {project.unit}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {project.targetType === '区间型'
                      ? `${project.targetMin}-${project.targetMax}${project.unit}`
                      : `${project.targetValue}${project.unit}`}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={status.progress || 0}
                    className="h-2"
                    style={{
                      backgroundColor: '#e5e7eb',
                    }}
                  />
                  <div
                    className="absolute top-0 left-0 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, status.progress || 0)}%`,
                      backgroundColor: status.isOverLimit ? '#ef4444' : categoryColor,
                    }}
                  />
                </div>
                {status.isOverLimit && (
                  <p className="text-xs text-red-500">已超标</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const categories = Object.keys(groupedProjects) as ProjectCategory[];
  const shouldCollapse = enabledProjects.length > 8;

  // 黄历数据生成（基于真实农历库 lunar-javascript）
  const almanacData = useMemo(() => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 用真实农历库转换，得到准确的农历日期与宜忌
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    // 农历日期：如"七月十五"
    const lunarDate = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

    // 真实黄历宜忌
    const yi = lunar.getDayYi();
    const ji = lunar.getDayJi();

    // 生活化习惯提示：在真实宜忌之后追加 4 条（基于日期确定性挑选，去重避免与真实宜忌重复）
    const habitYi = ['阅读', '冥想', '运动', '学习', '早睡', '早起', '整理', '规划', '复盘', '喝水', '拉伸', '写作', '散步', '陪伴家人', '听音乐', '写日记'];
    const habitJi = ['熬夜', '拖延', '暴饮暴食', '久坐', '冲动消费', '过度刷手机', '焦虑', '抱怨', '生气', '赖床', '夜宵', '沉迷游戏', '久站', '饮食不规律', '思虑过度', '杂乱无章'];
    const seed = year * 10000 + month * 100 + day;
    const lifestyleYi: string[] = [];
    const lifestyleJi: string[] = [];
    for (let i = 0; i < 4; i++) {
      const yiItem = habitYi[(seed + i * 5) % habitYi.length];
      if (!yi.includes(yiItem) && !lifestyleYi.includes(yiItem)) lifestyleYi.push(yiItem);
      const jiItem = habitJi[(seed + i * 7) % habitJi.length];
      if (!ji.includes(jiItem) && !lifestyleJi.includes(jiItem)) lifestyleJi.push(jiItem);
    }
    // 真实黄历在前，生活化习惯在后
    const allYi = [...yi, ...lifestyleYi];
    const allJi = [...ji, ...lifestyleJi];

    // 运势（保留基于日期的确定性取档，风格不变）
    const fortunes = ['大吉', '吉', '平', '凶', '大凶'];
    const fortuneIndex = seed % fortunes.length;
    const fortune = fortunes[fortuneIndex];
    const fortuneColors: Record<string, string> = {
      '大吉': 'text-red-600 bg-red-50 border-red-200',
      '吉': 'text-orange-600 bg-orange-50 border-orange-200',
      '平': 'text-gray-600 bg-gray-50 border-gray-200',
      '凶': 'text-blue-600 bg-blue-50 border-blue-200',
      '大凶': 'text-purple-600 bg-purple-50 border-purple-200',
    };

    return { lunarDate, yi: allYi, ji: allJi, fortune, fortuneStyle: fortuneColors[fortune] };
  }, [selectedDate]);

  const StreakBadge = ({ streak, categoryColor }: { streak: number; categoryColor: string }) => {
    if (streak === 0) return null;
    const isLongStreak = streak >= 7;
    const bgColor = categoryColor;
    return (
      <div
        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white text-xs font-medium ${
          isLongStreak ? 'animate-pulse' : ''
        }`}
        style={{ backgroundColor: bgColor }}
      >
        <Flame size={isLongStreak ? 14 : 12} />
        <span>{isLongStreak ? '7+' : streak}</span>
      </div>
    );
  };

  const todayQuote = useMemo(() => {
    const dayIndex = new Date().getDate() % DAILY_QUOTES.length;
    return DAILY_QUOTES[dayIndex];
  }, []);

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

  const maxCoins = enabledProjects.length * 3;

  // 获取铜板等级
  const getCoinLevel = (coins: number) => {
    if (coins === 0) return COIN_LEVELS[0];
    if (coins === maxCoins) return COIN_LEVELS[4];
    const ratio = coins / maxCoins;
    if (ratio < 0.31) return COIN_LEVELS[1];
    if (ratio < 0.61) return COIN_LEVELS[2];
    return COIN_LEVELS[3];
  };

  // 当月铜板数据
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const coins = calculateDayCoins(dateStr);
      return { date: dateStr, day: day.getDate(), coins, level: getCoinLevel(coins) };
    });
  }, [data.records, maxCoins]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(format(date, 'yyyy-MM-dd'));
      setDateOpen(false);
    }
  };

  // 自定义日历日期渲染
  const renderDayButton = (day: { date: Date }, props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const dateStr = format(day.date, 'yyyy-MM-dd');
    const coins = calculateDayCoins(dateStr);
    const level = getCoinLevel(coins);
    const isFull = coins === maxCoins && maxCoins > 0;
    
    return (
      <button
        {...props}
        className={cn(
          props.className,
          'relative flex flex-col items-center justify-center p-1 rounded-lg transition-all',
          level.bg,
          'border',
          level.border,
          isFull && 'ring-1 ring-amber-400'
        )}
      >
        <span className="text-sm font-medium">{day.date.getDate()}</span>
        {coins > 0 && (
          <span className="text-[10px] text-gray-600 mt-0.5">{coins}</span>
        )}
        {isFull && (
          <Coins className="absolute -top-1 -right-1 w-3 h-3 text-amber-500" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 日期选择 */}
      <div className="flex items-center gap-4">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal bg-white">
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
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
                components={{
                  DayButton: ({ day, ...props }) => renderDayButton(day, props),
                }}
              />
              {/* 图例 */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
                  <span>起步</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <span>良好</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-200 border border-green-400" />
                  <span>优秀</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-amber-100 border border-amber-400 ring-1 ring-amber-400" />
                  <Coins className="w-3 h-3 text-amber-500" />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {selectedDate === today && unrecordedCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4" />
            还有 {unrecordedCount} 项未记录
          </div>
        )}
      </div>

      {/* 卡通鼓励语 */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-200">
        <Sparkles className="w-6 h-6 text-pink-500" />
        <p className="text-base font-medium text-purple-800">
          {todayQuote} ✨ 🌟 💪
        </p>
      </div>

      {/* 每日黄历 */}
      <Card className="rounded-2xl shadow-sm border-amber-200 overflow-hidden">
        <CardContent className="p-0">
          {/* 头部：日期和运势 */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 p-4 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <ScrollText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-medium">今日黄历</p>
                  <p className="text-lg font-bold text-gray-900">{almanacData.lunarDate}</p>
                </div>
              </div>
              <div className={cn('px-3 py-1 rounded-full text-sm font-bold border', almanacData.fortuneStyle)}>
                {almanacData.fortune}
              </div>
            </div>
          </div>

          {/* 宜忌 */}
          <div className="p-4 space-y-4">
            {/* 宜 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-500 text-white text-xs font-bold flex items-center justify-center">宜</div>
                <span className="text-sm text-gray-500">今日宜做</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {almanacData.yi.slice(0, 12).map((item, index) => (
                  <span
                    key={item}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded border",
                      index >= almanacData.yi.length - 4
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-red-50 text-red-700 border-red-100 font-medium"
                    )}
                    title={index >= almanacData.yi.length - 4 ? "生活习惯" : "今日宜做"}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* 忌 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-600 text-white text-xs font-bold flex items-center justify-center">忌</div>
                <span className="text-sm text-gray-500">今日忌做</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {almanacData.ji.slice(0, 12).map((item, index) => (
                  <span
                    key={item}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded border",
                      index >= almanacData.ji.length - 4
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-gray-100 text-gray-700 border-gray-200 font-medium"
                    )}
                    title={index >= almanacData.ji.length - 4 ? "生活习惯" : "今日忌做"}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 奖惩总览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{selectedDate === today ? '今日' : selectedDate} 奖惩</p>
                <p className="text-xl font-bold text-gray-900">
                  达标 {todayStats.completed} 项，预计奖励 {todayStats.reward} 铜板
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">昨日奖惩</p>
                <p className="text-xl font-bold text-gray-900">
                  达标 {yesterdayStats.completed} 项，实际奖励 {yesterdayStats.reward} 铜板
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 项目卡片列表 */}
      <div className="space-y-4">
        {categories.map((category) => {
          const projects = groupedProjects[category];
          const isExpanded = expandedCategories.has(category);
          const categoryColor = CATEGORY_COLORS[category];

          return (
            <div key={category} className="space-y-3">
              {shouldCollapse ? (
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="font-semibold text-gray-900">{category}</span>
                    <span className="text-sm text-gray-500">({projects.length}项)</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="font-semibold text-gray-900">{category}</span>
                  <span className="text-sm text-gray-500">({projects.length}项)</span>
                </div>
              )}

              {(!shouldCollapse || isExpanded) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects.map(renderProjectCard)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
