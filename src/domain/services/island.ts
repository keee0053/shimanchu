import {
  type Coordinates,
  DRIFTING_THRESHOLD_MS,
  ISLAND_EXIT_MARGIN_METERS,
  type IslandType,
  type RegisteredPlace,
  type RegisteredPlaces,
} from '../entities/island';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 2点間の距離（メートル）を Haversine 公式で計算する
 */
export function calculateDistanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h = sinHalfLat * sinHalfLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfLon * sinHalfLon;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

function getDistanceIfInside(
  coords: Coordinates,
  place: RegisteredPlace | null,
  isCurrentlyHere: boolean,
): number | null {
  if (!place) return null;
  const distance = calculateDistanceMeters(coords, place.coordinates);
  const effectiveRadius = place.radius + (isCurrentlyHere ? ISLAND_EXIT_MARGIN_METERS : 0);
  return distance <= effectiveRadius ? distance : null;
}

/**
 * 現在地と登録済みの場所（家・学校）から、今いる島を判定する純粋関数
 * - 位置が取れない・権限がない（coords が null）ときは 'drifting'
 * - 登録した点から半径以内ならその島（出るときは半径 + ISLAND_EXIT_MARGIN_METERS で判定）
 * - 家と学校の範囲が重なっているときは、中心が近い方の島にする
 * - どちらにも入らなければ 'outside'
 */
export function detectIsland(
  coords: Coordinates | null,
  places: RegisteredPlaces,
  currentIsland?: IslandType | null,
): IslandType {
  if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
    return 'drifting';
  }

  const homeDistance = getDistanceIfInside(coords, places.home, currentIsland === 'home');
  const schoolDistance = getDistanceIfInside(coords, places.school, currentIsland === 'school');

  if (homeDistance !== null && schoolDistance !== null) {
    return homeDistance <= schoolDistance ? 'home' : 'school';
  }
  if (homeDistance !== null) {
    return 'home';
  }
  if (schoolDistance !== null) {
    return 'school';
  }
  return 'outside';
}

/**
 * 最終更新日時（updated_at）から24時間以上経過して漂流扱いになるかを判定する
 */
export function isDriftingByInactivity(updatedAt: string | Date, now: Date = new Date()): boolean {
  const updatedTime =
    typeof updatedAt === 'string' ? new Date(updatedAt).getTime() : updatedAt.getTime();
  if (!Number.isFinite(updatedTime)) {
    return true;
  }
  return now.getTime() - updatedTime >= DRIFTING_THRESHOLD_MS;
}

/**
 * 保存されている島の種類と最終更新日時から、画面に表示する島の種類を決める
 */
export function resolveDisplayedIsland(
  islandType: IslandType,
  updatedAt: string | Date,
  now: Date = new Date(),
): IslandType {
  if (islandType === 'drifting' || isDriftingByInactivity(updatedAt, now)) {
    return 'drifting';
  }
  return islandType;
}
