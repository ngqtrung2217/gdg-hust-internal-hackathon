-- 20261126000200_pending_limits.sql
-- Cap the number of simultaneously pending join requests and team invites.
-- Only rows with status = 'pending' count, so cancelling, rejecting,
-- declining, or letting an invite expire frees the slot again.
-- The profile row is locked before the team row so concurrent requests from
-- the same user serialise and cannot race past the cap.

create index if not exists team_join_requests_pending_user_idx
  on public.team_join_requests (user_id)
  where status = 'pending';

create index if not exists team_invites_pending_inviter_idx
  on public.team_invites (inviter_id)
  where status = 'pending';

create or replace function public.request_join_team(
  p_team_id uuid,
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
  v_pending integer;
  v_request_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform public.assert_team_formation_open();

  -- Serialise everything this user does to a team.
  perform 1 from public.profiles where id = v_uid for update;

  if exists (select 1 from public.team_members where user_id = v_uid) then
    raise exception 'You already belong to a team' using errcode = '23505';
  end if;

  select count(*) into v_pending
  from public.team_join_requests
  where user_id = v_uid and status = 'pending';

  if v_pending >= 5 then
    raise exception 'Too many pending join requests' using errcode = '23514';
  end if;

  select * into v_team from public.teams where id = p_team_id for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  if v_team.status <> 'open' then
    raise exception 'Team is not recruiting' using errcode = '42501';
  end if;

  if not v_team.recruiting then
    raise exception 'Team is not recruiting' using errcode = '42501';
  end if;

  select count(*) into v_count
  from public.team_members
  where team_id = p_team_id;

  if v_count >= v_team.max_members then
    raise exception 'Team is full' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.team_join_requests
    where team_id = p_team_id and user_id = v_uid and status = 'pending'
  ) then
    raise exception 'A request is already pending' using errcode = '23505';
  end if;

  insert into public.team_join_requests (team_id, user_id, message)
  values (p_team_id, v_uid, nullif(trim(p_message), ''))
  returning id into v_request_id;

  return v_request_id;
end;
$$;

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
  v_pending integer;
  v_invite_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform public.assert_team_formation_open();

  -- Serialise everything this user does to a team.
  perform 1 from public.profiles where id = v_uid for update;

  select * into v_team from public.teams where id = p_team_id for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  if v_team.leader_id <> v_uid and not public.is_admin() then
    raise exception 'Only the team leader can invite' using errcode = '42501';
  end if;

  if v_team.status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
  end if;

  if not v_team.recruiting then
    raise exception 'Team is not recruiting' using errcode = '42501';
  end if;

  if p_invitee_id = v_uid then
    raise exception 'You cannot invite yourself' using errcode = '23514';
  end if;

  if not exists (select 1 from public.profiles where id = p_invitee_id) then
    raise exception 'Participant not found' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.team_members where user_id = p_invitee_id) then
    raise exception 'Participant already belongs to a team' using errcode = '23505';
  end if;

  select count(*) into v_count
  from public.team_members
  where team_id = p_team_id;

  if v_count >= v_team.max_members then
    raise exception 'Team is full' using errcode = '23514';
  end if;

  -- Expired pending invites already stopped being actionable, so they do not
  -- consume the inviter's quota.
  select count(*) into v_pending
  from public.team_invites
  where inviter_id = v_uid
    and status = 'pending'
    and expires_at > now();

  if v_pending >= 5 then
    raise exception 'Too many pending invites' using errcode = '23514';
  end if;

  -- Expired pendings would otherwise block re-inviting the same person.
  update public.team_invites
  set status = 'expired', responded_at = now()
  where team_id = p_team_id
    and invitee_id = p_invitee_id
    and status = 'pending'
    and expires_at <= now();

  if exists (
    select 1 from public.team_invites
    where team_id = p_team_id and invitee_id = p_invitee_id and status = 'pending'
  ) then
    raise exception 'An invite is already pending' using errcode = '23505';
  end if;

  insert into public.team_invites (team_id, inviter_id, invitee_id, message)
  values (p_team_id, v_uid, p_invitee_id, nullif(trim(p_message), ''))
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;
