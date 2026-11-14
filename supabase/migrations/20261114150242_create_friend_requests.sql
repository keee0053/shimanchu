-- 友達申請
-- 申請・承認・拒否・取り消しはすべて関数で行い、クライアントから直接 INSERT / UPDATE / DELETE はできない。
-- 拒否されたことは申請者に伝えない（申請者には「申請中」のまま見せる）。
-- そのため申請者はテーブルを直接読めず、自分の申請は my_sent_friend_requests で status を伏せて受け取る。

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> recipient_id),
  check ((status = 'pending') = (responded_at is null))
);

comment on column public.friend_requests.responded_at is '承認・拒否・取り消しの日時（pending の間は NULL）';

-- 同じ2人の間で pending の申請は向きを問わず1件だけ
create unique index friend_requests_one_pending_per_pair
  on public.friend_requests (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  )
  where status = 'pending';

create index friend_requests_recipient_pending_idx
  on public.friend_requests (recipient_id)
  where status = 'pending';

create index friend_requests_requester_idx on public.friend_requests (requester_id);

alter table public.friend_requests enable row level security;

revoke all on public.friend_requests from anon, authenticated;
grant select on public.friend_requests to authenticated;

-- 読み取り: ログイン中のユーザーは自分が受け取った申請だけ読める
-- （申請者に読ませると拒否されたことが分かるため、申請者は my_sent_friend_requests を使う）
create policy "本人は受け取った友達申請を読める"
  on public.friend_requests for select
  to authenticated
  using (recipient_id = (select auth.uid()));

-- プロフィール: 自分に届いている申請中の相手のプロフィールを読める
create policy "申請してきた相手のプロフィールを読める"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.friend_requests r
      where r.recipient_id = (select auth.uid())
        and r.requester_id = profiles.id
        and r.status = 'pending'
    )
  );

-- 友達になった2人の間に残っている申請（申請中・拒否済み）を取り消し扱いにする
-- 拒否済みの申請が残ると、友達を解除したあとに申請者側で「申請中」として復活してしまうため
-- 申請の関数の中だけで使う
create function public.close_friend_requests_between(p_user_a uuid, p_user_b uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.friend_requests
  set status = 'cancelled', responded_at = coalesce(responded_at, now())
  where status in ('pending', 'rejected')
    and (
      (requester_id = p_user_a and recipient_id = p_user_b)
      or (requester_id = p_user_b and recipient_id = p_user_a)
    );
$$;

revoke execute on function public.close_friend_requests_between(uuid, uuid) from public, anon, authenticated;

-- 友達申請を送る
-- ・相手からの申請中の申請があれば、それを承認して友達になる（'accepted' を返す）
-- ・すでに自分からの申請がある（拒否されたものも含む）ときは何もせず 'pending' を返す
--   （拒否されたことを申請者に伝えないため。送り直すときは先に取り消す）
create function public.send_friend_request(p_recipient_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_reverse_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_recipient_id = v_user_id then
    raise exception 'cannot send a friend request to yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_recipient_id) then
    raise exception 'user not found';
  end if;
  if exists (
    select 1 from public.friendships
    where user_id = v_user_id and friend_id = p_recipient_id
  ) then
    raise exception 'already friends';
  end if;

  update public.friend_requests
  set status = 'accepted', responded_at = now()
  where requester_id = p_recipient_id
    and recipient_id = v_user_id
    and status = 'pending'
  returning id into v_reverse_id;

  if v_reverse_id is not null then
    insert into public.friendships (user_id, friend_id)
    values (v_user_id, p_recipient_id), (p_recipient_id, v_user_id)
    on conflict do nothing;
    perform public.close_friend_requests_between(v_user_id, p_recipient_id);
    return 'accepted';
  end if;

  if exists (
    select 1 from public.friend_requests
    where requester_id = v_user_id
      and recipient_id = p_recipient_id
      and status in ('pending', 'rejected')
  ) then
    return 'pending';
  end if;

  insert into public.friend_requests (requester_id, recipient_id)
  values (v_user_id, p_recipient_id);
  return 'pending';
end;
$$;

-- 受け取った申請を承認し、友達関係を2行まとめて作る
create function public.accept_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_requester_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  update public.friend_requests
  set status = 'accepted', responded_at = now()
  where id = p_request_id
    and recipient_id = v_user_id
    and status = 'pending'
  returning requester_id into v_requester_id;

  if v_requester_id is null then
    raise exception 'friend request not found';
  end if;

  insert into public.friendships (user_id, friend_id)
  values (v_user_id, v_requester_id), (v_requester_id, v_user_id)
  on conflict do nothing;
  perform public.close_friend_requests_between(v_user_id, v_requester_id);
end;
$$;

-- 受け取った申請を拒否する（申請者には伝わらない）
create function public.reject_friend_request(p_request_id uuid)
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

  update public.friend_requests
  set status = 'rejected', responded_at = now()
  where id = p_request_id
    and recipient_id = v_user_id
    and status = 'pending';

  if not found then
    raise exception 'friend request not found';
  end if;
end;
$$;

-- 自分が送った申請を取り消す
-- 申請者には拒否された申請も「申請中」に見えているので、rejected も取り消せる
create function public.cancel_friend_request(p_request_id uuid)
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

  update public.friend_requests
  set status = 'cancelled', responded_at = coalesce(responded_at, now())
  where id = p_request_id
    and requester_id = v_user_id
    and status in ('pending', 'rejected');

  if not found then
    raise exception 'friend request not found';
  end if;
end;
$$;

-- 自分が送った申請中の申請と、その相手のプロフィールを返す
-- 拒否された申請も申請中として含め、status は返さない
create function public.my_sent_friend_requests()
returns table (
  id uuid,
  recipient_id uuid,
  public_id text,
  display_name text,
  avatar_config jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.recipient_id, p.public_id, p.display_name, p.avatar_config, r.created_at
  from public.friend_requests r
  join public.profiles p on p.id = r.recipient_id
  where r.requester_id = (select auth.uid())
    and r.status in ('pending', 'rejected')
    and not exists (
      select 1 from public.friendships f
      where f.user_id = r.requester_id and f.friend_id = r.recipient_id
    )
  order by r.created_at desc;
$$;

revoke execute on function public.send_friend_request(uuid) from public, anon;
revoke execute on function public.accept_friend_request(uuid) from public, anon;
revoke execute on function public.reject_friend_request(uuid) from public, anon;
revoke execute on function public.cancel_friend_request(uuid) from public, anon;
revoke execute on function public.my_sent_friend_requests() from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.reject_friend_request(uuid) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.my_sent_friend_requests() to authenticated;
