/**
 * アバター作成・カスタマイズ画面のカテゴリ別タブ定義（UI表示用定数）
 */
export const AVATAR_CUSTOMIZE_TABS = [
  { id: 'hair', label: '髪型・髪色' },
  { id: 'face', label: '目・表情' },
  { id: 'skin', label: '肌色' },
  { id: 'outfit', label: '服（胴体）' },
  { id: 'glasses', label: 'メガネ・小物' },
] as const;

export type AvatarCustomizeTab = (typeof AVATAR_CUSTOMIZE_TABS)[number]['id'];
