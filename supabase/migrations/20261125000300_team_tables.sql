-- 20261125000300_team_tables.sql
-- Teams, membership, join requests, direct invites, and invite links.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  leader_id uuid not null references public.profiles (id) on delete restrict,
  max_members smallint not null default 5,
  status public.team_status not null default 'open',
  invite_code text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_len_chk check (char_length(name) between 2 and 60),
  constraint teams_description_len_chk
    check (description is null or char_length(description) <= 600),
  constraint teams_max_members_chk check (max_members between 2 and 10),
  constraint teams_invite_code_len_chk check (char_length(invite_code) >= 16)
);

create index teams_leader_id_idx on public.teams (leader_id);
create index teams_status_idx on public.teams (status);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.team_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (user_id)
);

create index team_members_team_idx on public.team_members (team_id);
create index team_members_role_idx on public.team_members (team_id, role);

create table public.team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status public.join_request_status not null default 'pending',
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint team_join_requests_message_len_chk
    check (message is null or char_length(message) <= 300)
);

create unique index team_join_requests_one_pending_idx
  on public.team_join_requests (team_id, user_id)
  where status = 'pending';
create index team_join_requests_team_status_idx
  on public.team_join_requests (team_id, status);
create index team_join_requests_user_status_idx
  on public.team_join_requests (user_id, status);

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status public.team_invite_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint team_invites_message_len_chk
    check (message is null or char_length(message) <= 300),
  constraint team_invites_no_self_chk check (inviter_id <> invitee_id)
);

create unique index team_invites_one_pending_idx
  on public.team_invites (team_id, invitee_id)
  where status = 'pending';
create index team_invites_team_status_idx
  on public.team_invites (team_id, status);
create index team_invites_invitee_status_idx
  on public.team_invites (invitee_id, status);

create table public.team_invite_links (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses smallint not null default 1,
  uses smallint not null default 0,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint team_invite_links_token_hash_len_chk
    check (char_length(token_hash) >= 32),
  constraint team_invite_links_max_uses_chk check (max_uses between 1 and 20),
  constraint team_invite_links_uses_chk
    check (uses >= 0 and uses <= max_uses)
);

create index team_invite_links_team_idx on public.team_invite_links (team_id);
