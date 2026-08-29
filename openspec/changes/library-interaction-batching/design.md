## Context

See `proposal.md` for the motivation and the change contract. The current implementation renders `TitleTile` in Library, search/popular, and list surfaces. Library loads all list sections and titles for the user in one server render, while `WatchStatusControls` starts a singular `/api/watch-status?ids=...` query when its `status` prop is `undefined` and `BookmarkDialog` starts `/api/lists/items?title_id=...` as soon as it mounts, independently of whether its dialog is open.

The library server page already reads all of the user's `user_title_statuses` and all `list_items` for the user's lists. Single-list detail already reads its status rows and list items, but search/popular discovery does not receive interaction state in its initial props. Existing React Query keys are title-scoped, the default stale time is 60 seconds, and mutations currently use Sonner plus broad invalidation. Upstash Redis is already configured for rate limiting, but is not yet used as an application data cache. Private data is accessed through the session-bound Supabase client with RLS.

## Goals / Non-Goals

**Goals:**

- Make interaction reads proportional to unique title IDs per page/list rather than rendered card count.
- Give every duplicate visual occurrence of a title the same status and membership state.
- Avoid rebuilding the expensive Library server payload on ordinary revisits when the user's lists and statuses have not changed.
- Treat an absent status or membership as a known empty value once the relevant batch has loaded.
- Preserve the singular API URLs, mutation contracts, auth behavior, localization, and TV routes.
- Keep loading and error states explicit without creating a fallback N+1 request storm.

**Non-Goals:**

- Changing database tables, indexes, RLS policies, Supabase Auth, or streaming-provider data.
- Batching likes or title metadata; a title detail page still has at most one like/status read.
- Caching each individual interaction API response in Redis or replacing the existing title-availability cache.
- Replacing server-rendered title data with a browser-only data model.
- Changing the visual repetition of a title in separate library sections or changing list ordering.

## Decisions

### 1. Extend the existing membership read contract

The implementation will extend `GET /api/lists/items` to accept `title_ids=<id1>,<id2>,...` in addition to the existing `title_id=<id>` form. Both forms will return the established `listIdsByTitle` map. The plural form will normalize whitespace, deduplicate IDs, and enforce the 100-ID maximum; the singular form will retain its current behavior and URL compatibility. No new endpoint is needed unless the existing route cannot represent the authenticated batch response without a breaking change.

The route will continue to use `getSupabaseAndUser()` and session-scoped Supabase queries. It will first read matching `list_items`, then restrict returned list IDs to lists owned by the current user. It will never use the service-role client for this read and will not return memberships from another user's lists or public lists that the current user does not own.

**Alternative considered:** adding `/api/interaction-state`. A new endpoint could combine statuses and memberships, but it would duplicate two existing contracts, increase OpenAPI and client migration surface, and make singular compatibility less direct. The separate batched reads keep ownership and response shapes clear while still allowing one request per state family per page.

### 2. Cache Library server data in Upstash Redis

Use a cache-aside L2 in the existing server-side Upstash integration for the expensive Library data, not as a replacement for browser batching. Store two user-scoped values:

- `watchily:library:v1:catalog:{userId}:{country}` for list order, list items, unique title IDs/types, and the assembled title payload used by the sections.
- `watchily:library:v1:statuses:{userId}` for the user's valid watch-status map.

The loader must authenticate with Supabase first, derive `userId` from `auth.getUser()`, and never accept a user ID from the request or client. Cache entries use `setex` with a bounded 15-minute TTL, are read and written only on the server, and are treated as an optimization: a Redis timeout or malformed value falls back to the existing session-bound Supabase path. The cache must not bypass the authorization checks that determine which user is allowed to receive the value.

Invalidate the catalog key after list creation, rename, deletion, reorder, or title add/remove. Invalidate the status key after a status upsert/delete. Membership changes invalidate the catalog key because they change both sections and membership-derived state. The page still seeds React Query from the resulting server props, so Redis reduces repeat server/database work while React Query prevents duplicate browser reads. The Library loader starts independent provider, preference, status-cache, and catalog-cache reads together, and cache writes are best-effort so Redis latency does not block the first render. When a catalog contains pending title metadata, the enrichment route hydrates those IDs in bounded concurrent groups and invalidates the catalog after successful hydration; a later visit can then cache and serve hydrated sections instead of repeating the pending snapshot.
On a catalog cache miss, the server returns the list structure and stub cards without performing a second `title_availability_cache` round trip. The browser enrichment route resolves database-cached metadata first and only then calls external providers for missing IDs, updating cards as each bounded batch completes. This keeps list headings, counts, filters, and cached interaction state on the critical response path while title metadata progressively fills in.

**Alternative considered:** caching only the batch API responses. That would help repeated API calls but would not avoid rebuilding the all-titles Library server payload. **Alternative considered:** caching the whole page indefinitely. That risks stale list order and status after mutations; separate keys, explicit invalidation, and a TTL bound the failure mode.

### 3. Use one shared batch size and canonical IDs

Add a shared `MAX_INTERACTION_BATCH_SIZE` of 100. Page-level clients split unique IDs into chunks at or below that limit. Query keys contain the authenticated user scope and a sorted, deduplicated ID list; the same ID set therefore reuses the same React Query entry regardless of card order or list-section order. Responses are merged by title ID, and missing keys are interpreted as known empty state only after their batch succeeds.

Add batch query-key builders alongside the existing singular `watchStatus`, `membership`, and `lists` keys. Existing singular keys remain available for `TitleActions` and compatibility. The shared query client retains its 60-second stale time. A batch query failure is represented in the page-level state and does not cause every card to retry independently.

**Alternative considered:** one query whose key contains every title on every surface. That would refetch a large set whenever infinite scroll appends a page and would reduce cache reuse. Per-batch canonical keys let new popular pages request only new IDs while retaining earlier results.

### 4. Introduce a page-scoped interaction-state adapter

Create a small shared client adapter/hook that accepts:

- unique title IDs for the current page/list;
- optional server-provided status and membership maps;
- the authenticated scope;
- optional enabled state for surfaces that are not mounted/visible.

It will seed successful server-provided values, request only unresolved IDs, merge batch results, and expose `status`, `membership`, `isLoading`, and `isError` state by title. Seeded batches remain observed by React Query even when they do not need a network request, so targeted mutation updates are reflected by duplicate Library cards. It will preserve a `loadedTitleIds` set so a missing map entry is distinguishable from a request that is still pending. For an infinite grid, the adapter will compare the current unique IDs with loaded IDs and enqueue only newly discovered IDs.

`LibraryContent` will build initial membership from the `list_items` relationships already used to create its sections and will pass the initial status/membership state to its tiles. `ListTitlesContent` will reuse its server status map and request one membership batch for the unique visible list titles when no equivalent server map is available. Search results and popular pages will use the adapter at the grid level. `/lists/all` currently redirects to `/library`; the retained `AllTitlesContent` path will use the same adapter if it becomes reachable again.

The adapter will use a neutral/loading control state while a batch is pending and a non-blocking error state with a retry action at the page/dialog level. It will not pass `undefined` as an invitation for each tile to fetch.

**Alternative considered:** adding a `useQuery` to each `TitleTile` with a longer stale time. That still creates one observer and potentially one request per card, does not solve duplicate IDs across sections, and leaves the closed bookmark cost in place.

### 5. Make card reads conditional on supplied state and dialog visibility

`TitleTile` will receive shared interaction state or a resolved per-title slice. `WatchStatusControls` will prefer that slice and will only use its singular query when it is used outside a page-scoped adapter and no resolved state was supplied. When a shared batch is loading, it will render neutral/loading controls without starting a singular fallback query.

`BookmarkDialog` will not enable membership reads based only on mount. If page-scoped membership is supplied, the bookmark badge uses it immediately. Otherwise, its singular membership query is enabled only after `open` becomes true. The same closed-dialog guard will be applied to `TitleActions`, whose detail-page membership read is currently eager even though its list query is already lazy. List contents and loading/error copy will remain in the existing translation namespaces for EN/ES.

**Alternative considered:** hiding bookmark badges until a dialog opens. That avoids reads but removes useful membership feedback where the server or page batch already knows the state. Supplying initial state and lazy fallback preserves both feedback and performance.

### 6. Update only affected cache entries after mutations

Keep the existing mutation functions, Sonner messages, `requireSuccessfulResponse`, and optimistic callback/rollback behavior. Add a shared cache update helper that:

- updates the changed title in every matching batch cache and its singular compatibility cache;
- adds/removes only the affected list ID in `listIdsByTitle[titleId]`;
- updates/removes only the affected watch-status entry;
- invalidates the relevant scoped batch/list metadata query as a correctness fallback, not every title query in the application.

Successful list membership changes still invalidate the user's `lists` query so item counts remain correct. A mutation failure restores the previous title entry or triggers a scoped refresh, and keeps unrelated entries untouched. Existing close callbacks/router refreshes may remain for authoritative server-rendered list structure, but they are not the mechanism used to refresh every interaction card.

**Alternative considered:** retaining `invalidateQueries({ queryKey: ["watch-status"] })` and equivalent broad membership invalidation. It is simple but refetches all visible batches after one click and recreates the load spike this change is intended to remove.

### 7. Keep API, security, and TV boundaries stable

The watch-status route will keep `ids` as the multi-ID parameter and add normalization/deduplication plus the 100-ID bound without changing its `{ statuses }` response. PUT and DELETE remain singular and unchanged. The membership route keeps `title_id` and adds `title_ids`; API documentation and shared response types will describe both forms.

All reads and writes continue through Supabase Auth cookies and RLS. Query keys include `userId`, and the existing auth boundary clears user-scoped cache on identity changes. The React TV page may use the same lazy membership behavior and adapter, but the hosted standalone TV HTML routes remain server-generated and untouched. No locale middleware or existing English/Spanish URL changes are introduced.

## Risks / Trade-offs

- [A page with many unique titles still needs multiple bounded requests] → Cap each request at 100 IDs, deduplicate first, and expose one aggregate loading/error state instead of multiplying work by card count.
- [Redis contains private Library snapshots] → Derive keys only from the authenticated Supabase user, keep Redis server-only, validate cached payloads, never use a client-supplied user ID, and fail open to RLS-backed Supabase reads.
- [Cache invalidation misses a mutation path] → Centralize invalidation helpers, call them only after successful writes on every list/status mutation route, retain the 15-minute TTL, and test each mutation family.
- [Redis adds latency or becomes unavailable] → Use lazy initialization, bounded timeouts, cache-aside reads, and transparent fallback; Redis must never block Library availability.
- [A long comma-separated URL may approach platform URL limits] → Keep the client batch size configurable and below the server maximum if observed payload lengths require it; preserve chunking and reject oversized requests explicitly.
- [A batch failure can leave controls unresolved] → Mark only that batch as errored, offer retry at the owning surface or open dialog, and keep known server-seeded values usable.
- [Duplicate cards may diverge after a mutation if only one component cache is updated] → Update all matching batch entries by title ID and keep the existing singular cache synchronized.
- [Library refreshes can overwrite a recent optimistic value] → Apply the authoritative server response only after the mutation settles and retain existing rollback/refresh behavior on failure.
- [New batch keys can coexist with legacy singular keys] → Keep singular builders/contracts during migration and add tests proving both cache forms receive the targeted update.

## Migration Plan

1. Add shared interaction types, canonical ID/batch helpers, and query keys without changing existing routes.
2. Add the plural membership read handling and watch-status input normalization, tests, and API documentation while preserving singular calls.
3. Add cache-aside Library catalog/status loaders backed by Upstash, explicit mutation invalidation, payload validation, and the Supabase fallback.
4. Seed Library data from the cached/server list and status queries, then add the page-scoped interaction adapter.
5. Wire list detail, search, popular, retained all-list content, and TV React tiles to shared state; make bookmark membership lazy.
6. Replace broad interaction invalidation with targeted updates while retaining Library cache invalidation, list metadata invalidation, and existing feedback.
7. Run unit, integration/RLS, Playwright, lint/typecheck, build, and strict OpenSpec validation. Roll back by disabling the Redis cache path and retaining the adapter with the existing singular contracts; the API remains backward compatible throughout.
