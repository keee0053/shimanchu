import { PROFILE_RULES } from '@/domain/entities/profile';

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

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

export function getJstDateParts(now: Date = new Date()): DateParts {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth() + 1,
    day: jst.getUTCDate(),
  };
}

function subtractYears(parts: DateParts, years: number): DateParts {
  const targetYear = parts.year - years;
  const maxDay = daysInMonth(targetYear, parts.month);
  return {
    year: targetYear,
    month: parts.month,
    day: Math.min(parts.day, maxDay),
  };
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function isBirthDateInAllowedRange(birthDate: string, now: Date = new Date()): boolean {
  const parsed = parseIsoDate(birthDate);
  if (!parsed) return false;

  const today = getJstDateParts(now);
  const maxAllowed = subtractYears(today, PROFILE_RULES.MIN_AGE_YEARS);
  const minAllowed = subtractYears(today, PROFILE_RULES.MAX_AGE_YEARS);

  return compareDateParts(parsed, minAllowed) >= 0 && compareDateParts(parsed, maxAllowed) <= 0;
}
