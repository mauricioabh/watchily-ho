## Why

Opening the installed PWA feels slow: `start_url` hits `/`, auth redirects to `/library`, then the server blocks on Watchmode for every list title before any UI paints. Users want an immediate shell, then progressive fill, plus a cleaner library toolbar (filters in a header drawer; Movie/Series chips).

## What Changes

- PWA `start_url` → `/library` (logged-out users redirect to login from that page).
- Library first paint from Supabase lists/items + `title_availability_cache` stubs; no blocking Watchmode waterfall on the page.
- Client-side batch enrich for cache misses; upsert cache when fetched.
- Library toolbar: `+` icon only; filter icon opens a collapsible drawer under the header so the list stays visible and updates live.
- Drawer holds: find, sort, expand/collapse, status chips, type chips (Movies/Series), provider filter bar.
- Status chips stay: All / Watching / Finished; add Movies / Series (orthogonal type filter).

## Capabilities

### New Capabilities

- `library-fast-boot`: Immediate library shell + cache-first title hydration + client enrich for misses.
- `library-filter-drawer`: Collapsible filter drawer UI and Movie/Series type filter.

### Modified Capabilities

- `library-ia`: Library filters move into a drawer; add Movie/Series type chips; compose with existing status/find/sort.

## Impact

- `src/app/manifest.ts`, `src/app/library/page.tsx`, `src/components/library-content.tsx`
- New API: `POST /api/library/titles/enrich` (cache-first + Watchmode miss)
- Types: `LibraryPrefs` / local type filter; OpenAPI schemas if prefs extend
- `title_availability_cache` read path on library load
- Existing SW continues to help second visits; no RSC streaming
