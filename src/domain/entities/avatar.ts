import { z } from 'zod';

/**
 * 肌色一覧
 */
export const SKIN_TONES = ['fair', 'natural', 'warm', 'tan', 'deep'] as const;
export type SkinTone = (typeof SKIN_TONES)[number];

/**
 * 髪色一覧
 */
export const HAIR_COLORS = [
  'dark_navy',
  'black',
  'dark_brown',
  'chestnut',
  'blonde',
  'crimson',
] as const;
export type HairColor = (typeof HAIR_COLORS)[number];

/**
 * 髪型一覧
 */
export const HAIR_STYLES = [
  'mush',
  'short',
  'center_part',
  'long',
  'wavy',
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
 * 服（胴体）の種類
 */
export const OUTFIT_TYPES = ['stripe', 'plain', 'hoodie', 'jacket'] as const;
export type OutfitType = (typeof OUTFIT_TYPES)[number];

/**
 * プレビュー状態（立ち姿 / 漂流姿）
 */
export const AVATAR_PREVIEW_MODES = ['standing', 'drifting'] as const;
export type AvatarPreviewMode = (typeof AVATAR_PREVIEW_MODES)[number];

/**
 * 仕様通りのアバター設定 Zod スキーマ
 */
export const avatarConfigSchema = z.object({
  skinTone: z.enum(SKIN_TONES),
  hairStyle: z.enum(HAIR_STYLES),
  hairColor: z.enum(HAIR_COLORS),
  eyeType: z.enum(EYE_TYPES),
  outfit: z.enum(OUTFIT_TYPES),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

/**
 * デフォルトのアバター設定
 */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinTone: 'natural',
  hairStyle: 'short',
  hairColor: 'dark_navy',
  eyeType: 'dots',
  outfit: 'stripe',
};
