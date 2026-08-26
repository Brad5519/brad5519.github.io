import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Clock } from 'lucide-react';
import type { Project } from '@/types';

interface ReminderViewProps {
  projects: Project[];
}

interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  projectIds: string[];
}

const STORAGE_KEY = 'daily-review-reminder-settings';

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 21,
  minute: 0,
  projectIds: [],
};

export function ReminderView({ projects }: ReminderViewProps) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleProject = (projectId: string) => {
    setSettings((prev) => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId],
    }));
  };

  const enabledProjects = projects.filter((p) => p.enabled);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            提醒设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 启用开关 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">启用每日提醒</h3>
              <p className="text-sm text-gray-500">在设定时间提醒您完成未记录的项目</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {/* 时间设置 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              提醒时间
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={settings.hour.toString()}
                onValueChange={(v) =>
                  setSettings((prev) => ({ ...prev, hour: parseInt(v) }))
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-gray-500">:</span>
              <Select
                value={settings.minute.toString()}
                onValueChange={(v) =>
                  setSettings((prev) => ({ ...prev, minute: parseInt(v) }))
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 项目选择 */}
          <div className="space-y-3">
            <Label>需要提醒的项目</Label>
            <div className="grid grid-cols-2 gap-2">
              {enabledProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50"
                >
                  <Checkbox
                    checked={settings.projectIds.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                  />
                  <span className="text-sm truncate">{project.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 保存按钮 */}
          <Button onClick={saveSettings} className="w-full">
            {saved ? '已保存' : '保存设置'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
