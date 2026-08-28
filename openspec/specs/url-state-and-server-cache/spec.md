# url-state-and-server-cache Specification

## Purpose

Makes search and library views shareable and navigable through typed URL state while providing predictable client caching for authenticated API data and paginated streaming results.

## Requirements

### Requirement: Search filters are represented in the URL

The search view SHALL encode its submitted query and active type/provider filters using validated URL parameters, and SHALL restore the same view when loaded, refreshed, shared, or reached through browser history.

#### Scenario: Search URL is opened directly

- **WHEN** a user opens a search URL containing a query and valid filters
- **THEN** the search input, filters, and results reflect those parameters

#### Scenario: Search filter changes

- **WHEN** a user changes a search filter
- **THEN** the URL updates without losing unrelated parameters or causing an invalid filter state

### Requirement: Library view state is reproducible

The library view SHALL support URL-backed query, type, status, and sorting state, while preserving authenticated persistent preferences separately where required.

#### Scenario: Library view is shared

- **WHEN** a user opens a library URL with valid filters
- **THEN** the same filtered library state is rendered

#### Scenario: Browser navigation is used

- **WHEN** a user navigates backward or forward after changing filters
- **THEN** the previous filter state is restored

### Requirement: Client caching is keyed by request inputs

Client-cached title and library data SHALL be keyed by all inputs that affect the response, including query, type, country, provider selection, pagination, and authenticated user scope.

#### Scenario: Two filter combinations are viewed

- **WHEN** a user switches between two different filter combinations
- **THEN** cached data for one combination is not presented as the other combination

### Requirement: Initial server data is reused

The application SHALL reuse server-rendered initial title data when hydrating client queries and SHALL avoid an unnecessary duplicate request for the initial page.

#### Scenario: Search or popular titles hydrate

- **WHEN** a server-rendered page becomes interactive
- **THEN** the initial result set is immediately available and the first page is not fetched twice

### Requirement: Mutations invalidate affected cached data

The system SHALL update or invalidate relevant cached queries after successful likes, watch-status, list, preference, and enrichment mutations, and SHALL not retain stale user data across account changes.

#### Scenario: List membership changes

- **WHEN** a title is added to or removed from a list
- **THEN** affected title and library queries are updated or invalidated

#### Scenario: Authenticated user changes

- **WHEN** the Supabase user changes or signs out
- **THEN** user-scoped cached data is cleared or isolated before another user can observe it
