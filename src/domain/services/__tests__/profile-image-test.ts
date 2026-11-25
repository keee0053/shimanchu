import type { ProfileImageMimeType } from '@/domain/entities/profile-image';
import {
  buildProfileImagePath,
  calculateProfileImageResize,
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
