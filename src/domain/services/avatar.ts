import {
  type AvatarConfig,
  avatarConfigSchema,
  DEFAULT_AVATAR_CONFIG,
} from '@/domain/entities/avatar';

/**
 * DB から読んだアバター設定を、アプリで使える形にする。
 * 一覧にない値・足りない項目は、その項目だけ初期値に戻す（#17）。オブジェクトでなければ全部初期値
 */
export function normalizeAvatarConfig(raw: unknown): AvatarConfig {
  const source: Record<string, unknown> =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const { shape } = avatarConfigSchema;

  const pick = <K extends keyof AvatarConfig>(key: K): AvatarConfig[K] => {
    const parsed = shape[key].safeParse(source[key]);
    return parsed.success ? (parsed.data as AvatarConfig[K]) : DEFAULT_AVATAR_CONFIG[key];
  };

  return {
    skinTone: pick('skinTone'),
    hairStyle: pick('hairStyle'),
    hairColor: pick('hairColor'),
    eyeType: pick('eyeType'),
    outfit: pick('outfit'),
  };
}
