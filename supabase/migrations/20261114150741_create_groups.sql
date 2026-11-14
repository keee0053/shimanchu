-- グループ
-- オーナーは group_members.role で管理するため、groups にはオーナーの列を持たない。
-- 参加はアプリ内の招待だけで行うため、招待コードも持たない。
-- 読み取り・名前変更のポリシーと、作成の関数は group_members を追加するときに足す
-- （メンバーかどうかの判定に group_members が必要なため）。それまではクライアントから読み書きできない。

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

alter table public.groups enable row level security;

revoke all on public.groups from anon, authenticated;
grant select on public.groups to authenticated;
grant update (name) on public.groups to authenticated;

-- 作成: 関数 create_group だけで行う（グループとオーナーのメンバー行を同時に作るため）
-- 削除: 最後のメンバーが抜けたときにトリガーで行う
