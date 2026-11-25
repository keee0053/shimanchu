import type {
  CropCorner,
  ProfileImageCropRect,
  ProfileImageMimeType,
  SquareCropBox,
} from '@/domain/entities/profile-image';
import {
  buildProfileImagePath,
  calculateFittedImageSize,
  calculateProfileImageResize,
  convertSquareCropBoxToImageRect,
  createInitialSquareCropBox,
  isAllowedProfileImageMimeType,
  isValidProfileImagePath,
  isValidProfileImageSize,
  moveSquareCropBox,
  resizeSquareCropBox,
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

describe('切り抜き枠の計算（calculateFittedImageSize / createInitialSquareCropBox / move / resize / convert）', () => {
  it.each<{
    imageWidth: number;
    imageHeight: number;
    maxWidth: number;
    maxHeight: number;
    expected: { width: number; height: number };
  }>([
    {
      imageWidth: 1000,
      imageHeight: 500,
      maxWidth: 300,
      maxHeight: 400,
      expected: { width: 300, height: 150 },
    },
    {
      imageWidth: 500,
      imageHeight: 1000,
      maxWidth: 300,
      maxHeight: 400,
      expected: { width: 200, height: 400 },
    },
    {
      imageWidth: 0,
      imageHeight: 500,
      maxWidth: 300,
      maxHeight: 400,
      expected: { width: 0, height: 0 },
    },
  ])(
    'fit ($imageWidth x $imageHeight in $maxWidth x $maxHeight) → $expected',
    ({ imageWidth, imageHeight, maxWidth, maxHeight, expected }) => {
      expect(calculateFittedImageSize(imageWidth, imageHeight, maxWidth, maxHeight)).toEqual(
        expected,
      );
    },
  );

  it('初期切り抜き枠は表示画像の中央に最大正方形で配置される', () => {
    expect(createInitialSquareCropBox(300, 150)).toEqual({ x: 75, y: 0, size: 150 });
    expect(createInitialSquareCropBox(200, 400)).toEqual({ x: 0, y: 100, size: 200 });
  });

  it.each<{
    box: SquareCropBox;
    deltaX: number;
    deltaY: number;
    displayedWidth: number;
    displayedHeight: number;
    expected: SquareCropBox;
  }>([
    {
      box: { x: 50, y: 0, size: 100 },
      deltaX: 30,
      deltaY: 20,
      displayedWidth: 300,
      displayedHeight: 200,
      expected: { x: 80, y: 20, size: 100 },
    },
    {
      box: { x: 50, y: 20, size: 100 },
      deltaX: -999,
      deltaY: 999,
      displayedWidth: 300,
      displayedHeight: 200,
      expected: { x: 0, y: 100, size: 100 },
    },
  ])(
    'moveSquareCropBox ($deltaX, $deltaY) → $expected',
    ({ box, deltaX, deltaY, displayedWidth, displayedHeight, expected }) => {
      expect(moveSquareCropBox(box, deltaX, deltaY, displayedWidth, displayedHeight)).toEqual(
        expected,
      );
    },
  );

  it.each<{
    corner: CropCorner;
    deltaX: number;
    deltaY: number;
    expected: SquareCropBox;
  }>([
    { corner: 'bottom-right', deltaX: 40, deltaY: 40, expected: { x: 50, y: 50, size: 140 } },
    { corner: 'bottom-right', deltaX: -200, deltaY: -200, expected: { x: 50, y: 50, size: 64 } },
    { corner: 'top-left', deltaX: -20, deltaY: -20, expected: { x: 30, y: 30, size: 120 } },
    { corner: 'top-left', deltaX: -999, deltaY: -999, expected: { x: 0, y: 0, size: 150 } },
    { corner: 'top-right', deltaX: 20, deltaY: -20, expected: { x: 50, y: 30, size: 120 } },
    { corner: 'bottom-left', deltaX: -30, deltaY: 30, expected: { x: 20, y: 50, size: 130 } },
  ])(
    'resizeSquareCropBox ($corner, dx=$deltaX, dy=$deltaY) → $expected',
    ({ corner, deltaX, deltaY, expected }) => {
      const startBox: SquareCropBox = { x: 50, y: 50, size: 100 };
      expect(resizeSquareCropBox(startBox, corner, deltaX, deltaY, 300, 300, 64)).toEqual(expected);
    },
  );

  it.each<{
    box: SquareCropBox;
    displayedWidth: number;
    displayedHeight: number;
    imageWidth: number;
    imageHeight: number;
    expected: ProfileImageCropRect;
  }>([
    {
      box: { x: 75, y: 0, size: 150 },
      displayedWidth: 300,
      displayedHeight: 150,
      imageWidth: 1000,
      imageHeight: 500,
      expected: { originX: 250, originY: 0, width: 500, height: 500 },
    },
    {
      box: { x: 25, y: 50, size: 100 },
      displayedWidth: 200,
      displayedHeight: 400,
      imageWidth: 600,
      imageHeight: 1200,
      expected: { originX: 75, originY: 150, width: 300, height: 300 },
    },
  ])(
    'convertSquareCropBoxToImageRect → $expected',
    ({ box, displayedWidth, displayedHeight, imageWidth, imageHeight, expected }) => {
      expect(
        convertSquareCropBoxToImageRect({
          box,
          displayedWidth,
          displayedHeight,
          imageWidth,
          imageHeight,
        }),
      ).toEqual(expected);
    },
  );
});
