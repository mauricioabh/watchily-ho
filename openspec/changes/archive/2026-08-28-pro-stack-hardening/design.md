## Context

See proposal.md for motivation. The application uses the Next.js App Router with a server-rendered root layout, client components for search and library interactions, Supabase cookie auth, direct browser fetches to authenticated API routes, Sentry instrumentation, and custom middleware rewrites for TV user agents. Streaming credentials are server-only and availability is already split between Watchmode and Streaming Availability.

## Goals / Non-Goals

**Goals:**

- Establish one client provider composition point without moving server-only data access into the browser.
- Preserve existing root URLs and TV behavior while adding `/es` as the Spanish URL namespace.
- Make optional integrations safe when disabled and make required configuration failures actionable.
- Keep analytics bounded, product-oriented, and free of credentials or raw user-entered content.
- Adopt client caching incrementally, reusing existing server-rendered data rather than duplicating requests.
- Make mutation feedback truthful and consistent across web and TV-compatible components.

**Non-Goals:**

- Replacing Supabase auth, Sentry, Upstash, Inngest, or the existing streaming providers.
- Rewriting every server component into client-side queries.
- Capturing raw search terms, emails, list names, passwords, provider URLs, or API payloads in analytics.
- Translating API response bodies or third-party provider content.
- Localizing API, auth callback, OpenAPI, static asset, or server-to-server URLs.
- Adding a third locale or introducing runtime translation management.

## Decisions

### Provider composition

Create a client-side application provider boundary consumed by the root layout. Keep `ThemeProvider`, the Query client provider, `NuqsAdapter`, PostHog integration, and the global Sonner toaster in that boundary. The toaster stays inside the theme boundary so it follows the dark UI. Use one browser QueryClient singleton and one PostHog initialization path.

Alternative considered: placing each provider directly in `layout.tsx`. This makes ordering and future removal harder and mixes server-layout concerns with browser-only initialization.

### Environment validation

Use `@t3-oss/env-nextjs` with distinct server and public schemas, `emptyStringAsUndefined: true`, and explicit optional integration groups. Required Supabase and primary streaming values fail validation; optional integrations are disabled when their complete configuration is absent. Application code migrates from direct `process.env` reads to the validated environment boundary over time.

Do not place test-only Supabase database variables in the runtime application schema. Do not use a blanket validation bypass in production.

Alternative considered: validating every variable as required. That would make local development and deployments fail for intentionally optional Sentry, Inngest, Push, Upstash, PostHog, and fallback-provider features.

### PostHog contract

Use the existing Watchily PostHog project through `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`. Initialize on the client only, identify with the Supabase user ID, reset on sign-out, and attach `app_tag: "app:wat"` through a small analytics wrapper. Include only bounded metadata in the event contract.

Alternative considered: server-side capture for every API route. That duplicates Sentry and increases event volume and privacy surface. Server-side PostHog capture remains a later opt-in for specific operational signals.

### URL state and client server state

Use nuqs for query-string state in Search and Library. Keep URL state limited to reproducible view state: query, type, providers, status, and sort. Keep persistent user preferences in Supabase and define precedence explicitly when both are present.

Use TanStack Query v5 for client-owned remote state. Start with search results, paginated popular titles, enrichment, likes, watch status, and list membership. Seed or hydrate from existing server-rendered props so the first page is not fetched twice. Query keys include every response-affecting input and user scope.

Alternative considered: replacing all local state and all RSC fetches at once. This creates a large hydration and auth-cache migration with no product benefit for static server-rendered title details.

### Localization strategy

Use next-intl with two locales, `en` and `es`, and `localePrefix: "as-needed"`: existing unprefixed URLs represent English, while Spanish uses `/es/...`. Move page routes into a locale segment and use localized navigation helpers so query strings and route parameters survive locale changes.

Compose next-intl routing with the current middleware in this order: preserve TV rewrites and excluded contracts, run locale handling for page routes, then run Supabase session refresh. Keep `/api`, `/auth`, `/tv-standalone`, `/search-standalone`, `/lists-standalone`, `/title-standalone`, static assets, and OpenAPI routes outside locale negotiation. Preserve the hosted TV root URL; default TV remains English, with `/es/tv` available only if the TV surface is intentionally translated.

Use message namespaces by surface (`common`, `auth`, `search`, `library`, `lists`, `settings`, `title`, `tv`, `metadata`) and translate application-owned copy only. Use locale-aware metadata and alternate links. Avoid relying on `next/root-params`, because the project is on Next 16.1.x while that next-intl integration targets newer Next 16 releases.

Alternative considered: cookie-only localization. It minimizes route movement but gives weak shareability, poorer SEO, and ambiguous links. Alternative considered: prefix every locale, but it would unnecessarily break existing production URLs and the TV hosted integration.

### Mutation feedback and cache invalidation

All user mutations use a shared success/error toast convention. A non-2xx response is an error even if the network request resolved. TanStack mutations update or invalidate only affected queries; optimistic updates must have rollback or a refresh fallback.

## Risks / Trade-offs

- [Moving pages under a locale segment touches many imports, links, metadata files, and route params] → Migrate route groups systematically and add route smoke tests for `/`, `/es`, `/search`, `/es/search`, title pages, auth, and TV.
- [Custom TV middleware may conflict with next-intl middleware] → Keep standalone TV paths excluded and test user-agent rewrites before and after locale handling.
- [Hydration can duplicate requests or leak cached user data] → Reuse initial data, include user scope in keys, clear the QueryClient on auth changes, and add browser tests.
- [Strict env validation can break CI or local builds] → Classify variables by required/optional scope, document them, and keep test configuration separate.
- [PostHog can collect sensitive user-entered data accidentally] → Centralize capture, use bounded properties, prohibit raw query/email/password/url fields, and test the event payload.
- [Translations can regress accessibility or metadata] → Translate labels and loading/error states alongside visible copy and test both locales.
- [Sonner may be noisy or unsuitable on TV] → Use a shared toaster configuration and explicitly verify TV visibility before enabling every toast there.

## Migration Plan

1. Add and document the new dependencies and environment schema without changing product behavior.
2. Add provider composition, PostHog opt-in initialization, Sonner, and focused tests.
3. Migrate Search and Library URL state to nuqs.
4. Add TanStack Query incrementally, preserving server-rendered initial data and authenticated API contracts.
5. Add next-intl routing and messages, migrate page links/metadata, then verify TV and auth exclusions.
6. Run typecheck/lint/unit/Playwright/build checks and update README and environment examples.
7. Roll back by removing provider usage and locale middleware while retaining existing API routes; optional integrations remain disabled by removing their public configuration.

## Open Questions

- Whether TV should expose a visible locale switch or remain English-only initially; the route and middleware design supports both without changing the hosted root contract.
