import type { EyeType, GlassesType, HairStyle, MouthType, OutfitType } from '../entities/avatar';

/**
 * 肌色カラーパレット（添付画像から抽出した美しいトーン）
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
  { id: 'black', name: 'ブラック', hex: '#1C2833', highlightHex: '#2E4053' },
  { id: 'dark_navy', name: 'ダークネイビー', hex: '#2C3E50', highlightHex: '#415B76' },
  { id: 'dark_brown', name: '焦茶', hex: '#3E2723', highlightHex: '#5D4037' },
  { id: 'brown', name: 'ブラウン', hex: '#6D4C41', highlightHex: '#8D6E63' },
  { id: 'blonde', name: 'ゴールド', hex: '#D4A373', highlightHex: '#E9C46A' },
  { id: 'burgundy', name: 'レッド系', hex: '#880E4F', highlightHex: '#AD1457' },
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
 * 口のタイプオプション
 */
export interface MouthTypeOption {
  id: MouthType;
  name: string;
}

export const MOUTH_TYPE_OPTIONS: readonly MouthTypeOption[] = [
  { id: 'neutral', name: '普通（点）' },
  { id: 'smile', name: 'ほほえみ' },
  { id: 'open', name: '開いた口' },
  { id: 'small', name: 'ひかえめ' },
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
  { id: 'border_navy', name: 'ネイビーボーダー', description: '青白ストライプT' },
  { id: 'border_white', name: 'ライトボーダー', description: '爽やかな水色ボーダー' },
  { id: 'hoodie_blue', name: 'ブルーパーカー', description: 'ゆったりフーディー' },
  { id: 'jacket_green', name: 'グリーンシャツ', description: '羽織りジャケット' },
  { id: 'jacket_black', name: 'レザージャケット', description: '黒ジャケット＋白T' },
  { id: 'tshirt_white', name: '白Tシャツ', description: '爽やかな白無地T' },
  { id: 'tshirt_red', name: '赤Tシャツ', description: '鮮やかな赤無地T' },
  { id: 'tshirt_graphic', name: 'ロゴTシャツ', description: 'ダークロゴT' },
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
  { id: 'face', label: '目・口' },
  { id: 'skin', label: '肌色' },
  { id: 'outfit', label: '服装' },
  { id: 'accessory', label: '小物' },
] as const;

export type AvatarCustomizeTab = (typeof AVATAR_CUSTOMIZE_TABS)[number]['id'];
