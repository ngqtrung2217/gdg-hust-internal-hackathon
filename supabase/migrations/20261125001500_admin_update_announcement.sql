-- 20261125001500_admin_update_announcement.sql

create or replace function public.admin_update_announcement(
  p_id uuid,
  p_title text,
  p_body_md text,
  p_pinned boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  update public.announcements
  set title = trim(p_title),
      body_md = p_body_md,
      pinned = coalesce(p_pinned, false)
  where id = p_id;

  if not found then
    raise exception 'Announcement not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_update_announcement(uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_update_announcement(uuid, text, text, boolean) to authenticated;
