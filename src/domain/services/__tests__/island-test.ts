import {
  type Coordinates,
  DRIFTING_THRESHOLD_MS,
  EMPTY_REGISTERED_PLACES,
  ISLAND_EXIT_MARGIN_METERS,
  type RegisteredPlaces,
} from '@/domain/entities/island';
import {
  calculateDistanceMeters,
  detectIsland,
  isDriftingByInactivity,
  resolveDisplayedIsland,
} from '@/domain/services/island';

const TOKYO_STATION: Coordinates = { latitude: 35.681236, longitude: 139.767125 };

/**
 * 基準点から北方向に指定メートル離れた座標を作るテスト用ヘルパー
 */
function offsetNorthMeters(base: Coordinates, meters: number): Coordinates {
  const earthRadius = 6_371_000;
  const dLat = (meters / earthRadius) * (180 / Math.PI);
  return { latitude: base.latitude + dLat, longitude: base.longitude };
}

describe('calculateDistanceMeters', () => {
  it('同じ座標同士の距離は 0 になる', () => {
    expect(calculateDistanceMeters(TOKYO_STATION, TOKYO_STATION)).toBe(0);
  });

  it('北方向に移動した距離をおおむね正確に計算できる', () => {
    const point200m = offsetNorthMeters(TOKYO_STATION, 200);
    expect(calculateDistanceMeters(TOKYO_STATION, point200m)).toBeCloseTo(200, 3);
  });
});

describe('detectIsland', () => {
  const places: RegisteredPlaces = {
    home: { coordinates: TOKYO_STATION, radius: 200 },
    school: { coordinates: offsetNorthMeters(TOKYO_STATION, 1000), radius: 200 },
  };

  it('位置情報が null のときは drifting になる', () => {
    expect(detectIsland(null, places)).toBe('drifting');
  });

  it('位置情報が NaN を含むときは drifting になる', () => {
    expect(detectIsland({ latitude: Number.NaN, longitude: 139.767125 }, places)).toBe('drifting');
  });

  it('家・学校どちらも未登録でも位置が取れていれば outside になる', () => {
    expect(detectIsland(TOKYO_STATION, EMPTY_REGISTERED_PLACES)).toBe('outside');
  });

  it('家の半径（200m）の境界で判定が切り替わる', () => {
    const justInside = offsetNorthMeters(TOKYO_STATION, 199.99);
    const justOutside = offsetNorthMeters(TOKYO_STATION, 200.01);
    expect(detectIsland(justInside, places)).toBe('home');
    expect(detectIsland(justOutside, places, 'outside')).toBe('outside');
  });

  it('現在 home にいるときは半径 + 余裕幅（200m + 30m）まで home のままになる', () => {
    const midMargin = offsetNorthMeters(TOKYO_STATION, 215);
    const marginInside = offsetNorthMeters(TOKYO_STATION, 200 + ISLAND_EXIT_MARGIN_METERS - 0.01);
    expect(detectIsland(midMargin, places, 'outside')).toBe('outside');
    expect(detectIsland(midMargin, places, 'home')).toBe('home');
    expect(detectIsland(marginInside, places, 'home')).toBe('home');
  });

  it('現在 home にいても半径 + 余裕幅を超えると outside になる', () => {
    const marginOutside = offsetNorthMeters(TOKYO_STATION, 200 + ISLAND_EXIT_MARGIN_METERS + 0.01);
    expect(detectIsland(marginOutside, places, 'home')).toBe('outside');
  });

  it('学校の範囲内にいるときは school になる', () => {
    const nearSchool = offsetNorthMeters(TOKYO_STATION, 1150);
    expect(detectIsland(nearSchool, places)).toBe('school');
  });

  it('家と学校の範囲が重なっているときは中心が近い方の島になる', () => {
    const overlappingPlaces: RegisteredPlaces = {
      home: { coordinates: TOKYO_STATION, radius: 500 },
      school: { coordinates: offsetNorthMeters(TOKYO_STATION, 300), radius: 500 },
    };

    const closerToHome = offsetNorthMeters(TOKYO_STATION, 100);
    expect(detectIsland(closerToHome, overlappingPlaces)).toBe('home');

    const closerToSchool = offsetNorthMeters(TOKYO_STATION, 200);
    expect(detectIsland(closerToSchool, overlappingPlaces)).toBe('school');
  });
});

describe('isDriftingByInactivity / resolveDisplayedIsland', () => {
  it('最終更新から24時間未満なら漂流扱いにならない', () => {
    const now = new Date('2026-11-20T12:00:00.000Z');
    const updatedAt = new Date(now.getTime() - (DRIFTING_THRESHOLD_MS - 1));
    expect(isDriftingByInactivity(updatedAt, now)).toBe(false);
    expect(resolveDisplayedIsland('home', updatedAt, now)).toBe('home');
  });

  it('最終更新からちょうど24時間経過したら漂流扱いになる', () => {
    const now = new Date('2026-11-20T12:00:00.000Z');
    const updatedAt = new Date(now.getTime() - DRIFTING_THRESHOLD_MS);
    expect(isDriftingByInactivity(updatedAt, now)).toBe(true);
    expect(resolveDisplayedIsland('home', updatedAt, now)).toBe('drifting');
  });

  it('もともと drifting が保存されていれば最新でも drifting になる', () => {
    const now = new Date('2026-11-20T12:00:00.000Z');
    expect(resolveDisplayedIsland('drifting', now, now)).toBe('drifting');
  });

  it('不正な日時文字列のときは漂流扱いになる', () => {
    const now = new Date('2026-11-20T12:00:00.000Z');
    expect(isDriftingByInactivity('invalid-date', now)).toBe(true);
  });
});
