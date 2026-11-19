-- 友達ではないグループのメンバーに島を見せる設定（#67）
-- 友達への公開は今どおり friendships.share_presence で決める。
-- 友達ではない人には、同じグループにいる間だけ、次の順で判定する。
--   1. 相手ごとの上書き（group_presence_overrides）があればそれに従う
--   2. なければ全体の設定（group_presence_settings）に従う。行がない・未設定（NULL）なら見せない
-- 設定や上書きは本人しか読めない。見せていないことは相手に分からない（島に出さないだけ。#63）。

-- 全体の設定（1人1行。行がなければ未設定）
create table public.group_presence_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  share_with_non_friends boolean,
  shared_since timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.group_presence_settings is '友達ではないグループのメンバーに島を見せるかの全体の設定。行がない・NULL は未設定（見せない）';
comment on column public.group_presence_settings.share_with_non_friends is 'true = 見せる / false = 見せない / NULL = 未設定（見せない）';
comment on column public.group_presence_settings.shared_since is '最後に「見せる」にした日時。履歴はこれより後の分だけ見せる';

-- 相手ごとの上書き（全体の設定より優先する。行を消すと全体の設定に戻る）
create table public.group_presence_overrides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  visible boolean not null,
  visible_since timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, target_user_id),
  constraint group_presence_overrides_not_self check (user_id <> target_user_id)
);

comment on table public.group_presence_overrides is '友達ではないグループのメンバー1人ずつへの上書き。全体の設定より優先する';
comment on column public.group_presence_overrides.visible_since is '最後に「見せる」にした日時。履歴はこれより後の分だけ見せる';

create index group_presence_overrides_target_user_id_idx
  on public.group_presence_overrides (target_user_id);

create trigger group_presence_settings_set_updated_at
  before update on public.group_presence_settings
  for each row execute function public.set_updated_at();

create trigger group_presence_overrides_set_updated_at
  before update on public.group_presence_overrides
  for each row execute function public.set_updated_at();

-- 「見せる」になったときに、見せ始めた日時を今にする
-- （見せる→見せるの更新では変えない。クライアントにはこの列の書き込みを許可しない）
create function private.set_group_presence_settings_since()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.shared_since = old.shared_since;
  end if;
  if new.share_with_non_friends
    and (tg_op = 'INSERT' or not coalesce(old.share_with_non_friends, false)) then
    new.shared_since = now();
  end if;
  return new;
end;
$$;

create function private.set_group_presence_overrides_since()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.visible_since = old.visible_since;
  end if;
  if new.visible and (tg_op = 'INSERT' or not old.visible) then
    new.visible_since = now();
  end if;
  return new;
end;
$$;

revoke execute on function private.set_group_presence_settings_since() from public, anon, authenticated;
revoke execute on function private.set_group_presence_overrides_since() from public, anon, authenticated;

create trigger group_presence_settings_set_since
  before insert or update on public.group_presence_settings
  for each row execute function private.set_group_presence_settings_since();

create trigger group_presence_overrides_set_since
  before insert or update on public.group_presence_overrides
  for each row execute function private.set_group_presence_overrides_since();

-- RLS: 本人だけが読み書きできる
alter table public.group_presence_settings enable row level security;
alter table public.group_presence_overrides enable row level security;

revoke all on public.group_presence_settings from anon, authenticated;
grant select on public.group_presence_settings to authenticated;
-- user_id も含めるのは、supabase-js の upsert が送った列すべてを ON CONFLICT DO UPDATE で更新するため
-- （他人の user_id への書き換えは UPDATE ポリシーの with check で防ぐ）
grant insert (user_id, share_with_non_friends) on public.group_presence_settings to authenticated;
grant update (user_id, share_with_non_friends) on public.group_presence_settings to authenticated;

revoke all on public.group_presence_overrides from anon, authenticated;
grant select, delete on public.group_presence_overrides to authenticated;
grant insert (user_id, target_user_id, visible) on public.group_presence_overrides to authenticated;
grant update (user_id, target_user_id, visible) on public.group_presence_overrides to authenticated;

create policy "本人は自分の全体の設定を読める"
  on public.group_presence_settings for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "本人は自分の全体の設定を作成できる"
  on public.group_presence_settings for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "本人は自分の全体の設定を更新できる"
  on public.group_presence_settings for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "本人は自分の上書きを読める"
  on public.group_presence_overrides for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "本人は自分の上書きを作成できる"
  on public.group_presence_overrides for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "本人は自分の上書きを更新できる"
  on public.group_presence_overrides for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "本人は自分の上書きを削除できる"
  on public.group_presence_overrides for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- p_user_id が、友達ではないグループのメンバーとしてログイン中のユーザーに島を見せているなら、見せ始めた日時を返す
-- 見せていなければ NULL。上書き → 全体の設定の順で判定する（友達かどうか・同じグループかどうかは呼び出し側で確かめる）
create function private.group_presence_since(p_user_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when o.user_id is not null then case when o.visible then o.visible_since end
    when s.share_with_non_friends then s.shared_since
  end
  from (select 1) as one
  left join public.group_presence_overrides o
    on o.user_id = p_user_id
    and o.target_user_id = (select auth.uid())
  left join public.group_presence_settings s
    on s.user_id = p_user_id;
$$;

revoke execute on function private.group_presence_since(uuid) from public, anon;
grant execute on function private.group_presence_since(uuid) to authenticated;

-- user_id の島を、ログイン中のユーザーが見てよいか（#56 の判定に、友達ではないグループのメンバーを足す）
--   本人 → 見られる
--   友達 → share_presence が true なら見られる（友達なら、グループの設定は使わない）
--   友達ではない → 同じグループにいて、上書き → 全体の設定の順で「見せる」なら見られる
create or replace function private.can_view_presence_of(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.presence_history_visible_since(p_user_id) is not null;
$$;

-- user_id の履歴を、ログイン中のユーザーがいつより後の分まで見てよいか（#57 の判定に、友達ではないグループのメンバーを足す）
-- 本人なら全期間（-infinity）、島を公開している友達なら公開を始めた日時、
-- 見せている友達ではないグループのメンバーなら見せ始めた日時、それ以外は NULL（見られない）
create or replace function private.presence_history_visible_since(p_user_id uuid)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer_id uuid := (select auth.uid());
  v_share_presence boolean;
  v_share_presence_since timestamptz;
begin
  if v_viewer_id is null then
    return null;
  end if;
  if p_user_id = v_viewer_id then
    return '-infinity'::timestamptz;
  end if;

  select f.share_presence, f.share_presence_since
  into v_share_presence, v_share_presence_since
  from public.friendships f
  where f.user_id = p_user_id
    and f.friend_id = v_viewer_id;

  if found then
    return case when v_share_presence then v_share_presence_since end;
  end if;

  if not public.shares_group_with(p_user_id) then
    return null;
  end if;

  return private.group_presence_since(p_user_id);
end;
$$;
