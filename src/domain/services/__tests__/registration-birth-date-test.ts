import {
  type DateParts,
  formatIsoDate,
  getJstToday,
  isBirthDateInAllowedRange,
  parseIsoDate,
} from '@/domain/services/registration-birth-date';

const d = (year: number, month: number, day: number): DateParts => ({ year, month, day });

describe('isBirthDateInAllowedRange', () => {
  it.each<{ name: string; birthDate: DateParts; today: DateParts; expected: boolean }>([
    {
      name: 'ちょうど18歳になる日は選べる',
      birthDate: d(2008, 11, 27),
      today: d(2026, 11, 27),
      expected: true,
    },
    {
      name: '18歳になる前日（明日が誕生日）は選べない',
      birthDate: d(2008, 11, 28),
      today: d(2026, 11, 27),
      expected: false,
    },
    {
      name: 'ちょうど120年前は選べる',
      birthDate: d(1906, 11, 27),
      today: d(2026, 11, 27),
      expected: true,
    },
    {
      name: '120年前より1日古い日は選べない',
      birthDate: d(1906, 11, 26),
      today: d(2026, 11, 27),
      expected: false,
    },
    {
      name: '2月29日生まれは、うるう年でない年の2月28日にはまだ18歳ではない',
      birthDate: d(2008, 2, 29),
      today: d(2026, 2, 28),
      expected: false,
    },
    {
      name: '2月29日生まれは、うるう年でない年の3月1日に18歳になる',
      birthDate: d(2008, 2, 29),
      today: d(2026, 3, 1),
      expected: true,
    },
  ])('$name', ({ birthDate, today, expected }) => {
    expect(isBirthDateInAllowedRange(birthDate, today)).toBe(expected);
  });
});

describe('parseIsoDate', () => {
  it.each<{ name: string; value: string; expected: DateParts | null }>([
    { name: '正しい日付を読める', value: '2008-04-01', expected: d(2008, 4, 1) },
    { name: 'うるう年の2月29日は読める', value: '2008-02-29', expected: d(2008, 2, 29) },
    { name: 'うるう年でない年の2月29日は存在しない', value: '2007-02-29', expected: null },
    { name: '13月は存在しない', value: '2008-13-01', expected: null },
    { name: '4月31日は存在しない', value: '2008-04-31', expected: null },
    { name: '形式が違う', value: '2008/04/01', expected: null },
    { name: '空文字', value: '', expected: null },
  ])('$name', ({ value, expected }) => {
    expect(parseIsoDate(value)).toEqual(expected);
  });
});

describe('formatIsoDate', () => {
  it.each<{ name: string; date: DateParts; expected: string }>([
    { name: '月と日を2桁にそろえる', date: d(2008, 4, 1), expected: '2008-04-01' },
    { name: '2桁の月と日はそのまま', date: d(2008, 12, 31), expected: '2008-12-31' },
  ])('$name', ({ date, expected }) => {
    expect(formatIsoDate(date)).toBe(expected);
  });
});

describe('getJstToday', () => {
  it.each<{ name: string; now: string; expected: DateParts }>([
    {
      name: 'UTC の15時（日本時間の0時）から日本時間の翌日になる',
      now: '2026-03-31T15:00:00Z',
      expected: d(2026, 4, 1),
    },
    {
      name: 'UTC の14時59分（日本時間の23時59分）はまだ同じ日',
      now: '2026-03-31T14:59:59Z',
      expected: d(2026, 3, 31),
    },
  ])('$name', ({ now, expected }) => {
    expect(getJstToday(new Date(now))).toEqual(expected);
  });
});
