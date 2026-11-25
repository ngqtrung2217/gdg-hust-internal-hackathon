-- 20261125000600_auth_profile_rpc.sql
-- Login gate and profile skill writes. Both are SECURITY DEFINER and trust
-- only the verified JWT, never client-supplied identity.

create or replace function public.finalize_login()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_allow public.access_allowlist%rowtype;
  v_settings public.app_settings%rowtype;
  v_avatar text;
  v_name text;
  v_role public.app_role;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    raise exception 'Missing verified email claim' using errcode = '28000';
  end if;

  v_avatar := nullif(auth.jwt() -> 'user_metadata' ->> 'avatar_url', '');
  if v_avatar is null then
    v_avatar := nullif(auth.jwt() -> 'user_metadata' ->> 'picture', '');
  end if;
  v_name := nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', '');

  select *
  into v_allow
  from public.access_allowlist
  where email = v_email;

  if found then
    if not v_allow.active then
      raise exception 'Access has been revoked' using errcode = '42501';
    end if;

    v_role := v_allow.role;

    insert into public.profiles as p (
      id, email, full_name, student_id, major, cohort, avatar_url, role
    )
    values (
      v_uid,
      v_email,
      coalesce(nullif(v_allow.full_name, ''), v_name, ''),
      v_allow.student_id,
      v_allow.major,
      v_allow.cohort,
      v_avatar,
      v_role
    )
    on conflict (id) do update set
      email = excluded.email,
      full_name = case when p.full_name = '' then excluded.full_name else p.full_name end,
      student_id = coalesce(p.student_id, excluded.student_id),
      major = coalesce(p.major, excluded.major),
      cohort = coalesce(p.cohort, excluded.cohort),
      avatar_url = excluded.avatar_url,
      role = excluded.role,
      updated_at = now();

    update public.access_allowlist
    set claimed = true, claimed_by = v_uid
    where email = v_email
      and (claimed = false or claimed_by is null);

    return jsonb_build_object('allowed', true, 'role', v_role);
  end if;

  select *
  into v_settings
  from public.app_settings
  where id = 1;

  if v_settings.allowlist_mode then
    raise exception 'Email is not on the access list' using errcode = '42501';
  end if;

  insert into public.profiles as p (id, email, full_name, avatar_url, role)
  values (v_uid, v_email, coalesce(v_name, ''), v_avatar, 'participant')
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when p.full_name = '' then excluded.full_name else p.full_name end,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return jsonb_build_object('allowed', true, 'role', 'participant');
end;
$$;

create or replace function public.set_profile_skills(
  p_skill_ids uuid[],
  p_levels integer[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  v_count := coalesce(cardinality(p_skill_ids), 0);

  if v_count > 5 then
    raise exception 'A profile can have at most 5 skills' using errcode = '23514';
  end if;

  if v_count <> coalesce(cardinality(p_levels), 0) then
    raise exception 'Skill and level arrays must have the same length'
      using errcode = '23514';
  end if;

  if v_count <> (
    select count(distinct t.skill_id)
    from unnest(p_skill_ids) as t(skill_id)
  ) then
    raise exception 'Duplicate skills are not allowed' using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(p_levels) as t(level)
    where t.level is null or t.level not between 1 and 5
  ) then
    raise exception 'Skill level must be between 1 and 5' using errcode = '23514';
  end if;

  perform 1
  from public.profiles
  where id = v_uid
  for update;

  if exists (
    select 1
    from unnest(p_skill_ids) as s(skill_id)
    left join public.skill_catalog c
      on c.id = s.skill_id and c.active
    where c.id is null
  ) then
    raise exception 'Unknown or inactive skill' using errcode = '23503';
  end if;

  delete from public.profile_skills where profile_id = v_uid;

  if v_count > 0 then
    insert into public.profile_skills (profile_id, skill_id, level)
    select v_uid, s.skill_id, s.level::smallint
    from unnest(p_skill_ids, p_levels) as s(skill_id, level);
  end if;
end;
$$;

revoke execute on function public.finalize_login() from public, anon;
revoke execute on function public.set_profile_skills(uuid[], integer[]) from public, anon;
grant execute on function public.finalize_login() to authenticated;
grant execute on function public.set_profile_skills(uuid[], integer[]) to authenticated;
