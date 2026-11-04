import { z } from 'zod';

/**
 * 髪型の種類
 */
export const HAIR_STYLES = [
  'short_messy',
  'mush',
  'center_part',
  'long_straight',
  'wavy',
  'spiky',
  'bob',
  'cap_forward',
  'cap_backward',
] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

/**
 * 目の種類
 */
export const EYE_TYPES = ['dots', 'smile', 'calm', 'sparkle'] as const;
export type EyeType = (typeof EYE_TYPES)[number];

/**
 * 口・表情の種類
 */
export const MOUTH_TYPES = ['neutral', 'smile', 'open', 'small'] as const;
export type MouthType = (typeof MOUTH_TYPES)[number];

/**
 * 服装の種類
 */
export const OUTFIT_TYPES = [
  'border_navy',
  'border_white',
  'hoodie_blue',
  'jacket_green',
  'jacket_black',
  'tshirt_white',
  'tshirt_red',
  'tshirt_graphic',
] as const;
export type OutfitType = (typeof OUTFIT_TYPES)[number];

/**
 * メガネの種類
 */
export const GLASSES_TYPES = ['none', 'glasses_round', 'glasses_square'] as const;
export type GlassesType = (typeof GLASSES_TYPES)[number];

/**
 * プレビュー状態（立ち姿 / 漂流姿）
 */
export const AVATAR_PREVIEW_MODES = ['standing', 'drifting'] as const;
export type AvatarPreviewMode = (typeof AVATAR_PREVIEW_MODES)[number];

/**
 * アバター構成設定の Zod スキーマ
 */
export const avatarConfigSchema = z.object({
  skinTone: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '有効なHEXカラーコードを指定してください'),
  hairStyle: z.enum(HAIR_STYLES),
  hairColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '有効なHEXカラーコードを指定してください'),
  eyeType: z.enum(EYE_TYPES),
  mouthType: z.enum(MOUTH_TYPES),
  outfit: z.enum(OUTFIT_TYPES),
  glasses: z.enum(GLASSES_TYPES),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

/**
 * デフォルトのアバター設定（添付画像風）
 */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinTone: '#F5CEB3',
  hairStyle: 'short_messy',
  hairColor: '#2C3E50', // 画像2番目のダークネイビー/黒髪
  eyeType: 'dots',
  mouthType: 'neutral',
  outfit: 'border_navy',
  glasses: 'none',
};
