## Context

See proposal.md — Why. Today `getTitleDetails` prefers Watchmode with `append_to_response=sources` and only falls through to SA on Watchmode failure. For MX, Watchmode “succeeds” with US sources after `toWatchmodeRegion` remap. Watchmode details payloads include `imdb_id` / `tmdb_id` (verified for Bee Movie). SA accepts IMDb (`/shows/tt…`) or TMDB (`/shows/movie/{id}`). Free SA quota is ~1000 req/month (direct) — hard limit.

## Goals / Non-Goals

**Goals:**

- Region-correct subscription sources for countries not enabled on the Watchmode plan (starting with MX).
- Preserve Watchmode for search/autocomplete/list/metadata.
- Survive SA quota via longer fetch + DB cache TTLs.
- Rollback via env feature flag.

**Non-Goals:**

- Matching JustWatch web freshness (catalog sync lag).
- Replacing Watchmode for search.
- TMDB watch/providers as availability source.
- JustWatch scraping or Partner API.
- Upgrading Watchmode paid plan.

## Decisions

1. **Gate by plan-enabled set, not “Watchmode HTTP success”**  
   Maintain `WATCHMODE_PLAN_ENABLED_REGIONS` (verified: US, CA, GB, AU, BR, ES, IN). If `country` ∉ set → fetch sources from SA only (after resolving IMDb/TMDB from Watchmode details without `regions`/sources, or from existing details fields).  
   *Alt:* Always merge Watchmode+SA — wastes quota and mixes US noise.

2. **ID bridge Watchmode → SA**  
   Call Watchmode details (metadata) → read `imdb_id` preferred, else `tmdb_id` + type → SA show endpoint. Keep UnifiedTitle `id` as Watchmode string for app URLs.  
   *Alt:* Switch app IDs to IMDb — large **BREAKING** surface.

3. **SA auth: direct first, RapidAPI fallback**  
   `MOVIEOFTHENIGHT_API_KEY` → `https://api.movieofthenight.com/v4` + `X-API-Key`. Else existing RapidAPI key/host.  
   *Alt:* RapidAPI only — half the free quota.

4. **Cache both layers at ~24h for SA-backed availability**  
   Next `revalidate: 86400` on SA fetches; treat `title_availability_cache.refreshed_at` as fresh for 24h on enrich/read paths (skip external call if fresh). Cron still refreshes oldest rows but capped.  
   *Alt:* Keep 1h — burns SA quota.

5. **Feature flag `AVAILABILITY_SA_UNSUPPORTED_REGIONS=1` (default on in prod once validated)**  
   When off, restore previous Watchmode-first behavior for emergency rollback.

6. **Attribution**  
   When SA sources are shown, include movieofthenight attribution per their ToS (footer or title providers block).

## Risks / Trade-offs

- [SA lag vs JustWatch] → Expected; optional JustWatch outbound link; do not claim parity.
- [SA missing Disney for Bee Movie today] → Still correct behavior vs US Netflix remap; monitor over days.
- [Quota exhaustion] → 24h cache + Inngest only watchlist/stale rows; log SA call counts.
- [Wrong gate sends US users to SA] → Flag + instrument path; whitelist only verified plan regions.
- [Direct key missing in Vercel] → Fallback RapidAPI; document required env for prod MX fix quality.

## Migration Plan

1. Deploy code with flag default **on** after local smoke (or off first if key missing — prefer on once `MOVIEOFTHENIGHT_API_KEY` or RapidAPI works for MX).
2. Set Vercel env `MOVIEOFTHENIGHT_API_KEY` (and flag).
3. Smoke: `/title/145946` as MX user — sources must not be Watchmode-US Netflix-only remap path; expect SA MX payload.
4. Rollback: set flag off / remove SA routing env → previous behavior.

## Open Questions

- Whether to show JustWatch link in v1 UI (optional task; can ship without it).
