-- 友達関係
-- 1組の友達を2行（A→B と B→A）で持つ。share_presence を友達ごと・向きごとに設定できるようにするため。
-- 行の作成は友達申請の承認（friend_requests を追加するときの関数）、削除は remove_friend だけが行い、
-- クライアントから直接 INSERT / DELETE はできない。

create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  share_presence boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

comment on column public.friendships.share_presence is 'user_id の島（今いる島・移動履歴）を friend_id に公開するか';

create index friendships_friend_id_idx on public.friendships (friend_id);

alter table public.friendships enable row level security;

revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;
grant update (share_presence) on public.friendships to authenticated;

-- 読み取り: ログイン中のユーザーは自分が user_id の行だけ読める
-- （相手側の行を読めると、相手が自分に島を公開しているかが分かってしまうため）
create policy "本人は自分の友達一覧を読める"
  on public.friendships for select
  to authenticated
  using (user_id = (select auth.uid()));

-- 更新: ログイン中のユーザーは自分が user_id の行の share_presence だけ変えられる
create policy "本人は友達ごとの公開設定を変えられる"
  on public.friendships for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- プロフィール: 友達のプロフィールを読める
create policy "友達のプロフィールを読める"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.friendships f
      where f.user_id = (select auth.uid())
        and f.friend_id = profiles.id
    )
  );

-- 友達を解除する。自分側と相手側の2行をまとめて削除する
create function public.remove_friend(p_friend_id uuid)
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

  delete from public.friendships
  where (user_id = v_user_id and friend_id = p_friend_id)
     or (user_id = p_friend_id and friend_id = v_user_id);

  if not found then
    raise exception 'friendship not found';
  end if;
end;
$$;

revoke execute on function public.remove_friend(uuid) from public, anon;
grant execute on function public.remove_friend(uuid) to authenticated;
