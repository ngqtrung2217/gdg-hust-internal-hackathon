-- 20261125000500_security.sql
-- Helpers, RLS (default deny), and least-privilege grants.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.access_allowlist a on a.email = p.email
    where p.id = auth.uid()
      and p.role = 'admin'
      and a.role = 'admin'
      and a.active
  );
$$;

create or replace function public.is_team_leader(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and role = 'leader'
  );
$$;

alter table public.profiles enable row level security;
alter table public.access_allowlist enable row level security;
alter table public.skill_catalog enable row level security;
alter table public.profile_skills enable row level security;
alter table public.app_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_join_requests enable row level security;
alter table public.team_invites enable row level security;
alter table public.team_invite_links enable row level security;

-- Reads only. All mutations go through SECURITY DEFINER RPCs or the service
-- role on the server.
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (auth.uid() is not null);

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy skill_catalog_select_visible
  on public.skill_catalog for select
  to authenticated
  using (active or public.is_admin());

create policy profile_skills_select_authenticated
  on public.profile_skills for select
  to authenticated
  using (auth.uid() is not null);

create policy app_settings_select_authenticated
  on public.app_settings for select
  to authenticated
  using (auth.uid() is not null);

create policy announcements_select_published
  on public.announcements for select
  to authenticated
  using (published_at <= now());

create policy audit_logs_select_admin
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create policy teams_select_authenticated
  on public.teams for select
  to authenticated
  using (auth.uid() is not null);

create policy team_members_select_authenticated
  on public.team_members for select
  to authenticated
  using (auth.uid() is not null);

create policy team_join_requests_select_related
  on public.team_join_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_team_leader(team_id)
    or public.is_admin()
  );

create policy team_invites_select_related
  on public.team_invites for select
  to authenticated
  using (
    invitee_id = auth.uid()
    or inviter_id = auth.uid()
    or public.is_team_leader(team_id)
    or public.is_admin()
  );

create policy team_invite_links_select_leader
  on public.team_invite_links for select
  to authenticated
  using (public.is_team_leader(team_id) or public.is_admin());

-- No policies on access_allowlist: only the service role and SECURITY DEFINER
-- functions can touch it.

-- Least privilege: authenticated users can read, and may update only safe
-- profile columns. Role, email, and avatar_url stay server-managed.
grant usage on schema public to authenticated;

revoke all on all tables in schema public from anon;
revoke insert, update, delete on all tables in schema public from authenticated;

grant select on public.profiles to authenticated;
grant select on public.skill_catalog to authenticated;
grant select on public.profile_skills to authenticated;
grant select on public.app_settings to authenticated;
grant select on public.announcements to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.teams to authenticated;
grant select on public.team_members to authenticated;
grant select on public.team_join_requests to authenticated;
grant select on public.team_invites to authenticated;
grant select on public.team_invite_links to authenticated;

grant update (
  full_name,
  contact_email,
  major,
  cohort,
  headline,
  bio,
  preferred_roles,
  facebook_url,
  github_url,
  open_to_invites
) on public.profiles to authenticated;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_team_leader(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_team_leader(uuid) to authenticated;
