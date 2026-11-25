-- Local seed data. Never run this against production.
-- Replace the admin email before using the local environment.

insert into public.app_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.skill_catalog (name, category, sort_order)
values
  ('Frontend', 'engineering', 10),
  ('Backend', 'engineering', 20),
  ('Mobile', 'engineering', 30),
  ('AI/ML', 'data', 40),
  ('Data Engineering', 'data', 50),
  ('UI/UX Design', 'design', 60),
  ('Product Management', 'product', 70),
  ('DevOps', 'engineering', 80),
  ('QA/Testing', 'engineering', 90)
on conflict (name) do nothing;

-- BTC/admin must be on the same allowlist as participants.
insert into public.access_allowlist (email, full_name, role)
values
  ('ngqtrung22.17@gmail.com', 'BTC Admin', 'admin'),
  ('admin@example.com', 'BTC Admin', 'admin')
on conflict (email) do nothing;
