-- 20261125000700_team_rpc_core.sql
-- Team creation and the join-request flow.

create or replace function public.assert_team_formation_open()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_settings public.app_settings%rowtype;
begin
  select *
  into v_settings
  from public.app_settings
  where id = 1;

  if v_settings.teams_locked then
    raise exception 'Team formation is locked' using errcode = '42501';
  end if;

  if v_settings.team_creation_deadline is not null
     and now() > v_settings.team_creation_deadline then
    raise exception 'Team formation deadline has passed' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.create_team(
  p_name text,
  p_description text default null,
  p_max_members integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_settings public.app_settings%rowtype;
  v_max smallint;
  v_team_id uuid;
  v_slug text;
  v_name text := trim(coalesce(p_name, ''));
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform public.assert_team_formation_open();

  select *
  into v_settings
  from public.app_settings
  where id = 1;

  if exists (select 1 from public.team_members where user_id = v_uid) then
    raise exception 'You already belong to a team' using errcode = '23505';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception 'Team name must be 2..60 characters' using errcode = '23514';
  end if;

  v_max := coalesce(p_max_members, v_settings.max_team_size)::smallint;

  if v_max < 2 or v_max > v_settings.max_team_size then
    raise exception 'Invalid team size' using errcode = '23514';
  end if;

  v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'team';
  end if;
  v_slug := left(v_slug, 40) || '-' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.teams (
    name, slug, description, leader_id, max_members, status
  )
  values (
    v_name, v_slug, nullif(trim(p_description), ''), v_uid, v_max, 'open'
  )
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, v_uid, 'leader');

  return v_team_id;
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

  select *
  into v_team
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  if v_team.status <> 'open' then
    raise exception 'Team is not recruiting' using errcode = '42501';
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
    from public.team_join_requests
    where team_id = p_team_id
      and user_id = v_uid
      and status = 'pending'
  ) then
    raise exception 'A request is already pending' using errcode = '23505';
  end if;

  insert into public.team_join_requests (team_id, user_id, message)
  values (p_team_id, v_uid, nullif(trim(p_message), ''))
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.approve_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.team_join_requests%rowtype;
  v_team public.teams%rowtype;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select *
  into v_request
  from public.team_join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request is not pending' using errcode = '23514';
  end if;

  select *
  into v_team
  from public.teams
  where id = v_request.team_id
  for update;

  if v_team.leader_id <> v_uid and not public.is_admin() then
    raise exception 'Only the team leader can approve requests'
      using errcode = '42501';
  end if;

  perform public.assert_team_formation_open();

  if v_team.status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.team_members where user_id = v_request.user_id
  ) then
    raise exception 'Participant already belongs to a team'
      using errcode = '23505';
  end if;

  select count(*)
  into v_count
  from public.team_members
  where team_id = v_team.id;

  if v_count >= v_team.max_members then
    raise exception 'Team is full' using errcode = '23514';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (v_team.id, v_request.user_id, 'member');

  update public.team_join_requests
  set status = 'accepted', decided_by = v_uid, decided_at = now()
  where id = p_request_id;

  update public.team_join_requests
  set status = 'cancelled', decided_at = now()
  where user_id = v_request.user_id
    and status = 'pending'
    and id <> p_request_id;

  update public.team_invites
  set status = 'cancelled', responded_at = now()
  where invitee_id = v_request.user_id
    and status = 'pending';
end;
$$;

create or replace function public.reject_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.team_join_requests%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select *
  into v_request
  from public.team_join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request is not pending' using errcode = '23514';
  end if;

  if not (
    public.is_team_leader(v_request.team_id) or public.is_admin()
  ) then
    raise exception 'Only the team leader can reject requests'
      using errcode = '42501';
  end if;

  update public.team_join_requests
  set status = 'rejected', decided_by = v_uid, decided_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.assert_team_formation_open() from public, anon, authenticated;
revoke execute on function public.create_team(text, text, integer) from public, anon;
revoke execute on function public.request_join_team(uuid, text) from public, anon;
revoke execute on function public.approve_join_request(uuid) from public, anon;
revoke execute on function public.reject_join_request(uuid) from public, anon;

grant execute on function public.create_team(text, text, integer) to authenticated;
grant execute on function public.request_join_team(uuid, text) to authenticated;
grant execute on function public.approve_join_request(uuid) to authenticated;
grant execute on function public.reject_join_request(uuid) to authenticated;
