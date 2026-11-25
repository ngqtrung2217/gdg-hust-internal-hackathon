-- 20261125001700_access_requests.sql
-- Unknown Google users create a pending access request instead of a hard
-- rejection. BTC approves/rejects manually in the admin console.

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  google_sub text,
  profile_id uuid,
  full_name text,
  avatar_url text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  constraint access_requests_email_lower_chk check (email = lower(email)),
  constraint access_requests_email_format_chk
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create index access_requests_status_idx
  on public.access_requests (status, requested_at desc);

alter table public.access_requests enable row level security;
revoke all on public.access_requests from anon, authenticated;

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
    insert into public.access_requests (
      email, google_sub, profile_id, full_name, avatar_url
    )
    values (
      v_email, v_google_sub, v_uid, coalesce(v_name, ''), v_avatar
    )
    on conflict (email) do update set
      google_sub = coalesce(excluded.google_sub, public.access_requests.google_sub),
      profile_id = excluded.profile_id,
      full_name = coalesce(nullif(excluded.full_name, ''), public.access_requests.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.access_requests.avatar_url),
      status = 'pending',
      requested_at = now(),
      reviewed_by = null,
      reviewed_at = null;

    return jsonb_build_object('allowed', false, 'reason', 'pending');
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

create or replace function public.admin_list_access_requests()
returns table (
  id uuid,
  email text,
  google_sub text,
  full_name text,
  avatar_url text,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz
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
  select r.id, r.email, r.google_sub, r.full_name, r.avatar_url,
         r.status, r.requested_at, r.reviewed_at
  from public.access_requests r
  order by
    case when r.status = 'pending' then 0 else 1 end,
    r.requested_at desc;
end;
$$;

create or replace function public.admin_approve_access_request(
  p_id uuid,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.access_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  select *
  into v_request
  from public.access_requests
  where id = p_id
  for update;

  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request is not pending' using errcode = '23514';
  end if;

  insert into public.access_allowlist (
    email, full_name, role, active
  )
  values (
    v_request.email, v_request.full_name, p_role, true
  )
  on conflict (email) do update set
    full_name = coalesce(excluded.full_name, public.access_allowlist.full_name),
    role = excluded.role,
    active = true;

  update public.profiles
  set role = p_role
  where email = v_request.email;

  update public.access_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_id;
end;
$$;

create or replace function public.admin_reject_access_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  update public.access_requests
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_id and status = 'pending';

  if not found then
    raise exception 'Request is not pending' using errcode = '23514';
  end if;
end;
$$;

revoke execute on function public.admin_list_access_requests() from public, anon;
revoke execute on function public.admin_approve_access_request(uuid, public.app_role) from public, anon;
revoke execute on function public.admin_reject_access_request(uuid) from public, anon;

grant execute on function public.admin_list_access_requests() to authenticated;
grant execute on function public.admin_approve_access_request(uuid, public.app_role) to authenticated;
grant execute on function public.admin_reject_access_request(uuid) to authenticated;
