import type { EyeType, HairColor, HairStyle, OutfitType, SkinTone } from '@/domain/entities/avatar';

/**
 * 肌色パレット（表示名・HEXカラーコード）
 */
export const SKIN_TONE_OPTIONS: Record<SkinTone, { name: string; hex: string }> = {
  fair: { name: '色白', hex: '#FDE8D7' },
  natural: { name: '標準', hex: '#F5CEB3' },
  warm: { name: '健康肌', hex: '#E0AC69' },
  tan: { name: '小麦肌', hex: '#C68642' },
  deep: { name: '褐色', hex: '#8D5524' },
};

/**
 * 髪色カラーパレット（表示名・HEXカラーコード）
 */
export const HAIR_COLOR_OPTIONS: Record<HairColor, { name: string; hex: string }> = {
  dark_navy: { name: 'ダークネイビー', hex: '#433F58' },
  black: { name: 'ブラック', hex: '#282634' },
  dark_brown: { name: '焦茶', hex: '#3E2723' },
  chestnut: { name: 'チェスナット', hex: '#92513E' },
  blonde: { name: 'ハニーブロンド', hex: '#CB8853' },
  crimson: { name: 'ワインレッド', hex: '#C04263' },
};

/**
 * 髪型の表示名
 */
export const HAIR_STYLE_LABELS: Record<HairStyle, string> = {
  mush: 'マッシュ',
  short: 'ショート',
  center_part: 'センター分け',
  long: 'ロング',
  wavy: 'ウェーブ',
  cap_forward: 'キャップ（前）',
  cap_backward: 'キャップ（後）',
};

/**
 * 目の種類の表示名
 */
export const EYE_TYPE_LABELS: Record<EyeType, string> = {
  dots: '点目（デフォルト）',
  smile: '笑顔（にっこり）',
  calm: 'ジト目',
  sparkle: 'パッチリ丸目',
};

/**
 * 服装の表示名・説明
 */
export const OUTFIT_OPTIONS: Record<OutfitType, { name: string; description: string }> = {
  stripe: { name: 'ボーダーTシャツ', description: '爽やかなネイビー×白ボーダー' },
  plain: { name: '無地Tシャツ', description: '鮮やかなレッドTシャツ' },
  hoodie: { name: 'パーカー', description: 'フード付きブルーパーカー' },
  jacket: { name: 'ジャケット', description: 'グリーンの羽織りジャケット' },
};
