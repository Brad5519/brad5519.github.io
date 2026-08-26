import { useEffect, useState, useCallback, useRef } from 'react';
import type { AppData, Project } from '@/types';
import { getDateData } from '@/lib/storage';

interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm
  projectIds: string[];
}

interface ReminderState {
  showReminder: boolean;
  unrecordedProjects: Project[];
  dismissReminder: () => void;
}

const REMINDER_KEY = 'daily-review-reminder-settings';

export function useReminder(data: AppData): ReminderState {
  const [showReminder, setShowReminder] = useState(false);
  const [unrecordedProjects, setUnrecordedProjects] = useState<Project[]>([]);
  const lastReminderDateRef = useRef<string>('');

  const getSettings = (): ReminderSettings => {
    try {
      const stored = localStorage.getItem(REMINDER_KEY);
      if (stored) {
        return JSON.parse(stored) as ReminderSettings;
      }
    } catch {
      // ignore
    }
    return {
      enabled: false,
      time: '21:00',
      projectIds: [],
    };
  };

  const checkAndShowReminder = useCallback(() => {
    const settings = getSettings();
    if (!settings.enabled || settings.projectIds.length === 0) {
      setShowReminder(false);
      return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    // 如果今天已经提醒过了，不再提醒
    if (lastReminderDateRef.current === today) {
      return;
    }

    // 检查是否到达提醒时间
    if (currentTime !== settings.time) {
      return;
    }

    // 检查需要提醒的项目是否已记录
    const todayData = getDateData(data.records, today);
    const enabledProjects = data.projects.filter((p) => p.enabled);
    const reminderProjects = enabledProjects.filter((p) =>
      settings.projectIds.includes(p.id)
    );

    const unrecorded = reminderProjects.filter((project) => {
      const record = todayData.records[project.id];
      return !record || record.value === null || record.value === '';
    });

    if (unrecorded.length > 0) {
      setUnrecordedProjects(unrecorded);
      setShowReminder(true);
      lastReminderDateRef.current = today;

      // 尝试显示浏览器通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('日常生活复盘', {
          body: `还有 ${unrecorded.length} 个项目待记录：${unrecorded.map((p) => p.name).join('、')}`,
          icon: '/icon-192.png',
        });
      }
    }
  }, [data]);

  const dismissReminder = useCallback(() => {
    setShowReminder(false);
  }, []);

  useEffect(() => {
    // 每分钟检查一次
    const interval = setInterval(checkAndShowReminder, 60000);
    // 立即检查一次
    checkAndShowReminder();

    return () => clearInterval(interval);
  }, [checkAndShowReminder]);

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    showReminder,
    unrecordedProjects,
    dismissReminder,
  };
}

export function saveReminderSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadReminderSettings(): ReminderSettings {
  try {
    const stored = localStorage.getItem(REMINDER_KEY);
    if (stored) {
      return JSON.parse(stored) as ReminderSettings;
    }
  } catch {
    // ignore
  }
  return {
    enabled: false,
    time: '21:00',
    projectIds: [],
  };
}
