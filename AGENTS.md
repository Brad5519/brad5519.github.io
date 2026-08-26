# AGENTS.md

## Dependencies

- date-fns: 日期格式化与计算
- lucide-react: SVG 图标库

## Architecture

- 数据存储: localStorage (`daily-review-workbench-v1`)
- 状态管理: React useState + useEffect
- 路由: TanStack Router (单页应用)
- 组件结构:
  - DashboardView: 今日总览（含每日黄历、连续打卡徽章）
  - RecordView: 每日记录
  - StatsView: 统计回顾（含本月概览、铜板趋势、热力图）
  - SyncView: 云端同步
  - ProjectView: 项目管理
  - SettingsView: 数据管理（含Obsidian导出）
- 工具函数:
  - stats-utils.ts: 统计计算
  - github-sync.ts: GitHub Gist 同步
  - backup.ts: 本地备份管理
  - obsidian-export.ts: Markdown 导出
- PWA: manifest.json + sw.js（离线支持）

## Patterns / Constraints

- 预置项目不可删除，只能停用
- 奖惩规则: 完成一项奖励3铜板
- 记录型项目: 有记录即完成
- 目标型项目: 达到目标值算完成
- 连续异常: 2天未记录黄框，3天未达标红框
- 连续打卡计算: 从昨天向前追溯，断一天归零
- GitHub Token: 仅存储在浏览器本地
- 同步前自动创建本地备份
- 导入前自动创建本地备份

## Data Flow

1. AppData 存储在 localStorage
2. 各视图通过 props 接收数据和回调
3. 修改后自动保存到 localStorage
4. 统计数据从现有记录实时计算
5. 云端同步通过 GitHub Gist API
6. 本地备份保留最近10条

## What Didn't Work

- 日历背景色渐变方案: 用户反馈视觉效果不佳，改用分级色块（起步/良好/优秀/完美）
- 铜板趋势图放在Dashboard: 占用空间过大，移至StatsView更合适

## Lessons

- 黄历数据采用本地算法生成，避免外部API依赖
- 日历组件统一使用 weekStartsOn={1} 确保周一开头
- 平均值计算需过滤无记录天数，避免数据失真
