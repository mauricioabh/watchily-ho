## Purpose

Consolidate library find/sort/expand/status/type/provider controls into a header-anchored collapsible drawer so the title grid stays visible and updates live while filters change.

## ADDED Requirements

### Requirement: Compact library toolbar actions
My Library SHALL show a create-list control as an icon-only `+` button and a filters control as an icon-only button to its right.

#### Scenario: Icon-only create
- **WHEN** the user views the library toolbar
- **THEN** the create-list control shows a plus icon without the “New list” text label

### Requirement: Filter drawer under header
Activating the filters control SHALL expand a collapsible panel under the library toolbar (not a full-screen modal) so list sections remain visible. Changing filters SHALL update the visible titles without closing the drawer.

#### Scenario: Live filter while drawer open
- **WHEN** the filter drawer is open and the user toggles Watching
- **THEN** the list below updates immediately and the drawer stays open

### Requirement: Drawer contains library controls
The filter drawer SHALL include: Find in library, title sort, expand all / collapse all, status chips (All / Watching / Finished), type chips (All / Movies / Series), and the provider filter bar.

#### Scenario: Type filter Movies
- **WHEN** the user selects Movies (and status All, empty find)
- **THEN** only movie titles are shown (empty sections hidden)

#### Scenario: Status and type compose
- **WHEN** the user selects Watching and Series
- **THEN** only series with watching status are shown
