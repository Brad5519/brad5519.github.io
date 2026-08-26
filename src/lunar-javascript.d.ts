// 类型声明：lunar-javascript（无自带类型定义的 CommonJS 农历库）
declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    toString(): string;
  }
}