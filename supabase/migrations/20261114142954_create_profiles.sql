-- プロフィール
-- オンボーディングの最後に、名前・公開 ID・アバターをそろえて本人が1回で作成する。
-- アバターは1人1つで必ず持つため、別テーブルにせず avatar_config として持つ。

-- updated_at を更新時に自動で now() にする（他のテーブルでも使う）
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  public_id text not null unique check (public_id ~ '^[a-z0-9]{4,20}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 20),
  avatar_config jsonb not null check (jsonb_typeof(avatar_config) = 'object'),
  discoverable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.public_id is '友達検索に使う公開 ID。英小文字と数字の4〜20文字。変更可';
comment on column public.profiles.avatar_config is '顔・髪型・服装などの設定。アプリが組み立てて表示する';
comment on column public.profiles.discoverable is '友達の友達としてグループの候補に表示されることを許可するか';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- 列単位の権限: id・created_at・updated_at はクライアントから書き換えさせない
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, public_id, display_name, avatar_config, discoverable) on public.profiles to authenticated;
grant update (public_id, display_name, avatar_config, discoverable) on public.profiles to authenticated;

-- 読み取り: ログイン中のユーザーは自分の行だけ読める
-- （友達・グループのメンバーが読めるポリシーは、それぞれのテーブルを追加するときに足す）
create policy "本人は自分のプロフィールを読める"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- 作成: ログイン中のユーザーは自分の id の行だけ作れる
create policy "本人は自分のプロフィールを作成できる"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

-- 更新: ログイン中のユーザーは自分の行だけ更新できる
create policy "本人は自分のプロフィールを更新できる"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- 削除: ポリシーを作らない（アカウント削除時に auth.users から cascade で消える）

-- 公開 ID の完全一致でユーザーを1人探す（友達申請の相手を探すため）
-- 一覧取得による全ユーザーの列挙を防ぐため、テーブルの SELECT は開けずにこの関数だけを公開する
create function public.find_profile_by_public_id(p_public_id text)
returns table (id uuid, public_id text, display_name text, avatar_config jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.public_id, p.display_name, p.avatar_config
  from public.profiles p
  where (select auth.uid()) is not null
    and p.public_id = p_public_id;
$$;

revoke execute on function public.find_profile_by_public_id(text) from public, anon;
grant execute on function public.find_profile_by_public_id(text) to authenticated;
