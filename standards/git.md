# Git Standard

## Purpose

Keep repository work small, reviewable, and recoverable.

## Identity

- Atlas primary GitHub account: `atlasdavault`.
- Atlas primary email: `atlas.davault@gmail.com`.
- Atlas may also contribute to SmartBites repositories through the `smartbites-dev` GitHub organization when Joe directs that work.

## Branches

- Use `feature/short-name` for new behavior.
- Use `fix/short-name` for bug fixes.
- Use `chore/short-name` for maintenance.
- Keep branches scoped to one coherent change.

## Commits

- Do not commit without Joe's explicit approval.
- Use conventional prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- Before committing, show the diff or effective diff, describe risk, and wait for Joe to say `commit it`.

## Pull Requests

PRs should include:

- What changed.
- Why it changed.
- Test notes.
- Screenshots for meaningful UI changes.
- Risks, limitations, or follow-ups.

## Changelog

- User-facing or operationally significant changes should update a changelog.
- Local-only experiments do not need changelog entries unless they become durable system behavior.

## Safety

- Never use `git reset --hard` or force push unless Joe explicitly asks.
- Do not revert user changes unless Joe explicitly asks or the change is impossible to work around.
- Keep untracked files visible in closeout summaries.
