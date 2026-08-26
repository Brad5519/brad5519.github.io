import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 把日期格式化为本地时区的 YYYY-MM-DD。
 * 注意：`toISOString()` 返回 UTC 时间，在中国时区（UTC+8）凌晨会导致"当天"错一天，
 * 因此统一改用本地时区拼装。
 */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
