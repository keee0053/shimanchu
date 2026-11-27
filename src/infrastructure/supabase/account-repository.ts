import type { AccountRepository } from '@/domain/repositories/account-repository';

import { supabase } from './client';

export const supabaseAccountRepository: AccountRepository = {
  async isPublicIdTaken(publicId) {
    const [{ data, error }, { data: authData, error: authError }] = await Promise.all([
      // profiles は自分の行しか読めないため、公開 ID の完全一致で探す関数を使う
      supabase.rpc('find_profile_by_public_id', { p_public_id: publicId }),
      supabase.auth.getSession(),
    ]);
    if (error) throw error;
    if (authError) throw authError;
    if (!authData.session) {
      throw new Error('公開 ID を確かめるにはログインが必要です。');
    }

    const myUserId = authData.session.user.id;
    return data.some((profile) => profile.id !== myUserId);
  },
};
