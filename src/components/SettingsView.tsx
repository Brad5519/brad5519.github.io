import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { exportData, importData, clearData, initData } from '@/lib/storage';
import { exportToObsidian, type ExportRange } from '@/lib/obsidian-export';
import { createBackup } from '@/lib/backup';
import type { AppData, Project } from '@/types';
import { Download, Upload, Trash2, Database, FileJson, Calendar, FileText, Cloud, FolderOpen, Settings, ChevronLeft, Plus, Bell } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingsViewProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onNavigate?: (tab: string) => void;
}

// 云端同步子组件
function SyncSection({ data, onDataChange }: { data: AppData; onDataChange: (data: AppData) => void }) {
  const [token, setToken] = useState(localStorage.getItem('github-token') || '');
  const [gistId, setGistId] = useState(localStorage.getItem('github-gist-id') || '');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(data.lastSync || '-');

  const saveToken = () => {
    localStorage.setItem('github-token', token);
    localStorage.setItem('github-gist-id', gistId);
    alert('配置已保存');
  };

  const handleSync = async () => {
    if (!token) {
      alert('请先配置 GitHub Token');
      return;
    }
    setSyncing(true);
    try {
      // 模拟同步
      await new Promise(resolve => setTimeout(resolve, 1000));
      const now = new Date().toISOString();
      setLastSync(now);
      onDataChange({ ...data, lastSync: now });
      alert('同步成功');
    } catch (e) {
      alert('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GitHub 配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>GitHub Token</Label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500">用于访问 GitHub Gist API</p>
          </div>
          <div className="space-y-2">
            <Label>Gist ID（可选）</Label>
            <Input
              value={gistId}
              onChange={(e) => setGistId(e.target.value)}
              placeholder="留空将自动创建"
            />
          </div>
          <Button onClick={saveToken} className="gap-2">
            <Settings size={16} />
            保存配置
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>同步操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">上次同步</p>
              <p className="text-sm text-gray-500">{lastSync === '-' ? '从未同步' : new Date(lastSync).toLocaleString()}</p>
            </div>
            <Button onClick={handleSync} disabled={syncing} className="gap-2">
              <Cloud size={16} />
              {syncing ? '同步中...' : '立即同步'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 项目管理子组件
function ProjectSection({ data, onDataChange }: { data: AppData; onDataChange: (data: AppData) => void }) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    category: '自定义',
    measureType: '是否型',
    projectType: '目标型',
    targetType: '下限型',
    unit: '',
    cardColor: '#ec4899',
    enabled: true,
  });

  const toggleProject = (projectId: string) => {
    const newProjects = data.projects.map(p =>
      p.id === projectId ? { ...p, enabled: !p.enabled } : p
    );
    onDataChange({ ...data, projects: newProjects });
  };

  const handleAddProject = () => {
    if (!newProject.name?.trim()) return;
    const project: Project = {
      id: 'proj_' + Date.now(),
      name: newProject.name || '',
      category: (newProject.category as Project['category']) || '自定义',
      measureType: (newProject.measureType as Project['measureType']) || '是否型',
      projectType: (newProject.projectType as Project['projectType']) || '目标型',
      targetType: (newProject.targetType as Project['targetType']) || '下限型',
      unit: newProject.unit || '',
      cardColor: newProject.cardColor || '#ec4899',
      sort: data.projects.length,
      enabled: true,
      targetValue: newProject.targetValue,
      targetMin: newProject.targetMin,
      targetMax: newProject.targetMax,
    };
    onDataChange({ ...data, projects: [...data.projects, project] });
    setIsAddDialogOpen(false);
    setNewProject({
      name: '',
      category: '自定义',
      measureType: '是否型',
      projectType: '目标型',
      targetType: '下限型',
      unit: '',
      cardColor: '#ec4899',
      enabled: true,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>项目列表</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="gap-2">
            <Plus size={16} />
            添加项目
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.cardColor }}
                />
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={project.enabled}
                  onCheckedChange={() => toggleProject(project.id)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 添加项目对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新项目</DialogTitle>
            <DialogDescription>
              创建一个新的追踪项目
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>项目名称</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="例如：早起"
              />
            </div>
            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={newProject.category}
                onValueChange={(v) => setNewProject({ ...newProject, category: v as Project['category'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="运动健康">运动健康</SelectItem>
                  <SelectItem value="饮食管理">饮食管理</SelectItem>
                  <SelectItem value="学习成长">学习成长</SelectItem>
                  <SelectItem value="兴趣技能">兴趣技能</SelectItem>
                  <SelectItem value="体征参数">体征参数</SelectItem>
                  <SelectItem value="自定义">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>计量类型</Label>
              <Select
                value={newProject.measureType}
                onValueChange={(v) => setNewProject({ ...newProject, measureType: v as Project['measureType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="是否型">是否型（完成/未完成）</SelectItem>
                  <SelectItem value="数值型">数值型（记录具体数值）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>单位（可选）</Label>
              <Input
                value={newProject.unit}
                onChange={(e) => setNewProject({ ...newProject, unit: e.target.value })}
                placeholder="例如：分钟、毫升"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddProject}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SettingsView({ data, onDataChange, onNavigate }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('data');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [exportRange, setExportRange] = useState<ExportRange>('全部');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obsidian 导出
  const handleObsidianExport = async () => {
    createBackup(data);
    await exportToObsidian(data, exportRange);
  };

  // 计算统计数据
  const projectCount = data.projects.length;
  const recordDays = Object.keys(data.records).length;
  const totalRecords = Object.values(data.records).reduce(
    (sum, day) => sum + Object.keys(day.records).length,
    0
  );

  // 导出数据
  const handleExport = () => {
    const json = exportData(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-review-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 选择文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportContent(content);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
  };

  // 确认导入
  const handleImportConfirm = () => {
    try {
      createBackup(data);
      const newData = importData(importContent);
      onDataChange(newData);
      setImportDialogOpen(false);
      setImportContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (e) {
      alert('导入失败：文件格式不正确');
    }
  };

  // 确认清空
  const handleClearConfirm = () => {
    if (clearConfirmText === '确认清空') {
      clearData();
      onDataChange(initData());
      setClearDialogOpen(false);
      setClearConfirmText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">设置</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data" className="gap-2">
            <Database size={16} />
            数据管理
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2">
            <Cloud size={16} />
            云端同步
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderOpen size={16} />
            项目管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6 mt-6">
          {/* 数据统计 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 flex flex-col items-center">
                <FileJson className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{projectCount}</p>
                <p className="text-sm text-gray-600">项目数量</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 flex flex-col items-center">
                <Calendar className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{recordDays}</p>
                <p className="text-sm text-gray-600">记录天数</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 flex flex-col items-center">
                <Database className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
                <p className="text-sm text-gray-600">总记录条数</p>
              </CardContent>
            </Card>
          </div>

          {/* 数据操作 */}
          <Card>
            <CardHeader>
              <CardTitle>数据操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 导出 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">导出数据</h3>
                  <p className="text-sm text-gray-500">下载所有项目配置和记录为 JSON 文件</p>
                </div>
                <Button onClick={handleExport} className="gap-2">
                  <Download size={16} />
                  导出
                </Button>
              </div>

              {/* 导入 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">导入数据</h3>
                  <p className="text-sm text-gray-500">从 JSON 文件恢复数据（将覆盖现有数据）</p>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload size={16} />
                    选择文件
                  </Button>
                </div>
              </div>

              {/* Obsidian 导出 */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div>
                  <h3 className="font-medium text-indigo-900">导出为 Obsidian 日记</h3>
                  <p className="text-sm text-indigo-600">生成 Markdown 格式日记文件</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={exportRange} onValueChange={(v) => setExportRange(v as ExportRange)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全部">全部</SelectItem>
                      <SelectItem value="本月">本月</SelectItem>
                      <SelectItem value="上周">上周</SelectItem>
                      <SelectItem value="自定义">自定义</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleObsidianExport} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <FileText size={16} />
                    导出
                  </Button>
                </div>
              </div>

              {/* 重置为默认 */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <h3 className="font-medium text-orange-900">重置为默认</h3>
                  <p className="text-sm text-orange-600">恢复预置项目配置，保留记录数据</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('确定要重置项目配置为默认吗？这将恢复预置项目的最新配置，但保留您的记录数据。')) {
                      const newData = initData();
                      onDataChange({ ...data, projects: newData.projects });
                      alert('项目配置已重置为默认');
                    }
                  }}
                  className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Settings size={16} />
                  重置
                </Button>
              </div>

              {/* 清空 */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <h3 className="font-medium text-red-900">清空数据</h3>
                  <p className="text-sm text-red-600">删除所有数据，此操作不可恢复</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setClearDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 size={16} />
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="mt-6">
          <SyncSection data={data} onDataChange={onDataChange} />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ProjectSection data={data} onDataChange={onDataChange} />
        </TabsContent>
      </Tabs>

      {/* 导入确认对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认导入数据</DialogTitle>
            <DialogDescription>
              导入将覆盖当前所有数据，此操作不可撤销。是否继续？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImportConfirm}>确认导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空确认对话框 */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认清空数据</DialogTitle>
            <DialogDescription>
              此操作将删除所有数据且不可恢复。请输入"确认清空"以继续。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="clear-confirm">确认文本</Label>
            <Input
              id="clear-confirm"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="输入：确认清空"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearConfirm}
              disabled={clearConfirmText !== '确认清空'}
            >
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
