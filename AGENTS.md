# AGENTS.md

This file is the operating manual for AI coding agents working on this
repository. It follows the [AGENTS.md](https://agents.md) open format: a
predictable place for context, commands, conventions, and boundaries.

`README.md` explains the product to humans. `design.md` defines the visual
system. `SECURITY.md` defines the security policy. This file tells agents how
to change the code without breaking either.

---

## 1. Project at a glance

**GDG HUST Internal Hackathon** — a web platform for an internal hackathon:

- Landing page with event information and announcements.
- Google sign-in restricted by an admin-managed access allowlist. BTC/admin
  emails are on the same list; there is no admin bypass.
- Participant profiles with skills and skill levels.
- Team creation, direct invites, join requests, and leader approval.
- Admin (BTC) console: participant import, settings, deadlines, team lock.

**Stack**

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, TypeScript, strict) |
| Styling | Tailwind CSS v4, tokens from `design.md` |
| Backend | Supabase (PostgreSQL, Auth, RLS, RPC) |
| Auth | Auth.js (Google OAuth) + custom Supabase JWT |
| Validation | Zod |
| Tests | Vitest + Testing Library, Playwright for e2e |
| Package manager | npm |

---

## 2. Golden rules

Read these before writing code. They are not negotiable.

1. **Never disable RLS.** Every table has RLS enabled with default-deny policies.
2. **Never put the service-role key in client code.** It must never appear in a
   `NEXT_PUBLIC_*` variable or in any file imported by a Client Component.
3. **Never trust the client.** Validate and authorize on the server, even when
   RLS already enforces the rule.
4. **Never edit an applied migration.** Add a new timestamped migration.
5. **Never commit secrets or real participant data.** Use `.env.local` and test
   fixtures with fake identities.
6. **Never log tokens, session objects, or PII.**
7. **One participant = one team.** Enforce it in the database, not only in UI.
8. **Follow `design.md`.** No arbitrary hex colors, font sizes, or radii.
9. **Vietnamese UI copy.** Sentence case, action verbs, no emoji as controls.
10. **Ask before changing the data model, auth, RLS, or design tokens.**
11. **Admins are allowlisted too.** BTC/admin accounts must have an active row in
    `access_allowlist` with `role = 'admin'`. There is no hardcoded, self-service,
    or environment-variable admin path.

---

## 3. Commands

Run from the repository root.

```bash
# Install
npm install

# Develop
npm run dev                 # http://localhost:3000

# Quality gates (all must pass before a PR)
npm run lint
npm run typecheck
npm test
npm run build
npm audit

# Database (local Supabase)
npx supabase start
npx supabase db reset
npx supabase db push

# Focused tests
npm test -- <pattern>
npx playwright test
```

If a command is missing from `package.json`, add a script rather than
documenting a one-off shell incantation.

---

## 4. Repository map

```text
auth.ts                         Auth.js config (Google)
app/
  page.tsx                      Landing page (public)
  login/page.tsx                Google sign-in
  join/[token]/page.tsx         Accept an invite link
  api/auth/[...nextauth]/       Auth.js handlers
  (dashboard)/
    layout.tsx                  Contestant shell, navigation, session guard
    overview/page.tsx           Announcements and deadlines
    team/page.tsx               Create team / manage my team
    teams/page.tsx              Browse open teams, request to join
    participants/page.tsx       Browse participants open to invites
    profile/page.tsx            Edit profile and skills
  admin/
    layout.tsx                  Separate BTC shell + admin guard
    page.tsx                    BTC console (settings, allowlist, announcements, teams)
components/
  ui/                           Primitives: button, input, card, markdown…
  admin/                        Settings, import, announcement forms
  app-shell.tsx                 Navigation and session chrome
  profile-form.tsx              Profile editor
  skill-editor.tsx              Five-skill picker
lib/
  actions/                      Server Actions (profile, team, admin)
  auth/
    session.ts                  Signed Supabase JWT + user client
    require-user.ts             Session guard
    require-admin.ts            Admin guard
    profile-id.ts               UUIDv5(google_sub)
    supabase-jwt.ts             HS256 JWT signing
  supabase/
    user.ts                     Server Supabase client with user JWT
  validation/                   Zod schemas
  utils/                        Pure helpers
supabase/
  migrations/                   Timestamped SQL migrations
  README.md                     Schema, RLS, RPC docs
  seed.sql                      Local seed data
types/
  db.ts                         Domain types
  next-auth.d.ts                Session augmentation
```

There is no browser Supabase client. All database access stays on the server
with the short-lived custom JWT.

Route names may evolve, but keep the boundaries: UI in `components`, server
logic in `lib`, SQL in `supabase/migrations`.

---

## 5. Architecture contract

- **Server Components by default.** Add `"use client"` only for interactivity,
  browser APIs, or local state.
- **Server Actions for mutations.** Use Route Handlers only for OAuth callbacks,
  webhooks, or non-form HTTP endpoints.
- **Data access on the server.** Prefer `lib/supabase/server.ts`. Do not fetch
  privileged data in Client Components.
- **Team mutations go through RPCs**, not ad-hoc multi-step updates. The RPC
  owns the transaction: lock, validate, write.
- **Authorization is layered:** middleware session check → route guard →
  Server Action guard → RLS → database constraint. Do not remove a layer
  because another one exists.

### Core data model

| Table | Purpose | Key rules |
| --- | --- | --- |
| `profiles` | Participant profile, independent of Supabase Auth | `id = UUIDv5(google_sub)`; unique `google_sub`; users edit their own row except `role`, `email`, and `avatar_url`; contact fields are visible to authenticated users only |
| `access_allowlist` | Admin-managed emails and pre-filled data, **including BTC/admin** | Admin-only; unique `email`; `role` is `participant` or `admin`; `active = false` revokes access |
| `skill_catalog` | Admin-defined skill list | Admin write; authenticated read of active rows; unique `name` |
| `profile_skills` | Skills selected by each profile | Unique `(profile_id, skill_id)`; `level` 1–5; **max 5 rows per profile** enforced by trigger |
| `teams` | Team metadata | `leader_id` references a profile; unique `slug`, `invite_code` |
| `team_members` | Membership | Unique `user_id` (one team per person); unique `(team_id, user_id)` |
| `team_join_requests` | Request to join | Unique pending request per `(team_id, user_id)` |
| `team_invites` | Direct invite by leader | Unique pending invite per `(team_id, invitee_id)` |
| `announcements` | Overview notices | `body_md` is markdown with inline `https://` links; sanitize before render; admin write, authenticated read |
| `app_settings` | Singleton event config | Admin write; `allowlist_mode`, `max_team_size`, deadlines, `teams_locked` |

### Profile schema

Keep the profile rich enough for team matching, but validate and limit every
field.

| Group | Fields | Rules |
| --- | --- | --- |
| Identity | `email`, `full_name`, `student_id`, `major`, `cohort`, `avatar_url` | `email` and `avatar_url` come from Google and are **read-only**; `student_id` unique per event; `cohort` matches `K[0-9]{2,3}` |
| About | `headline`, `bio` | `headline` ≤ 120 chars; `bio` ≤ 600 chars |
| Contact | `contact_email`, `facebook_url`, `github_url` | Optional; URLs must be `https://`; reject non-http(s) schemes; each field ≤ 300 chars |
| Skills | `profile_skills` join rows | **Max 5** per profile; `skill_id` must reference an `active` row in `skill_catalog`; `level` integer 1–5; unique `(profile_id, skill_id)` |
| Department | `department`, `subteam` | `developer` (`data-ai`, `web`, `mobile`), `marcom` (`content`, `design`, `photo`), `operation` (`event`, `human-resources`, `partnership`); both required before creating/joining a team |
| Team | `open_to_invites` | Boolean; only profiles with `true` appear in "Find teammates" |
| Team composition | `team_members` + profile department | Teams are 3–5 members, at most **3 Developer** and **2 Marcom/Operation**; enforced by a DB trigger on `team_members` |
| System | `role`, `created_at`, `updated_at` | `role` is server-managed; timestamps are trigger-managed |

`skill_catalog` is admin-managed (`name`, `category`, `active`, `sort_order`).
Participants can select only active skills. Enforce the 5-skill cap in the
database with a trigger on `profile_skills`, and expose writes through the
`set_profile_skills` RPC so a client cannot exceed the cap or select inactive
skills. Avatar URLs are synced from Google OAuth metadata and never accepted
from the client.

**Visibility:** anonymous users cannot read `profiles` at all. Authenticated
participants can read profile rows, including contact links intended for
teammates. Only the owner or an admin can update a profile; `role`, `email`, and
`avatar_url` are never client-updatable. If contact fields must be
column-restricted later, expose a `public_profiles` view and keep the base table
locked down.

### Required RPCs

Implement these as `SECURITY DEFINER` functions with an explicit
`SET search_path = ''`, an `auth.uid()` check, and row locks:

| RPC | Caller | Guarantees |
| --- | --- | --- |
| `create_team(name, description, max_members)` | Participant without a team | Deadline and lock check; caller becomes leader |
| `request_join_team(team_id, message)` | Participant without a team | Capacity, deadline, lock, no pending duplicate |
| `approve_join_request(request_id)` | Team leader | `FOR UPDATE` team; capacity check; atomic membership insert |
| `reject_join_request(request_id)` | Team leader | Only pending requests |
| `invite_to_team(team_id, invitee_id)` | Team leader | Capacity, deadline, no existing membership |
| `respond_to_invite(invite_id, accept)` | Invitee | Expiry, capacity, one-team rule |
| `leave_team(team_id)` | Member | Leader must transfer or the team is handled by BTC |
| `transfer_leadership(team_id, new_leader_id)` | Current leader or admin | New leader is a member |
| `finalize_login()` | Custom JWT holder | Reads `sub`, `email`, and `google_sub`, resolves `access_allowlist`, creates/updates the profile, and returns `{ allowed, role, profile_id }`. Admin role comes only from the allowlist. |
| `set_profile_skills(skill_ids uuid[], levels integer[])` | Profile owner | Replaces the caller's skills atomically; max 5; skill rows must be active; level 1–5 |

### Authentication gate

Every sign-in, including BTC/admin, passes through the same gate:

1. Auth.js completes Google OAuth and verifies the Google profile and email.
2. The server derives `profileId = UUIDv5(google_sub)` using the fixed namespace
   in `lib/auth/profile-id.ts`. Never derive it from email.
3. The server signs a short-lived HS256 Supabase JWT with `sub = profileId`,
   `role = authenticated`, `aud = authenticated`, `email`, `google_sub`, and
   `iss`. The browser never receives this token.
4. `finalize_login()` runs with that JWT and looks up `access_allowlist` by the
   verified email.
5. If the row exists and `active = true`, the profile is created or updated with
   `role` and `google_sub` from the allowlist row.
6. If the row exists but `active = false`, login is rejected regardless of
   `allowlist_mode`. Deactivation is an explicit revocation.
7. If the row does not exist and `allowlist_mode = false`, the user is created as
   a `participant`.
8. Otherwise, login is rejected.
9. Admin authorization requires `profiles.role = 'admin'` **and** an active
   `access_allowlist` row with `role = 'admin'`. Removing or deactivating the
   allowlist row revokes admin access on the next request because `is_admin()`
   checks both.

Never grant admin from a client-provided value, an email list in source code, or
an environment variable. There is no Supabase Auth user and no service-role key
in the application.

---

## 6. Coding conventions

### TypeScript

- `strict: true`. No `any`, no `@ts-ignore` without a written reason.
- Use the domain types in `types/db.ts`; update them when the schema changes.
- Prefer `unknown` at boundaries and narrow with Zod.
- Use named exports; default exports only for Next.js pages/layouts.
- Keep pure helpers in `lib/utils` and unit-test them.

### React / Next.js

- Server Components must not import browser-only modules.
- Client Components must not import `lib/supabase/server.ts` or anything that
  reads any server-only secret.
- Use `Suspense` and loading states for async UI.
- Forms use progressive enhancement where practical; show pending, success, and
  error states.
- Do not use `useEffect` to fetch data that can be fetched on the server.

### Validation

- Every Server Action starts with a Zod parse.
- Reject unknown fields with `.strict()` where appropriate.
- Return typed result objects: `{ ok: true, data }` or
  `{ ok: false, error: { code, message } }`.
- Map database errors to user-safe messages; never echo raw SQL errors.

### UI

- Use tokens and components from `design.md`.
- Buttons: one filled primary action per view.
- All interactive elements have visible focus states and 48px touch targets.
- Every form control has a visible label; errors are announced with
  `aria-describedby` and `aria-live`.
- Vietnamese copy, sentence case. Dates `dd/MM/yyyy HH:mm`, timezone
  `Asia/Ho_Chi_Minh`.
- No emoji as functional icons; use Material Symbols.

### Database

- Migrations are timestamped and ordered; one logical change per migration.
- Enable RLS and add policies in the same migration that creates the table.
- Add indexes for foreign keys and columns used in policies/filters.
- Prefer `timestamptz` and `gen_random_uuid()`.
- Add `created_at`/`updated_at` with a trigger where relevant.
- Write SQL comments for non-obvious constraints.

---

## 7. Testing requirements

Add or update tests for every behavioral change.

| Layer | Tool | What to cover |
| --- | --- | --- |
| Pure logic | Vitest | Validation, ranking, formatting |
| Components | Testing Library | Forms, empty states, error states |
| Server Actions | Vitest with mocked Supabase | Auth guard, validation, error mapping |
| Database | SQL/pgTAP tests | RLS allow/deny, capacity, one-team rule, deadline |
| Critical journeys | Playwright | Login, create team, request, approve |

Minimum security test matrix for a new table or RPC:

- Anonymous cannot read or write.
- Participant can read only what the policy allows.
- Participant cannot modify another participant's row.
- Participant cannot change their own `email`, `role`, or `avatar_url`.
- Anonymous cannot read profiles; authenticated participants can read contact
  fields needed for team matching.
- Invalid URLs and roles are rejected; skills outside the catalog or beyond 5
  per profile are rejected.
- Leader can act only on their own team.
- Admin can perform the intended admin action.
- Admin without an active `access_allowlist` row cannot sign in and cannot
  obtain or keep admin access.
- Deactivating an allowlist row revokes access on the next login/refresh.
- Constraint violations return a safe error.

---

## 8. Security checklist for changes

Before opening a PR, confirm:

- [ ] No secret, token, or real PII in the diff.
- [ ] Every new table has RLS + policies + tests.
- [ ] Every new Server Action validates input with Zod and checks auth.
- [ ] Every new privileged RPC verifies `auth.uid()` and role.
- [ ] Admin access is driven by `access_allowlist.role`, never a hardcoded email
      or environment variable.
- [ ] Profile `email`, `role`, and `avatar_url` are not client-updatable;
      social URLs are validated; skills are capped at 5 and limited to the
      active catalog; profile rows are not readable by anonymous users.
- [ ] Team mutations cannot race past capacity or the deadline.
- [ ] Errors shown to users contain no internal details.
- [ ] Logs contain no tokens, session objects, or PII.
- [ ] New dependencies are necessary, maintained, and audited.
- [ ] Security headers and CSP still permit only what is needed.

See `SECURITY.md` for the full policy.

---

## 9. PR and commit conventions

**Commit messages**

```text
<area>: <imperative summary>

Optional body explaining why, not what.
```

Areas: `auth`, `team`, `admin`, `ui`, `db`, `docs`, `chore`.

**PR title**

```text
[<area>] <Summary>
```

**PR description**

- What changed and why.
- Screenshots or recordings for UI changes.
- Migration/RPC notes and rollback plan.
- Test evidence: commands run and results.
- Risk and security notes.

Before requesting review:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

---

## 10. Definition of done

A task is done when:

- [ ] The behavior matches the request and the event rules.
- [ ] UI follows `design.md` and works at 360px, 768px, and 1280px.
- [ ] Server-side authorization and RLS are in place.
- [ ] Tests cover success, failure, and permission-denied paths.
- [ ] `lint`, `typecheck`, `test`, and `build` pass.
- [ ] Docs (`README.md`, `AGENTS.md`, `design.md`) are updated if behavior or
      setup changed.
- [ ] No secrets, debug code, or TODOs without an owner.

---

## 11. Boundaries — ask first

Stop and ask a maintainer before:

- Changing the schema, an RPC signature, or an RLS policy.
- Changing auth, the allowlist logic, or admin role assignment.
- Adding a dependency, a third-party service, or a background job.
- Changing `design.md` tokens or typography.
- Deleting data, running a destructive migration, or resetting a shared
  environment.
- Touching CI/CD secrets or deployment configuration.

Never do:

- Disable RLS "temporarily".
- Use the service-role key in the browser or in a Client Component.
- Bypass the allowlist with a client-side check.
- Hardcode an admin email in client code.
- Commit `.env*`, tokens, or real participant data.
- Rewrite applied migrations or force-push `main`.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Redirect loop after login | Google callback URL missing | Add `http://localhost:3000/api/auth/callback/google` and the production callback in Google Console |
| `permission denied for table` | RLS policy missing, wrong role, or JWT not accepted by Supabase | Inspect policies; verify Third-Party Auth secret and `aud`/`role` claims |
| `new row violates row-level security` | Insert policy or `WITH CHECK` missing | Add policy and test |
| Type drift | DB schema changed | Update `types/db.ts` and rerun `npm run typecheck` |
| Supabase JWT rejected | `SUPABASE_JWT_SECRET` does not match Supabase Third-Party Auth | Copy the same secret to both sides |
| Team join race | Mutation not using `FOR UPDATE` | Move logic into the RPC |

---

## 13. References

- Product: `README.md`
- Design system: `design.md`
- Security policy: `SECURITY.md`
- Database schema: `supabase/README.md`
- AGENTS.md format: https://agents.md
- Next.js App Router: https://nextjs.org/docs/app
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
