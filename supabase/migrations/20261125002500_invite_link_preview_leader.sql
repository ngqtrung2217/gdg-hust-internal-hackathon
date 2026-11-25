-- 20261125002500_invite_link_preview_leader.sql
-- Extend the public invite preview with the leader's name and contact email,
-- and include the recruiting toggle in the joinable calculation.

drop function if exists public.get_invite_link_preview(text);

create function public.get_invite_link_preview(p_token_hash text)
returns table (
  team_name text,
  team_description text,
  member_count integer,
  max_members smallint,
  expires_at timestamptz,
  joinable boolean,
  leader_name text,
  leader_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.name,
    t.description,
    (
      select count(*)::integer
      from public.team_members tm
      where tm.team_id = t.id
    ),
    t.max_members,
    l.expires_at,
    (
      t.status not in ('locked', 'archived')
      and t.recruiting
      and not s.teams_locked
      and (
        s.team_creation_deadline is null
        or now() <= s.team_creation_deadline
      )
      and (
        select count(*)
        from public.team_members tm
        where tm.team_id = t.id
      ) < t.max_members
    ),
    p.full_name,
    p.email
  from public.team_invite_links l
  join public.teams t on t.id = l.team_id
  join public.profiles p on p.id = t.leader_id
  cross join public.app_settings s
  where s.id = 1
    and l.token_hash = p_token_hash
    and not l.revoked
    and l.expires_at > now()
    and l.uses < l.max_uses
  limit 1;
$$;

revoke execute on function public.get_invite_link_preview(text) from public;
grant execute on function public.get_invite_link_preview(text)
  to anon, authenticated;
