-- 島の移動履歴
-- user_presence の島が変わったときにトリガーで1行追加する。クライアントからは書き込めない。
-- 見せるのは直近24時間の分（友達には公開を始めた後の分）だけで、それより古い行は pg_cron で1時間ごとに削除する。

create table public.presence_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  from_island text check (from_island in ('home', 'school', 'outside', 'drifting')),
  to_island text not null check (to_island in ('home', 'school', 'outside', 'drifting')),
  changed_at timestamptz not null default now()
);

comment on column public.presence_history.from_island is '移動前の島（最初の1件は NULL）';

create index presence_history_user_id_changed_at_idx
  on public.presence_history (user_id, changed_at desc);

create index presence_history_changed_at_idx on public.presence_history (changed_at);

alter table public.presence_history enable row level security;

revoke all on public.presence_history from anon, authenticated;
grant select on public.presence_history to authenticated;

-- 友達に島を公開し始めた日時
-- 履歴は公開設定に関係なく記録されるため、公開をオフ→オンにしたときや友達になった直後に、
-- 公開していなかった間の履歴まで見えないよう、この日時より後の分だけを見せる
alter table public.friendships
  add column share_presence_since timestamptz not null default now();

comment on column public.friendships.share_presence_since is 'share_presence を最後にオンにした日時（友達になった時点で初期値が入る）。履歴はこれより後の分だけ friend_id に見せる';

-- share_presence がオフからオンになったら、公開を始めた日時を今にする
-- （クライアントには share_presence の UPDATE だけを許可しているので、この列は書き換えられない）
create function private.set_share_presence_since()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.share_presence and not old.share_presence then
    new.share_presence_since = now();
  end if;
  return new;
end;
$$;

revoke execute on function private.set_share_presence_since() from public, anon, authenticated;

create trigger friendships_set_share_presence_since
  before update of share_presence on public.friendships
  for each row execute function private.set_share_presence_since();

-- user_id の履歴を、ログイン中のユーザーがいつより後の分まで見てよいか
-- 本人なら全期間（-infinity）、島を公開している友達なら公開を始めた日時、それ以外は NULL（見られない）
-- friendships の RLS では相手側の行を読めないため、security definer で判定し、RPC では呼べない private に置く
create function private.presence_history_visible_since(p_user_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_user_id = (select auth.uid()) then '-infinity'::timestamptz
    else (
      select f.share_presence_since
      from public.friendships f
      where f.user_id = p_user_id
        and f.friend_id = (select auth.uid())
        and f.share_presence
    )
  end;
$$;

-- ポリシーの判定は呼び出したユーザーの権限で実行されるため、authenticated には EXECUTE が必要
revoke execute on function private.presence_history_visible_since(uuid) from public, anon;
grant execute on function private.presence_history_visible_since(uuid) to authenticated;

-- 読み取り: 本人と、本人が島を公開している友達が、直近24時間の分だけ読める
-- 友達は、公開を始めた日時（share_presence_since）より後の分だけ読める
-- （削除の実行前でも、24時間より古い行は返らない）
create policy "本人と公開先の友達は直近24時間の移動履歴を読める"
  on public.presence_history for select
  to authenticated
  using (
    changed_at > now() - interval '24 hours'
    and changed_at > private.presence_history_visible_since(user_id)
  );

-- 作成・更新・削除: ポリシーを作らない（トリガーと pg_cron だけが書き込む）

-- user_presence の島が変わったら履歴に1行追加する
create function public.record_presence_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.presence_history (user_id, from_island, to_island)
    values (new.user_id, null, new.island_type);
  elsif new.island_type is distinct from old.island_type then
    insert into public.presence_history (user_id, from_island, to_island)
    values (new.user_id, old.island_type, new.island_type);
  end if;
  return null;
end;
$$;

revoke execute on function public.record_presence_change() from public, anon, authenticated;

create trigger user_presence_record_change
  after insert or update of island_type on public.user_presence
  for each row execute function public.record_presence_change();

-- 24時間より古い履歴を1時間ごとに削除する
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'delete-old-presence-history',
  '0 * * * *',
  $$delete from public.presence_history where changed_at < now() - interval '24 hours'$$
);
