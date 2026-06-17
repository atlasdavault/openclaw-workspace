# Backend Standard

## Purpose

Define backend patterns for P3, Mission Control, and SmartBites services.

## Stack

- SmartBites backend: NestJS, Node, TypeScript, Supabase.
- Mission Control local server: Express until the surface demands a larger framework.
- Prefer repository/service separation when business logic starts growing.

## API Shape

- Use JSON endpoints with predictable envelope names.
- Prefer explicit status fields over ambiguous booleans.
- Return degraded/offline states gracefully for local dependencies.
- Validate request bodies before writing local data or forwarding to external services.

## Data Access

- Keep local Mission Control data in `mission-control/data/` unless the data is secret.
- Secret or recovery material must stay outside the workspace repo.
- For SmartBites, use migrations for schema changes and review RLS with each table or bucket change.

## Errors

- User-facing errors should be short and actionable.
- Logs can be more detailed but must not contain secrets.
- Network and provider failures should degrade the UI instead of crashing the app.

## Architecture

- Use CQRS only when read/write models genuinely diverge.
- Avoid adding message buses, queues, or durable background workers until simple request/response or cron is insufficient.
- Keep gateway integrations isolated behind API endpoints so frontend code does not learn secret tokens or local process details.

## Verification

- Run unit/integration tests where available.
- At minimum, run build/typecheck/lint commands that exist in the project.
- Exercise new endpoints with local HTTP requests before closeout.
