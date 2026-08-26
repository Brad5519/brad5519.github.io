import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  categoryColor: string;
}

export function StreakBadge({ streak, categoryColor }: StreakBadgeProps) {
  if (streak === 0) return null;

  const isFire = streak >= 7;
  const displayText = isFire ? '7+' : String(streak);

  // 深色版背景色
  const darkenColor = (color: string): string => {
    // 简单 darken: 将 hex 转为 rgb 后降低亮度
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // 降低 30%
    const darken = (c: number) => Math.floor(c * 0.7);
    return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
  };

  return (
    <div
      className="absolute -top-2 -right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-white text-xs font-bold shadow-md z-10"
      style={{ backgroundColor: darkenColor(categoryColor) }}
    >
      {isFire && (
        <Flame
          size={isFire ? 14 : 12}
          className="text-orange-300"
          fill="currentColor"
        />
      )}
      <span>{displayText}</span>
    </div>
  );
}
