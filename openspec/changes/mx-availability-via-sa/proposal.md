## Why

Users in Mexico (default country) see US streaming catalogs because Watchmode Free Plan legacy does not enable MX (`plan_enabled: false`); `toWatchmodeRegion` remaps MX→US to avoid API 400s. That makes titles like Bee Movie show Netflix (US) instead of MX providers. We need correct **regional** availability without paying Watchmode Startup, while keeping Watchmode for search/metadata.

## What Changes

- Route **availability** through Streaming Availability (SA / movieofthenight) when the user's country is not enabled on the Watchmode plan (e.g. MX); keep Watchmode for search/IDs/posters.
- Prefer SA **direct** API key (`api.movieofthenight.com/v4`) over RapidAPI; keep RapidAPI as fallback.
- Align Watchmode region whitelist with the verified plan-enabled set (`US, CA, GB, AU, BR, ES, IN`).
- Lengthen availability caching (Next `revalidate` + DB `title_availability_cache` freshness) to respect SA monthly quota (~1000).
- Optional: outbound JustWatch link as a “fresher source” hint (no scraping).
- Feature flag for safe rollback of SA-first availability routing.

This fix addresses **region correctness**, not catalog freshness vs JustWatch web (SA/TMDB can still lag new Disney+ adds).

## Capabilities

### New Capabilities

- `regional-availability-routing`: Choose Watchmode vs SA for subscription/rent/buy sources based on whether the country is enabled on the Watchmode plan; map Watchmode title ids to IMDb/TMDB for SA lookups; attribute SA when shown publicly.

### Modified Capabilities

- (none — no existing openspec capability covers this routing)

## Impact

- `src/lib/streaming/unified.ts`, `watchmode.ts`, `streaming-availability.ts`
- Callers of `getTitleDetails` (title page, search enrich, library enrich, Inngest refresh)
- Env: `MOVIEOFTHENIGHT_API_KEY` (new), `STREAMING_AVAILABILITY_API_KEY` (fallback), optional flag env
- Supabase `title_availability_cache` read/write freshness policy
- `.env.local.example` / Vercel env for production test
