## 1. Shared contracts and cache primitives

- [x] 1.1 Define the shared interaction-state types, `loadedTitleIds` semantics, and the maximum batch size of 100 without changing existing singular response types.
- [x] 1.2 Add canonical title-ID normalization, deduplication, chunking, and response-map merge helpers; cover blanks, duplicates, ordering, and over-limit inputs with unit tests.
- [x] 1.3 Add batch React Query key builders for watch status and list membership containing the authenticated user scope and canonical ID set, while retaining the existing singular key builders.
- [x] 1.4 Add unit tests proving equivalent ID orderings share a key, different users remain isolated, and a missing title entry is distinguishable from an unresolved batch.

## 2. Authenticated batch read APIs

- [x] 2.1 Update `GET /api/watch-status` to normalize and deduplicate `ids`, enforce the 100-ID request limit, preserve the existing `{ statuses }` shape, and keep PUT/DELETE behavior unchanged.
- [x] 2.2 Update `GET /api/lists/items` to accept plural `title_ids` as well as singular `title_id`, return the established `listIdsByTitle` shape, enforce the same bound, and preserve singular URL behavior.
- [ ] 2.3 Verify both batch routes use the session-bound Supabase client, explicit user ownership filtering, and no service-role bypass; add RLS/integration coverage for own, other-user, public, missing, and unauthenticated state.
- [x] 2.4 Extend the shared API schemas/OpenAPI document and route contract tests for plural membership reads, bounded inputs, response omissions, and backward-compatible singular reads.
- [x] 2.5 Implement cache-aside Upstash loaders for user-scoped Library catalog and status data with versioned keys, a 15-minute TTL, payload validation, lazy initialization, and transparent Supabase fallback.
- [x] 2.6 Centralize exact Library cache invalidation after list CRUD/reorder/item mutations and status upsert/delete, ensuring invalidation runs only after successful writes.

## 3. Page-scoped interaction adapter and hydration

- [x] 3.1 Implement the shared client adapter that seeds server state, queries unresolved IDs in bounded batches, merges responses, exposes per-title loading/error state, and requests only newly discovered IDs for infinite lists.
- [x] 3.2 Derive Library membership state from the `list_items` rows already read by `src/app/library/page.tsx`, pass it with the existing status map, and mark absent values as loaded rather than unresolved.
- [x] 3.3 Wire `ListTitlesContent` to reuse its server status state and load one shared membership batch for unique titles when initial memberships are unavailable.
- [x] 3.4 Wire search results and `PopularInfiniteGrid` to share interaction state at grid scope, including incremental loading when an infinite-scroll page adds IDs; keep `/popular` and `/lists/all` route behavior unchanged.
- [x] 3.5 Pass the resolved per-title interaction slice into every `TitleTile`, including repeated title occurrences in Library, and define neutral/loading/error presentation without singular fallback requests.
- [x] 3.6 Keep Library's first render independent from Redis writes, start independent server reads together, and hydrate pending title metadata in bounded concurrent groups so sections become usable progressively.

## 4. Card reads and mutation behavior

- [x] 4.1 Make `WatchStatusControls` prefer supplied/shared state and suppress its singular query while a page batch is pending; retain singular fallback only for genuinely standalone use.
- [x] 4.2 Make `BookmarkDialog` enable membership loading only after opening when no seeded state exists, and apply the same closed-dialog guard to `TitleActions`.
- [x] 4.3 Add targeted cache update helpers that update the affected title across matching batch and singular status/membership entries, including duplicate rendered cards.
- [x] 4.4 Replace broad watch-status and membership invalidation with targeted updates plus scoped correctness invalidation; retain list metadata invalidation and existing Sonner, optimistic, rollback, and refresh fallback behavior.
- [x] 4.5 Preserve EN/ES loading, error, retry, and mutation feedback copy and verify the React TV surface uses the same safe card behavior without changing standalone TV HTML routes.

## 5. Behavioral and regression coverage

- [x] 5.1 Add unit tests for batch normalization/chunking, response merging, loaded-empty semantics, canonical query keys, duplicate-title mapping, and targeted mutation updates.
- [ ] 5.2 Add component/integration tests proving a grid with N cards makes bounded page-level requests, repeated IDs are queried once, server-seeded Library state makes zero equivalent reads, and closed bookmark dialogs make no membership request.
- [ ] 5.3 Add integration tests for batch API status codes, response contracts, 100-ID boundaries, malformed inputs, RLS isolation, and singular URL compatibility.
- [ ] 5.4 Add Playwright coverage for authenticated Library, search, popular/infinite append, single-list detail, and both EN/ES routes, asserting shared controls, loading/error recovery, duplicate-title consistency, and no per-card request fan-out.
- [ ] 5.5 Add or update TV browser coverage for `/tv` and the hosted standalone routes, confirming navigation and rendering remain compatible and that no locale or auth rewrite regresses.
- [ ] 5.6 Add cache tests for Library Redis hit/miss, TTL expiry, malformed/unavailable Redis fallback, per-user isolation, and every mutation invalidation path.

## 6. Documentation and verification

- [x] 6.1 Document the plural membership query, batch limit, response semantics, browser/server cache layers, Library TTL/invalidation, and singular compatibility in the API/README documentation without documenting private data or secrets.
- [ ] 6.2 Run lint, typecheck, unit tests, RLS/integration tests, and Playwright tests; resolve regressions in localization, auth, cache isolation, or mutation feedback.
- [x] 6.3 Run `npm run build` and `openspec validate --changes --strict`, confirming the change and all affected application contracts are ready for release.
