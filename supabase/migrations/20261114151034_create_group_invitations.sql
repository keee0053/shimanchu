-- グループへの招待（アプリ内のみ）
-- 招待を送れる相手は、送る人の友達か、グループの「友達の友達」の候補（メンバーの誰かの友達で discoverable な人）だけ。
-- 送信・承認・辞退・取り消しはすべて関数で行い、クライアントから直接 INSERT / UPDATE / DELETE はできない。

create table public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (inviter_id <> invitee_id),
  check ((status = 'pending') = (responded_at is null))
);

comment on column public.group_invitations.responded_at is '承認・辞退・取り消しの日時（pending の間は NULL）';

-- 同じグループから同じ人への pending の招待は1件だけ
create unique index group_invitations_one_pending
  on public.group_invitations (group_id, invitee_id)
  where status = 'pending';

create index group_invitations_invitee_pending_idx
  on public.group_invitations (invitee_id)
  where status = 'pending';

alter table public.group_invitations enable row level security;

revoke all on public.group_invitations from anon, authenticated;
grant select on public.group_invitations to authenticated;

-- 読み取り: 招待された本人と、グループのメンバーが読める
create policy "招待された本人とグループのメンバーは招待を読める"
  on public.group_invitations for select
  to authenticated
  using (
    invitee_id = (select auth.uid())
    or public.is_group_member(group_id)
  );

-- グループ: 招待されている（pending）グループの名前を読める
create policy "招待されているグループを読める"
  on public.groups for select
  to authenticated
  using (
    exists (
      select 1
      from public.group_invitations i
      where i.group_id = groups.id
        and i.invitee_id = (select auth.uid())
        and i.status = 'pending'
    )
  );

-- ログイン中のユーザーと p_user_id の間に、プロフィールを見せ合う必要がある pending の招待があるか
-- ・自分が招待されている招待の、招待した人
-- ・自分がメンバーのグループから招待されている人
create function public.has_pending_group_invitation_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_invitations i
    where i.status = 'pending'
      and (
        (i.invitee_id = (select auth.uid()) and i.inviter_id = p_user_id)
        or (i.invitee_id = p_user_id and public.is_group_member(i.group_id))
      )
  );
$$;

revoke execute on function public.has_pending_group_invitation_with(uuid) from public, anon;
grant execute on function public.has_pending_group_invitation_with(uuid) to authenticated;

-- プロフィール: 招待した人・招待されている人のプロフィールを読める
create policy "招待の相手のプロフィールを読める"
  on public.profiles for select
  to authenticated
  using (public.has_pending_group_invitation_with(id));

-- グループに招待を送る（すでに pending の招待があれば、その id を返す）
create function public.send_group_invitation(p_group_id uuid, p_invitee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_group_member(p_group_id) then
    raise exception 'not a member of the group';
  end if;
  if exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_invitee_id
  ) then
    raise exception 'already a member';
  end if;

  -- 送れるのは、自分の友達か、メンバーの誰かの友達で discoverable な人だけ
  if not (
    exists (
      select 1 from public.friendships
      where user_id = v_user_id and friend_id = p_invitee_id
    )
    or exists (
      select 1
      from public.friendships f
      join public.group_members m on m.user_id = f.user_id
      join public.profiles p on p.id = f.friend_id
      where m.group_id = p_group_id
        and f.friend_id = p_invitee_id
        and p.discoverable
    )
  ) then
    raise exception 'cannot invite this user';
  end if;

  select id into v_invitation_id
  from public.group_invitations
  where group_id = p_group_id
    and invitee_id = p_invitee_id
    and status = 'pending';

  if v_invitation_id is not null then
    return v_invitation_id;
  end if;

  insert into public.group_invitations (group_id, inviter_id, invitee_id)
  values (p_group_id, v_user_id, p_invitee_id)
  returning id into v_invitation_id;

  return v_invitation_id;
end;
$$;

-- 招待を承認してグループに参加する
create function public.accept_group_invitation(p_invitation_id uuid)
returns void
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

  update public.group_invitations
  set status = 'accepted', responded_at = now()
  where id = p_invitation_id
    and invitee_id = v_user_id
    and status = 'pending'
  returning group_id into v_group_id;

  if v_group_id is null then
    raise exception 'invitation not found';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'member')
  on conflict do nothing;
end;
$$;

-- 招待を辞退する
create function public.decline_group_invitation(p_invitation_id uuid)
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

  update public.group_invitations
  set status = 'declined', responded_at = now()
  where id = p_invitation_id
    and invitee_id = v_user_id
    and status = 'pending';

  if not found then
    raise exception 'invitation not found';
  end if;
end;
$$;

-- 自分が送った招待を取り消す
create function public.cancel_group_invitation(p_invitation_id uuid)
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

  update public.group_invitations
  set status = 'cancelled', responded_at = now()
  where id = p_invitation_id
    and inviter_id = v_user_id
    and status = 'pending';

  if not found then
    raise exception 'invitation not found';
  end if;
end;
$$;

revoke execute on function public.send_group_invitation(uuid, uuid) from public, anon;
revoke execute on function public.accept_group_invitation(uuid) from public, anon;
revoke execute on function public.decline_group_invitation(uuid) from public, anon;
revoke execute on function public.cancel_group_invitation(uuid) from public, anon;
grant execute on function public.send_group_invitation(uuid, uuid) to authenticated;
grant execute on function public.accept_group_invitation(uuid) to authenticated;
grant execute on function public.decline_group_invitation(uuid) to authenticated;
grant execute on function public.cancel_group_invitation(uuid) to authenticated;
