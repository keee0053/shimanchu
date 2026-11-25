import {
  type Coordinates,
  EMPTY_REGISTERED_PLACES,
  type IslandType,
  type PlaceRadius,
  type RegisteredPlaces,
} from '@/domain/entities/island';
import {
  calculateDistanceMeters,
  detectIsland,
  isDriftingByInactivity,
  resolveDisplayedIsland,
} from '@/domain/services/island';

const TOKYO_STATION: Coordinates = { latitude: 35.681236, longitude: 139.767125 };
const HOUR_MS = 60 * 60 * 1000;

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

  it('位置情報が null または NaN のときは drifting になる', () => {
    expect(detectIsland(null, places)).toBe('drifting');
    expect(detectIsland({ latitude: Number.NaN, longitude: 139.767125 }, places)).toBe('drifting');
  });

  it('家・学校どちらも未登録でも位置が取れていれば outside になる', () => {
    expect(detectIsland(TOKYO_STATION, EMPTY_REGISTERED_PLACES)).toBe('outside');
  });

  it.each<{ distanceFromHome: number; currentIsland: IslandType | null; expected: IslandType }>([
    { distanceFromHome: 199.99, currentIsland: null, expected: 'home' },
    { distanceFromHome: 200.01, currentIsland: null, expected: 'outside' },
    { distanceFromHome: 215, currentIsland: 'outside', expected: 'outside' },
    { distanceFromHome: 215, currentIsland: 'home', expected: 'home' },
    { distanceFromHome: 229.99, currentIsland: 'home', expected: 'home' },
    { distanceFromHome: 230.01, currentIsland: 'home', expected: 'outside' },
    { distanceFromHome: 1150, currentIsland: null, expected: 'school' },
    { distanceFromHome: 770.01, currentIsland: 'school', expected: 'school' },
    { distanceFromHome: 769.99, currentIsland: 'school', expected: 'outside' },
  ])(
    '家から $distanceFromHome m・今の島 $currentIsland → $expected',
    ({ distanceFromHome, currentIsland, expected }) => {
      expect(
        detectIsland(offsetNorthMeters(TOKYO_STATION, distanceFromHome), places, currentIsland),
      ).toBe(expected);
    },
  );

  it.each<{
    radius: PlaceRadius;
    distanceFromHome: number;
    currentIsland: IslandType | null;
    expected: IslandType;
  }>([
    { radius: 100, distanceFromHome: 99.99, currentIsland: null, expected: 'home' },
    { radius: 100, distanceFromHome: 100.01, currentIsland: null, expected: 'outside' },
    { radius: 100, distanceFromHome: 129.99, currentIsland: 'home', expected: 'home' },
    { radius: 100, distanceFromHome: 130.01, currentIsland: 'home', expected: 'outside' },
    { radius: 500, distanceFromHome: 499.99, currentIsland: null, expected: 'home' },
    { radius: 500, distanceFromHome: 500.01, currentIsland: null, expected: 'outside' },
    { radius: 500, distanceFromHome: 529.99, currentIsland: 'home', expected: 'home' },
    { radius: 500, distanceFromHome: 530.01, currentIsland: 'home', expected: 'outside' },
  ])(
    '半径 $radius m・距離 $distanceFromHome m・今の島 $currentIsland → $expected',
    ({ radius, distanceFromHome, currentIsland, expected }) => {
      const customPlaces: RegisteredPlaces = {
        home: { coordinates: TOKYO_STATION, radius },
        school: null,
      };
      expect(
        detectIsland(
          offsetNorthMeters(TOKYO_STATION, distanceFromHome),
          customPlaces,
          currentIsland,
        ),
      ).toBe(expected);
    },
  );

  it('家と学校の範囲が重なっているときは中心が近い方を優先し、等距離なら home にする', () => {
    const overlappingPlaces: RegisteredPlaces = {
      home: { coordinates: TOKYO_STATION, radius: 500 },
      school: { coordinates: offsetNorthMeters(TOKYO_STATION, 300), radius: 500 },
    };

    expect(detectIsland(offsetNorthMeters(TOKYO_STATION, 100), overlappingPlaces)).toBe('home');
    expect(detectIsland(offsetNorthMeters(TOKYO_STATION, 200), overlappingPlaces)).toBe('school');

    // 同緯度・経度対称配置により両方の中心から完全に等距離になる座標を作る
    const symmetricPlaces: RegisteredPlaces = {
      home: { coordinates: { latitude: 35.68, longitude: 139.76 }, radius: 500 },
      school: { coordinates: { latitude: 35.68, longitude: 139.762 }, radius: 500 },
    };
    const exactMidpoint: Coordinates = { latitude: 35.68, longitude: 139.761 };
    expect(detectIsland(exactMidpoint, symmetricPlaces)).toBe('home');
  });
});

describe('isDriftingByInactivity / resolveDisplayedIsland', () => {
  const now = new Date('2026-11-20T12:00:00.000Z');

  it.each<{
    islandType: IslandType;
    elapsedMs: number;
    expectedDrifting: boolean;
    expectedDisplayed: IslandType;
  }>([
    {
      islandType: 'home',
      elapsedMs: 24 * HOUR_MS - 1,
      expectedDrifting: false,
      expectedDisplayed: 'home',
    },
    {
      islandType: 'home',
      elapsedMs: 24 * HOUR_MS,
      expectedDrifting: true,
      expectedDisplayed: 'drifting',
    },
    {
      islandType: 'drifting',
      elapsedMs: 0,
      expectedDrifting: false,
      expectedDisplayed: 'drifting',
    },
  ])(
    '保存済み=$islandType・経過時間=$elapsedMs ms → drifting=$expectedDrifting, 表示=$expectedDisplayed',
    ({ islandType, elapsedMs, expectedDrifting, expectedDisplayed }) => {
      const updatedAt = new Date(now.getTime() - elapsedMs);
      expect(isDriftingByInactivity(updatedAt, now)).toBe(expectedDrifting);
      expect(resolveDisplayedIsland(islandType, updatedAt, now)).toBe(expectedDisplayed);
    },
  );

  it('不正な日時文字列のときは漂流扱いになる', () => {
    expect(isDriftingByInactivity('invalid-date', now)).toBe(true);
  });
});
