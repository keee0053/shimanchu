import { isBirthDateInAllowedRange, parseIsoDate } from '@/domain/services/birth-date';

describe('parseIsoDate', () => {
  it('正しい YYYY-MM-DD を年月日に分解する', () => {
    expect(parseIsoDate('2003-05-15')).toEqual({ year: 2003, month: 5, day: 15 });
  });

  it('うるう年の 2月29日 を有効とみなす', () => {
    expect(parseIsoDate('2000-02-29')).toEqual({ year: 2000, month: 2, day: 29 });
  });

  it('平年の 2月29日 は null を返す', () => {
    expect(parseIsoDate('2001-02-29')).toBeNull();
  });

  it('存在しない日付 2月30日 は null を返す', () => {
    expect(parseIsoDate('2000-02-30')).toBeNull();
  });

  it('YYYY-MM-DD 以外の形式は null を返す', () => {
    expect(parseIsoDate('2003/05/15')).toBeNull();
    expect(parseIsoDate('2003-5-15')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });
});

describe('isBirthDateInAllowedRange', () => {
  it('18歳の誕生日の前日は false を返す', () => {
    const now = new Date('2026-04-01T00:00:00+09:00');
    expect(isBirthDateInAllowedRange('2008-04-02', now)).toBe(false);
  });

  it('ちょうど18歳の誕生日は true を返す', () => {
    const now = new Date('2026-04-01T00:00:00+09:00');
    expect(isBirthDateInAllowedRange('2008-04-01', now)).toBe(true);
  });

  it('ちょうど120年前の日付は true を返す', () => {
    const now = new Date('2026-04-01T00:00:00+09:00');
    expect(isBirthDateInAllowedRange('1906-04-01', now)).toBe(true);
  });

  it('120年前より1日古い日付は false を返す', () => {
    const now = new Date('2026-04-01T00:00:00+09:00');
    expect(isBirthDateInAllowedRange('1906-03-31', now)).toBe(false);
  });

  it('日本時間の日付境界（UTC 15:00 が JST 翌日 0:00）を正しく判定する', () => {
    const beforeJstMidnight = new Date('2026-03-31T14:59:59Z');
    const atJstMidnight = new Date('2026-03-31T15:00:00Z');
    expect(isBirthDateInAllowedRange('2008-04-01', beforeJstMidnight)).toBe(false);
    expect(isBirthDateInAllowedRange('2008-04-01', atJstMidnight)).toBe(true);
  });
});
