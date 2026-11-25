-- 20261125001600_admin_team_manage.sql
-- Admin can remove a member and transfer leadership.

create or replace function public.admin_remove_team_member(
  p_team_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.team_member_role;
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  perform 1 from public.teams where id = p_team_id for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  select role
  into v_role
  from public.team_members
  where team_id = p_team_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  if v_role = 'leader' then
    select count(*) into v_count from public.team_members where team_id = p_team_id;

    if v_count > 1 then
      raise exception 'Transfer leadership before removing the leader'
        using errcode = '42501';
    end if;

    delete from public.teams where id = p_team_id;
    return;
  end if;

  delete from public.team_members
  where team_id = p_team_id and user_id = p_user_id;
end;
$$;

create or replace function public.admin_transfer_team_leadership(
  p_team_id uuid,
  p_new_leader_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_leader_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  select leader_id
  into v_leader_id
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_new_leader_id
  ) then
    raise exception 'The new leader must be a team member'
      using errcode = '23514';
  end if;

  update public.team_members
  set role = 'member'
  where team_id = p_team_id and user_id = v_leader_id;

  update public.team_members
  set role = 'leader'
  where team_id = p_team_id and user_id = p_new_leader_id;

  update public.teams
  set leader_id = p_new_leader_id
  where id = p_team_id;
end;
$$;

revoke execute on function public.admin_remove_team_member(uuid, uuid) from public, anon;
revoke execute on function public.admin_transfer_team_leadership(uuid, uuid) from public, anon;
grant execute on function public.admin_remove_team_member(uuid, uuid) to authenticated;
grant execute on function public.admin_transfer_team_leadership(uuid, uuid) to authenticated;
