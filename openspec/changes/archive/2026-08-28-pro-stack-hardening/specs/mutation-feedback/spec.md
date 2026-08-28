## Purpose

Gives users immediate, consistent and truthful feedback when authenticated actions change their library, preferences, watch status, likes, lists, or push-notification settings.

## ADDED Requirements

### Requirement: Successful mutations provide confirmation

The application SHALL show a success toast after a user mutation receives a successful response, with wording appropriate to the action.

#### Scenario: Title is added to a list

- **WHEN** the add-to-list request succeeds
- **THEN** the user sees a success confirmation and the UI reflects membership

#### Scenario: Settings are saved

- **WHEN** profile and provider preferences finish saving successfully
- **THEN** the user sees one consolidated success confirmation

### Requirement: Failed mutations provide recovery feedback

The application SHALL show an error toast when a mutation returns a non-success response or fails at the network layer, and SHALL avoid claiming success.

#### Scenario: API rejects a mutation

- **WHEN** a mutation receives a non-2xx response
- **THEN** the user sees an error message and the UI either rolls back optimistic state or refreshes it

#### Scenario: Network request fails

- **WHEN** a mutation cannot reach the API
- **THEN** the user sees an error message and can retry without losing unrelated state

### Requirement: Read operations do not create mutation noise

The system SHALL NOT show mutation success toasts for ordinary data loading, background enrichment, or initial page rendering.

#### Scenario: Library enrichment runs

- **WHEN** background title enrichment completes
- **THEN** the interface may show passive progress but does not show a success toast for every batch
