# Security Standard

## Purpose

Define how P3, SmartBites, Atlas, and Mission Control handle auth, secrets, privileged commands, and external access.

## Authentication

- Prefer OAuth 2.0 with PKCE for mobile and browser clients.
- Use session cookies for trusted first-party web surfaces when the backend can enforce secure, HttpOnly, SameSite cookies.
- Use short-lived JWTs only when a service boundary requires bearer tokens.
- Do not place long-lived tokens in frontend storage unless there is no safer product path.

## Supabase And RLS

- Every user-owned table must have RLS enabled before production use.
- Policies should be scoped by `auth.uid()` or tenant membership, not by client-provided IDs alone.
- Service-role keys are backend-only and must never appear in browser, mobile, or generated client bundles.
- Migration reviews must include a quick RLS pass for new tables, views, and storage buckets.

## Secrets

- Secrets live in environment variables, OpenClaw secrets, platform secret stores, or password managers.
- Do not store secrets, recovery codes, private keys, API keys, OAuth client secrets, or tokens in repo, memory files, screenshots, logs, or prompt artifacts.
- Local secret files must live outside repo paths and use owner-only permissions.
- Rotate secrets after accidental exposure, unknown access, employee/agent offboarding, or provider breach notices.

## External Actions

- Ask Joe before sending email, posting publicly, changing live access controls, deleting tracked files, modifying billing, or taking actions that affect production users.
- Internal file reads, docs updates, local builds, and local-only prototypes are safe when scoped and reversible.

## Exec Command Boundaries

Approved by default:

- Read-only inspection commands such as `rg`, `sed`, `ls`, `find`, `git status`, `git diff`, `npm run build`, and local test commands.
- Scoped file edits through Codex patch tools.
- Local service starts needed to verify UI.

Requires explicit approval:

- `git commit`, `git push`, force pushes, branch deletion, production deploys, destructive DB commands, public network sends, and irreversible file removal.

Blocked unless Joe explicitly requests and confirms:

- `git reset --hard`, broad `rm -rf`, secret exfiltration, disabling MFA, weakening auth, or changing retention/security policy silently.
