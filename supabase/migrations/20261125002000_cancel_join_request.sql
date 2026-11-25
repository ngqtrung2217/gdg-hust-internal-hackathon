-- 20261125002000_cancel_join_request.sql

create or replace function public.cancel_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.team_join_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select *
  into v_request
  from public.team_join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  if v_request.user_id <> auth.uid() then
    raise exception 'Only the requester can cancel' using errcode = '42501';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request is not pending' using errcode = '23514';
  end if;

  update public.team_join_requests
  set status = 'cancelled', decided_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.cancel_join_request(uuid) from public, anon;
grant execute on function public.cancel_join_request(uuid) to authenticated;
