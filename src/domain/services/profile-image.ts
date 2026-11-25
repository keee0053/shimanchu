import {
  type CropCorner,
  PROFILE_IMAGE_EXTENSIONS,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MAX_DIMENSION,
  type ProfileImageCropRect,
  type ProfileImageMimeType,
  type SquareCropBox,
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

/**
 * 元画像を画面上の表示領域（maxWidth x maxHeight）に収める縦横比維持サイズを計算する
 */
export function calculateFittedImageSize(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (
    !isPositiveNumber(imageWidth) ||
    !isPositiveNumber(imageHeight) ||
    !isPositiveNumber(maxWidth) ||
    !isPositiveNumber(maxHeight)
  ) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
  };
}

/**
 * 表示画像の中央に収まる最大サイズの初期正方形切り抜き枠を作る
 */
export function createInitialSquareCropBox(
  displayedWidth: number,
  displayedHeight: number,
): SquareCropBox {
  if (!isPositiveNumber(displayedWidth) || !isPositiveNumber(displayedHeight)) {
    return { x: 0, y: 0, size: 0 };
  }
  const size = Math.min(displayedWidth, displayedHeight);
  return {
    x: normalizeZero((displayedWidth - size) / 2),
    y: normalizeZero((displayedHeight - size) / 2),
    size,
  };
}

/**
 * 正方形切り抜き枠を表示画像からはみ出さないように移動する
 */
export function moveSquareCropBox(
  box: SquareCropBox,
  deltaX: number,
  deltaY: number,
  displayedWidth: number,
  displayedHeight: number,
): SquareCropBox {
  if (!isPositiveNumber(displayedWidth) || !isPositiveNumber(displayedHeight)) {
    return { x: 0, y: 0, size: 0 };
  }
  const maxAvailableSize = Math.min(displayedWidth, displayedHeight);
  const size = clampNumber(Number.isFinite(box.size) ? box.size : 0, 0, maxAvailableSize);
  const safeDeltaX = Number.isFinite(deltaX) ? deltaX : 0;
  const safeDeltaY = Number.isFinite(deltaY) ? deltaY : 0;

  return {
    x: clampNumber(box.x + safeDeltaX, 0, Math.max(0, displayedWidth - size)),
    y: clampNumber(box.y + safeDeltaY, 0, Math.max(0, displayedHeight - size)),
    size,
  };
}

/**
 * 指定した四隅のハンドルをドラッグして正方形切り抜き枠を拡縮する（対角の角を固定）
 */
export function resizeSquareCropBox(
  box: SquareCropBox,
  corner: CropCorner,
  deltaX: number,
  deltaY: number,
  displayedWidth: number,
  displayedHeight: number,
  minSize: number = 64,
): SquareCropBox {
  if (!isPositiveNumber(displayedWidth) || !isPositiveNumber(displayedHeight)) {
    return { x: 0, y: 0, size: 0 };
  }
  const maxAvailableSize = Math.min(displayedWidth, displayedHeight);
  const effectiveMin = Math.min(isPositiveNumber(minSize) ? minSize : 1, maxAvailableSize);
  const safeDx = Number.isFinite(deltaX) ? deltaX : 0;
  const safeDy = Number.isFinite(deltaY) ? deltaY : 0;

  switch (corner) {
    case 'bottom-right': {
      const anchorX = clampNumber(box.x, 0, displayedWidth);
      const anchorY = clampNumber(box.y, 0, displayedHeight);
      const maxSize = Math.min(displayedWidth - anchorX, displayedHeight - anchorY);
      const size = clampNumber(box.size + (safeDx + safeDy) / 2, effectiveMin, maxSize);
      return { x: anchorX, y: anchorY, size };
    }
    case 'top-left': {
      const anchorX = clampNumber(box.x + box.size, 0, displayedWidth);
      const anchorY = clampNumber(box.y + box.size, 0, displayedHeight);
      const maxSize = Math.min(anchorX, anchorY);
      const size = clampNumber(box.size + (-safeDx - safeDy) / 2, effectiveMin, maxSize);
      return {
        x: normalizeZero(anchorX - size),
        y: normalizeZero(anchorY - size),
        size,
      };
    }
    case 'top-right': {
      const anchorX = clampNumber(box.x, 0, displayedWidth);
      const anchorY = clampNumber(box.y + box.size, 0, displayedHeight);
      const maxSize = Math.min(displayedWidth - anchorX, anchorY);
      const size = clampNumber(box.size + (safeDx - safeDy) / 2, effectiveMin, maxSize);
      return {
        x: anchorX,
        y: normalizeZero(anchorY - size),
        size,
      };
    }
    case 'bottom-left': {
      const anchorX = clampNumber(box.x + box.size, 0, displayedWidth);
      const anchorY = clampNumber(box.y, 0, displayedHeight);
      const maxSize = Math.min(anchorX, displayedHeight - anchorY);
      const size = clampNumber(box.size + (-safeDx + safeDy) / 2, effectiveMin, maxSize);
      return {
        x: normalizeZero(anchorX - size),
        y: anchorY,
        size,
      };
    }
  }
}

/**
 * 表示座標系の正方形切り抜き枠を、元画像ピクセル座標系の切り抜き範囲へ変換する
 */
export function convertSquareCropBoxToImageRect(params: {
  box: SquareCropBox;
  displayedWidth: number;
  displayedHeight: number;
  imageWidth: number;
  imageHeight: number;
}): ProfileImageCropRect {
  const { box, displayedWidth, displayedHeight, imageWidth, imageHeight } = params;
  if (
    !isPositiveNumber(displayedWidth) ||
    !isPositiveNumber(displayedHeight) ||
    !isPositiveNumber(imageWidth) ||
    !isPositiveNumber(imageHeight)
  ) {
    return { originX: 0, originY: 0, width: 1, height: 1 };
  }

  const scaleX = imageWidth / displayedWidth;
  const scaleY = imageHeight / displayedHeight;
  const maxSide = Math.max(1, Math.min(Math.floor(imageWidth), Math.floor(imageHeight)));
  const side = clampNumber(Math.round(box.size * Math.min(scaleX, scaleY)), 1, maxSide);
  const maxOriginX = Math.max(0, Math.floor(imageWidth) - side);
  const maxOriginY = Math.max(0, Math.floor(imageHeight) - side);

  return {
    originX: clampNumber(Math.round(box.x * scaleX), 0, maxOriginX),
    originY: clampNumber(Math.round(box.y * scaleY), 0, maxOriginY),
    width: side,
    height: side,
  };
}
