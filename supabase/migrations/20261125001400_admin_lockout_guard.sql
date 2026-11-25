-- 20261125001400_admin_lockout_guard.sql
-- Never allow the last active admin to be deleted, demoted, or deactivated.

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
  v_existing public.access_allowlist%rowtype;
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

  select *
  into v_existing
  from public.access_allowlist
  where email = v_email;

  if found
     and v_existing.role = 'admin'
     and (p_role <> 'admin' or not p_active)
     and (
       select count(*)
       from public.access_allowlist
       where role = 'admin' and active
     ) <= 1
  then
    raise exception 'Cannot demote or deactivate the last active admin'
      using errcode = '23514';
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

create or replace function public.admin_delete_allowlist(p_email text)
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

  if exists (
    select 1 from public.access_allowlist
    where email = v_email and role = 'admin'
  ) and (
    select count(*) from public.access_allowlist
    where role = 'admin' and active
  ) <= 1 then
    raise exception 'Cannot delete the last active admin'
      using errcode = '23514';
  end if;

  delete from public.access_allowlist where email = v_email;
end;
$$;
