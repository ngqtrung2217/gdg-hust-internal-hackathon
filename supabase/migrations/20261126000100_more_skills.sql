-- 20261126000100_more_skills.sql
-- Extra skills for business analysis, product, marcom, and operation roles.
-- BTC can still edit, hide, or add skills in the admin UI.

insert into public.skill_catalog (name, category, sort_order)
values
  ('Business Analyst', 'product', 100),
  ('Project Management', 'product', 110),
  ('Market Research', 'product', 120),
  ('Pitching', 'product', 130),
  ('Data Analysis', 'data', 140),
  ('Marketing', 'marketing', 150),
  ('Content Writing', 'marketing', 160),
  ('Social Media', 'marketing', 170),
  ('Video Editing', 'marketing', 180),
  ('Graphic Design', 'design', 190),
  ('Event Planning', 'operations', 200),
  ('Partnership', 'operations', 210),
  ('Logistics', 'operations', 220)
on conflict (name) do nothing;
