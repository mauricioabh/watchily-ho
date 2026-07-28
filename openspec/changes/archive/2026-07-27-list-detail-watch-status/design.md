## Context

My Library (`/library`) loads `user_title_statuses` into a `statusMap` and passes `showWatchStatus` / `watchStatus` / `onWatchStatusChange` into `TitleTile`. List detail (`/lists/[id]` → `ListTitlesContent`) renders `TitleTile` without those props (`showWatchStatus` defaults to false).

`TitleTile` and `WatchStatusControls` already support the UI; this change wires the same data path into list detail.

## Goals / Non-Goals

**Goals:**
- Parity of Watching/Finished tile controls between My Library and `/lists/[id]`
- Reuse existing table, API, and components

**Non-Goals:**
- Watching/Finished filter chips on list detail
- Enabling watch-status on Search / Popular / All Titles tiles
- Schema or API changes

## Decisions

1. **Server-side statusMap (same as Library)**  
   Fetch `user_title_statuses` in `lists/[id]/page.tsx` and pass `statusMap` into `ListTitlesContent`.  
   Alternative: client fetch via `/api/watch-status?ids=…` — more round-trips and diverges from Library.

2. **Optimistic local state in `ListTitlesContent`**  
   Mirror `LibraryContent`'s `handleStatusChange` so toggles update UI without a full refresh.

3. **Opt-in prop stays**  
   Keep `showWatchStatus` default false; only list detail (and Library) opt in. Avoids changing discovery grids in this change.

## Risks / Trade-offs

- [Full user status map on one list] → Same approach as Library; list pages are already auth-gated and small. Acceptable.
- [Status stale after toggle elsewhere] → Same as Library until navigation refresh; no new risk.

## Migration Plan

- Deploy frontend only; no DB migration.
- Rollback: revert list detail wiring; Library unaffected.

## Open Questions

- None for this scope. Broader tile coverage (Search etc.) deferred.
