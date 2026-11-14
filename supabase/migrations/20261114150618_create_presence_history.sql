-- 島の移動履歴
-- user_presence の島が変わったときにトリガーで1行追加する。クライアントからは書き込めない。
-- 見せるのは直近24時間の分だけで、それより古い行は pg_cron で1時間ごとに削除する。

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

-- 読み取り: 本人と、本人が島を公開している友達が、直近24時間の分だけ読める
-- （削除の実行前でも、24時間より古い行は返らない）
create policy "本人と公開先の友達は直近24時間の移動履歴を読める"
  on public.presence_history for select
  to authenticated
  using (
    changed_at > now() - interval '24 hours'
    and public.can_view_presence_of(user_id)
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
