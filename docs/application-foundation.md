# Application foundation

This document describes the shared runtime boundaries added by the
`pro-stack-hardening` change. Keep values out of source control and use
`.env.local.example` as the local configuration template.

## Environment variables

The application validates runtime configuration in `src/env.ts`. Empty values
are treated as unset. A `NEXT_PUBLIC_` variable is available to browser
bundles; all other application variables are server/build-only.

### Required public configuration

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL. Required by the web
  client, server session helpers, and middleware.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key. Required
  by the web client and safe to expose as public configuration.

### Optional public configuration

- `NEXT_PUBLIC_SITE_URL` — canonical/SEO site origin. Optional; the app URL is
  used as a fallback.
- `NEXT_PUBLIC_APP_URL` — origin used in server-generated redirects and
  standalone links. Optional; production Watchily is used as a fallback.
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` —
  optional PostHog pair. PostHog remains disabled unless both are present and
  valid.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — optional browser-side Web Push key. Push UI
  remains unavailable without it.

### Optional server-only configuration

- `SUPABASE_SECRET_KEY` — secret Supabase key for trusted
  `createAdminClient()` operations only. It is not needed by ordinary
  authenticated API routes and must never be sent to a browser.
- `MOVIEOFTHENIGHT_API_KEY` — preferred direct Streaming Availability
  credential.
- `STREAMING_AVAILABILITY_API_KEY` — RapidAPI Streaming Availability
  credential.
- `RAPIDAPI_KEY` — compatibility alias for the RapidAPI Streaming Availability
  credential.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — optional pair for
  authenticated search rate limiting. The integration is disabled when the
  pair is incomplete.
- `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` — optional pair for Inngest
  background jobs. Jobs are disabled when the pair is incomplete.
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` — server-side Web Push key pair.
  They must be complete together; the private key is never public.
- `VAPID_SUBJECT` — optional Web Push contact address (`mailto:` or `https:`).
- `SENTRY_DSN` — optional Sentry DSN. Sentry is disabled when absent.
- `SENTRY_ORG` — optional Sentry organization used by build upload settings.
- `SENTRY_PROJECT` — optional Sentry project; defaults to `watchily-ho`.

### Flags and platform-provided values

- `WATCHMODE_API_KEY` — required server-only primary streaming credential.
- `AVAILABILITY_SA_FOR_UNSUPPORTED_REGIONS` — optional server-only routing
  flag. `1`, `true`, or `on` enables the secondary provider for regions not
  covered by Watchmode; `0`, `false`, or `off` rolls back to Watchmode-only.
  The default is enabled.
- `VERCEL_URL`, `VERCEL_ENV`, and `VERCEL_GIT_COMMIT_REF` — optional values
  supplied by Vercel for deployment-aware URL and environment behavior.
- `OMNI_ALLOW_PREVIEW_INDEX` — optional `true`/`false` indexing override for
  preview deployments.
- `NODE_ENV` — framework-managed shared value (`development`, `test`, or
  `production`); do not commit a local override.

The runtime schema intentionally excludes database-test variables. RLS tests
may additionally read `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` or
`SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_DB_URL` or `DB_URL`, and `JWT_SECRET`. These are test/script inputs,
not browser configuration, and their values must remain local or managed by
CI.

`CI`, `ANALYZE`, `PW_FRESH_SERVER`, and Next.js's `NEXT_RUNTIME` are tooling or
platform switches, not application integrations. `CI` enables CI Playwright
behavior, `ANALYZE=true` enables the bundle analyzer, and
`PW_FRESH_SERVER=true` prevents Playwright from reusing a local server.

## Provider composition

`src/components/app-providers.tsx` is the single client provider boundary
consumed by the root layout. Its order is intentional:

1. `ThemeProvider` supplies the dark theme.
2. `QueryClientProvider` supplies one browser `QueryClient` singleton.
3. The auth boundary observes Supabase identity changes and clears the query
   cache when the user changes.
4. `NuqsAdapter` enables typed URL state for App Router pages.
5. `PostHogBoundary` initializes analytics once and synchronizes identity.
6. The global Sonner `Toaster` renders mutation feedback inside the theme.

Server-only data access stays in server components and API routes. Client
components use the authenticated API contract and do not receive server
credentials.

## Analytics contract

PostHog initializes only in the browser when both public PostHog variables are
configured. Autocapture, automatic pageviews, and session recording are
disabled. Authenticated identity uses the Supabase user ID only; sign-out
resets the anonymous identity.

Every event includes:

- `app_tag: "app:wat"` — the stable Watchily application identifier.
- `surface` — `web` or `tv` when the surface can be determined.

The bounded event wrapper currently supports:

- `auth_completed` (`method`, `flow`)
- `search_submitted` (`query_length`, `type`, `provider_count`)
- `title_viewed` (`title_type`)
- `streaming_link_clicked` (`provider`, `offer_type`)
- `list_membership_changed` (`action`, `title_type`)
- `watch_status_changed` (`status`)
- `library_filter_changed` (`filter`, bounded `value`)
- `settings_saved` (`country`, `provider_count`)

Payloads are allowlisted and bounded. Raw search text, email addresses,
passwords, list names, provider URLs, and API response data are not captured.
Adding an event requires extending the TypeScript union, its allowlist, and
the focused analytics test.

## Provider composition for streaming

Watchmode is the required primary search/metadata provider. For regions where
Watchmode is not plan-enabled, the unified streaming layer uses
`MOVIEOFTHENIGHT_API_KEY` first and then the RapidAPI fallback
(`STREAMING_AVAILABILITY_API_KEY` or `RAPIDAPI_KEY`) when
`AVAILABILITY_SA_FOR_UNSUPPORTED_REGIONS` is enabled. These credentials are
server-only. The provider layer returns the same unified title/source shape to
the UI and never exposes API keys.

## URL state and TanStack Query

Search state is URL-backed with `q`, `type`, and `providers`. Library state is
URL-backed with `query`, `type`, `status`, and `sort`. Parsers accept only
supported values, preserve unrelated query parameters, and allow browser
back/forward and shared URLs to reproduce a view. Persisted profile
preferences remain separate and are used when the corresponding URL parameter
is absent.

TanStack Query v5 is used for client-owned remote state. Query keys include
every response-affecting input (country, type, providers, query, pagination)
and the authenticated user scope where applicable. Server-rendered initial
data is reused to avoid a duplicate first request. Likes, watch status, list
membership, enrichment, search, and popular-title mutations update or
invalidate affected queries. Auth changes clear user-scoped cached data before
another user can observe it.

Dense title grids use page-scoped interaction batches of at most 100 unique
IDs. The Library server loader additionally uses a server-only, user-scoped
Upstash Redis cache-aside snapshot with a 15-minute TTL for assembled catalog
and status data. List membership/order and watch-status writes invalidate the
corresponding snapshot; Redis misses, malformed values, or outages fall back
to the authenticated Supabase path.

## Localization and routing

The supported locales are `en` and `es`, configured with
`localePrefix: "as-needed"`. Existing unprefixed page URLs are English by
default; Spanish uses `/es` (for example `/es/search` and `/es/title/<id>`).
Unsupported locale values fall back to English. The locale switcher preserves
the current page, route parameters, and supported query string.

Page content, navigation, metadata, loading/error states, and accessibility
labels use the active locale. Spanish pages emit Spanish metadata plus
canonical and alternate locale links. API routes, auth callbacks, OpenAPI,
static assets, and server-to-server contracts remain at their existing
unlocalized paths. The hosted `/tv` URL remains English-compatible; an
explicit `/es/tv` route is available for the localized TV surface.
