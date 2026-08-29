## Purpose

Provides efficient, authenticated reads of per-title interaction state for dense title grids without exposing another user's data or requiring each card to load state independently.

## ADDED Requirements

### Requirement: Interaction state supports bounded batch reads

The system SHALL provide a read contract that accepts a deduplicated set of title IDs for watch status and list membership, with a maximum request batch of 100 IDs. A larger page or list SHALL be split into additional bounded requests without changing the returned state.

#### Scenario: A page requests repeated titles

- **WHEN** the same title appears in multiple library sections or result pages
- **THEN** the page issues at most one interaction-state lookup for that title in each batch and maps the result to every rendered card

#### Scenario: A page contains more than one batch

- **WHEN** a surface has more than 100 unique title IDs
- **THEN** the client sends bounded batches of at most 100 IDs and combines their responses without dropping valid state

### Requirement: Batch responses are user-scoped

The system SHALL return interaction state only for the authenticated Supabase user making the request, SHALL continue to enforce RLS through the session-bound Supabase client, and SHALL omit absent status or membership entries rather than inventing state.

#### Scenario: User requests titles with mixed state

- **WHEN** an authenticated user requests IDs where some titles are watching, some belong to lists, and some have no interaction
- **THEN** the response contains only that user's matching statuses and list IDs, with no state for unrelated users and no fabricated entries for the remaining titles

#### Scenario: Request includes invalid or duplicate IDs

- **WHEN** a request contains blank, repeated, or otherwise invalid title-ID values
- **THEN** the invalid values are rejected or ignored according to the established API validation policy, duplicates do not multiply database work, and the response remains bounded

### Requirement: Page-scoped state is available before tile rendering

The system SHALL allow library, search/popular, all-list, and single-list surfaces to provide a shared interaction-state map to their title cards. A card with complete provided state SHALL render from that state without issuing an individual read request.

#### Scenario: Server-rendered library data is available

- **WHEN** the library already has the user's status rows and list items while rendering the page
- **THEN** those values are passed or seeded into the shared client state and no equivalent per-card read is required for the initial render

#### Scenario: A discovery grid loads client-side

- **WHEN** search or popular results produce a grid of titles
- **THEN** the grid loads interaction state in bounded page-level batches and cards reuse the shared result

### Requirement: Closed bookmark dialogs do not load membership

The system SHALL NOT request list membership solely because a bookmark dialog is mounted. If a card has no page-provided membership state, its membership read SHALL be enabled only when the bookmark dialog opens.

#### Scenario: Bookmark control is visible but dialog is closed

- **WHEN** a title card is rendered and its bookmark dialog remains closed
- **THEN** no membership request is made for that card

#### Scenario: Bookmark dialog opens without seeded state

- **WHEN** the user opens a bookmark dialog whose membership state was not provided by the page
- **THEN** the dialog requests membership for that title using the compatible singular or batch read contract and shows loading/error state without affecting other cards
