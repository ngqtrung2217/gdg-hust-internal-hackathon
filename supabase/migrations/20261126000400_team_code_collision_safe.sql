-- 20261126000400_team_code_collision_safe.sql
-- Serialise code generation so two teams created at the same moment cannot
-- receive the same code between the existence check and the insert.

create or replace function public.next_team_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_attempts integer := 0;
begin
  -- Transaction-scoped advisory lock. The check below runs after the lock is
  -- granted and therefore sees every code committed by the previous insert.
  perform pg_advisory_xact_lock(hashtextextended('public.teams.code', 0::bigint));

  loop
    v_attempts := v_attempts + 1;

    if v_attempts > 100 then
      raise exception 'No free team codes left' using errcode = '55000';
    end if;

    v_code := lpad((floor(random() * 1000000))::integer::text, 6, '0');

    exit when not exists (
      select 1 from public.teams where code = v_code
    );
  end loop;

  return v_code;
end;
$$;

revoke execute on function public.next_team_code() from public, anon, authenticated;

create or replace function public.assign_team_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.code is not null then
    return new;
  end if;

  new.code := public.next_team_code();
  return new;
end;
$$;
