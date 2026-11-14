-- グループのメンバー
-- 役割は owner / member の2種類で、owner は各グループに必ず1人。
-- メンバーの追加・役割の変更・脱退はすべて関数で行い、クライアントから直接 INSERT / UPDATE / DELETE はできない。
-- オーナーが抜けたら最も古くから参加しているメンバーに自動で譲り、最後の1人が抜けたらグループを削除する
-- （アカウント削除で cascade されたときも同じ動きにするため、トリガーで行う）。

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

comment on column public.group_members.joined_at is '参加日時。オーナーが抜けたときの自動譲渡の順番に使う';

-- オーナーはグループに1人だけ
create unique index group_members_one_owner_per_group
  on public.group_members (group_id)
  where role = 'owner';

create index group_members_user_id_idx on public.group_members (user_id);

-- ログイン中のユーザーがグループのメンバーか
-- group_members のポリシーから group_members を参照すると無限再帰になるため、security definer で判定する
create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = (select auth.uid())
  );
$$;

-- ログイン中のユーザーがグループのオーナーか
create function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

-- ログイン中のユーザーと p_user_id が同じグループに入っているか
create function public.shares_group_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members me
    join public.group_members other on other.group_id = me.group_id
    where me.user_id = (select auth.uid())
      and other.user_id = p_user_id
  );
$$;

revoke execute on function public.is_group_member(uuid) from public, anon;
revoke execute on function public.is_group_owner(uuid) from public, anon;
revoke execute on function public.shares_group_with(uuid) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.shares_group_with(uuid) to authenticated;

alter table public.group_members enable row level security;

revoke all on public.group_members from anon, authenticated;
grant select on public.group_members to authenticated;

-- 読み取り: メンバーは同じグループのメンバー一覧を読める
create policy "メンバーは同じグループのメンバーを読める"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

-- グループ: メンバーはグループを読める
create policy "メンバーはグループを読める"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

-- グループ: オーナーはグループ名を変更できる
create policy "オーナーはグループ名を変更できる"
  on public.groups for update
  to authenticated
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

-- プロフィール: 同じグループのメンバーのプロフィールを読める
create policy "同じグループのメンバーのプロフィールを読める"
  on public.profiles for select
  to authenticated
  using (public.shares_group_with(id));

-- メンバーが抜けたとき（脱退・アカウント削除）の後始末
-- ・残りのメンバーがいなければグループを削除する
-- ・抜けたのがオーナーなら、最も古くから参加しているメンバーをオーナーにする
create function public.handle_group_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next_owner_id uuid;
begin
  if not exists (select 1 from public.group_members where group_id = old.group_id) then
    delete from public.groups where id = old.group_id;
    return null;
  end if;

  if old.role = 'owner' then
    select user_id into v_next_owner_id
    from public.group_members
    where group_id = old.group_id
    order by joined_at, user_id
    limit 1;

    update public.group_members
    set role = 'owner'
    where group_id = old.group_id
      and user_id = v_next_owner_id;
  end if;

  return null;
end;
$$;

revoke execute on function public.handle_group_member_removed() from public, anon, authenticated;

create trigger group_members_handle_removed
  after delete on public.group_members
  for each row execute function public.handle_group_member_removed();

-- グループを作成し、作成者をオーナーとして追加する
create function public.create_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_group_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.groups (name)
  values (p_name)
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'owner');

  return v_group_id;
end;
$$;

-- オーナーを同じグループの別のメンバーに譲る
create function public.transfer_group_ownership(p_group_id uuid, p_new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_group_owner(p_group_id) then
    raise exception 'only the owner can transfer ownership';
  end if;
  if p_new_owner_id = v_user_id then
    raise exception 'already the owner';
  end if;
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_new_owner_id
  ) then
    raise exception 'new owner is not a member';
  end if;

  -- オーナーは1人だけなので、先に自分を member に下げてから相手を owner にする
  update public.group_members
  set role = 'member'
  where group_id = p_group_id and user_id = v_user_id;

  update public.group_members
  set role = 'owner'
  where group_id = p_group_id and user_id = p_new_owner_id;
end;
$$;

-- グループを抜ける（オーナーの自動譲渡・グループの削除はトリガーで行う）
create function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = v_user_id;

  if not found then
    raise exception 'not a member of the group';
  end if;
end;
$$;

revoke execute on function public.create_group(text) from public, anon;
revoke execute on function public.transfer_group_ownership(uuid, uuid) from public, anon;
revoke execute on function public.leave_group(uuid) from public, anon;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.transfer_group_ownership(uuid, uuid) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
