## Why

The search page wastes vertical space on empty-state copy ("Search" / "Type a title above…") and keeps platform filters as a permanent horizontal bar. Users need filters (platforms + movie/series) without cluttering the first viewport—especially on PWA mobile.

## What Changes

- Remove the empty-state heading and helper copy on `/search` so popular results start closer to the search bar.
- Add a filter icon next to the search controls that opens a bottom-sheet drawer.
- Move platform filters into that drawer (instant apply on tap; reuse existing `useProviderFilter` persistence).
- Add Movies / Series toggle badges in the same drawer (multi-select: both or neither = all types; one alone = filter).
- Apply filters to both the popular browse grid and search results (type via search API; platforms client-side for results, existing popular API for browse).
- Show an active-filter indicator on the filter icon when platforms are narrowed or a single type is selected.

## Capabilities

### New Capabilities

- `search-filters`: Search page filter drawer (platforms + type badges), empty-state declutter, and filter application to popular browse and search results.

### Modified Capabilities

- (none)

## Impact

- UI: `src/components/search-content.tsx`, `src/components/popular-infinite-grid.tsx`, new sheet/drawer UI helper, possible small reuse of `ProviderFilterBar`.
- API: search already supports `?type=`; client will pass it. No schema change required unless we extend to multi-type query params (prefer client/API single-type or omit).
- Dependencies: build bottom sheet on existing `@radix-ui/react-dialog` (no new package unless needed).
- Surfaces: web + PWA production at `/search`.
