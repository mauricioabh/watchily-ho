## ADDED Requirements

### Requirement: Watch status reads support bounded multi-title requests

The watch-status read contract SHALL accept the existing comma-separated `ids` URL parameter for multiple title IDs, SHALL deduplicate and bound the requested IDs to batches of at most 100, and SHALL return the current user's statuses in the existing `{ statuses: Record<titleId, status> }` response shape. Existing singular reads and PUT/DELETE mutation URLs SHALL remain compatible.

#### Scenario: Multiple statuses are requested

- **WHEN** an authenticated client requests `/api/watch-status?ids=title-a,title-b,title-c`
- **THEN** the response contains only the current user's existing `watching` or `finished` statuses keyed by title ID, omitting titles without a status

#### Scenario: The request repeats an ID

- **WHEN** the `ids` parameter contains the same title more than once
- **THEN** the server performs one logical lookup for that title and returns one status entry

#### Scenario: A surface exceeds the batch limit

- **WHEN** a page has more than 100 unique title IDs
- **THEN** the client splits the read into requests of no more than 100 IDs and combines the response maps

### Requirement: Tiles do not refetch provided watch status

Watch-status controls SHALL use a supplied status or a shared page/list interaction query when available. They MUST NOT issue a singular watch-status read merely because a supplied status is temporarily `undefined` while the shared query is loading.

#### Scenario: A tile receives a status map entry

- **WHEN** a library, list, search, or popular tile receives the status for its title from page data or a shared batch query
- **THEN** the controls render that status without a per-tile GET request

#### Scenario: A shared batch is loading

- **WHEN** a tile's status is not yet resolved but its surface has an active shared batch query
- **THEN** the tile shows the defined loading or neutral state and does not create an additional singular request
