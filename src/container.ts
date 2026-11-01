// 依存の組み立て（Composition Root）
// infrastructure の実装を domain のインターフェースに当てはめ、presentation に渡す。
// 層をまたいで import してよいのはこのファイルだけ（eslint.config.js のルール参照）。
//
// 例（機能を作るときにここへ追加する）:
//   import type { GroupRepository } from '@/domain/repositories/group-repository';
//   import { supabaseGroupRepository } from '@/infrastructure/supabase/group-repository';
//
//   export const groupRepository: GroupRepository = supabaseGroupRepository;

export {};
