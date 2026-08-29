## ADDED Requirements

### Requirement: Title grids share interaction state across repeated cards

My Library, single-list detail, all-list content, search results, and popular discovery SHALL load interaction state at the page or list scope and SHALL provide equivalent state to every card for a title that appears more than once. A title may remain repeated visually by list section, but its state reads MUST be deduplicated.

#### Scenario: A title appears in multiple library sections

- **WHEN** the same title ID is present in two or more visible library lists
- **THEN** the UI uses one shared status and membership result for all cards and does not issue one request per occurrence

#### Scenario: Filters change the visible subset

- **WHEN** a user filters a library, search, or popular grid after interaction state has loaded
- **THEN** the filtered cards reuse matching cached state and do not refetch each title solely because its visibility changed

#### Scenario: A new popular page is appended

- **WHEN** infinite popular loading appends another page containing new or repeated titles
- **THEN** only previously unknown unique IDs are added to bounded interaction reads and existing state is preserved
