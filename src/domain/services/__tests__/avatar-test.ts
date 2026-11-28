import { type AvatarConfig, DEFAULT_AVATAR_CONFIG } from '@/domain/entities/avatar';
import { normalizeAvatarConfig } from '@/domain/services/avatar';

const SAVED: AvatarConfig = {
  skinTone: 'tan',
  hairStyle: 'long',
  hairColor: 'blonde',
  eyeType: 'smile',
  outfit: 'hoodie',
};

describe('normalizeAvatarConfig', () => {
  it.each<{ name: string; raw: unknown; expected: AvatarConfig }>([
    { name: '正しい設定はそのまま使う', raw: SAVED, expected: SAVED },
    {
      name: '一覧にない値は、その項目だけ初期値に戻す',
      raw: { ...SAVED, hairStyle: 'mohawk' },
      expected: { ...SAVED, hairStyle: DEFAULT_AVATAR_CONFIG.hairStyle },
    },
    {
      name: '型が違う値は、その項目だけ初期値に戻す',
      raw: { ...SAVED, outfit: 1 },
      expected: { ...SAVED, outfit: DEFAULT_AVATAR_CONFIG.outfit },
    },
    {
      name: '足りない項目は初期値で埋める',
      raw: { skinTone: 'tan' },
      expected: { ...DEFAULT_AVATAR_CONFIG, skinTone: 'tan' },
    },
    {
      name: '知らない項目は捨てる',
      raw: { ...SAVED, hat: 'beret' },
      expected: SAVED,
    },
    { name: '空のオブジェクトは全部初期値', raw: {}, expected: DEFAULT_AVATAR_CONFIG },
    { name: 'null は全部初期値', raw: null, expected: DEFAULT_AVATAR_CONFIG },
    { name: '配列は全部初期値', raw: ['tan'], expected: DEFAULT_AVATAR_CONFIG },
    { name: '文字列は全部初期値', raw: 'tan', expected: DEFAULT_AVATAR_CONFIG },
  ])('$name', ({ raw, expected }) => {
    expect(normalizeAvatarConfig(raw)).toEqual(expected);
  });
});
