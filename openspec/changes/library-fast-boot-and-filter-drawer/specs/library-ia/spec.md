## MODIFIED Requirements

### Requirement: Library filters and find
My Library SHALL provide filter chips All, Watching, and Finished; type chips All, Movies, and Series; a Find in library text filter; and sort by title name (A–Z and Z–A). Filters SHALL compose (status AND type AND find). These controls SHALL live in the library filter drawer (see library-filter-drawer).

#### Scenario: Watching filter
- **WHEN** the user activates Watching and leaves Find empty and type All
- **THEN** only titles with watching status are shown (empty sections hidden)

#### Scenario: Movies type filter
- **WHEN** the user activates Movies with status All and empty Find
- **THEN** only movie titles are shown (empty sections hidden)
