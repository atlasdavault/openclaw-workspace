# SmartBites Standard

## Purpose

Capture SmartBites-specific conventions so agents can act consistently across mobile, backend, data, and admin surfaces.

## Product Context

- SmartBites helps people understand restaurant food through allergy, dietary, and nutrition-aware information.
- Joe D. is the Founder and Creator of SmartBites.
- SmartBites work should prioritize trust, accuracy, practical usefulness, and clear user confidence.

## Known Stack

- Mobile: React Native and Expo.
- Backend: NestJS and Supabase.
- Data model center: `restaurants` and `restaurant_locations`.
- Restaurant/menu enrichment: Gemini API with Google Search grounding where appropriate.

## Naming

- Shared SmartBites wrapper components use the `SB*` prefix.
- Keep allergen and dietary labels plain and user-understandable.
- Avoid ambiguous health claims unless supported by verified source data.

## Data Quality

- Distinguish verified restaurant data from inferred data.
- Preserve source context for menu and allergen claims when available.
- Do not overstate confidence from generated or inferred results.

## Auth

- Mobile auth should use PKCE.
- Web admin surfaces may use secure session cookies.
- Supabase service-role access is backend-only.

## Admin Actions

- Mission Control may eventually trigger SmartBites admin actions, but those actions must have reviewable logs and clear confirmation for destructive or production-impacting operations.

## Verification

- Test with realistic restaurant/menu examples.
- Check empty, partial, conflicting, and stale data states.
- Prioritize user safety for allergen-related flows.
