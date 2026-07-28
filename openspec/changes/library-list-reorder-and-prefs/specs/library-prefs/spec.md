## ADDED Requirements

### Requirement: Server-persisted status filter
The system SHALL persist the user’s My Library status filter (`all`, `watching`, or `finished`) on the server for that user. All clients (web, PWA, TV) SHALL read and apply the same value when showing Library filtering.

#### Scenario: Chip congruent across clients
- **WHEN** the user selects Watching on web and later opens Library on PWA or TV
- **THEN** Watching is the active filter and only watching titles are shown where that UI applies

### Requirement: Server-persisted title sort mode
The system SHALL persist the user’s My Library title sort mode as one of `custom`, `asc`, or `desc` on the server. `custom` SHALL mean order by saved title `position`; `asc` / `desc` SHALL mean display by title name without rewriting stored positions. All clients SHALL use the same mode.

#### Scenario: Sort mode congruent across clients
- **WHEN** the user selects Name Z–A on PWA and later opens Library on web
- **THEN** titles are displayed Z–A within sections

#### Scenario: Custom mode uses positions
- **WHEN** the user’s sort mode is `custom`
- **THEN** titles within each list are shown in `list_items.position` order

### Requirement: Prefs update API
The system SHALL allow the authenticated user to update Library status filter and title sort mode via an API. Updates MUST be scoped to the current user only (RLS or equivalent).

#### Scenario: Patch status filter
- **WHEN** the user changes the status chip
- **THEN** the new value is stored for that user and returned on subsequent prefs reads
