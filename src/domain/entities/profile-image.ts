/**
 * プロフィール画像の最大ファイルサイズ（バイト: 2MB）
 */
export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/**
 * プロフィール画像として許可される MIME タイプと対応する拡張子
 */
export const PROFILE_IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type ProfileImageMimeType = keyof typeof PROFILE_IMAGE_EXTENSIONS;

/**
 * 端末で縮小するときの最大縦横サイズ（ピクセル）
 */
export const PROFILE_IMAGE_MAX_DIMENSION = 512;

/**
 * 切り抜きモーダルで拡大できる最大倍率
 */
export const PROFILE_IMAGE_MAX_CROP_SCALE = 4;

/**
 * 端末から選択した直後のプロフィール画像（切り抜き前）
 */
export type PickedProfileImage = {
  uri: string;
  width: number;
  height: number;
};

/**
 * 元画像のピクセル座標系における正方形の切り抜き範囲
 */
export type ProfileImageCropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

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
