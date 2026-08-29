## MODIFIED Requirements

### Requirement: Client caching is keyed by request inputs

Client-cached title and library interaction data SHALL be keyed by every input that affects the response, including query, type, country, provider selection, pagination, the canonical deduplicated title-ID set, and authenticated user scope. Different interaction batches or users MUST NOT share private state.

#### Scenario: Two interaction batches are viewed

- **WHEN** a user views two surfaces with different title-ID sets
- **THEN** each surface reads the state associated with its own canonical batch and does not display a status or membership from the other batch

#### Scenario: The authenticated user changes

- **WHEN** the Supabase user changes or signs out
- **THEN** user-scoped interaction queries are cleared or isolated before another user can observe their data

### Requirement: Initial server data is reused

The application SHALL reuse server-rendered initial title, watch-status, and available list-membership data when hydrating client queries and SHALL avoid unnecessary duplicate requests for state already present in the page props.

#### Scenario: Library interaction state hydrates

- **WHEN** the server-rendered library includes status rows and list-item relationships for its titles
- **THEN** the client seeds the corresponding shared interaction query and does not refetch the same initial state once per card

#### Scenario: A client-only result set hydrates

- **WHEN** search or popular results arrive without interaction state
- **THEN** one or more bounded shared interaction queries load the state for the unique visible IDs and cards render from those results

### Requirement: Mutations invalidate affected cached data

The system SHALL update the affected title entry in every relevant shared interaction cache after a successful like, watch-status, or list-membership mutation, SHALL preserve optimistic rollback or refresh fallback on failure, and SHALL invalidate only the affected scoped query families when a refetch is needed.

#### Scenario: Watch status changes in a shared batch

- **WHEN** a user sets or clears watch status on one title card
- **THEN** that title's entry changes in the shared state immediately, sibling cards remain unchanged, and no full-page interaction reload is required

#### Scenario: List membership changes in a shared batch

- **WHEN** a user adds or removes one title from one list
- **THEN** only that title's membership map is updated, list metadata remains correctly invalidated, and unrelated title entries are not reset

#### Scenario: Interaction mutation fails

- **WHEN** a mutation receives a non-2xx response or fails at the network layer
- **THEN** the affected title rolls back to its previous state or is refreshed, an error is shown, and unrelated cached entries remain intact
