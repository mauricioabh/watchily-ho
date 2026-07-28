## ADDED Requirements

### Requirement: Persist list position
The system SHALL store a non-negative integer `position` on each row in `lists` for ordering that user’s lists. Owner-facing list queries SHALL return lists ordered by `position` ascending (stable tie-break MAY use `id`).

#### Scenario: Library loads custom list order
- **WHEN** an authenticated user opens My Library after previously reordering lists
- **THEN** list groups appear in the saved `position` order on web, PWA, and TV surfaces that show those lists

#### Scenario: API lists use position
- **WHEN** a client calls `GET /api/lists` for the authenticated user
- **THEN** lists are returned ordered by `position` ascending

### Requirement: Persist title position within a list
The system SHALL store a non-negative integer `position` on each row in `list_items` for ordering titles within that list. Owner-facing item queries for a list SHALL return items ordered by `position` ascending when the user’s title sort mode is Custom.

#### Scenario: Titles keep order across clients
- **WHEN** the user reorders titles in a list and later opens that list on another client (web, PWA, or TV)
- **THEN** titles appear in the saved `position` order

### Requirement: Reorder lists API
The system SHALL provide an authenticated endpoint that accepts the full ordered list of the user’s list IDs and updates each list’s `position` to match that order. The system MUST reject requests that include IDs not owned by the user.

#### Scenario: Successful list reorder
- **WHEN** the owner submits a complete ordered set of their list IDs
- **THEN** each list’s `position` matches its index in that set and subsequent reads on any client reflect the new order

#### Scenario: Foreign list ID rejected
- **WHEN** the request includes a list ID that does not belong to the authenticated user
- **THEN** the system does not apply the reorder and returns an error

### Requirement: Reorder list items API
The system SHALL provide an authenticated endpoint for a list that accepts the full ordered set of title IDs (or item IDs) in that list and updates each item’s `position`. The system MUST reject requests when the list is not owned by the user or when IDs are not members of that list.

#### Scenario: Successful title reorder
- **WHEN** the owner submits a complete ordered set of titles for a list they own
- **THEN** each item’s `position` matches its index and subsequent reads reflect the new order

### Requirement: New lists and items prepend
When a user creates a list, the system SHALL place it at `position` 0 and shift existing lists down. When a user adds a title to a list, the system SHALL place that item at `position` 0 within the list and shift existing items down.

#### Scenario: Create list appears first
- **WHEN** a user with existing lists creates a new list
- **THEN** the new list has `position` 0 and appears first in ordered fetches

#### Scenario: Add title appears first in list
- **WHEN** a user adds a title to a list that already has items
- **THEN** the new item has `position` 0 within that list
