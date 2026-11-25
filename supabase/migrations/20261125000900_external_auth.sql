-- 20261125000900_external_auth.sql
-- Google OAuth is handled by Auth.js; Supabase only issues/validates the DB
-- identity through a custom JWT. There is no Supabase Auth user row.

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

alter table public.profiles
  add column google_sub text;

alter table public.profiles
  add constraint profiles_google_sub_key unique (google_sub);

-- finalize_login now trusts the verified JWT minted by our server. The JWT
-- carries:
--   sub        -> profiles.id (UUIDv5 derived from the Google subject)
--   email      -> verified Google email
--   google_sub -> stable Google subject
create or replace function public.finalize_login()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_google_sub text;
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

  v_google_sub := nullif(auth.jwt() ->> 'google_sub', '');
  v_avatar := nullif(auth.jwt() -> 'user_metadata' ->> 'avatar_url', '');
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
      id, google_sub, email, full_name, student_id, major, cohort, avatar_url, role
    )
    values (
      v_uid,
      v_google_sub,
      v_email,
      coalesce(nullif(v_allow.full_name, ''), v_name, ''),
      v_allow.student_id,
      v_allow.major,
      v_allow.cohort,
      v_avatar,
      v_role
    )
    on conflict (id) do update set
      google_sub = coalesce(excluded.google_sub, p.google_sub),
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

    return jsonb_build_object('allowed', true, 'role', v_role, 'profile_id', v_uid);
  end if;

  select *
  into v_settings
  from public.app_settings
  where id = 1;

  if v_settings.allowlist_mode then
    raise exception 'Email is not on the access list' using errcode = '42501';
  end if;

  insert into public.profiles as p (
    id, google_sub, email, full_name, avatar_url, role
  )
  values (
    v_uid, v_google_sub, v_email, coalesce(v_name, ''), v_avatar, 'participant'
  )
  on conflict (id) do update set
    google_sub = coalesce(excluded.google_sub, p.google_sub),
    email = excluded.email,
    full_name = case when p.full_name = '' then excluded.full_name else p.full_name end,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return jsonb_build_object('allowed', true, 'role', 'participant', 'profile_id', v_uid);
end;
$$;
