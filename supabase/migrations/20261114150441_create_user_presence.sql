-- 現在の島
-- 島は端末で判定し、本人が自分の行を upsert する。座標は DB に保存しない。
-- 端末からの更新が止まったとき（updated_at が古いとき）の漂流表示は、表示する側（domain）のルールで行う。

create table public.user_presence (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  island_type text not null check (island_type in ('home', 'school', 'outside', 'drifting')),
  status_text text check (char_length(status_text) <= 50),
  updated_at timestamptz not null default now()
);

comment on column public.user_presence.island_type is 'home: 家 / school: 学校 / outside: 外出中（登録した場所のどこにもいない） / drifting: 漂流（位置が取れない・権限がない）';
comment on column public.user_presence.status_text is 'ひとこと（50文字まで）';
comment on column public.user_presence.updated_at is '最終更新日時。島が変わらなくても更新のたびに now() になる';

create trigger user_presence_set_updated_at
  before update on public.user_presence
  for each row execute function public.set_updated_at();

-- user_id の島を、ログイン中のユーザーが見てよいか
-- （本人、または user_id が自分に share_presence = true にしている友達）
-- friendships の RLS では相手側の行を読めないため、security definer で判定する
create function public.can_view_presence_of(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = (select auth.uid())
    or exists (
      select 1
      from public.friendships f
      where f.user_id = p_user_id
        and f.friend_id = (select auth.uid())
        and f.share_presence
    );
$$;

revoke execute on function public.can_view_presence_of(uuid) from public, anon;
grant execute on function public.can_view_presence_of(uuid) to authenticated;

alter table public.user_presence enable row level security;

revoke all on public.user_presence from anon, authenticated;
grant select on public.user_presence to authenticated;
grant insert (user_id, island_type, status_text) on public.user_presence to authenticated;
-- user_id も含めるのは、supabase-js の upsert が送った列すべてを ON CONFLICT DO UPDATE で更新するため
-- （他人の user_id への書き換えは UPDATE ポリシーの with check で防ぐ）
grant update (user_id, island_type, status_text) on public.user_presence to authenticated;

-- 読み取り: 本人と、本人が島を公開している友達が読める
-- （公開していない友達には行が返らず、島にまったく出てこない）
create policy "本人と公開先の友達は今いる島を読める"
  on public.user_presence for select
  to authenticated
  using (public.can_view_presence_of(user_id));

-- 作成: ログイン中のユーザーは自分の行だけ作れる
create policy "本人は自分の島を作成できる"
  on public.user_presence for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- 更新: ログイン中のユーザーは自分の行だけ更新できる
create policy "本人は自分の島を更新できる"
  on public.user_presence for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 削除: ポリシーを作らない（アカウント削除時に cascade で消える）
