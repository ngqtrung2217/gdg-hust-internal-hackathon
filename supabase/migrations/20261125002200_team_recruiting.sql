-- 20261125002200_team_recruiting.sql
-- A team can pause recruiting independently of capacity/lock.

alter table public.teams
  add column recruiting boolean not null default true;

create or replace function public.set_team_recruiting(
  p_team_id uuid,
  p_recruiting boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team public.teams%rowtype;
  v_count integer;
begin
  if auth.uid() is null then
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

  if v_team.leader_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the team leader can change recruiting'
      using errcode = '42501';
  end if;

  if v_team.status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
  end if;

  if p_recruiting then
    select count(*)
    into v_count
    from public.team_members
    where team_id = p_team_id;

    if v_count >= v_team.max_members then
      raise exception 'Team is full' using errcode = '23514';
    end if;
  end if;

  update public.teams
  set recruiting = p_recruiting
  where id = p_team_id;
end;
$$;

-- Backstop for every membership insert (approve invite, invite link, etc.).
create or replace function public.enforce_team_capacity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_max smallint;
  v_status public.team_status;
  v_recruiting boolean;
  v_count integer;
begin
  select max_members, status, recruiting
  into v_max, v_status, v_recruiting
  from public.teams
  where id = new.team_id
  for update;

  if not found then
    raise exception 'Team does not exist' using errcode = '23503';
  end if;

  if v_status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
  end if;

  if not v_recruiting then
    raise exception 'Team is not recruiting' using errcode = '42501';
  end if;

  select count(*)
  into v_count
  from public.team_members
  where team_id = new.team_id;

  if v_count >= v_max then
    raise exception 'Team is full' using errcode = '23514';
  end if;

  return new;
end;
$$;

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
  v_request_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform public.assert_team_formation_open();

  if exists (select 1 from public.team_members where user_id = v_uid) then
    raise exception 'You already belong to a team' using errcode = '23505';
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
  v_invite_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform public.assert_team_formation_open();

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

create or replace function public.create_invite_link(
  p_team_id uuid,
  p_token_hash text,
  p_max_uses integer,
  p_expires_days integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not public.is_team_leader(p_team_id) then
    raise exception 'Only the team leader can create invite links'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.teams where id = p_team_id and recruiting
  ) then
    raise exception 'Team is not recruiting' using errcode = '42501';
  end if;

  if p_token_hash is null or char_length(p_token_hash) < 32 then
    raise exception 'Invalid token hash' using errcode = '22023';
  end if;

  if p_max_uses < 1 or p_max_uses > 20 then
    raise exception 'max_uses must be between 1 and 20' using errcode = '23514';
  end if;

  if p_expires_days < 1 or p_expires_days > 30 then
    raise exception 'expires_days must be between 1 and 30' using errcode = '23514';
  end if;

  insert into public.team_invite_links (
    team_id, created_by, token_hash, expires_at, max_uses
  )
  values (
    p_team_id, auth.uid(), p_token_hash,
    now() + make_interval(days => p_expires_days), p_max_uses::smallint
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.set_team_recruiting(uuid, boolean) from public, anon;
grant execute on function public.set_team_recruiting(uuid, boolean) to authenticated;
