// 本地备份管理
import type { AppData } from '@/types';

const BACKUP_KEY_PREFIX = 'local_backup_';
const MAX_BACKUPS = 10;
const KEEP_BACKUPS = 3;

export interface BackupRecord {
  id: string;
  timestamp: string;
  data: AppData;
  recordCount: number;
}

// 创建备份
export function createBackup(data: AppData): BackupRecord {
  const timestamp = new Date().toISOString();
  const recordCount = Object.keys(data.records).length;

  const backup: BackupRecord = {
    id: timestamp,
    timestamp,
    data,
    recordCount,
  };

  const key = `${BACKUP_KEY_PREFIX}${timestamp}`;
  localStorage.setItem(key, JSON.stringify(backup));

  // 自动清理旧备份
  deleteOldBackups();

  return backup;
}

// 获取最近3条备份记录
export function getBackups(): BackupRecord[] {
  const backups: BackupRecord[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_KEY_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const backup = JSON.parse(value) as BackupRecord;
          backups.push(backup);
        } catch {
          // 忽略解析失败的备份
        }
      }
    }
  }

  // 按时间戳降序排列，返回最近3条
  return backups
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, KEEP_BACKUPS);
}

// 恢复指定备份
export function restoreBackup(timestamp: string): AppData | null {
  const key = `${BACKUP_KEY_PREFIX}${timestamp}`;
  const value = localStorage.getItem(key);

  if (value) {
    try {
      const backup = JSON.parse(value) as BackupRecord;
      return backup.data;
    } catch {
      return null;
    }
  }

  return null;
}

// 删除超过10条的旧备份
export function deleteOldBackups(): void {
  const backups: { key: string; timestamp: string }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_KEY_PREFIX)) {
      const timestamp = key.replace(BACKUP_KEY_PREFIX, '');
      backups.push({ key, timestamp });
    }
  }

  // 如果超过10条，删除最旧的
  if (backups.length > MAX_BACKUPS) {
    const sorted = backups.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const toDelete = sorted.slice(0, backups.length - MAX_BACKUPS);
    toDelete.forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  }
}

// 删除指定备份
export function deleteBackup(timestamp: string): void {
  const key = `${BACKUP_KEY_PREFIX}${timestamp}`;
  localStorage.removeItem(key);
}
