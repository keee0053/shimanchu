import { PROFILE_IMAGE_MAX_BYTES } from '@/domain/entities/profile-image';
import {
  buildProfileImagePath,
  calculateProfileImageResize,
  getExtensionForProfileImageMimeType,
  isAllowedProfileImageMimeType,
  isValidProfileImagePath,
  isValidProfileImageSize,
} from '@/domain/services/profile-image';

describe('isAllowedProfileImageMimeType', () => {
  it('JPEG・PNG・WebP を許可する', () => {
    expect(isAllowedProfileImageMimeType('image/jpeg')).toBe(true);
    expect(isAllowedProfileImageMimeType('image/png')).toBe(true);
    expect(isAllowedProfileImageMimeType('image/webp')).toBe(true);
  });

  it('許可されていない形式を拒否する', () => {
    expect(isAllowedProfileImageMimeType('image/gif')).toBe(false);
    expect(isAllowedProfileImageMimeType('image/heic')).toBe(false);
    expect(isAllowedProfileImageMimeType('application/pdf')).toBe(false);
  });
});

describe('isValidProfileImageSize', () => {
  it('1バイトからちょうど 2MB までを許可する', () => {
    expect(isValidProfileImageSize(1)).toBe(true);
    expect(isValidProfileImageSize(PROFILE_IMAGE_MAX_BYTES)).toBe(true);
  });

  it('0以下・小数・2MB超過を拒否する', () => {
    expect(isValidProfileImageSize(0)).toBe(false);
    expect(isValidProfileImageSize(-1)).toBe(false);
    expect(isValidProfileImageSize(1.5)).toBe(false);
    expect(isValidProfileImageSize(PROFILE_IMAGE_MAX_BYTES + 1)).toBe(false);
  });
});

describe('buildProfileImagePath / isValidProfileImagePath', () => {
  it('userId と fileId から Storage パスを生成できる', () => {
    expect(getExtensionForProfileImageMimeType('image/jpeg')).toBe('jpg');
    expect(buildProfileImagePath('user-123', 'avatar-1', 'image/png')).toBe(
      'user-123/avatar-1.png',
    );
  });

  it('パストラバーサルや空文字を含む場合はエラーにする', () => {
    expect(() => buildProfileImagePath('', 'file', 'image/jpeg')).toThrow();
    expect(() => buildProfileImagePath('user/1', 'file', 'image/jpeg')).toThrow();
    expect(() => buildProfileImagePath('user-1', '..', 'image/jpeg')).toThrow();
  });

  it('本人のフォルダ直下のパスだけを妥当とみなす', () => {
    expect(isValidProfileImagePath('user-1/avatar.jpg', 'user-1')).toBe(true);
    expect(isValidProfileImagePath('user-2/avatar.jpg', 'user-1')).toBe(false);
    expect(isValidProfileImagePath('user-1/sub/avatar.jpg', 'user-1')).toBe(false);
    expect(isValidProfileImagePath('user-1/', 'user-1')).toBe(false);
    expect(isValidProfileImagePath('user-1/..', 'user-1')).toBe(false);
  });
});

describe('calculateProfileImageResize', () => {
  it('縦横とも最大サイズ以下なら null を返す', () => {
    expect(calculateProfileImageResize(512, 512)).toBeNull();
    expect(calculateProfileImageResize(300, 512)).toBeNull();
  });

  it('横長または正方形で上限を超えるときは width 基準のリサイズを返す', () => {
    expect(calculateProfileImageResize(513, 512)).toEqual({ width: 512 });
    expect(calculateProfileImageResize(1024, 1024)).toEqual({ width: 512 });
  });

  it('縦長で上限を超えるときは height 基準のリサイズを返す', () => {
    expect(calculateProfileImageResize(512, 513)).toEqual({ height: 512 });
    expect(calculateProfileImageResize(600, 1200)).toEqual({ height: 512 });
  });
});
