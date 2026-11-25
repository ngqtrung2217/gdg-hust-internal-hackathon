-- 20261125000100_enums.sql
-- Domain enums. Keep values stable; add new values in a new migration.

do $$
begin
  create type public.app_role as enum ('participant', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.team_status as enum ('open', 'full', 'locked', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.team_member_role as enum ('leader', 'member');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.join_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.team_invite_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;
