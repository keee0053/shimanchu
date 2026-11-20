/**
 * 島の種類
 * - home: 家
 * - school: 学校
 * - outside: 外出中（位置は取れたが登録した場所のどこにもいない）
 * - drifting: 漂流（位置が取れない・権限がない・24時間以上更新がない）
 */
export const ISLAND_TYPES = ['home', 'school', 'outside', 'drifting'] as const;
export type IslandType = (typeof ISLAND_TYPES)[number];

/**
 * ユーザーが端末に登録できる場所の種類（家・学校それぞれ1つ）
 */
export const PLACE_ISLAND_TYPES = ['home', 'school'] as const;
export type PlaceIslandType = (typeof PLACE_ISLAND_TYPES)[number];

/**
 * 場所の判定半径の選択肢（メートル: 小 100m / 中 200m / 大 500m）
 */
export const PLACE_RADIUS_OPTIONS = [100, 200, 500] as const;
export type PlaceRadius = (typeof PLACE_RADIUS_OPTIONS)[number];

/**
 * 場所の判定半径の初期値（メートル）
 */
export const DEFAULT_PLACE_RADIUS: PlaceRadius = 200;

/**
 * 島の境目で出入りを繰り返さないための余裕幅（メートル）
 * 現在その島にいる場合、radius + ISLAND_EXIT_MARGIN_METERS 以内なら滞在継続とみなす
 */
export const ISLAND_EXIT_MARGIN_METERS = 30;

/**
 * 最終更新（user_presence.updated_at）から漂流とみなすまでの時間（ミリ秒: 24時間）
 */
export const DRIFTING_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * 緯度・経度（端末内でのみ扱い、サーバーには送らない）
 */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * 端末内に保存する登録場所（家または学校）
 */
export type RegisteredPlace = {
  coordinates: Coordinates;
  radius: PlaceRadius;
};

/**
 * 家と学校の登録状態（それぞれ1つまで）
 */
export type RegisteredPlaces = {
  home: RegisteredPlace | null;
  school: RegisteredPlace | null;
};

export const EMPTY_REGISTERED_PLACES: RegisteredPlaces = {
  home: null,
  school: null,
};

/**
 * ユーザーの現在の島の状態（user_presence テーブルに対応）
 */
export type UserPresence = {
  userId: string;
  islandType: IslandType;
  statusText: string | null;
  updatedAt: string;
};
