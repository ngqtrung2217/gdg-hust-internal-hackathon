-- 20261125000200_core_tables.sql
-- Core identity, skills, settings, announcements, and audit tables.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  contact_email text,
  full_name text not null default '',
  student_id text unique,
  major text,
  cohort text,
  avatar_url text,
  headline text,
  bio text,
  preferred_roles text[] not null default '{}',
  facebook_url text,
  github_url text,
  open_to_invites boolean not null default true,
  role public.app_role not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_lower_chk check (email = lower(email)),
  constraint profiles_email_format_chk
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint profiles_contact_email_lower_chk
    check (contact_email is null or contact_email = lower(contact_email)),
  constraint profiles_contact_email_format_chk
    check (contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint profiles_student_id_len_chk
    check (student_id is null or char_length(student_id) between 3 and 20),
  constraint profiles_cohort_chk
    check (cohort is null or cohort ~ '^K[0-9]{2,3}$'),
  constraint profiles_avatar_url_chk
    check (avatar_url is null or avatar_url ~ '^https://'),
  constraint profiles_headline_len_chk
    check (headline is null or char_length(headline) <= 120),
  constraint profiles_bio_len_chk
    check (bio is null or char_length(bio) <= 600),
  constraint profiles_facebook_url_chk
    check (facebook_url is null or (facebook_url ~ '^https://' and char_length(facebook_url) <= 300)),
  constraint profiles_github_url_chk
    check (github_url is null or (github_url ~ '^https://' and char_length(github_url) <= 300)),
  constraint profiles_preferred_roles_chk check (
    cardinality(preferred_roles) <= 3
    and preferred_roles <@ array[
      'frontend', 'backend', 'mobile', 'ai-ml', 'data',
      'design', 'product', 'devops', 'other'
    ]::text[]
  )
);

create table public.access_allowlist (
  email text primary key,
  full_name text,
  student_id text,
  major text,
  cohort text,
  role public.app_role not null default 'participant',
  active boolean not null default true,
  claimed boolean not null default false,
  claimed_by uuid references public.profiles (id) on delete set null,
  imported_at timestamptz not null default now(),
  constraint access_allowlist_email_lower_chk check (email = lower(email)),
  constraint access_allowlist_email_format_chk
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint access_allowlist_cohort_chk
    check (cohort is null or cohort ~ '^K[0-9]{2,3}$')
);

create table public.skill_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_catalog_name_len_chk check (char_length(name) between 1 and 40)
);

create table public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skill_catalog (id) on delete restrict,
  level smallint not null default 3,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id),
  constraint profile_skills_level_chk check (level between 1 and 5)
);

create table public.app_settings (
  id smallint primary key default 1,
  allowlist_mode boolean not null default true,
  max_team_size smallint not null default 5,
  team_creation_deadline timestamptz,
  teams_locked boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton_chk check (id = 1),
  constraint app_settings_max_team_size_chk check (max_team_size between 2 and 10)
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body_md text not null,
  pinned boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_len_chk check (char_length(title) between 1 and 160),
  constraint announcements_body_len_chk check (char_length(body_md) between 1 and 10000)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
