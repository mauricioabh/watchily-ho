## Why

Library is the heaviest surface: it loads all of a user's list titles in one server-rendered view, while search/popular discovery and list views also render many `TitleTile` instances. Interaction state is currently fetched by each tile, creating one watch-status request and one list-membership request per title, with duplicate work when a title appears in multiple library sections, and the closed bookmark dialog performs network I/O. Because Library changes only when list membership/order or watch status changes, it is also a good candidate for an explicitly invalidated server-side cache in addition to client batching.

## What Changes

- Add page/list-scoped loading of watch statuses and list memberships using deduplicated title IDs and bounded batches.
- Reuse the server-rendered library status and `list_items` data as initial interaction state wherever it is already available.
- Add a cache-aside L2 for the assembled, user-scoped Library data using the existing Upstash Redis integration, with a bounded TTL, explicit invalidation after relevant mutations, and transparent fallback when Redis is unavailable.
- Extend the list-membership read contract to accept multiple `title_ids` while preserving the existing singular `title_id` URL contract, or expose an equivalent interaction-state read contract if required by implementation constraints.
- Make `TitleTile`, `BookmarkDialog`, and `WatchStatusControls` consume provided/cached interaction state instead of issuing one request per card; membership reads SHALL wait until the bookmark dialog is open when no page-level state exists.
- Keep React Query as the browser L1 cache, scoped by authenticated user and the complete title-ID set, with a 60-second stale window and targeted updates for the title affected by a successful mutation.
- Preserve Sonner success/error feedback, optimistic updates with rollback or refresh fallback, Supabase Auth, RLS, EN/ES routes, existing API URLs, and TV-compatible surfaces.
- Add bounded batch validation, deduplication, loading/error fallback states, and unit, integration, and Playwright coverage for request counts and duplicate titles.

## Capabilities

### New Capabilities

- `batched-interaction-state`: Provides observable, authenticated batch reads and page-scoped delivery of per-title watch status and list membership state.

### Modified Capabilities

- `url-state-and-server-cache`: Client interaction state is keyed and hydrated at page/list scope rather than fetched independently by every tile.
- `watch-status`: Existing multi-ID status reads are bounded, deduplicated, and consumed by tiles without fallback requests when state was provided.
- `library-ia`: Library, search/popular, all-list, and single-list surfaces share interaction state across repeated title cards while retaining existing route behavior.
- `mutation-feedback`: Successful interaction mutations update only the affected title entry and preserve existing optimistic, rollback, toast, and invalidation guarantees.

## Impact

- Affected client components: `TitleTile`, `WatchStatusControls`, `TitleActions`, `library-content`, `list-titles-content`, `search-content`, and `popular-infinite-grid`.
- Affected server pages: `/library`, `/lists/[id]`, and the search/popular entry points that render title grids.
- Affected API contract: batched reads for `/api/watch-status` and `/api/lists/items`; singular URLs and mutation endpoints remain compatible.
- Affected shared query-key/types, the Library server data loader, the existing Upstash Redis integration, and tests, plus OpenAPI/API documentation if the membership contract is extended there.
- No database schema, migration, RLS policy, authentication model, locale route, TV standalone endpoint, or streaming-provider contract changes are required.
