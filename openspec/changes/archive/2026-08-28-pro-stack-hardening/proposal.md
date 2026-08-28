## Why

Watchily has grown several client-side stateful surfaces, multiple optional and secret API integrations, and a mixed English/Spanish UI without a shared application foundation. Centralizing environment validation, product telemetry, feedback, URL state, server-state caching, and localization will reduce configuration failures and make search, library, and account flows consistent across web and TV.

## What Changes

- Add type-safe validation and documentation for server, client, optional, and feature-gated environment variables.
- Add PostHog analytics in the existing Watchily project with the shared `app:wat` event context and privacy-safe product events.
- Add a global Sonner toast surface and success/error feedback for user mutations.
- Add typed URL state for search and library filters without exposing private API data.
- Add TanStack Query for client-side search, paginated popular titles, enrichment, and mutation invalidation while preserving server-rendered initial data.
- Add English and Spanish localization with a stable locale strategy covering metadata, navigation, authentication, library, search, settings, and TV-compatible routes.
- Preserve existing Supabase auth, Sentry, Upstash rate limiting, Inngest, streaming-provider routing, and TV rewrites.

## Capabilities

### New Capabilities

- `validated-environment`: Type-safe, privacy-aware validation and documentation of application environment variables.
- `product-analytics`: Privacy-safe PostHog initialization, identity lifecycle, app tagging, and minimum product event contract.
- `mutation-feedback`: Consistent toast feedback for successful and failed user mutations.
- `url-state-and-server-cache`: Typed URL filter state and client server-state caching for search, library, and title data.
- `application-localization`: English and Spanish translations, locale selection, localized routing, metadata, and TV compatibility.

### Modified Capabilities

- None.

## Impact

- Root layout and client provider composition.
- Existing middleware/proxy behavior, including TV rewrites and authentication session refresh.
- Search, popular titles, library, title actions, lists, settings, authentication, and push components.
- `src/lib/streaming`, Supabase server/client access, and environment reads.
- `package.json` and lockfile with the selected dependencies.
- `.env.local.example`, README, and localization/analytics documentation.
- New unit, component, integration, and Playwright coverage where behavior changes.
- Vercel environment configuration and local developer setup.
