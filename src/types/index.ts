// 日常生活复盘工作台 - 类型定义

// 项目分类
export type ProjectCategory =
  | '运动健康'
  | '饮食管理'
  | '学习成长'
  | '兴趣技能'
  | '体征参数'
  | '自定义';

// 计量类型
export type MeasureType = '是否型' | '数值型' | '文本型';

// 项目类型
export type ProjectType = '目标型' | '记录型';

// 目标类型
export type TargetType = '下限型' | '上限型' | '区间型' | '无目标';

// 项目配置
export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  measureType: MeasureType;
  projectType: ProjectType;
  targetType: TargetType;
  unit: string;
  targetValue?: number;
  targetMin?: number;
  targetMax?: number;
  cardColor: string;
  sort: number;
  enabled: boolean;
  placeholder?: string;
}

// 每日记录
export interface DailyRecord {
  projectId: string;
  date: string; // YYYY-MM-DD
  value: boolean | number | string | null;
  note?: string;
}

// 日期数据
export interface DateData {
  date: string;
  records: Record<string, DailyRecord>; // projectId -> DailyRecord
  note: string;
}

// 应用数据
export interface AppData {
  projects: Project[];
  records: Record<string, DateData>; // date -> DateData
  lastSync?: string;
}

// 项目完成状态
export interface ProjectStatus {
  project: Project;
  record: DailyRecord | null;
  isCompleted: boolean;
  isOverLimit?: boolean;
  currentValue?: number | string;
  targetValue?: number;
  progress?: number;
}

// 分类颜色映射
export const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  '运动健康': '#22c55e', // green-500
  '饮食管理': '#f97316', // orange-500
  '学习成长': '#3b82f6', // blue-500
  '兴趣技能': '#a855f7', // purple-500
  '体征参数': '#eab308', // yellow-500
  '自定义': '#ec4899', // pink-500
};

// 预置标签
export const PRESET_TAGS = ['#聚餐', '#失眠', '#加班', '#生理期', '#cheatday', '#生病'];

// 每日鼓励语
export const DAILY_QUOTES = [
  '今天也是元气满满的一天！',
  '坚持就是胜利，你超棒的！',
  '每一个小进步都值得庆祝！',
  '相信自己，你可以的！',
  '今天的努力是明天的礼物！',
  '保持热爱，奔赴山海！',
  '星光不问赶路人，时光不负有心人！',
  '越努力，越幸运！',
  '做最好的自己，遇见更好的未来！',
  '生活明朗，万物可爱！',
  '愿你眼里有光，心中有爱！',
  '每一天都是新的开始！',
  '向阳而生，逐光而行！',
  '平凡的日子也要闪闪发光！',
  '心怀希望，所向披靡！',
  '你的坚持终将美好！',
  '不负时光，不负自己！',
  '努力成为更好的自己！',
  '今天也要加油鸭！',
  '愿你被世界温柔以待！',
  '保持微笑，好运自来！',
  '心若向阳，无畏悲伤！',
  '慢慢来，谁还没有个努力的过程！',
  '你努力的样子真好看！',
  '愿所有美好如期而至！',
  '生活值得，未来可期！',
  '做自己的太阳，无需借谁的光！',
  '愿你历尽千帆，归来仍是少年！',
  '每一天都值得被温柔对待！',
  '愿你活成自己想要的模样！',
];

// 快捷累加值
export const QUICK_ADD_VALUES: Record<string, number[]> = {
  '喝水量': [250, 500],
  '钢琴练习': [10, 30],
  '拍一段视频': [5, 10],
  '减脂时间': [10, 20],
  '增肌时间': [10, 20],
  '练字': [1, 5],
  'Python技能学习': [10, 30],
  '背单词': [10, 30],
  '情绪签到': [1, 1],
};
