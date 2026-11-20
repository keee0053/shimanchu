/**
 * プロフィール画像を保存する Supabase Storage のバケット名（#65）
 */
export const PROFILE_IMAGE_BUCKET = 'profile-images';

/**
 * プロフィール画像の最大ファイルサイズ（バイト: 2MB）
 */
export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/**
 * プロフィール画像として許可される MIME タイプ
 */
export const PROFILE_IMAGE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ProfileImageMimeType = (typeof PROFILE_IMAGE_ALLOWED_MIME_TYPES)[number];

/**
 * 端末で縮小するときの最大縦横サイズ（ピクセル）
 */
export const PROFILE_IMAGE_MAX_DIMENSION = 512;

/**
 * 端末で選択・縮小圧縮されたアップロード前のプロフィール画像
 */
export type PreparedProfileImage = {
  uri: string;
  mimeType: ProfileImageMimeType;
  sizeBytes: number;
  width: number;
  height: number;
};
