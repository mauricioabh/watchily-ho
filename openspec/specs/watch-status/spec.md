## Requirements

### Requirement: Global watch status per user and title
The system SHALL store at most one watch status per authenticated user and title. Allowed statuses are `watching` and `finished`. Absence of a row means no status.

#### Scenario: Set watching
- **WHEN** an authenticated user sets Watching on a title
- **THEN** the stored status for that user+title is `watching` and any previous `finished` status is replaced

#### Scenario: Clear status
- **WHEN** an authenticated user toggles off the active status on a title
- **THEN** no watch status remains for that user+title

### Requirement: Status API with RLS
The system SHALL expose authenticated API endpoints to read and upsert/clear watch status for the current user. Row Level Security MUST ensure users only access their own status rows.

#### Scenario: Unauthorized access
- **WHEN** an unauthenticated client calls the watch-status API
- **THEN** the API responds with 401

### Requirement: Status controls on tile and detail
Title tiles on My Library and on single-list detail (`/lists/[id]`), and the title detail page, SHALL show Eye (Watching) and Finished controls that toggle status and reflect the current state. Controls on list-detail tiles MUST match the compact My Library tile controls.

#### Scenario: Toggle from detail
- **WHEN** a logged-in user activates Finished on title detail
- **THEN** the title is marked finished and Watching is not active

#### Scenario: Controls on list detail tiles
- **WHEN** a logged-in user views a list at `/lists/[id]`
- **THEN** each title tile shows Watching and Finished controls reflecting that title's global watch status
- **AND** toggling a control updates the status the same way as on My Library tiles

### Requirement: Library respects watch status filters
When My Library filter Watching or Finished is active, the system SHALL only show titles matching that status. All SHALL show titles regardless of status.

#### Scenario: Finished filter empty
- **WHEN** Finished is active and the user has no finished titles
- **THEN** My Library shows an empty filtered state (not an error)
