import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Cloud, Download, Upload, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle, Copy, Database } from 'lucide-react';
import type { AppData } from '@/types';
import { validateToken, createGist, updateGist, fetchGist } from '@/lib/github-sync';
import { createBackup, getBackups, restoreBackup } from '@/lib/backup';
import type { BackupRecord } from '@/lib/backup';
import { saveData } from '@/lib/storage';

interface SyncViewProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
}

const GIST_ID_KEY = 'github_gist_id';
const TOKEN_KEY = 'github_token';

export function SyncView({ data, onDataChange }: SyncViewProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [gistId, setGistId] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [cloudCount, setCloudCount] = useState(0);
  const [localCount, setLocalCount] = useState(0);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<{ local: number; cloud: number } | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || '';
    const savedGistId = localStorage.getItem(GIST_ID_KEY) || '';
    const savedLastSync = localStorage.getItem('last_sync_time');
    setToken(savedToken);
    setGistId(savedGistId);
    if (savedLastSync) setLastSync(savedLastSync);
    if (savedToken) {
      validateToken(savedToken).then((result) => setIsTokenValid(result.success));
    }
    setBackups(getBackups());
    updateCounts();
  }, [data]);

  const updateCounts = () => {
    const records = Object.keys(data.records).length;
    setLocalCount(records);
  };

  const handleValidateToken = async () => {
    setLoading(true);
    const result = await validateToken(token);
    setIsTokenValid(result.success);
    if (result.success) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      setError(result.error || 'Token 无效，请检查并重试');
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!isTokenValid) return;
    setLoading(true);
    
    // 先创建本地备份
    createBackup(data);
    setBackups(getBackups());

    let id = gistId;
    if (!id) {
      const result = await createGist(token, data);
      if (result.success && result.gistId) {
        id = result.gistId;
        setGistId(id);
        localStorage.setItem(GIST_ID_KEY, id);
      } else {
        setError(result.error || '创建 Gist 失败');
        setLoading(false);
        return;
      }
    } else {
      const result = await updateGist(token, id, data);
      if (!result.success) {
        setError(result.error || '更新 Gist 失败');
        setLoading(false);
        return;
      }
    }

    const now = new Date().toLocaleString();
    setLastSync(now);
    localStorage.setItem('last_sync_time', now);
    setCloudCount(Object.keys(data.records).length);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!isTokenValid || !gistId) return;
    setLoading(true);
    const result = await fetchGist(gistId);
    if (result.success && result.data) {
      createBackup(data);
      onDataChange(result.data);
      saveData(result.data);
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem('last_sync_time', now);
      setCloudCount(Object.keys(result.data.records).length);
    } else {
      setError(result.error || '获取云端数据失败');
    }
    setLoading(false);
  };

  const handleBidirectionalSync = async () => {
    if (!isTokenValid || !gistId) return;
    setLoading(true);
    const result = await fetchGist(gistId);
    if (result.success && result.data) {
      const localRecords = Object.keys(data.records).length;
      const cloudRecords = Object.keys(result.data.records).length;
      
      if (localRecords !== cloudRecords) {
        setConflictData({ local: localRecords, cloud: cloudRecords });
        setShowConflictDialog(true);
      } else {
        await handleUpload();
      }
    } else {
      setError(result.error || '获取云端数据失败');
    }
    setLoading(false);
  };

  const handleResolveConflict = async (useLocal: boolean) => {
    setShowConflictDialog(false);
    if (useLocal) {
      await handleUpload();
    } else {
      await handleDownload();
    }
  };

  const handleRestoreBackup = (backup: BackupRecord) => {
    const restored = restoreBackup(backup.id);
    if (restored) {
      onDataChange(restored);
      saveData(restored);
      updateCounts();
    }
  };

  const copyGistId = () => {
    navigator.clipboard.writeText(gistId);
  };

  return (
    <div className="space-y-4">
      {/* 标题已移除，由父组件 SettingsView 统一控制 */}

      {/* Token 配置 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            GitHub Token 配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Personal Access Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="pr-10"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button onClick={handleValidateToken} disabled={loading || !token}>
                {isTokenValid ? <CheckCircle className="w-4 h-4" /> : '验证'}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Token 仅存储在浏览器本地，不上传任何第三方服务器
            </p>
            {isTokenValid && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" /> 已连接
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gist 管理 */}
      {isTokenValid && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Gist 管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gistId && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Gist ID:</span>
                <code className="text-sm font-mono">{gistId}</code>
                <Button variant="ghost" size="sm" onClick={copyGistId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleUpload} disabled={loading} className="gap-2">
                <Upload className="w-4 h-4" /> 上传到云端
              </Button>
              <Button onClick={handleDownload} disabled={loading || !gistId} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> 从云端恢复
              </Button>
              <Button onClick={handleBidirectionalSync} disabled={loading || !gistId} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> 双向同步
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">最后同步</p>
                <p className="font-medium">{lastSync || '未同步'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">云端数据</p>
                <p className="font-medium">{cloudCount} 条</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">本地数据</p>
                <p className="font-medium">{localCount} 条</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 本地备份 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-500" />
            本地备份
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {backups.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无备份记录</p>
            ) : (
              backups.slice(0, 3).map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{backup.timestamp}</p>
                    <p className="text-sm text-gray-500">{backup.recordCount} 条记录</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRestoreBackup(backup)}>
                    恢复
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 错误弹窗 */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" /> 同步错误
            </DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setError(null)}>关闭</Button>
        </DialogContent>
      </Dialog>

      {/* 冲突解决弹窗 */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>数据冲突</DialogTitle>
            <DialogDescription>
              本地与云端数据不一致，请选择同步方向：
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-gray-50 rounded">本地：{conflictData?.local} 条记录</div>
                <div className="p-3 bg-gray-50 rounded">云端：{conflictData?.cloud} 条记录</div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button onClick={() => handleResolveConflict(true)} className="flex-1">
              本地优先
            </Button>
            <Button onClick={() => handleResolveConflict(false)} variant="outline" className="flex-1">
              云端优先
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
