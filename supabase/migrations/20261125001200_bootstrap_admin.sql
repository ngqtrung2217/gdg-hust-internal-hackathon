-- 20261125001200_bootstrap_admin.sql
-- Bootstrap the BTC admin account. Admin must still be on the allowlist.

insert into public.access_allowlist (email, full_name, role, active)
values ('ngqtrung22.17@gmail.com', 'BTC Admin', 'admin', true)
on conflict (email) do update
set role = 'admin', active = true;
