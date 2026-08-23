## 1. Fast boot (A+C server)

- [x] 1.1 Set PWA `start_url` to `/library`
- [x] 1.2 Refactor `library/page.tsx` to build sections from list_items + `title_availability_cache` (no blocking Watchmode)
- [x] 1.3 Pass `pendingTitleIds` into `LibraryContent`

## 2. Client enrich (B)

- [x] 2.1 Add `POST /api/library/titles/enrich` (cache-first, Watchmode miss, upsert cache)
- [x] 2.2 Client batch-enrich pending titles and merge into sections
- [x] 2.3 Keep pending tiles visible (bypass provider filter until `sources` defined); skeleton UI for incomplete titles

## 3. Filter drawer UI

- [x] 3.1 Add `TypeFilter` (all/movie/series) composing with status/find/sort
- [x] 3.2 Toolbar: icon-only `+` and filters toggle; collapsible drawer with find, sort, expand/collapse, status, type, providers
- [x] 3.3 Empty-library toolbar matches the same `+` / filters pattern where applicable

## 4. Ship

- [x] 4.1 Typecheck / lint touched files
- [ ] 4.2 Commit, push, verify Vercel production deploy
