## 1. SA client (direct key)

- [x] 1.1 Update `streaming-availability.ts` to prefer `MOVIEOFTHENIGHT_API_KEY` + `api.movieofthenight.com/v4` (`X-API-Key`); fallback to RapidAPI env
- [x] 1.2 Set SA fetch `revalidate` to 86400; add simple SA request counter/log helper
- [x] 1.3 Update `.env.local.example` / `.env.example` with `MOVIEOFTHENIGHT_API_KEY` and routing flag
- [x] 1.4 Smoke-call SA for `tt0389790` + `country=mx` (document shape / any mapping tweaks)

## 2. Region gate + unified routing

- [x] 2.1 Fix `WATCHMODE_SUPPORTED_REGIONS` / `toWatchmodeRegion` to plan-enabled set `US,CA,GB,AU,BR,ES,IN` + comment to re-audit `/v1/regions`
- [x] 2.2 Add `isWatchmodeAvailabilityRegion(country)` used by routing (same set)
- [x] 2.3 Change `getTitleDetails` to: always get Watchmode metadata; if unsupported region + flag on, replace `sources` from SA via imdb/tmdb bridge; else Watchmode sources as today
- [x] 2.4 Feature flag env (e.g. `AVAILABILITY_SA_FOR_UNSUPPORTED_REGIONS`) default true when unset in code path we choose — document rollback

## 3. Cache + jobs

- [x] 3.1 Enrich / library / refresh: skip external availability fetch when `title_availability_cache.refreshed_at` < 24h for that country
- [x] 3.2 Keep Inngest watchlist + daily cron; do not expand to full-catalog enrich

## 4. UI attribution (+ optional JW link)

- [x] 4.1 Show SA attribution on title page when sources came from SA (marker on UnifiedTitle or heuristic)
- [x] 4.2 Optional: JustWatch outbound link for the title (no scrape)

## 5. Verify + ship

- [x] 5.1 Local/build check: MX Bee Movie path does not use US Netflix-only remap; US path still Watchmode
- [ ] 5.2 Set Vercel env if needed; push; confirm deployment Ready; smoke prod title page
