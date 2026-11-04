import { z } from 'zod';

/**
 * 添付画像のベーススタイル一覧（全12タイプ）
 */
export const AVATAR_BASE_STYLES = [
  'char1_cap_red', // 赤白キャップ ＋ 青パーカー
  'char2_border_navy', // 黒髪ショート ＋ 白青ボーダーT ＋ デニム
  'char3_cap_blue', // 青キャップ（後） ＋ 水色ボーダーT
  'char4_cap_green', // 緑キャップ（後） ＋ 緑ジャケット
  'char5_long_hair', // 黒髪ロングストレート ＋ 白T ＋ デニム
  'char6_jacket_green', // 茶髪無造作 ＋ 緑ジャケット
  'char7_jacket_teal', // 茶髪ショート ＋ エメラルドジャケット
  'char8_jacket_black', // 黒髪ショート ＋ 黒レザージャケット
  'char9_tshirt_red', // ピンク/赤髪 ＋ 赤無地Tシャツ
  'char10_jacket_olive', // 金髪無造作 ＋ オリーブジャケット
  'char11_graphic_dark', // 黒髪分け目 ＋ ダークロゴTシャツ
  'char12_wavy_hair', // 茶髪ウェーブ・パーマ ＋ 緑ジャケット
] as const;
export type AvatarBaseStyle = (typeof AVATAR_BASE_STYLES)[number];

/**
 * 目の種類
 */
export const EYE_TYPES = ['dots', 'smile', 'calm', 'sparkle'] as const;
export type EyeType = (typeof EYE_TYPES)[number];

/**
 * 口の種類
 */
export const MOUTH_TYPES = ['neutral', 'smile', 'open', 'small'] as const;
export type MouthType = (typeof MOUTH_TYPES)[number];

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
  baseStyle: z.enum(AVATAR_BASE_STYLES),
  eyeType: z.enum(EYE_TYPES),
  mouthType: z.enum(MOUTH_TYPES),
  glasses: z.enum(GLASSES_TYPES),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

/**
 * デフォルトのアバター設定（添付画像2番目のボーダーT）
 */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  baseStyle: 'char2_border_navy',
  eyeType: 'dots',
  mouthType: 'neutral',
  glasses: 'none',
};
