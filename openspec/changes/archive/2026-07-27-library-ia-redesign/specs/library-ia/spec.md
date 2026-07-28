## ADDED Requirements

### Requirement: Authenticated home is My Library
The system SHALL redirect authenticated users from `/` to `/library`. Unauthenticated users SHALL continue to see the marketing/login home.

#### Scenario: Logged-in visit to root
- **WHEN** an authenticated user navigates to `/`
- **THEN** they are redirected to `/library`

### Requirement: Library route replaces lists hub and Ver todo
The system SHALL serve My Library at `/library` showing all user list sections with titles. The system SHALL permanently redirect `/lists` and `/lists/all` to `/library`. Single-list detail at `/lists/[id]` MAY remain available.

#### Scenario: Old lists index URL
- **WHEN** a user navigates to `/lists` or `/lists/all`
- **THEN** they are redirected to `/library`

#### Scenario: Library has no Mis Listas back link
- **WHEN** a user views `/library`
- **THEN** the page MUST NOT show a back link to a lists index hub

### Requirement: Header navigation icons
For authenticated users, the header SHALL provide icon links to Search and My Library. On small PWA/mobile viewports, the hamburger menu SHALL expose Settings and Sign out and MUST NOT duplicate primary Search/My Library as the only way to reach Settings. Text links Popular, Listas, and Ver todo MUST NOT appear in the header.

#### Scenario: Desktop header icons
- **WHEN** an authenticated user views the header at `md` breakpoint or larger
- **THEN** Search and My Library icon links are visible

#### Scenario: Mobile hamburger
- **WHEN** an authenticated user opens the hamburger on a small viewport
- **THEN** the menu includes Settings and Sign out

### Requirement: Search merges popular discovery
The Search page SHALL show an infinite popular titles grid when the query is empty, and search results when a query is present. The system SHALL redirect `/popular` to `/search`.

#### Scenario: Empty search
- **WHEN** an authenticated user opens `/search` with no query
- **THEN** popular titles load with infinite scroll

#### Scenario: Popular URL
- **WHEN** a user navigates to `/popular`
- **THEN** they are redirected to `/search`

### Requirement: Library filters and find
My Library SHALL provide filter chips All, Watching, and Finished; a Find in library text filter; and sort by title name (A–Z and Z–A). Filters SHALL compose (chips AND find).

#### Scenario: Watching filter
- **WHEN** the user activates Watching and leaves Find empty
- **THEN** only titles with watching status are shown (empty sections hidden)

### Requirement: Expand and collapse list groups
My Library SHALL allow expanding/collapsing each list group and expanding/collapsing all groups.

#### Scenario: Collapse one list
- **WHEN** the user collapses a list group
- **THEN** that group’s titles are hidden until expanded again

### Requirement: List CRUD from Library
My Library SHALL allow creating a new list and renaming or deleting an existing list from the Library UI (including a per-group overflow menu).

#### Scenario: Delete list from Library
- **WHEN** the user confirms delete from a list group menu
- **THEN** the list is removed and the Library refreshes without that section

### Requirement: English user-facing copy
User-facing strings on surfaces changed by this capability SHALL be in English, and the document language SHOULD be `en`.

#### Scenario: Library heading
- **WHEN** a user opens My Library
- **THEN** the primary heading is in English (e.g. “My Library”)
