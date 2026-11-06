import type { EyeType, HairStyle, OutfitType } from '../entities/avatar';

/**
 * 肌色パレット（4〜5段階）
 */
export interface SkinToneOption {
  id: string;
  name: string;
  hex: string;
}

export const SKIN_TONE_OPTIONS: readonly SkinToneOption[] = [
  { id: 'fair', name: '色白', hex: '#FDE8D7' },
  { id: 'natural', name: '標準', hex: '#F5CEB3' },
  { id: 'warm', name: '健康肌', hex: '#E0AC69' },
  { id: 'tan', name: '小麦肌', hex: '#C68642' },
  { id: 'deep', name: '褐色', hex: '#8D5524' },
] as const;

/**
 * 髪色カラーパレット
 */
export interface HairColorOption {
  id: string;
  name: string;
  hex: string;
}

export const HAIR_COLOR_OPTIONS: readonly HairColorOption[] = [
  { id: 'dark_navy', name: 'ダークネイビー', hex: '#433F58' },
  { id: 'black', name: 'ブラック', hex: '#282634' },
  { id: 'dark_brown', name: '焦茶', hex: '#3E2723' },
  { id: 'chestnut', name: 'チェスナット', hex: '#92513E' },
  { id: 'blonde', name: 'ハニーブロンド', hex: '#CB8853' },
  { id: 'crimson', name: 'ワインレッド', hex: '#C04263' },
] as const;

/**
 * 髪型オプション
 */
export interface HairStyleOption {
  id: HairStyle;
  name: string;
}

export const HAIR_STYLE_OPTIONS: readonly HairStyleOption[] = [
  { id: 'mush', name: 'マッシュ' },
  { id: 'short', name: 'ショート' },
  { id: 'center_part', name: 'センター分け' },
  { id: 'long', name: 'ロング' },
  { id: 'wavy', name: 'ウェーブ' },
  { id: 'cap_forward', name: 'キャップ（前）' },
  { id: 'cap_backward', name: 'キャップ（後）' },
] as const;

/**
 * 目のタイプオプション
 */
export interface EyeTypeOption {
  id: EyeType;
  name: string;
}

export const EYE_TYPE_OPTIONS: readonly EyeTypeOption[] = [
  { id: 'dots', name: '点目（デフォルト）' },
  { id: 'smile', name: '笑顔（にっこり）' },
  { id: 'calm', name: 'ジト目' },
  { id: 'sparkle', name: 'パッチリ丸目' },
] as const;

/**
 * 服装オプション
 */
export interface OutfitOption {
  id: OutfitType;
  name: string;
  description: string;
}

export const OUTFIT_OPTIONS: readonly OutfitOption[] = [
  { id: 'stripe', name: 'ボーダーTシャツ', description: '爽やかなネイビー×白ボーダー' },
  { id: 'plain', name: '無地Tシャツ', description: '鮮やかなレッドTシャツ' },
  { id: 'hoodie', name: 'パーカー', description: 'フード付きブルーパーカー' },
  { id: 'jacket', name: 'ジャケット', description: 'グリーンの羽織りジャケット' },
] as const;
