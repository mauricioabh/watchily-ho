## 1. UI primitives

- [x] 1.1 Add bottom-sheet `Sheet` (or Dialog-based) component styled for mobile/PWA
- [x] 1.2 Ensure sheet has accessible title ("Filtros") and close affordance

## 2. Search page chrome

- [x] 2.1 Remove empty-state "Search" heading and "Type a title above…" copy from `SearchContent`
- [x] 2.2 Add filter icon button next to search controls with active-filter indicator
- [x] 2.3 Wire icon to open bottom sheet containing type badges + platform chips

## 3. Filter state and application

- [x] 3.1 Lift `useProviderFilter` to `SearchContent`; pass active IDs into popular grid; hide inline `ProviderFilterBar` under search
- [x] 3.2 Add Movies/Series toggle badges (both/neither = all; exactly one = that type)
- [x] 3.3 Pass effective `type` to `/api/titles/search` when searching; client-filter search results by active platforms
- [x] 3.4 Client-filter popular titles by effective type (in addition to existing provider filter)

## 4. Verify

- [x] 4.1 Smoke-check `/search` empty + with query: sheet open/close, filters update grids, indicator reflects state
- [x] 4.2 `npm run build` succeeds
