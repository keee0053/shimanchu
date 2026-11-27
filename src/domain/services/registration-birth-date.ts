import { REGISTRATION_RULES } from '@/domain/entities/registration';

// アカウント登録で入力する生年月日のルール
// 日付は時刻やタイムゾーンを持たない「年月日」として扱う。今日の日付は日本時間で数える
// （DB のトリガー private.check_birth_date と同じ基準）

export type DateParts = {
  year: number;
  /** 1〜12 */
  month: number;
  day: number;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/** `years` 年前の同じ日。うるう日（2月29日）がない年は2月28日にする（PostgreSQL の interval と同じ） */
function subtractYears(date: DateParts, years: number): DateParts {
  const year = date.year - years;
  return { year, month: date.month, day: Math.min(date.day, daysInMonth(year, date.month)) };
}

/** YYYY-MM-DD を年月日にする。形式が違う・存在しない日付は null */
export function parseIsoDate(value: string): DateParts | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;

  return { year, month, day };
}

/** 年月日を YYYY-MM-DD にする */
export function formatIsoDate({ year, month, day }: DateParts): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** `now` の時点の、日本時間での今日の年月日 */
export function getJstToday(now: Date): DateParts {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return { year: jst.getUTCFullYear(), month: jst.getUTCMonth() + 1, day: jst.getUTCDate() };
}

/** 生年月日として選べる範囲（120年前〜18年前の今日。両端を含む） */
export function getBirthDateRange(today: DateParts): { min: DateParts; max: DateParts } {
  return {
    min: subtractYears(today, REGISTRATION_RULES.MAX_AGE_YEARS),
    max: subtractYears(today, REGISTRATION_RULES.MIN_AGE_YEARS),
  };
}

/** 生年月日が選べる範囲に入っているか（18歳以上・120年前まで） */
export function isBirthDateInAllowedRange(birthDate: DateParts, today: DateParts): boolean {
  const { min, max } = getBirthDateRange(today);
  return compareDateParts(birthDate, min) >= 0 && compareDateParts(birthDate, max) <= 0;
}
