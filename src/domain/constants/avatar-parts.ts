import type { EyeType, GlassesType, HairStyle, OutfitType } from '../entities/avatar';

/**
 * 肌色カラーパレット
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
  { id: 'black', name: 'ブラック', hex: '#212121', highlightHex: '#424242' },
  { id: 'dark_brown', name: '焦茶', hex: '#3E2723', highlightHex: '#5D4037' },
  { id: 'brown', name: 'ブラウン', hex: '#6D4C41', highlightHex: '#8D6E63' },
  { id: 'ash_blonde', name: 'アッシュ', hex: '#A1887F', highlightHex: '#BCAAA4' },
  { id: 'blonde', name: 'ゴールド', hex: '#D4A373', highlightHex: '#E9C46A' },
  { id: 'burgundy', name: 'ワインレッド', hex: '#880E4F', highlightHex: '#AD1457' },
  { id: 'navy', name: 'ネイビー', hex: '#1A237E', highlightHex: '#283593' },
] as const;

/**
 * 髪型オプション
 */
export interface HairStyleOption {
  id: HairStyle;
  name: string;
}

export const HAIR_STYLE_OPTIONS: readonly HairStyleOption[] = [
  { id: 'short_messy', name: '無造作ショート' },
  { id: 'mush', name: 'マッシュ' },
  { id: 'center_part', name: 'センターパート' },
  { id: 'long_straight', name: 'ロングストレート' },
  { id: 'wavy', name: 'ウェーブ' },
  { id: 'spiky', name: 'スパイキー' },
  { id: 'bob', name: 'ボブ' },
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
  { id: 'dots', name: '点目（標準）' },
  { id: 'smile', name: 'にっこり' },
  { id: 'calm', name: 'ジト目' },
  { id: 'sparkle', name: 'パッチリ' },
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
  { id: 'border_navy', name: 'ネイビーボーダー', description: '爽やかな青白ボーダー' },
  { id: 'hoodie_blue', name: 'ブルーパーカー', description: 'ゆったりフーディー' },
  { id: 'jacket_green', name: 'グリーンジャケット', description: 'アウトドア風シャツ羽織り' },
  { id: 'jacket_black', name: 'レザージャケット', description: 'クールな黒ジャケット' },
  { id: 'tshirt_white', name: '白Tシャツ', description: 'シンプルな白Tシャツ' },
  { id: 'tshirt_red', name: '赤Tシャツ', description: '鮮やかな赤無地Tシャツ' },
  { id: 'tshirt_graphic', name: 'グラフィックT', description: 'ワンポイントロゴT' },
] as const;

/**
 * メガネオプション
 */
export interface GlassesOption {
  id: GlassesType;
  name: string;
}

export const GLASSES_OPTIONS: readonly GlassesOption[] = [
  { id: 'none', name: 'なし' },
  { id: 'glasses_round', name: '丸メガネ' },
  { id: 'glasses_square', name: '黒縁メガネ' },
] as const;

/**
 * カスタマイズ画面のタブ一覧
 */
export const AVATAR_CUSTOMIZE_TABS = [
  { id: 'hair', label: '髪型・髪色' },
  { id: 'skin', label: '肌色' },
  { id: 'face', label: '目・表情' },
  { id: 'outfit', label: '服装' },
  { id: 'accessory', label: '小物' },
] as const;

export type AvatarCustomizeTab = (typeof AVATAR_CUSTOMIZE_TABS)[number]['id'];
