import {
  PROFILE_IMAGE_EXTENSIONS,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MAX_CROP_SCALE,
  PROFILE_IMAGE_MAX_DIMENSION,
  type ProfileImageCropRect,
  type ProfileImageMimeType,
} from '../entities/profile-image';

function isSafePathSegment(segment: string): boolean {
  return segment.length > 0 && segment !== '.' && segment !== '..' && !/[\s/]/.test(segment);
}

function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

function clampNumber(value: number, min: number, max: number): number {
  return normalizeZero(Math.min(Math.max(value, min), max));
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

export type ProfileImageCropTransformParams = {
  imageWidth: number;
  imageHeight: number;
  viewportSize: number;
  scale: number;
  translateX: number;
  translateY: number;
  maxScale?: number;
};

/**
 * 切り抜き枠をはみ出さないように拡大率と移動量を正規化する
 */
export function clampProfileImageCropTransform({
  imageWidth,
  imageHeight,
  viewportSize,
  scale,
  translateX,
  translateY,
  maxScale = PROFILE_IMAGE_MAX_CROP_SCALE,
}: ProfileImageCropTransformParams): {
  scale: number;
  translateX: number;
  translateY: number;
  displayedWidth: number;
  displayedHeight: number;
} {
  if (
    !isPositiveNumber(imageWidth) ||
    !isPositiveNumber(imageHeight) ||
    !isPositiveNumber(viewportSize)
  ) {
    const safeViewport = isPositiveNumber(viewportSize) ? viewportSize : 0;
    return {
      scale: 1,
      translateX: 0,
      translateY: 0,
      displayedWidth: safeViewport,
      displayedHeight: safeViewport,
    };
  }

  const resolvedMaxScale =
    isPositiveNumber(maxScale) && maxScale > 1 ? maxScale : PROFILE_IMAGE_MAX_CROP_SCALE;
  const clampedScale = clampNumber(Number.isFinite(scale) ? scale : 1, 1, resolvedMaxScale);
  const baseScale = viewportSize / Math.min(imageWidth, imageHeight);
  const displayedWidth = imageWidth * baseScale * clampedScale;
  const displayedHeight = imageHeight * baseScale * clampedScale;
  const maxTranslateX = Math.max(0, (displayedWidth - viewportSize) / 2);
  const maxTranslateY = Math.max(0, (displayedHeight - viewportSize) / 2);

  return {
    scale: clampedScale,
    translateX: clampNumber(
      Number.isFinite(translateX) ? translateX : 0,
      -maxTranslateX,
      maxTranslateX,
    ),
    translateY: clampNumber(
      Number.isFinite(translateY) ? translateY : 0,
      -maxTranslateY,
      maxTranslateY,
    ),
    displayedWidth,
    displayedHeight,
  };
}

/**
 * 切り抜きモーダル上の拡大率・移動量から、元画像座標系の正方形切り抜き範囲を計算する
 */
export function calculateProfileImageCropRect(
  params: Omit<ProfileImageCropTransformParams, 'maxScale'>,
): ProfileImageCropRect {
  const { imageWidth, imageHeight, viewportSize } = params;
  if (
    !isPositiveNumber(imageWidth) ||
    !isPositiveNumber(imageHeight) ||
    !isPositiveNumber(viewportSize)
  ) {
    return { originX: 0, originY: 0, width: 1, height: 1 };
  }

  const clamped = clampProfileImageCropTransform(params);
  const totalScale = (viewportSize / Math.min(imageWidth, imageHeight)) * clamped.scale;
  const rawSide = viewportSize / totalScale;
  const maxSide = Math.max(1, Math.min(Math.floor(imageWidth), Math.floor(imageHeight)));
  const side = Math.max(1, Math.min(Math.round(rawSide), maxSide));

  const rawOriginX = (imageWidth - rawSide) / 2 - clamped.translateX / totalScale;
  const rawOriginY = (imageHeight - rawSide) / 2 - clamped.translateY / totalScale;

  const maxOriginX = Math.max(0, Math.floor(imageWidth) - side);
  const maxOriginY = Math.max(0, Math.floor(imageHeight) - side);

  return {
    originX: clampNumber(Math.round(rawOriginX), 0, maxOriginX),
    originY: clampNumber(Math.round(rawOriginY), 0, maxOriginY),
    width: side,
    height: side,
  };
}
