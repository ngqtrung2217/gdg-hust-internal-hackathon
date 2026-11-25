-- 20261125000400_triggers.sql
-- Timestamp maintenance and integrity triggers.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger skill_catalog_set_updated_at
  before update on public.skill_catalog
  for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- Serialize skill writes per profile and cap the list at five rows.
create or replace function public.enforce_max_profile_skills()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform 1
  from public.profiles
  where id = new.profile_id
  for update;

  select count(*)
  into v_count
  from public.profile_skills
  where profile_id = new.profile_id;

  if v_count >= 5 then
    raise exception 'A profile can have at most 5 skills'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profile_skills_max_five
  before insert on public.profile_skills
  for each row execute function public.enforce_max_profile_skills();

-- Defense in depth: the RPCs also check capacity, but the table cannot be
-- pushed past max_members or into a locked team.
create or replace function public.enforce_team_capacity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_max smallint;
  v_status public.team_status;
  v_count integer;
begin
  select max_members, status
  into v_max, v_status
  from public.teams
  where id = new.team_id
  for update;

  if not found then
    raise exception 'Team does not exist' using errcode = '23503';
  end if;

  if v_status in ('locked', 'archived') then
    raise exception 'Team is locked' using errcode = '42501';
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

create trigger team_members_capacity
  before insert on public.team_members
  for each row execute function public.enforce_team_capacity();

-- Keep teams.status in sync with membership, but never override an explicit
-- lock or archive.
create or replace function public.sync_team_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_max smallint;
  v_status public.team_status;
  v_count integer;
begin
  v_team_id := coalesce(new.team_id, old.team_id);

  select max_members, status
  into v_max, v_status
  from public.teams
  where id = v_team_id;

  if not found or v_status in ('locked', 'archived') then
    return null;
  end if;

  select count(*)
  into v_count
  from public.team_members
  where team_id = v_team_id;

  update public.teams
  set status = case
    when v_count >= v_max then 'full'::public.team_status
    else 'open'::public.team_status
  end
  where id = v_team_id;

  return null;
end;
$$;

create trigger team_members_sync_status
  after insert or delete on public.team_members
  for each row execute function public.sync_team_status();
