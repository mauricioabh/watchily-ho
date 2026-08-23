## Purpose

Gives the search page a compact filter drawer for streaming platforms and title type (movie/series), and removes empty-state copy that wastes vertical space on PWA and mobile.

## ADDED Requirements

### Requirement: Empty search state has no decorative heading copy
When the user has not submitted a search query, the search page MUST NOT show a "Search" heading or helper text such as "Type a title above…". Popular content MUST appear directly below the search controls.

#### Scenario: Landing on /search with no query
- **WHEN** the user opens `/search` without a `q` query param
- **THEN** the page shows the search input row and popular titles without the empty-state heading or helper paragraph

### Requirement: Filter control opens a bottom sheet
The search page MUST provide a filter control adjacent to the search controls. Activating it MUST open a bottom-sheet panel that contains platform filters and type badges.

#### Scenario: Open filters
- **WHEN** the user activates the filter control
- **THEN** a bottom sheet opens showing type badges and the user's subscribed platforms

#### Scenario: Close filters
- **WHEN** the user dismisses the bottom sheet (close control, overlay, or Escape)
- **THEN** the sheet closes and the underlying grid remains visible with current filters applied

### Requirement: Type badges filter movies and series
The filter sheet MUST offer Movies and Series badges as independent toggles. When both are selected or both are deselected, the system MUST treat the type filter as unrestricted (all types). When exactly one is selected, results MUST be limited to that type.

#### Scenario: Restrict to movies
- **WHEN** the user selects only the Movies badge
- **THEN** popular browse and search results show only movie titles

#### Scenario: Restrict to series
- **WHEN** the user selects only the Series badge
- **THEN** popular browse and search results show only series titles

#### Scenario: Both or neither selected means all types
- **WHEN** both badges are selected OR both are deselected
- **THEN** popular browse and search results are not restricted by title type

### Requirement: Platform filters apply from the drawer with instant effect
Platform chips in the drawer MUST toggle the user's subscribed-provider subset immediately (no separate Apply action). The same persisted provider-filter preference used elsewhere in the app MUST apply. Changes MUST update popular browse and, when a search is active, the visible search results.

#### Scenario: Narrow platforms while browsing popular
- **WHEN** the user deselects a platform in the filter sheet while viewing popular titles
- **THEN** the popular grid updates to titles available on the remaining selected platforms without requiring a confirm button

#### Scenario: Narrow platforms while viewing search results
- **WHEN** the user has search results and changes platform selection in the filter sheet
- **THEN** the visible results update to titles matching the selected platforms

### Requirement: Active filter indicator on the filter control
The filter control MUST visually indicate when filters differ from the default (not all subscribed platforms selected, or exactly one type badge selected).

#### Scenario: Indicator when filtered
- **WHEN** platforms are narrowed or exactly one type is selected
- **THEN** the filter control shows an active-state indicator (dot or count)

#### Scenario: No indicator at default
- **WHEN** all subscribed platforms are selected and type is unrestricted
- **THEN** the filter control does not show an active-filter indicator
