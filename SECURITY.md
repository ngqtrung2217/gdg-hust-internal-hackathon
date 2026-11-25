# Security Policy

**Project:** GDG HUST Internal Hackathon
**Maintainer:** GDG HUST Organizing Committee (BTC)
**Last updated:** 2026-11-25

We take the security of participant data and event operations seriously. This
document explains how to report a vulnerability, what is in scope, and the
controls we expect every contributor to follow.

---

## Supported Versions

| Version | Supported |
| --- | --- |
| `main` (production) | ✅ |
| Staging / pre-release | ✅ best effort |
| Older than current release | ❌ |

Only the latest deployed revision receives security fixes. If you are unsure
whether a finding affects the current deployment, report it anyway.

---

## Reporting a Vulnerability

> **Do not open a public GitHub issue, discussion, or pull request for a
> security vulnerability.**

Report privately through **either** channel:

1. **GitHub Private Vulnerability Reporting** — repository **Security** tab →
   **Report a vulnerability**.
2. **Email** — `security@[YOUR_DOMAIN]`
   <!-- TODO: replace with the BTC security mailbox before launch. -->

If you need an encrypted channel, ask us for a PGP key in your first message.

### What to include

Please provide as much of the following as you can:

- **Summary** — one sentence describing the issue.
- **Type** — e.g. authentication bypass, IDOR, RLS bypass, XSS, CSRF, injection,
  privilege escalation, secret exposure, business-logic abuse.
- **Affected component** — URL, route, API endpoint, table, or file path.
- **Affected revision** — commit SHA, branch, or deployment URL.
- **Preconditions** — accounts, roles, settings, or data required.
- **Reproduction steps** — numbered, minimal, deterministic.
- **Proof of concept** — request/response, screenshots, or exploit code.
- **Impact** — what an attacker could read, change, or disrupt.
- **Environment** — browser, OS, time, and whether you used a test account.
- **Credit preference** — name/handle to credit, or request anonymity.

Use **test accounts only**. Do not access, modify, or retain another
participant's data. If you encounter real personal data, stop and tell us.

---

## What to Expect

| Stage | Target |
| --- | --- |
| Acknowledgement of report | 2 business days |
| Initial triage and severity | 5 business days |
| Critical severity fix | 7 days |
| High severity fix | 14 days |
| Medium severity fix | 30 days |
| Low severity fix | Best effort / next release |

We will:

1. Confirm receipt and open a private tracking thread.
2. Reproduce and assign a severity using CVSS v3.1.
3. Develop and test a fix.
4. Coordinate disclosure with you.
5. Credit you unless you prefer otherwise.

We may ask for clarifying details or a retest after deployment.

---

## Scope

### In scope

- The production and staging web application.
- Authentication and session handling (Google OAuth via Auth.js, custom Supabase JWT).
- Authorization: RLS bypass, IDOR, privilege escalation, admin-only actions.
- The access allowlist and onboarding flow, including BTC/admin accounts.
- Privilege escalation through the allowlist, role assignment, or admin
  onboarding.
- Team operations: create, invite, join request, approve/reject, leave.
- Team capacity, deadline, and lock enforcement.
- Invite links and invite tokens.
- Injection: SQL, command, template, header, open redirect.
- XSS, CSRF, SSRF, and unsafe file upload.
- Sensitive data exposure: PII, tokens, secrets, service-role key leakage.
- Business-logic abuse with real security impact.

### Out of scope

- Third-party infrastructure: Google, Supabase, Vercel, GitHub. Report to the
  provider; you may also notify us so we can track it.
- Denial of service, volumetric attacks, or load testing.
- Brute force, credential stuffing, or spam.
- Social engineering, phishing, or physical attacks.
- Self-XSS and issues requiring an already-compromised device.
- Missing security headers with no demonstrable impact.
- Automated scanner output without a working proof of concept.
- Clickjacking on pages without sensitive state-changing actions.
- Content, typo, translation, or policy issues.
- Testing against real participant accounts or production data.

If you are unsure whether something is in scope, report it privately and ask.

---

## Safe Harbor

We support good-faith security research and will not pursue legal action for
research that follows this policy. This safe harbor applies only when you:

- Test against accounts you own or have explicit written permission to use.
- Do not access, modify, exfiltrate, or retain data belonging to others.
- Do not degrade, disrupt, or interrupt the event or other participants.
- Do not use social engineering against participants or organizers.
- Report the issue promptly and do not disclose it publicly before a fix is
  deployed, or within 90 days of the report, whichever comes first.
- Comply with applicable laws and the policies of third-party providers.

Good-faith research that accidentally accesses limited data must stop
immediately, avoid saving it, and notify us.

---

## Security Controls in This Project

This section documents the baseline every contributor must preserve.

### Authentication

- Google OAuth 2.0 / OpenID Connect is handled by **Auth.js**. No passwords are
  stored.
- Auth.js verifies the Google profile and stores the session in an `HttpOnly`,
  `Secure` (production), `SameSite=Lax` cookie. The browser never receives a
  Supabase token.
- The server derives a stable profile UUID from Google `sub` with UUIDv5 and
  mints a short-lived HS256 JWT for Supabase:
  `sub`, `role = authenticated`, `aud = authenticated`, `email`, `google_sub`,
  `iss`. Supabase Third-Party Auth verifies this JWT, so RLS still sees
  `auth.uid()`.
- **Allowlist mode:** when enabled, only emails present in `access_allowlist`
  with `active = true` may sign in. The check runs in `finalize_login()` using
  the verified email, never a client-supplied field.
- **Admins are allowlisted too.** BTC/admin accounts must have an active
  `access_allowlist` row with `role = 'admin'`. There is no admin bypass,
  hardcoded email, or self-service admin creation. Turning allowlist mode off
  does not exempt admins from the allowlist.
- Admin role is assigned server-side from `access_allowlist.role` by a
  `SECURITY DEFINER` function during login. Client claims are never trusted.
- Deactivating or deleting an allowlist row revokes access on the next login or
  role sync. An inactive row is always denied, regardless of allowlist mode.
  Admin access requires both `profiles.role = 'admin'` and an active allowlist
  row with `role = 'admin'`.
- Sign-out clears the Auth.js session.

### Authorization

- Row Level Security is enabled on **every** table. Default deny.
- Server-side authorization is enforced in addition to RLS.
- Team mutations run through `SECURITY DEFINER` RPCs that:
  - verify `auth.uid()` and the caller's role,
  - lock the team row with `SELECT ... FOR UPDATE`,
  - enforce capacity, deadline, lock, and one-team-per-user rules in the same
    transaction.
- `team_members` has a unique constraint on `user_id` to enforce one team per
  participant at the database level.
- Profile updates are restricted to the owner or an admin. `email`, `role`, and
  `avatar_url` are immutable by clients, and skills are capped at 5 active
  catalog entries through the `set_profile_skills` RPC.
- Admin-only tables and policies are restricted to `role = 'admin'` and
  re-checked against an active `access_allowlist` row with `role = 'admin'`
  (defense in depth).

### Input and output

- Every Server Action and Route Handler validates input with Zod.
- Database access uses parameterized queries through supabase-js; no string
  concatenation of SQL.
- Announcement bodies are Markdown. Render with a strict Markdown parser, strip
  raw HTML, and sanitize the result. Links must be `http(s)` and open with
  `rel="noopener noreferrer"`. Never inject unsanitized HTML.
- The app does not accept user file uploads in v1. Avatar URLs come from Google
  OAuth metadata and are not client-editable.

### Secrets

- `AUTH_SECRET`, `AUTH_GOOGLE_SECRET`, and `SUPABASE_JWT_SECRET` are
  **server-only** and must never appear in a `NEXT_PUBLIC_*` variable or client
  bundle.
- `SUPABASE_JWT_SECRET` must match the HS256 secret configured in Supabase
  Third-Party Auth. Rotate both together.
- The application does not need a service-role key. Admin writes go through
  `SECURITY DEFINER` RPCs guarded by `is_admin()`.
- `.env`, `.env.local`, and variants are gitignored.
- Production secrets live in the deployment platform's secret store.
- Rotate any secret that is exposed.

### Platform and operations

- HTTPS with HSTS in production.
- Security headers: CSP, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy`, and `frame-ancestors`.
- Rate limiting on authentication, invite creation, and join requests.
- Dependency scanning with Dependabot plus `npm audit` in CI.
- Audit log for administrative actions: actor, action, target, timestamp.
- Database backups enabled according to the Supabase plan.

### Privacy

- Collect the minimum PII needed for the event: Google email, contact email,
  full name, student ID, major, cohort, and optional Facebook and GitHub URLs.
- Avatar images come from the Google profile and are read-only. The app does not
  accept user uploads or store avatars in Supabase Storage.
- Anonymous users cannot read profile rows. Authenticated participants can read
  the profile fields needed for team matching, including contact links intended
  for teammates.
- Only the owner or BTC can update a profile. Contact fields and social links
  are never embedded in public or pre-login pages.
- Skills are selected from the BTC-managed `skill_catalog`, capped at 5 per
  profile, and used only for team matching.
- Retention: participant data is deleted after the event plus the retention
  window stated in the event rules.
- Participants may request export or deletion through the BTC mailbox.

---

## Secure Development Requirements

- No direct commits to `main`; every change goes through a pull request and
  review.
- CI must pass: lint, typecheck, unit tests, build, and dependency audit.
- New tables require RLS policies, indexes, constraints, and tests.
- New privileged operations require a threat-model note in the PR.
- Applied migrations are immutable; create a new migration to change schema.
- Secrets scanning (e.g. gitleaks) runs in pre-commit and CI.
- Security-relevant changes require review from a BTC maintainer.
- Role and allowlist changes are audited. Admin access is never granted from
  client code, a hardcoded email, or an environment variable.

---

## Disclosure Policy

We follow **coordinated disclosure**:

1. We acknowledge and triage privately.
2. We fix and deploy.
3. We publish a security advisory with credit, unless you request anonymity.
4. We request a CVE when the issue warrants one.

We ask that you do not publish details before a fix is available or before the
90-day coordination window ends, whichever comes first.

---

## Recognition

This is a community event and we do not offer monetary bounties. With your
permission we will credit you in the advisory and event communication. We may
offer event swag or a thank-you at the organizers' discretion.

---

## Contact

| Purpose | Contact |
| --- | --- |
| Security reports | `security@[YOUR_DOMAIN]` |
| Organizing committee | `btc@[YOUR_DOMAIN]` |
| Non-security bugs | GitHub Issues |
| General questions | GitHub Discussions |

<!-- Replace placeholder domains with the official BTC mailboxes before launch. -->

---

## References

- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [GitHub: Adding a security policy to your repository](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/adding-a-security-policy-to-your-repository)
- [Google Vulnerability Reward Program](https://bughunters.google.com/)
- [Supabase Security](https://supabase.com/docs/guides/security)
