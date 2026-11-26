# Database

PostgreSQL schema for the GDG HUST internal hackathon. The source of truth is
`supabase/migrations/`; the high-level ER diagram is in the root `README.md`.

## Design principles

- **Third normal form.** Identity, skills, team membership, requests, and
  invites are separate tables. Skills are a catalog plus a join table, not a
  free-text array.
- **Database-enforced invariants.** Every rule that must never break is a
  constraint, a partial unique index, or a trigger:
  - one team per participant (`team_members.user_id` unique);
  - at most five skills per profile;
  - no duplicate pending request or invite;
  - at most five pending join requests per participant and five pending
    invites per inviter; cancelling, rejecting, declining, or expiring frees
    the slot;
  - team capacity; locked teams cannot gain members.
- **Explicit types and time.** `uuid` primary keys, `timestamptz`, enums for
  closed sets, `smallint` only where the range is genuinely small.
- **Least privilege.** RLS is enabled on every table with default deny.
  Authenticated users get `select` and a narrow column-level `update` grant on
  `profiles`; all writes go through `security definer` RPCs or the service role.
- **Server-side identity.** `auth.uid()` and the verified JWT email are the only
  trusted identity sources. No client-supplied user id or role.
- **Atomic team operations.** RPCs lock the team or request row with
  `for update`, then validate capacity, deadline, and membership in one
  transaction.
- **Auditability.** Admin-only changes are recorded in `audit_logs`; the app
  writes the audit row with the actor from the session.

## Migration order

| File | Contents |
|---|---|
| `20261125000100_enums.sql` | `app_role`, `team_status`, `team_member_role`, request/invite statuses |
| `20261125000200_core_tables.sql` | `profiles`, `access_allowlist`, `skill_catalog`, `profile_skills`, `app_settings`, `announcements`, `audit_logs` |
| `20261125000300_team_tables.sql` | `teams`, `team_members`, join requests, direct invites, invite links |
| `20261125000400_triggers.sql` | `updated_at`, skill cap, team capacity, team status sync |
| `20261125000500_security.sql` | `is_admin()`, `is_team_leader()`, RLS policies, grants |
| `20261125000600_auth_profile_rpc.sql` | `finalize_login()`, `set_profile_skills()` |
| `20261125000700_team_rpc_core.sql` | `create_team`, `request_join_team`, `approve_join_request`, `reject_join_request` |
| `20261125000800_team_rpc_invites.sql` | `invite_to_team`, `respond_to_invite`, `leave_team`, `transfer_leadership`, `join_team_with_link` |
| `20261125000900_external_auth.sql` | `google_sub`, no `auth.users` FK, `finalize_login` reads custom JWT |
| `20261125001000_admin_rpc.sql` | Admin settings, allowlist import, announcements, team lock, invite-link creation |
| `20261125001100_default_skills.sql` | Default skill catalog |
| `20261125001200_bootstrap_admin.sql` | Bootstrap `ngqtrung22.17@gmail.com` as admin |
| `20261126000100_more_skills.sql` | Extra business, marketing, and operation skills |
| `20261126000200_pending_limits.sql` | Pending join-request and invite caps per user |

`seed.sql` is for local development only.

## Access model

| Table | Read | Write |
|---|---|---|
| `profiles` | authenticated | owner via column-level grant; `id`, `google_sub`, `role`, `email`, `avatar_url` server-managed |
| `access_allowlist` | service role only | service role / admin server actions |
| `skill_catalog` | authenticated (active rows) | service role / admin |
| `profile_skills` | authenticated | `set_profile_skills()` RPC |
| `app_settings` | authenticated | service role / admin |
| `announcements` | authenticated (published) | service role / admin |
| `audit_logs` | admin | server-side audit writes |
| `teams` | authenticated | RPCs |
| `team_members` | authenticated | RPCs + triggers |
| `team_join_requests` | requester, team leader, admin | RPCs |
| `team_invites` | invitee, inviter, team leader, admin | RPCs |
| `team_invite_links` | team leader, admin | RPCs |

Admin status always requires **both** `profiles.role = 'admin'` and an active
`access_allowlist` row with `role = 'admin'`. BTC/admin is not exempt from the
allowlist.

## External auth (Auth.js)

Supabase Auth is **not** used. The application handles Google OAuth with Auth.js
and mints its own Supabase-compatible JWT:

- `sub` = `profiles.id` = UUIDv5(Google `sub`)
- `role` = `authenticated`
- `aud` = `authenticated`
- `email`, `google_sub`, `iss`

Supabase must have the same HS256 secret. On the linked project it is applied at
the PostgREST role level, without putting the secret in a migration:

```sql
alter role authenticator set pgrst.jwt_secret = '<SUPABASE_JWT_SECRET>';
notify pgrst, 'reload config';
```

The setting persists in `pg_db_role_setting`. Re-apply it if the project is
recreated or its PostgREST config is reset. `finalize_login()` then resolves
`access_allowlist` and creates or updates the profile. The browser never receives
the Supabase JWT; every database call is server-side.

## Apply

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Local reset:

```bash
npx supabase start
npx supabase db reset
```

## Bootstrap the first admin

```sql
insert into public.access_allowlist (email, full_name, role)
values ('admin@example.com', 'BTC Admin', 'admin')
on conflict (email) do update set role = 'admin', active = true;
```

The first Google sign-in creates the profile with `role = 'admin'` from the
allowlist row.

## Departments and team composition

`profiles.department` is one of `developer`, `marcom`, or `operation`, and
`profiles.subteam` must belong to that department (constraint-enforced). Team
composition follows the event rules: 3–5 members, at most 3 Developer members,
and at most 2 Marcom/Operation members. The insert trigger on `team_members`
blocks any path that would exceed those caps; a profile without a department
cannot join a team. Changing department while in a team is validated against the
same caps.

## Invite links

The application generates a random token, hashes it with SHA-256, and stores only
the hash in `team_invite_links.token_hash`. The raw token goes in the URL. The
server hashes the incoming token and calls `join_team_with_link(token_hash)`.
Never store or log the raw token.

Before sign-in, `/join/[token]` resolves the link through
`get_invite_link_preview(token_hash)`. That public RPC returns only the team
name, description, member count, capacity, expiry, and whether the link is
currently joinable. It returns no profile or contact data. Revoked, expired, or
exhausted links resolve to nothing; full or locked teams are shown as not
joinable.
