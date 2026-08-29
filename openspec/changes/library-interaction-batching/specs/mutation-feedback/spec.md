## ADDED Requirements

### Requirement: Interaction mutations update only the affected title

After a successful watch-status or list-membership mutation, the application SHALL update the affected title's entry in the shared interaction state and SHALL preserve the existing Sonner success confirmation and relevant list/status invalidation. It MUST NOT clear or reload unrelated title entries.

#### Scenario: Status mutation succeeds

- **WHEN** a user marks one title as watching, finished, or clears its status
- **THEN** the changed card and any duplicate card for the same title reflect the new state, the success toast is shown, and other titles retain their state

#### Scenario: Membership mutation succeeds

- **WHEN** a user adds or removes one title from one list
- **THEN** that title's membership map reflects the change, the success toast is shown, and list metadata is invalidated as required without resetting other title memberships

#### Scenario: Mutation fails after an optimistic update

- **WHEN** a status or membership mutation receives a non-2xx response or fails at the network layer
- **THEN** the affected title is rolled back or refreshed, the error toast is shown, and no success toast is emitted
