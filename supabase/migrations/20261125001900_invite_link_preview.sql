-- 20261125001900_invite_link_preview.sql
-- Public preview for /join/[token] so a visitor can see which team the link
-- belongs to before signing in. The raw token is the capability; only active
-- links resolve, and no participant PII is returned.

create or replace function public.get_invite_link_preview(p_token_hash text)
returns table (
  team_name text,
  team_description text,
  member_count integer,
  max_members smallint,
  expires_at timestamptz,
  joinable boolean
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
    )
  from public.team_invite_links l
  join public.teams t on t.id = l.team_id
  cross join public.app_settings s
  where s.id = 1
    and l.token_hash = p_token_hash
    and not l.revoked
    and l.expires_at > now()
    and l.uses < l.max_uses
  limit 1;
$$;

-- Anonymous execution is limited to resolving a token hash; no tables are
-- granted to anon.
grant usage on schema public to anon;

revoke execute on function public.get_invite_link_preview(text) from public;
grant execute on function public.get_invite_link_preview(text)
  to anon, authenticated;
