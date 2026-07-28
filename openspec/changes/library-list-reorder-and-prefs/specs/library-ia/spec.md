## ADDED Requirements

### Requirement: Drag to reorder list groups
My Library (web/PWA) SHALL allow the user to reorder list groups via drag-and-drop (including a hold/long-press friendly interaction on touch), using a drag handle that does not replace collapse or the overflow menu. On successful drop, the client SHALL persist the new order through the list reorder API (optimistic update with recovery on failure).

#### Scenario: Reorder lists by drag
- **WHEN** the user drags a list group to a new index via the drag handle and drops it
- **THEN** list groups appear in the new order immediately and that order remains after reload on any client

#### Scenario: Collapse still works
- **WHEN** the user activates the list group header outside the drag handle (or the dedicated collapse control)
- **THEN** the group expands or collapses as before without starting a reorder

### Requirement: Drag to reorder titles within a list
My Library (web/PWA) SHALL allow reordering titles within an expanded list group via drag-and-drop when title sort mode is `custom`. On drop, the client SHALL persist order through the list-items reorder API. When sort mode is `asc` or `desc`, title drag SHALL be disabled or hidden.

#### Scenario: Reorder titles by drag
- **WHEN** sort mode is Custom and the user drags a title to a new index within its list and drops it
- **THEN** titles in that list appear in the new order and remain so after reload on any client

#### Scenario: No title drag in name sort
- **WHEN** sort mode is Name A–Z or Z–A
- **THEN** the user cannot start a title drag reorder (handles hidden or inactive)

## MODIFIED Requirements

### Requirement: Library filters and find
My Library SHALL provide filter chips All, Watching, and Finished; a Find in library text filter; and title sort modes Custom, A–Z, and Z–A. Filters SHALL compose (chips AND find). The active status chip and title sort mode SHALL be loaded from and saved to server-persisted Library prefs so web, PWA, and TV stay congruent. Find in library text NEED NOT persist across visits.

#### Scenario: Watching filter
- **WHEN** the user activates Watching and leaves Find empty
- **THEN** only titles with watching status are shown (empty sections hidden)

#### Scenario: Restored prefs compose with Find
- **WHEN** server prefs restore Watching and Name Z–A and the user types a Find query
- **THEN** results are limited to watching titles matching the query, sorted Z–A within sections
