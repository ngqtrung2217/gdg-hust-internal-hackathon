-- 20261125000800_team_rpc_invites.sql
-- Direct invites, invite links, leaving, and leadership transfer.

create or replace function public.invite_to_team(
  p_team_id uuid,
  p_invitee_id uuid,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_team public.teams%rowtype;
  v_count integer;
  v_invite_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform public.assert_team_formation_open();

  select *
  into v_team
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  if v_team.leader_id <> v_uid and not public.is_admin() then
    raise exception 'Only the team leader can invite' using errcode = '42501';
  end if;

  if v_team.status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
  end if;

  if p_invitee_id = v_uid then
    raise exception 'You cannot invite yourself' using errcode = '23514';
  end if;

  if not exists (select 1 from public.profiles where id = p_invitee_id) then
    raise exception 'Participant not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.team_members where user_id = p_invitee_id
  ) then
    raise exception 'Participant already belongs to a team'
      using errcode = '23505';
  end if;

  select count(*)
  into v_count
  from public.team_members
  where team_id = p_team_id;

  if v_count >= v_team.max_members then
    raise exception 'Team is full' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.team_invites
    where team_id = p_team_id
      and invitee_id = p_invitee_id
      and status = 'pending'
  ) then
    raise exception 'An invite is already pending' using errcode = '23505';
  end if;

  insert into public.team_invites (
    team_id, inviter_id, invitee_id, message
  )
  values (
    p_team_id, v_uid, p_invitee_id, nullif(trim(p_message), '')
  )
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

create or replace function public.respond_to_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.team_invites%rowtype;
  v_team public.teams%rowtype;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select *
  into v_invite
  from public.team_invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  if v_invite.invitee_id <> v_uid then
    raise exception 'This invite is not yours' using errcode = '42501';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite is not pending' using errcode = '23514';
  end if;

  if v_invite.expires_at <= now() then
    update public.team_invites
    set status = 'expired', responded_at = now()
    where id = p_invite_id;
    raise exception 'Invite has expired' using errcode = '22023';
  end if;

  if not p_accept then
    update public.team_invites
    set status = 'declined', responded_at = now()
    where id = p_invite_id;
    return;
  end if;

  perform public.assert_team_formation_open();

  if exists (select 1 from public.team_members where user_id = v_uid) then
    raise exception 'You already belong to a team' using errcode = '23505';
  end if;

  select *
  into v_team
  from public.teams
  where id = v_invite.team_id
  for update;

  if v_team.status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
  end if;

  select count(*)
  into v_count
  from public.team_members
  where team_id = v_team.id;

  if v_count >= v_team.max_members then
    raise exception 'Team is full' using errcode = '23514';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (v_team.id, v_uid, 'member');

  update public.team_invites
  set status = 'accepted', responded_at = now()
  where id = p_invite_id;

  update public.team_invites
  set status = 'cancelled', responded_at = now()
  where invitee_id = v_uid
    and status = 'pending'
    and id <> p_invite_id;

  update public.team_join_requests
  set status = 'cancelled', decided_at = now()
  where user_id = v_uid
    and status = 'pending';
end;
$$;

create or replace function public.leave_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.team_member_role;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform 1
  from public.teams
  where id = p_team_id
  for update;

  select role
  into v_role
  from public.team_members
  where team_id = p_team_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'You are not a member of this team'
      using errcode = 'P0002';
  end if;

  if v_role = 'leader' then
    select count(*)
    into v_count
    from public.team_members
    where team_id = p_team_id;

    if v_count > 1 then
      raise exception 'Transfer leadership before leaving'
        using errcode = '42501';
    end if;

    delete from public.teams where id = p_team_id;
    return;
  end if;

  delete from public.team_members
  where team_id = p_team_id and user_id = v_uid;
end;
$$;

create or replace function public.transfer_leadership(
  p_team_id uuid,
  p_new_leader_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_team public.teams%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select *
  into v_team
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  if v_team.leader_id <> v_uid and not public.is_admin() then
    raise exception 'Only the leader can transfer leadership'
      using errcode = '42501';
  end if;

  if p_new_leader_id = v_team.leader_id then
    raise exception 'This participant is already the leader'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.team_members
    where team_id = p_team_id and user_id = p_new_leader_id
  ) then
    raise exception 'The new leader must be a team member'
      using errcode = '23514';
  end if;

  update public.team_members
  set role = 'member'
  where team_id = p_team_id and user_id = v_team.leader_id;

  update public.team_members
  set role = 'leader'
  where team_id = p_team_id and user_id = p_new_leader_id;

  update public.teams
  set leader_id = p_new_leader_id
  where id = p_team_id;
end;
$$;

create or replace function public.join_team_with_link(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.team_invite_links%rowtype;
  v_team public.teams%rowtype;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_token_hash is null or char_length(p_token_hash) < 32 then
    raise exception 'Invalid invite token' using errcode = '22023';
  end if;

  perform public.assert_team_formation_open();

  if exists (select 1 from public.team_members where user_id = v_uid) then
    raise exception 'You already belong to a team' using errcode = '23505';
  end if;

  select *
  into v_link
  from public.team_invite_links
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'Invite link not found' using errcode = 'P0002';
  end if;

  if v_link.revoked then
    raise exception 'Invite link has been revoked' using errcode = '42501';
  end if;

  if v_link.expires_at <= now() then
    update public.team_invite_links
    set revoked = true
    where id = v_link.id;
    raise exception 'Invite link has expired' using errcode = '22023';
  end if;

  if v_link.uses >= v_link.max_uses then
    raise exception 'Invite link has reached its use limit'
      using errcode = '23514';
  end if;

  select *
  into v_team
  from public.teams
  where id = v_link.team_id
  for update;

  if v_team.status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
  end if;

  select count(*)
  into v_count
  from public.team_members
  where team_id = v_team.id;

  if v_count >= v_team.max_members then
    raise exception 'Team is full' using errcode = '23514';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (v_team.id, v_uid, 'member');

  update public.team_invite_links
  set uses = uses + 1
  where id = v_link.id;

  update public.team_join_requests
  set status = 'cancelled', decided_at = now()
  where user_id = v_uid and status = 'pending';

  return v_team.id;
end;
$$;

revoke execute on function public.invite_to_team(uuid, uuid, text) from public, anon;
revoke execute on function public.respond_to_invite(uuid, boolean) from public, anon;
revoke execute on function public.leave_team(uuid) from public, anon;
revoke execute on function public.transfer_leadership(uuid, uuid) from public, anon;
revoke execute on function public.join_team_with_link(text) from public, anon;

grant execute on function public.invite_to_team(uuid, uuid, text) to authenticated;
grant execute on function public.respond_to_invite(uuid, boolean) to authenticated;
grant execute on function public.leave_team(uuid) to authenticated;
grant execute on function public.transfer_leadership(uuid, uuid) to authenticated;
grant execute on function public.join_team_with_link(text) to authenticated;
