// 依存の組み立て（Composition Root）
// infrastructure の実装を domain のインターフェースに当てはめ、presentation に渡す。
// 層をまたいで import してよいのはこのファイルだけ（eslint.config.js のルール参照）。

import type { ProfileRepository } from '@/domain/repositories/profile-repository';
import { supabaseProfileRepository } from '@/infrastructure/supabase/profile-repository';

export const profileRepository: ProfileRepository = supabaseProfileRepository;
