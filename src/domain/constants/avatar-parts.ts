import type { AvatarBaseStyle, EyeType, GlassesType, MouthType } from '../entities/avatar';

/**
 * 添付画像ベーススタイルのメタデータ
 */
export interface AvatarBaseStyleOption {
  id: AvatarBaseStyle;
  name: string;
  category: 'cap' | 'short' | 'long' | 'jacket';
  description: string;
}

export const AVATAR_BASE_STYLE_OPTIONS: readonly AvatarBaseStyleOption[] = [
  {
    id: 'char1_cap_red',
    name: '赤キャップ＆パーカー',
    category: 'cap',
    description: 'ベースボールキャップ ＋ 青パーカー',
  },
  {
    id: 'char2_border_navy',
    name: '黒髪ボーダーT',
    category: 'short',
    description: '爽やかな白青ボーダー ＋ デニム',
  },
  {
    id: 'char3_cap_blue',
    name: '青キャップ（後）',
    category: 'cap',
    description: 'ストリート風後ろかぶり ＋ 水色ボーダー',
  },
  {
    id: 'char4_cap_green',
    name: '緑キャップ＆シャツ',
    category: 'cap',
    description: '緑キャップ ＋ ジップジャケット',
  },
  {
    id: 'char5_long_hair',
    name: '黒髪ロングストレート',
    category: 'long',
    description: 'さらさらロング ＋ 白T ＋ デニム',
  },
  {
    id: 'char6_jacket_green',
    name: '茶髪＆グリーンシャツ',
    category: 'jacket',
    description: '無造作ヘア ＋ 緑ジャケット羽織り',
  },
  {
    id: 'char7_jacket_teal',
    name: 'エメラルドジャケット',
    category: 'jacket',
    description: 'オールバック風 ＋ 青緑ジャケット',
  },
  {
    id: 'char8_jacket_black',
    name: '黒レザージャケット',
    category: 'jacket',
    description: '黒髪ショート ＋ モードな黒ジャケット',
  },
  {
    id: 'char9_tshirt_red',
    name: 'レッド無地T',
    category: 'short',
    description: 'ベリー系カラー髪 ＋ 赤無地Tシャツ',
  },
  {
    id: 'char10_jacket_olive',
    name: '金髪＆オリーブシャツ',
    category: 'jacket',
    description: 'ゴールド無造作 ＋ オリーブシャツ',
  },
  {
    id: 'char11_graphic_dark',
    name: 'ダークロゴT',
    category: 'short',
    description: 'センター分け風 ＋ ワンポイントロゴT',
  },
  {
    id: 'char12_wavy_hair',
    name: 'ウェーブ＆パーマ',
    category: 'long',
    description: 'ボリュームのあるウェーブヘア ＋ 羽織り',
  },
] as const;

/**
 * 目のタイプオプション
 */
export interface EyeTypeOption {
  id: EyeType;
  name: string;
}

export const EYE_TYPE_OPTIONS: readonly EyeTypeOption[] = [
  { id: 'dots', name: '点目（オリジナル）' },
  { id: 'smile', name: 'にっこり笑顔' },
  { id: 'calm', name: 'クール・ジト目' },
  { id: 'sparkle', name: 'パッチリ丸目' },
] as const;

/**
 * 口のタイプオプション
 */
export interface MouthTypeOption {
  id: MouthType;
  name: string;
}

export const MOUTH_TYPE_OPTIONS: readonly MouthTypeOption[] = [
  { id: 'neutral', name: 'オリジナル（点口）' },
  { id: 'smile', name: 'ほほえみ口' },
  { id: 'open', name: 'わーい（開口）' },
  { id: 'small', name: 'ひかえめ' },
] as const;

/**
 * メガネオプション
 */
export interface GlassesOption {
  id: GlassesType;
  name: string;
}

export const GLASSES_OPTIONS: readonly GlassesOption[] = [
  { id: 'none', name: 'メガネなし' },
  { id: 'glasses_round', name: '丸メガネ' },
  { id: 'glasses_square', name: '黒縁メガネ' },
] as const;

/**
 * カスタマイズ画面のタブ一覧
 */
export const AVATAR_CUSTOMIZE_TABS = [
  { id: 'style', label: 'スタイル一覧' },
  { id: 'face', label: '表情（目・口）' },
  { id: 'accessory', label: 'メガネ・小物' },
] as const;

export type AvatarCustomizeTab = (typeof AVATAR_CUSTOMIZE_TABS)[number]['id'];
