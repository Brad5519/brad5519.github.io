import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AppData, Project, DateData } from '@/types';
import type { TimeRange } from '@/lib/stats-utils';
import { loadData, saveData } from '@/lib/storage';
import { formatDateLocal } from '@/lib/utils';
import { DashboardView } from '@/components/DashboardView';
import { RecordView } from '@/components/RecordView';
import { ProjectView } from '@/components/ProjectView';
import { SettingsView } from '@/components/SettingsView';
import { StatsView } from '@/components/StatsView';
import { SyncView } from '@/components/SyncView';
import { LayoutDashboard, Edit3, FolderOpen, Settings, BarChart3, Cloud } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statsTimeRange, setStatsTimeRange] = useState<TimeRange>('本周');
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedDate, setSelectedDate] = useState(() => formatDateLocal(new Date()));

  // 自动保存到 localStorage
  useEffect(() => {
    saveData(data);
  }, [data]);

  // 更新项目
  const updateProjects = (projects: Project[]) => {
    setData((prev) => ({ ...prev, projects }));
  };

  // 更新记录
  const updateRecords = (records: Record<string, DateData>) => {
    setData((prev) => ({ ...prev, records }));
  };

  // 获取今天的日期数据
  const todayData = useMemo(() => {
    return data.records[selectedDate] || { date: selectedDate, records: {}, note: '' };
  }, [data.records, selectedDate]);

  // 移动端底部导航
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-xs">今日</span>
        </button>
        <button
          onClick={() => setActiveTab('record')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'record' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Edit3 size={20} />
          <span className="text-xs">记录</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'stats' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <BarChart3 size={20} />
          <span className="text-xs">统计</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Settings size={20} />
          <span className="text-xs">设置</span>
        </button>
      </div>
    </div>
  );

  // 桌面端侧边栏
  const DesktopSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">日常生活复盘</h1>
        <p className="text-sm text-gray-500 mt-1">习惯追踪与体征记录</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard size={20} />
          <span>今日总览</span>
        </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'record'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Edit3 size={20} />
            <span>每日记录</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'stats'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={20} />
            <span>统计回顾</span>
          </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings size={20} />
          <span>数据管理</span>
        </button>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {!isMobile && <DesktopSidebar />}
      <main
        className={`${isMobile ? 'pb-20' : 'ml-64'} min-h-screen`}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onJumpToStats={() => {
                setStatsTimeRange('本月');
                setActiveTab('stats');
              }}
            />
          )}
          {activeTab === 'record' && (
            <RecordView
              projects={data.projects}
              records={data.records}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onRecordsChange={updateRecords}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectView
              projects={data.projects}
              onProjectsChange={updateProjects}
            />
          )}
          {activeTab === 'stats' && (
            <StatsView
              data={data}
              timeRange={statsTimeRange}
              onTimeRangeChange={setStatsTimeRange}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setActiveTab('record');
              }}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView
              data={data}
              onDataChange={setData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
        </div>
      </main>
      {isMobile && <MobileNav />}
    </div>
  );
}
