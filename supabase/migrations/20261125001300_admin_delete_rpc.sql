-- 20261125001300_admin_delete_rpc.sql
-- Destructive admin operations. Both check is_admin() and are server-only.

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

  delete from public.access_allowlist where email = v_email;
end;
$$;

create or replace function public.admin_delete_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  delete from public.teams where id = p_team_id;
end;
$$;

revoke execute on function public.admin_delete_allowlist(text) from public, anon;
revoke execute on function public.admin_delete_team(uuid) from public, anon;
grant execute on function public.admin_delete_allowlist(text) to authenticated;
grant execute on function public.admin_delete_team(uuid) to authenticated;
