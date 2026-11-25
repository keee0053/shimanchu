import type { ProfileImageCropRect, ProfileImageMimeType } from '@/domain/entities/profile-image';
import {
  buildProfileImagePath,
  calculateProfileImageCropRect,
  calculateProfileImageResize,
  clampProfileImageCropTransform,
  isAllowedProfileImageMimeType,
  isValidProfileImagePath,
  isValidProfileImageSize,
} from '@/domain/services/profile-image';

const TWO_MIB = 2 * 1024 * 1024;

describe('isAllowedProfileImageMimeType', () => {
  it.each<{ mimeType: string; expected: boolean }>([
    { mimeType: 'image/jpeg', expected: true },
    { mimeType: 'image/png', expected: true },
    { mimeType: 'image/webp', expected: true },
    { mimeType: 'image/gif', expected: false },
    { mimeType: 'image/heic', expected: false },
    { mimeType: 'application/pdf', expected: false },
    { mimeType: '', expected: false },
  ])('$mimeType の許可判定は $expected になる', ({ mimeType, expected }) => {
    expect(isAllowedProfileImageMimeType(mimeType)).toBe(expected);
  });
});

describe('isValidProfileImageSize', () => {
  it.each<{ sizeBytes: number; expected: boolean }>([
    { sizeBytes: 1, expected: true },
    { sizeBytes: TWO_MIB, expected: true },
    { sizeBytes: 0, expected: false },
    { sizeBytes: -1, expected: false },
    { sizeBytes: 1.5, expected: false },
    { sizeBytes: TWO_MIB + 1, expected: false },
    { sizeBytes: Number.NaN, expected: false },
    { sizeBytes: Number.POSITIVE_INFINITY, expected: false },
  ])('サイズ $sizeBytes バイトの判定は $expected になる', ({ sizeBytes, expected }) => {
    expect(isValidProfileImageSize(sizeBytes)).toBe(expected);
  });
});

describe('buildProfileImagePath / isValidProfileImagePath', () => {
  it.each<{ mimeType: ProfileImageMimeType; expected: string }>([
    { mimeType: 'image/jpeg', expected: 'user-123/avatar-1.jpg' },
    { mimeType: 'image/png', expected: 'user-123/avatar-1.png' },
    { mimeType: 'image/webp', expected: 'user-123/avatar-1.webp' },
  ])('MIME タイプ $mimeType からパス $expected を生成できる', ({ mimeType, expected }) => {
    expect(buildProfileImagePath('user-123', 'avatar-1', mimeType)).toBe(expected);
  });

  it.each<{ userId: string; fileId: string }>([
    { userId: '', fileId: 'file' },
    { userId: 'user/1', fileId: 'file' },
    { userId: 'user-1', fileId: '..' },
    { userId: 'user-1', fileId: 'a b' },
  ])('不正なセグメント ($userId / $fileId) はエラーにする', ({ userId, fileId }) => {
    expect(() => buildProfileImagePath(userId, fileId, 'image/jpeg')).toThrow();
  });

  it.each<{ path: string; userId: string; expected: boolean }>([
    { path: 'user-1/avatar.jpg', userId: 'user-1', expected: true },
    { path: 'user-2/avatar.jpg', userId: 'user-1', expected: false },
    { path: 'user-1/sub/avatar.jpg', userId: 'user-1', expected: false },
    { path: 'user-1/', userId: 'user-1', expected: false },
    { path: 'user-1/..', userId: 'user-1', expected: false },
  ])('パス $path（userId=$userId）の妥当性は $expected になる', ({ path, userId, expected }) => {
    expect(isValidProfileImagePath(path, userId)).toBe(expected);
  });
});

describe('calculateProfileImageResize', () => {
  it.each<{
    width: number;
    height: number;
    maxDimension: number;
    expected: { width: number } | { height: number } | null;
  }>([
    { width: 512, height: 512, maxDimension: 512, expected: null },
    { width: 300, height: 512, maxDimension: 512, expected: null },
    { width: 513, height: 512, maxDimension: 512, expected: { width: 512 } },
    { width: 1024, height: 1024, maxDimension: 512, expected: { width: 512 } },
    { width: 512, height: 513, maxDimension: 512, expected: { height: 512 } },
    { width: 600, height: 1200, maxDimension: 512, expected: { height: 512 } },
    { width: 400, height: 200, maxDimension: 256, expected: { width: 256 } },
    { width: 0, height: 512, maxDimension: 512, expected: null },
    { width: 512, height: 0, maxDimension: 512, expected: null },
    { width: 1024, height: 1024, maxDimension: 0, expected: null },
    { width: -100, height: 600, maxDimension: 512, expected: null },
    { width: Number.NaN, height: 600, maxDimension: 512, expected: null },
    { width: 600, height: Number.NaN, maxDimension: 512, expected: null },
    { width: Number.POSITIVE_INFINITY, height: 600, maxDimension: 512, expected: null },
  ])(
    '($width x $height, max=$maxDimension) のリサイズ結果は $expected になる',
    ({ width, height, maxDimension, expected }) => {
      expect(calculateProfileImageResize(width, height, maxDimension)).toEqual(expected);
    },
  );

  it('maxDimension 省略時は 512px が使われる', () => {
    expect(calculateProfileImageResize(1024, 512)).toEqual({ width: 512 });
    expect(calculateProfileImageResize(512, 512)).toBeNull();
  });
});

describe('clampProfileImageCropTransform / calculateProfileImageCropRect', () => {
  it.each<{
    imageWidth: number;
    imageHeight: number;
    viewportSize: number;
    scale: number;
    translateX: number;
    translateY: number;
    expectedScale: number;
    expectedTranslateX: number;
    expectedTranslateY: number;
  }>([
    {
      imageWidth: 1000,
      imageHeight: 500,
      viewportSize: 250,
      scale: 0.5,
      translateX: 500,
      translateY: 100,
      expectedScale: 1,
      expectedTranslateX: 125,
      expectedTranslateY: 0,
    },
    {
      imageWidth: 1000,
      imageHeight: 500,
      viewportSize: 250,
      scale: 6,
      translateX: -999,
      translateY: 999,
      expectedScale: 4,
      expectedTranslateX: -875,
      expectedTranslateY: 375,
    },
    {
      imageWidth: 600,
      imageHeight: 1200,
      viewportSize: 300,
      scale: 1,
      translateX: 40,
      translateY: -500,
      expectedScale: 1,
      expectedTranslateX: 0,
      expectedTranslateY: -150,
    },
  ])(
    '($imageWidth x $imageHeight, scale=$scale, tx=$translateX, ty=$translateY) のクランプ結果を確認',
    ({
      imageWidth,
      imageHeight,
      viewportSize,
      scale,
      translateX,
      translateY,
      expectedScale,
      expectedTranslateX,
      expectedTranslateY,
    }) => {
      const clamped = clampProfileImageCropTransform({
        imageWidth,
        imageHeight,
        viewportSize,
        scale,
        translateX,
        translateY,
      });
      expect(clamped.scale).toBe(expectedScale);
      expect(clamped.translateX).toBe(expectedTranslateX);
      expect(clamped.translateY).toBe(expectedTranslateY);
    },
  );

  it.each<{
    imageWidth: number;
    imageHeight: number;
    viewportSize: number;
    scale: number;
    translateX: number;
    translateY: number;
    expected: ProfileImageCropRect;
  }>([
    {
      imageWidth: 800,
      imageHeight: 800,
      viewportSize: 200,
      scale: 1,
      translateX: 0,
      translateY: 0,
      expected: { originX: 0, originY: 0, width: 800, height: 800 },
    },
    {
      imageWidth: 800,
      imageHeight: 800,
      viewportSize: 200,
      scale: 2,
      translateX: 0,
      translateY: 0,
      expected: { originX: 200, originY: 200, width: 400, height: 400 },
    },
    {
      imageWidth: 1000,
      imageHeight: 500,
      viewportSize: 250,
      scale: 1,
      translateX: 0,
      translateY: 0,
      expected: { originX: 250, originY: 0, width: 500, height: 500 },
    },
    {
      imageWidth: 1000,
      imageHeight: 500,
      viewportSize: 250,
      scale: 1,
      translateX: 125,
      translateY: 0,
      expected: { originX: 0, originY: 0, width: 500, height: 500 },
    },
    {
      imageWidth: 1000,
      imageHeight: 500,
      viewportSize: 250,
      scale: 1,
      translateX: -999,
      translateY: 0,
      expected: { originX: 500, originY: 0, width: 500, height: 500 },
    },
    {
      imageWidth: 600,
      imageHeight: 1200,
      viewportSize: 300,
      scale: 1,
      translateX: 0,
      translateY: 0,
      expected: { originX: 0, originY: 300, width: 600, height: 600 },
    },
    {
      imageWidth: 600,
      imageHeight: 1200,
      viewportSize: 300,
      scale: 1,
      translateX: 0,
      translateY: -150,
      expected: { originX: 0, originY: 600, width: 600, height: 600 },
    },
  ])(
    '($imageWidth x $imageHeight, scale=$scale, tx=$translateX, ty=$translateY) → $expected',
    ({ imageWidth, imageHeight, viewportSize, scale, translateX, translateY, expected }) => {
      expect(
        calculateProfileImageCropRect({
          imageWidth,
          imageHeight,
          viewportSize,
          scale,
          translateX,
          translateY,
        }),
      ).toEqual(expected);
    },
  );
});
