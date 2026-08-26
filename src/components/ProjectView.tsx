import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Power, GripVertical } from 'lucide-react';
import type { Project, ProjectCategory, MeasureType, ProjectType, TargetType } from '@/types';
import { generateId } from '@/lib/utils-project';

interface ProjectViewProps {
  projects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  isSubView?: boolean;
}

const CATEGORIES: ProjectCategory[] = ['运动健康', '饮食管理', '学习成长', '兴趣技能', '体征参数', '自定义'];
const MEASURE_TYPES: MeasureType[] = ['是否型', '数值型', '文本型'];
const PROJECT_TYPES: ProjectType[] = ['目标型', '记录型'];
const TARGET_TYPES: TargetType[] = ['下限型', '上限型', '区间型', '无目标'];

const PRESET_IDS = ['sleep', 'weight', 'gcs', 'bp', 'fitness', 'fat-burn', 'muscle', 'water', 'calories', 'words', 'calligraphy', 'piano', 'video'];

export function ProjectView({ projects, onProjectsChange, isSubView }: ProjectViewProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sortedProjects = [...projects].sort((a, b) => a.sort - b.sort);

  const handleAdd = () => {
    const newProject: Project = {
      id: generateId(),
      name: '',
      category: '自定义',
      measureType: '数值型',
      projectType: '目标型',
      targetType: '下限型',
      unit: '',
      cardColor: '#3b82f6',
      sort: projects.length,
      enabled: true,
    };
    setEditingProject(newProject);
    setIsDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject({ ...project });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingProject || !editingProject.name.trim()) return;

    const exists = projects.find((p) => p.id === editingProject.id);
    if (exists) {
      onProjectsChange(projects.map((p) => (p.id === editingProject.id ? editingProject : p)));
    } else {
      onProjectsChange([...projects, editingProject]);
    }
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  const handleDelete = (id: string) => {
    if (PRESET_IDS.includes(id)) return;
    onProjectsChange(projects.filter((p) => p.id !== id));
  };

  const handleToggleEnabled = (id: string) => {
    onProjectsChange(projects.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newProjects = [...projects];
    const temp = newProjects[index].sort;
    newProjects[index].sort = newProjects[index - 1].sort;
    newProjects[index - 1].sort = temp;
    onProjectsChange(newProjects);
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedProjects.length - 1) return;
    const newProjects = [...projects];
    const currentIdx = projects.findIndex((p) => p.id === sortedProjects[index].id);
    const nextIdx = projects.findIndex((p) => p.id === sortedProjects[index + 1].id);
    const temp = newProjects[currentIdx].sort;
    newProjects[currentIdx].sort = newProjects[nextIdx].sort;
    newProjects[nextIdx].sort = temp;
    onProjectsChange(newProjects);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">项目管理</h2>
        <Button onClick={handleAdd} className="gap-2">
          <Plus size={16} />
          新增项目
        </Button>
      </div>

      <div className="grid gap-3">
        {sortedProjects.map((project, index) => (
          <Card key={project.id} className={`${!project.enabled ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  disabled={index === 0}
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  disabled={index >= sortedProjects.length - 1}
                >
                  ▼
                </button>
              </div>

              <div
                className="w-3 h-12 rounded-full"
                style={{ backgroundColor: project.cardColor }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{project.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {project.category}
                  </span>
                  {!project.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                      已停用
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {project.measureType} · {project.projectType} · {project.targetType}
                  {project.unit && ` · ${project.unit}`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleEnabled(project.id)}
                  className={project.enabled ? 'text-green-600' : 'text-gray-400'}
                >
                  <Power size={16} />
                </Button>
                {!PRESET_IDS.includes(project.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project.id)}
                    className="text-red-500"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject?.id && projects.find((p) => p.id === editingProject.id) ? '编辑项目' : '新增项目'}</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>项目名称</Label>
                <Input
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  placeholder="输入项目名称"
                />
              </div>

              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={editingProject.category}
                  onValueChange={(v) => setEditingProject({ ...editingProject, category: v as ProjectCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>计量类型</Label>
                <Select
                  value={editingProject.measureType}
                  onValueChange={(v) => setEditingProject({ ...editingProject, measureType: v as MeasureType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEASURE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>项目类型</Label>
                <Select
                  value={editingProject.projectType}
                  onValueChange={(v) => setEditingProject({ ...editingProject, projectType: v as ProjectType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>目标类型</Label>
                <Select
                  value={editingProject.targetType}
                  onValueChange={(v) => setEditingProject({ ...editingProject, targetType: v as TargetType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>单位</Label>
                <Input
                  value={editingProject.unit}
                  onChange={(e) => setEditingProject({ ...editingProject, unit: e.target.value })}
                  placeholder="如：小时、分钟、kg"
                />
              </div>

              {(editingProject.targetType === '下限型' || editingProject.targetType === '上限型') && (
                <div className="space-y-2">
                  <Label>目标值</Label>
                  <Input
                    type="number"
                    value={editingProject.targetValue || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, targetValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              {editingProject.targetType === '区间型' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>最小值</Label>
                    <Input
                      type="number"
                      value={editingProject.targetMin || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, targetMin: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>最大值</Label>
                    <Input
                      type="number"
                      value={editingProject.targetMax || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, targetMax: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>卡片颜色</Label>
                <div className="flex gap-2">
                  {['#22c55e', '#f97316', '#3b82f6', '#a855f7', '#6b7280', '#ec4899', '#ef4444', '#14b8a6'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingProject({ ...editingProject, cardColor: color })}
                      className={`w-8 h-8 rounded-full ${editingProject.cardColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingProject.enabled}
                  onCheckedChange={(v) => setEditingProject({ ...editingProject, enabled: v })}
                />
                <Label>启用项目</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">保存</Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
