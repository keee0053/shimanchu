import type { EyeType, HairStyle, OutfitType } from '../entities/avatar';

/**
 * 肌色パレット（4〜5段階）
 */
export interface SkinToneOption {
  id: string;
  name: string;
  hex: string;
  shadowHex: string;
}

export const SKIN_TONE_OPTIONS: readonly SkinToneOption[] = [
  { id: 'fair', name: '色白', hex: '#FDE8D7', shadowHex: '#E8C4A2' },
  { id: 'natural', name: '標準', hex: '#F5CEB3', shadowHex: '#DCA485' },
  { id: 'warm', name: '健康肌', hex: '#E0AC69', shadowHex: '#C08B4B' },
  { id: 'tan', name: '小麦肌', hex: '#C68642', shadowHex: '#A06429' },
  { id: 'deep', name: '褐色', hex: '#8D5524', shadowHex: '#6E3E15' },
] as const;

/**
 * 髪色カラーパレット
 */
export interface HairColorOption {
  id: string;
  name: string;
  hex: string;
  highlightHex: string;
}

export const HAIR_COLOR_OPTIONS: readonly HairColorOption[] = [
  { id: 'black', name: 'ブラック', hex: '#212121', highlightHex: '#3D3D3D' },
  { id: 'dark_navy', name: 'ネイビー', hex: '#2C3E50', highlightHex: '#415B76' },
  { id: 'dark_brown', name: '焦茶', hex: '#3E2723', highlightHex: '#5D4037' },
  { id: 'brown', name: 'ブラウン', hex: '#6D4C41', highlightHex: '#8D6E63' },
  { id: 'blonde', name: 'ゴールド', hex: '#D4A373', highlightHex: '#E9C46A' },
  { id: 'burgundy', name: 'レッド', hex: '#880E4F', highlightHex: '#AD1457' },
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
  { id: 'stripe', name: 'ボーダーTシャツ', description: '爽やかな青白ボーダー' },
  { id: 'plain', name: '無地Tシャツ', description: 'シンプルな白Tシャツ' },
  { id: 'hoodie', name: 'パーカー', description: 'ブルーのフーディー' },
  { id: 'jacket', name: 'ジャケット', description: '羽織りジャケット' },
] as const;

/**
 * カテゴリ別タブ
 */
export const AVATAR_CUSTOMIZE_TABS = [
  { id: 'hair', label: '髪型・髪色' },
  { id: 'face', label: '目・表情' },
  { id: 'skin', label: '肌色' },
  { id: 'outfit', label: '服（胴体）' },
  { id: 'glasses', label: 'メガネ・小物' },
] as const;

export type AvatarCustomizeTab = (typeof AVATAR_CUSTOMIZE_TABS)[number]['id'];
