-- 20261126000300_team_code.sql
-- Every team gets a six-digit code, shown on the team page for sharing
-- with BTC. Generated server-side; clients cannot set it.

alter table public.teams
  add column if not exists code text;

-- Backfill existing teams before the constraints go on.
do $$
declare
  v_team_id uuid;
  v_code text;
begin
  for v_team_id in
    select id from public.teams where code is null
  loop
    loop
      v_code := lpad((floor(random() * 1000000))::integer::text, 6, '0');
      exit when not exists (
        select 1 from public.teams where code = v_code
      );
    end loop;

    update public.teams set code = v_code where id = v_team_id;
  end loop;
end;
$$;

alter table public.teams
  alter column code set not null;

alter table public.teams
  add constraint teams_code_key unique (code);

alter table public.teams
  add constraint teams_code_format check (code ~ '^[0-9]{6}$');

create or replace function public.assign_team_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if new.code is not null then
    return new;
  end if;

  loop
    v_code := lpad((floor(random() * 1000000))::integer::text, 6, '0');
    exit when not exists (
      select 1 from public.teams where code = v_code
    );
  end loop;

  new.code := v_code;
  return new;
end;
$$;

create trigger teams_assign_code
  before insert on public.teams
  for each row
  execute function public.assign_team_code();
