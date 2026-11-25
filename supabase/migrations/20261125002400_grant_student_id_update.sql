-- 20261125002400_grant_student_id_update.sql
-- The profile form updates student_id, but the column-level grant omitted it.
-- PostgreSQL reports this as "permission denied for table profiles".

grant update (student_id) on public.profiles to authenticated;
