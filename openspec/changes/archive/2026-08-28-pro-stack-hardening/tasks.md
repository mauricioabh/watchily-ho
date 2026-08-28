## 1. Foundation and configuration

- [x] 1.1 Add the selected runtime dependencies and regenerate the lockfile without changing unrelated dependency versions
- [x] 1.2 Create typed public/server environment schemas with required, optional, paired, and feature-gated validation
- [x] 1.3 Migrate Supabase, streaming, rate-limit, Inngest, Push, SEO, and Sentry configuration reads to the validated environment boundary where safe
- [x] 1.4 Add the shared client provider composition with theme, query, URL-state, analytics, and toast boundaries

## 2. Product analytics and mutation feedback

- [x] 2.1 Initialize PostHog opt-in for the Watchily project and implement Supabase identity lifecycle with `app:wat` context
- [x] 2.2 Add the bounded product event wrapper and instrument authentication, search, title/link, list, status, library-filter, and settings actions
- [x] 2.3 Add global Sonner configuration and success/error feedback to all user mutation flows
- [x] 2.4 Add unit/component coverage for analytics payload redaction and truthful mutation feedback

## 3. URL state and server-state caching

- [x] 3.1 Define typed URL parsers and migrate Search query/type/provider state with history-safe updates
- [x] 3.2 Migrate Library query/type/status/sort state to URL-backed state while preserving persisted preferences
- [x] 3.3 Add TanStack Query client/server helpers and seed initial server-rendered data without duplicate requests
- [x] 3.4 Migrate popular pagination, search, enrichment, title status, likes, and list membership to keyed queries/mutations
- [x] 3.5 Add cache isolation/invalidation tests for filters, mutations, and auth changes

## 4. English and Spanish localization

- [x] 4.1 Add next-intl routing/request configuration, locale messages, and `en`/`es` locale selection with English-compatible default URLs
- [x] 4.2 Move page routes and route-level metadata into the locale-aware tree and localize navigation links
- [x] 4.3 Translate application-owned content across auth, search, title, library, lists, settings, onboarding, errors, loading, and accessibility labels
- [x] 4.4 Compose locale middleware with Supabase auth and preserve API, auth callback, OpenAPI, assets, and TV standalone exclusions
- [x] 4.5 Add locale switcher, localized metadata/canonical/alternate links, and Spanish route coverage
- [x] 4.6 Add English/Spanish web and TV Playwright smoke coverage and fix hydration or navigation regressions

## 5. Documentation and verification

- [x] 5.1 Update `.env.local.example`, README, and integration documentation with all variables, scopes, locale behavior, analytics events, and provider boundaries
- [x] 5.2 Run lint, typecheck, unit tests, and Playwright tests; add or correct tests for every changed requirement
- [x] 5.3 Run production build and OpenSpec verification, resolving all critical failures
