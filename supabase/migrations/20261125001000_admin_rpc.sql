-- 20261125001000_admin_rpc.sql
-- Admin operations run through SECURITY DEFINER RPCs guarded by is_admin().
-- No service-role key is required by the application.

create or replace function public.admin_update_settings(
  p_allowlist_mode boolean,
  p_max_team_size integer,
  p_team_creation_deadline timestamptz,
  p_teams_locked boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  if p_max_team_size < 2 or p_max_team_size > 10 then
    raise exception 'max_team_size must be between 2 and 10'
      using errcode = '23514';
  end if;

  update public.app_settings
  set allowlist_mode = p_allowlist_mode,
      max_team_size = p_max_team_size::smallint,
      team_creation_deadline = p_team_creation_deadline,
      teams_locked = p_teams_locked
  where id = 1;
end;
$$;

create or replace function public.admin_list_allowlist()
returns table (
  email text,
  full_name text,
  student_id text,
  major text,
  cohort text,
  role public.app_role,
  active boolean,
  claimed boolean,
  imported_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  return query
  select a.email, a.full_name, a.student_id, a.major, a.cohort,
         a.role, a.active, a.claimed, a.imported_at
  from public.access_allowlist a
  order by a.email;
end;
$$;

create or replace function public.admin_upsert_allowlist(
  p_email text,
  p_full_name text,
  p_student_id text,
  p_major text,
  p_cohort text,
  p_role public.app_role,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  if v_email = '' then
    raise exception 'Email is required' using errcode = '23514';
  end if;

  if p_cohort is not null and p_cohort <> '' and p_cohort !~ '^K[0-9]{2,3}$' then
    raise exception 'Cohort must look like K70 or K71' using errcode = '23514';
  end if;

  insert into public.access_allowlist (
    email, full_name, student_id, major, cohort, role, active
  )
  values (
    v_email,
    nullif(trim(p_full_name), ''),
    nullif(trim(p_student_id), ''),
    nullif(trim(p_major), ''),
    nullif(trim(p_cohort), ''),
    p_role,
    p_active
  )
  on conflict (email) do update set
    full_name = coalesce(excluded.full_name, public.access_allowlist.full_name),
    student_id = coalesce(excluded.student_id, public.access_allowlist.student_id),
    major = coalesce(excluded.major, public.access_allowlist.major),
    cohort = coalesce(excluded.cohort, public.access_allowlist.cohort),
    role = excluded.role,
    active = excluded.active;

  update public.profiles
  set role = p_role
  where email = v_email;
end;
$$;

create or replace function public.admin_import_allowlist(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_row jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Expected a JSON array' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_rows);

  if v_count > 500 then
    raise exception 'At most 500 rows per import' using errcode = '23514';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    perform public.admin_upsert_allowlist(
      v_row ->> 'email',
      v_row ->> 'full_name',
      v_row ->> 'student_id',
      v_row ->> 'major',
      v_row ->> 'cohort',
      coalesce((v_row ->> 'role')::public.app_role, 'participant'),
      coalesce((v_row ->> 'active')::boolean, true)
    );
  end loop;

  return v_count;
end;
$$;

create or replace function public.admin_create_announcement(
  p_title text,
  p_body_md text,
  p_pinned boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  if char_length(trim(p_title)) < 1 then
    raise exception 'Title is required' using errcode = '23514';
  end if;

  insert into public.announcements (title, body_md, pinned, created_by)
  values (trim(p_title), p_body_md, coalesce(p_pinned, false), auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.admin_delete_announcement(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  delete from public.announcements where id = p_id;
end;
$$;

create or replace function public.admin_set_team_locked(
  p_team_id uuid,
  p_locked boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max smallint;
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  perform 1 from public.teams where id = p_team_id for update;

  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  if p_locked then
    update public.teams set status = 'locked' where id = p_team_id;
    return;
  end if;

  select max_members into v_max from public.teams where id = p_team_id;
  select count(*) into v_count from public.team_members where team_id = p_team_id;

  update public.teams
  set status = case
    when v_count >= v_max then 'full'::public.team_status
    else 'open'::public.team_status
  end
  where id = p_team_id;
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

  if p_token_hash is null or char_length(p_token_hash) < 32 then
    raise exception 'Invalid token hash' using errcode = '22023';
  end if;

  if p_max_uses < 1 or p_max_uses > 20 then
    raise exception 'max_uses must be between 1 and 20'
      using errcode = '23514';
  end if;

  if p_expires_days < 1 or p_expires_days > 30 then
    raise exception 'expires_days must be between 1 and 30'
      using errcode = '23514';
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

revoke execute on function public.admin_update_settings(boolean, integer, timestamptz, boolean) from public, anon;
revoke execute on function public.admin_list_allowlist() from public, anon;
revoke execute on function public.admin_upsert_allowlist(text, text, text, text, text, public.app_role, boolean) from public, anon;
revoke execute on function public.admin_import_allowlist(jsonb) from public, anon;
revoke execute on function public.admin_create_announcement(text, text, boolean) from public, anon;
revoke execute on function public.admin_delete_announcement(uuid) from public, anon;
revoke execute on function public.admin_set_team_locked(uuid, boolean) from public, anon;
revoke execute on function public.create_invite_link(uuid, text, integer, integer) from public, anon;

grant execute on function public.admin_update_settings(boolean, integer, timestamptz, boolean) to authenticated;
grant execute on function public.admin_list_allowlist() to authenticated;
grant execute on function public.admin_upsert_allowlist(text, text, text, text, text, public.app_role, boolean) to authenticated;
grant execute on function public.admin_import_allowlist(jsonb) to authenticated;
grant execute on function public.admin_create_announcement(text, text, boolean) to authenticated;
grant execute on function public.admin_delete_announcement(uuid) to authenticated;
grant execute on function public.admin_set_team_locked(uuid, boolean) to authenticated;
grant execute on function public.create_invite_link(uuid, text, integer, integer) to authenticated;
