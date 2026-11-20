import {
  PROFILE_IMAGE_ALLOWED_MIME_TYPES,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MAX_DIMENSION,
  type ProfileImageMimeType,
} from '../entities/profile-image';

const MIME_TYPE_TO_EXTENSION: Record<ProfileImageMimeType, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isSafePathSegment(segment: string): boolean {
  return segment.length > 0 && segment !== '.' && segment !== '..' && !/[\s/]/.test(segment);
}

/**
 * MIME タイプがプロフィール画像として許可されているか判定する
 */
export function isAllowedProfileImageMimeType(mimeType: string): mimeType is ProfileImageMimeType {
  return (PROFILE_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * ファイルサイズがプロフィール画像の上限（2MB）以内かつ正の整数か判定する
 */
export function isValidProfileImageSize(sizeBytes: number): boolean {
  return Number.isInteger(sizeBytes) && sizeBytes > 0 && sizeBytes <= PROFILE_IMAGE_MAX_BYTES;
}

/**
 * MIME タイプに対応するファイル拡張子を返す
 */
export function getExtensionForProfileImageMimeType(
  mimeType: ProfileImageMimeType,
): 'jpg' | 'png' | 'webp' {
  return MIME_TYPE_TO_EXTENSION[mimeType];
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
  const extension = getExtensionForProfileImageMimeType(mimeType);
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
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(maxDimension) ||
    width <= 0 ||
    height <= 0 ||
    maxDimension <= 0
  ) {
    return null;
  }
  if (width <= maxDimension && height <= maxDimension) {
    return null;
  }
  if (width >= height) {
    return { width: maxDimension };
  }
  return { height: maxDimension };
}
