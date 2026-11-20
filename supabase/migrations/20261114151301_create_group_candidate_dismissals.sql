-- グループの「友達の友達」候補の非表示
-- 候補そのものは保存せず、group_fof_candidates で毎回計算する（友達関係やメンバーが変わっても古くならないように）。
-- ここには「この人は候補に出さない」というメンバーの操作の結果だけを保存する。非表示はグループのメンバー全員に効く。

create table public.group_candidate_dismissals (
  group_id uuid not null references public.groups (id) on delete cascade,
  candidate_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, candidate_user_id)
);

alter table public.group_candidate_dismissals enable row level security;

revoke all on public.group_candidate_dismissals from anon, authenticated;
grant select, delete on public.group_candidate_dismissals to authenticated;
grant insert (group_id, candidate_user_id) on public.group_candidate_dismissals to authenticated;

-- 読み取り・追加・削除: グループのメンバーだけ
create policy "メンバーは候補の非表示を読める"
  on public.group_candidate_dismissals for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "メンバーは候補を非表示にできる"
  on public.group_candidate_dismissals for insert
  to authenticated
  with check (public.is_group_member(group_id));

create policy "メンバーは候補の非表示を取り消せる"
  on public.group_candidate_dismissals for delete
  to authenticated
  using (public.is_group_member(group_id));

-- グループの「友達の友達」候補を返す
-- 候補: メンバーの誰かの友達で、まだメンバーでなく、discoverable = true で、非表示にされていない人
-- mutual_friend_ids: その人と友達のメンバー（共通の友達として表示する）
-- invited: pending の招待があるか
create function public.group_fof_candidates(p_group_id uuid)
returns table (
  user_id uuid,
  public_id text,
  display_name text,
  avatar_config jsonb,
  mutual_friend_ids uuid[],
  invited boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'not a member of the group';
  end if;

  return query
  select
    p.id,
    p.public_id,
    p.display_name,
    p.avatar_config,
    array_agg(m.user_id order by m.user_id),
    exists (
      select 1 from public.group_invitations i
      where i.group_id = p_group_id
        and i.invitee_id = p.id
        and i.status = 'pending'
    )
  from public.group_members m
  join public.friendships f on f.user_id = m.user_id
  join public.profiles p on p.id = f.friend_id
  where m.group_id = p_group_id
    and p.discoverable
    and not exists (
      select 1 from public.group_members gm
      where gm.group_id = p_group_id and gm.user_id = p.id
    )
    and not exists (
      select 1 from public.group_candidate_dismissals d
      where d.group_id = p_group_id and d.candidate_user_id = p.id
    )
  group by p.id, p.public_id, p.display_name, p.avatar_config
  order by count(*) desc, p.id;
end;
$$;

revoke execute on function public.group_fof_candidates(uuid) from public, anon;
grant execute on function public.group_fof_candidates(uuid) to authenticated;
