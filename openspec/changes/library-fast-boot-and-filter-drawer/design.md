## Context

See proposal.md. Today `LibraryData` batches `getTitleDetails` (Watchmode) for every unique list item before rendering. `title_availability_cache` exists but is unused on library read. SW caches navigations/API/posters but cannot help while the RSC blocks on external APIs. Provider filter drops titles with no `sources`, so stubs must stay visible until enriched.

## Goals / Non-Goals

**Goals:**
- Sub-second perceived library shell for authenticated PWA open
- Cache-first hydration; client enrich for misses
- Compact toolbar + collapsible filter drawer with live list updates

**Non-Goals:**
- RSC streaming / React progressive SSR
- IndexedDB snapshot layer (SW + DB cache is enough for v1)
- Persisting type filter in profiles (local UI state / session is enough)

## Decisions

1. **Server returns stubs + cache hits only**  
   Build `UnifiedTitle` from `list_items.title_type` + cache `payload` when present. Pass `pendingTitleIds` to the client.  
   *Alt considered:* Keep blocking enrich — rejected (current pain).

2. **`POST /api/library/titles/enrich`**  
   Body `{ ids: string[] }`. For each id: read cache → else Watchmode → upsert cache → return details. Client batches (~8).  
   *Alt:* Enrich only on server via `router.refresh` — slower UX.

3. **Pending titles bypass provider filter**  
   Treat `sources === undefined` as pending; keep tile. After enrich, apply provider filter as today.

4. **Type filter client-only**  
   `TypeFilter = "all" | "movie" | "series"` in component state (optional localStorage). No DB migration.

5. **Drawer = collapsible panel**  
   `filtersOpen` state; panel under toolbar with `max-h` + internal scroll; list remains below. No new Sheet dependency required.

6. **`start_url: "/library"`**  
   Library page already redirects unauthenticated users.

## Risks / Trade-offs

- [First visit empty cache] → Many skeletons until enrich; mitigated by batching + showing list chrome immediately  
- [Stale cache] → Existing Inngest refresh; enrich can overwrite on miss path  
- [Provider filter hides titles after enrich] → Same as today; expected  

## Migration Plan

- Deploy web only; no schema change required  
- Rollback: revert manifest + library page + enrich route + LibraryContent UI  

## Open Questions

- None blocking implementation
