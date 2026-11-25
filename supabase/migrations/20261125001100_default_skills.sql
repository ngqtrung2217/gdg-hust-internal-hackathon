-- 20261125001100_default_skills.sql
-- Default skill catalog. BTC can edit, hide, or add skills in the admin UI.

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
