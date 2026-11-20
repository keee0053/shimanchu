-- 友達ではないグループのメンバーに島を見せる設定（#67）
-- 友達への公開は今どおり friendships.share_presence で決める。
-- 友達ではない人には、同じグループにいる間だけ、次の順で判定する。
--   1. 相手ごとの上書き（group_presence_overrides）が「見せる」「見せない」ならそれに従う
--   2. 上書きがない・NULL（全体の設定に従う）なら全体の設定（group_presence_settings）に従う。行がない・未設定（NULL）なら見せない
-- 履歴は、見せ始めた日時と、同じグループにいるようになった日時の遅いほうより後の分だけ見せる。
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

-- 相手ごとの上書き（全体の設定より優先する。visible を NULL にすると全体の設定に戻る）
-- 行を消すと隠していた日時が分からなくなり、隠していた間の履歴が見えてしまうため、削除はできない
create table public.group_presence_overrides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  visible boolean,
  visible_since timestamptz,
  hidden_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, target_user_id),
  constraint group_presence_overrides_not_self check (user_id <> target_user_id)
);

comment on table public.group_presence_overrides is '友達ではないグループのメンバー1人ずつへの上書き。全体の設定より優先する';
comment on column public.group_presence_overrides.visible is 'true = 見せる / false = 見せない / NULL = 全体の設定に従う';
comment on column public.group_presence_overrides.visible_since is '最後に「見せる」にした日時。履歴はこれより後の分だけ見せる';
comment on column public.group_presence_overrides.hidden_until is '最後に「見せない」をやめた日時。全体の設定に従うときも、履歴はこれより後の分だけ見せる';

create index group_presence_overrides_target_user_id_idx
  on public.group_presence_overrides (target_user_id);

create trigger group_presence_settings_set_updated_at
  before update on public.group_presence_settings
  for each row execute function public.set_updated_at();

create trigger group_presence_overrides_set_updated_at
  before update on public.group_presence_overrides
  for each row execute function public.set_updated_at();

-- 「見せる」になったときに、見せ始めた日時を今にする
-- 上書きは「見せない」をやめたときに、隠すのをやめた日時も今にする
-- （同じ値への更新では変えない。クライアントにはこれらの列の書き込みを許可しない）
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
    new.hidden_until = old.hidden_until;
  end if;
  if new.visible and (tg_op = 'INSERT' or not coalesce(old.visible, false)) then
    new.visible_since = now();
  end if;
  if tg_op = 'UPDATE' and old.visible = false and new.visible is distinct from false then
    new.hidden_until = now();
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
grant select on public.group_presence_overrides to authenticated;
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

-- 削除: ポリシーを作らない（全体の設定に戻すときは visible を NULL にする）

-- p_user_id が、友達ではないグループのメンバーとしてログイン中のユーザーに島を見せているなら、見せ始めた日時を返す
-- 見せていなければ NULL。上書き → 全体の設定の順で判定する（友達かどうか・同じグループかどうかは呼び出し側で確かめる）
-- 全体の設定に従うときは、上書きで隠すのをやめた日時より前は見せない
create function private.group_presence_since(p_user_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when o.visible then o.visible_since
    when not o.visible then null
    when s.share_with_non_friends then greatest(s.shared_since, o.hidden_until)
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
-- 見せている友達ではないグループのメンバーなら、見せ始めた日時と同じグループにいるようになった日時の遅いほう、
-- それ以外は NULL（見られない）
-- 同じグループにいるようになった日時は、2人の参加日時の遅いほう（複数のグループで一緒なら最も早いもの）。
-- グループに入る前・抜けて入り直す前の履歴は見せない
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
  v_together_since timestamptz;
  v_group_since timestamptz;
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

  select min(greatest(me.joined_at, other.joined_at))
  into v_together_since
  from public.group_members me
  join public.group_members other on other.group_id = me.group_id
  where me.user_id = v_viewer_id
    and other.user_id = p_user_id;

  if v_together_since is null then
    return null;
  end if;

  -- greatest は NULL を無視するため、見せていないときは先に返す
  v_group_since := private.group_presence_since(p_user_id);
  if v_group_since is null then
    return null;
  end if;

  return greatest(v_group_since, v_together_since);
end;
$$;
