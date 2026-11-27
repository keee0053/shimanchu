import type { AvatarRepository } from '@/domain/repositories/avatar-repository';
import { normalizeAvatarConfig } from '@/domain/services/avatar';

import { supabase } from './client';
import { requireCurrentUserId } from './current-user';

export const supabaseAvatarRepository: AvatarRepository = {
  async findMine() {
    const myUserId = await requireCurrentUserId('アバターを読み込む');
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_config')
      .eq('id', myUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    // 一覧にない値が保存されていても画面が壊れないよう、その項目だけ初期値に戻す
    return normalizeAvatarConfig(data.avatar_config);
  },

  async updateMine(config) {
    const myUserId = await requireCurrentUserId('アバターの保存');
    // 行が無い（または RLS で更新できない）ときは 0 件になるので、single() でエラーにする
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_config: config })
      .eq('id', myUserId)
      .select('id')
      .single();
    if (error) throw error;
  },
};
