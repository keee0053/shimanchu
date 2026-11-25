import {
  PROFILE_IMAGE_EXTENSIONS,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MAX_DIMENSION,
  type ProfileImageMimeType,
} from '../entities/profile-image';

function isSafePathSegment(segment: string): boolean {
  return segment.length > 0 && segment !== '.' && segment !== '..' && !/[\s/]/.test(segment);
}

function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * MIME タイプがプロフィール画像として許可されているか判定する
 */
export function isAllowedProfileImageMimeType(mimeType: string): mimeType is ProfileImageMimeType {
  return Object.hasOwn(PROFILE_IMAGE_EXTENSIONS, mimeType);
}

/**
 * ファイルサイズがプロフィール画像の上限（2MB）以内かつ正の整数か判定する
 */
export function isValidProfileImageSize(sizeBytes: number): boolean {
  return Number.isInteger(sizeBytes) && sizeBytes > 0 && sizeBytes <= PROFILE_IMAGE_MAX_BYTES;
}

/**
 * Supabase Storage に保存するパス（<user_id>/<ファイル名>）を組み立てる
 */
export function buildProfileImagePath(
  userId: string,
  fileId: string,
  mimeType: ProfileImageMimeType,
): string {
  if (!isSafePathSegment(userId) || !isSafePathSegment(fileId)) {
    throw new Error('プロフィール画像のパス生成に不正な ID が指定されました');
  }
  const extension = PROFILE_IMAGE_EXTENSIONS[mimeType];
  return `${userId}/${fileId}.${extension}`;
}

/**
 * パスが DB 制約（<userId>/<ファイル名>）を満たしているか検証する
 */
export function isValidProfileImagePath(path: string, userId: string): boolean {
  if (!isSafePathSegment(userId)) {
    return false;
  }
  const prefix = `${userId}/`;
  if (!path.startsWith(prefix)) {
    return false;
  }
  const fileName = path.slice(prefix.length);
  return isSafePathSegment(fileName);
}

/**
 * 画像を指定の最大辺サイズ以内に縮小するためのリサイズ指定を計算する（不要時は null）
 */
export function calculateProfileImageResize(
  width: number,
  height: number,
  maxDimension: number = PROFILE_IMAGE_MAX_DIMENSION,
): { width: number } | { height: number } | null {
  // 大きさが分からないときは縮めない
  if (!isPositiveNumber(width) || !isPositiveNumber(height) || !isPositiveNumber(maxDimension)) {
    return null;
  }
  // 長い辺が上限以下なら縮めない
  if (Math.max(width, height) <= maxDimension) {
    return null;
  }
  // 長い辺を上限にそろえる
  return width >= height ? { width: maxDimension } : { height: maxDimension };
}
