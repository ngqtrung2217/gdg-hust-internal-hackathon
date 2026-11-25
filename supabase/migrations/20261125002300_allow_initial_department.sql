-- 20261125002300_allow_initial_department.sql
-- Existing team members may fill in Ban/Mang once. Only subsequent changes are
-- blocked so the team composition cannot be altered after joining.

create or replace function public.prevent_department_change_in_team()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.department is not null
     and (
       new.department is distinct from old.department
       or new.subteam is distinct from old.subteam
     )
     and exists (
       select 1 from public.team_members where user_id = old.id
     ) then
    raise exception 'Cannot change department while in a team'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
