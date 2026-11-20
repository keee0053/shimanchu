-- オーナーがグループのメンバーを削除する（#66）
-- 削除された人は、誰でももう一度招待できる（削除の記録は残さない。#45）。
-- 行が消えると、Realtime で他のメンバーの島からすぐに消える（#49）。

create function public.remove_group_member(p_group_id uuid, p_user_id uuid)
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

  -- ロックを取ってから、自分がオーナーか・相手がメンバーかを確かめる
  -- （譲渡・脱退と同時に実行されたときに、オーナーがいなくなったり、オーナーでなくなった人が削除したりしないように）
  perform private.lock_group(p_group_id);

  if not public.is_group_owner(p_group_id) then
    raise exception 'only the owner can remove members';
  end if;
  if p_user_id = v_user_id then
    raise exception 'cannot remove yourself (use leave_group)';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;

  if not found then
    raise exception 'not a member of the group';
  end if;
end;
$$;

revoke execute on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
