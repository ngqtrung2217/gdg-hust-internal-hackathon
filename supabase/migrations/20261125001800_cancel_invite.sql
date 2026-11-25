-- 20261125001800_cancel_invite.sql

create or replace function public.cancel_team_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.team_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select *
  into v_invite
  from public.team_invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite is not pending' using errcode = '23514';
  end if;

  if v_invite.inviter_id <> auth.uid()
     and not public.is_team_leader(v_invite.team_id)
     and not public.is_admin() then
    raise exception 'Only the inviter or team leader can cancel'
      using errcode = '42501';
  end if;

  update public.team_invites
  set status = 'cancelled', responded_at = now()
  where id = p_invite_id;
end;
$$;

revoke execute on function public.cancel_team_invite(uuid) from public, anon;
grant execute on function public.cancel_team_invite(uuid) to authenticated;
