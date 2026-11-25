-- 20261125002100_profile_department.sql
-- Profile department/subteam and team composition caps from the event rules:
-- 3-5 members, at most 3 Developers, and at most 2 Marcom/Operation members.

alter table public.profiles
  add column department text,
  add column subteam text,
  add constraint profiles_department_chk
    check (
      department is null
      or department in ('developer', 'marcom', 'operation')
    ),
  add constraint profiles_subteam_chk
    check (
      subteam is null
      or subteam in (
        'data-ai', 'web', 'mobile',
        'content', 'design', 'photo',
        'event', 'human-resources', 'partnership'
      )
    ),
  add constraint profiles_department_subteam_chk
    check (
      (department is null and subteam is null)
      or (
        department = 'developer'
        and subteam in ('data-ai', 'web', 'mobile')
      )
      or (
        department = 'marcom'
        and subteam in ('content', 'design', 'photo')
      )
      or (
        department = 'operation'
        and subteam in ('event', 'human-resources', 'partnership')
      )
    );

grant update (department, subteam) on public.profiles to authenticated;

-- Align the configurable team size with the event format (3-5).
update public.app_settings
set max_team_size = least(5, greatest(3, max_team_size))
where id = 1
  and (max_team_size < 3 or max_team_size > 5);

alter table public.app_settings
  drop constraint app_settings_max_team_size_chk,
  add constraint app_settings_max_team_size_chk
    check (max_team_size between 3 and 5);

-- Defense in depth: the RPCs validate membership, this trigger keeps any
-- insert from exceeding the per-department caps.
create or replace function public.enforce_team_composition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_department text;
  v_developers integer;
  v_marcom_operation integer;
  v_max_members smallint;
  v_current_members integer;
begin
  -- Serialize with the team row even if trigger order changes.
  perform 1
  from public.teams
  where id = new.team_id
  for update;

  select department
  into v_department
  from public.profiles
  where id = new.user_id;

  if v_department is null then
    raise exception 'Profile department is required before joining a team'
      using errcode = '23514';
  end if;

  select max_members
  into v_max_members
  from public.teams
  where id = new.team_id;

  select count(*)
  into v_current_members
  from public.team_members
  where team_id = new.team_id;

  select
    count(*) filter (where p.department = 'developer'),
    count(*) filter (where p.department in ('marcom', 'operation'))
  into v_developers, v_marcom_operation
  from public.team_members tm
  join public.profiles p on p.id = tm.user_id
  where tm.team_id = new.team_id;

  if v_department = 'developer' and v_developers >= 3 then
    raise exception 'A team can have at most 3 developers'
      using errcode = '23514';
  end if;

  if v_department in ('marcom', 'operation')
     and v_marcom_operation >= 2 then
    raise exception 'A team can have at most 2 Marcom or Operation members'
      using errcode = '23514';
  end if;

  -- A team that reaches its configured size must include at least one
  -- Marcom/Operation member.
  if v_current_members + 1 >= v_max_members
     and v_marcom_operation = 0
     and v_department = 'developer' then
    raise exception 'A full team needs at least 1 Marcom or Operation member'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger team_members_composition
  before insert on public.team_members
  for each row execute function public.enforce_team_composition();

-- The event format is 3-5 members per team.
create or replace function public.enforce_team_size_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.max_members < 3 or new.max_members > 5 then
    raise exception 'Team size must be between 3 and 5'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger teams_size_limit
  before insert or update of max_members on public.teams
  for each row execute function public.enforce_team_size_limit();

-- Department is a team-composition attribute. Re-check the caps when it
-- changes while the participant is in a team, so the rule cannot be bypassed
-- by editing the profile after joining.
create or replace function public.validate_department_change_in_team()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_max_members smallint;
  v_other_members integer;
  v_developers integer;
  v_marcom_operation integer;
begin
  if new.department is not distinct from old.department
     and new.subteam is not distinct from old.subteam then
    return new;
  end if;

  select team_id
  into v_team_id
  from public.team_members
  where user_id = new.id;

  if not found then
    return new;
  end if;

  if new.department is null then
    raise exception 'Profile department is required while in a team'
      using errcode = '23514';
  end if;

  perform 1
  from public.teams
  where id = v_team_id
  for update;

  select max_members
  into v_max_members
  from public.teams
  where id = v_team_id;

  select
    count(*),
    count(*) filter (where p.department = 'developer'),
    count(*) filter (where p.department in ('marcom', 'operation'))
  into v_other_members, v_developers, v_marcom_operation
  from public.team_members tm
  join public.profiles p on p.id = tm.user_id
  where tm.team_id = v_team_id
    and tm.user_id <> new.id;

  if new.department = 'developer' and v_developers >= 3 then
    raise exception 'A team can have at most 3 developers'
      using errcode = '23514';
  end if;

  if new.department in ('marcom', 'operation')
     and v_marcom_operation >= 2 then
    raise exception 'A team can have at most 2 Marcom or Operation members'
      using errcode = '23514';
  end if;

  if v_other_members + 1 >= v_max_members
     and v_marcom_operation = 0
     and new.department = 'developer' then
    raise exception 'A full team needs at least 1 Marcom or Operation member'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profiles_validate_department_in_team
  before update of department, subteam on public.profiles
  for each row execute function public.validate_department_change_in_team();
