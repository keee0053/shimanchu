import type { AccountRepository } from '@/domain/repositories/account-repository';

import { supabase } from './client';
import { requireCurrentUserId } from './current-user';

const UNIQUE_VIOLATION = '23505';
const PUBLIC_ID_UNIQUE_CONSTRAINT = 'profiles_public_id_key';
const PRIMARY_KEY_CONSTRAINT = 'profiles_pkey';

export const supabaseAccountRepository: AccountRepository = {
  async isPublicIdTaken(publicId) {
    const [{ data, error }, myUserId] = await Promise.all([
      // profiles は自分の行しか読めないため、公開 ID の完全一致で探す関数を使う
      supabase.rpc('find_profile_by_public_id', { p_public_id: publicId }),
      requireCurrentUserId('公開 ID を確かめる'),
    ]);
    if (error) throw error;

    return data.some((profile) => profile.id !== myUserId);
  },

  async register(draft, avatarConfig) {
    const myUserId = await requireCurrentUserId('アカウントの登録');

    // 自己紹介・性別・画像・生年月日の公開範囲は DB の初期値のまま作る
    const { error } = await supabase.from('profiles').insert({
      id: myUserId,
      public_id: draft.publicId,
      display_name: draft.displayName,
      birth_date: draft.birthDate,
      avatar_config: avatarConfig,
    });

    if (error?.code === UNIQUE_VIOLATION) {
      if (error.message.includes(PUBLIC_ID_UNIQUE_CONSTRAINT)) {
        return { ok: false, reason: 'public_id_taken' };
      }
      // 自分の行がもうある（通信が切れて再送したときなど）。今回の入力は保存されていないので、成功とは分けて返す
      if (error.message.includes(PRIMARY_KEY_CONSTRAINT)) {
        return { ok: false, reason: 'already_registered' };
      }
    }
    if (error) throw error;

    return { ok: true };
  },
};
