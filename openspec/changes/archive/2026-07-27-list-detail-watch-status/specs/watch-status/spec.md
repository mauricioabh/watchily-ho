## MODIFIED Requirements

### Requirement: Status controls on tile and detail
Title tiles on My Library and on single-list detail (`/lists/[id]`), and the title detail page, SHALL show Eye (Watching) and Finished controls that toggle status and reflect the current state. Controls on list-detail tiles MUST match the compact My Library tile controls.

#### Scenario: Toggle from detail
- **WHEN** a logged-in user activates Finished on title detail
- **THEN** the title is marked finished and Watching is not active

#### Scenario: Controls on list detail tiles
- **WHEN** a logged-in user views a list at `/lists/[id]`
- **THEN** each title tile shows Watching and Finished controls reflecting that title's global watch status
- **AND** toggling a control updates the status the same way as on My Library tiles
