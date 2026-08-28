## Purpose

Provides privacy-conscious product analytics across Watchily web and TV surfaces while preserving a shared PostHog project and a stable application identifier.

## ADDED Requirements

### Requirement: Analytics uses the shared Watchily project

The client SHALL initialize PostHog only in the browser, using the configured Watchily project and host, and SHALL remain disabled without valid analytics configuration.

#### Scenario: Analytics is configured

- **WHEN** a user opens the web or TV application with valid PostHog configuration
- **THEN** the client initializes PostHog once and sends events to the configured project

#### Scenario: Analytics is not configured

- **WHEN** PostHog configuration is absent or incomplete
- **THEN** the application remains functional and emits no PostHog requests

### Requirement: Events identify the product consistently

Every product event SHALL include the application context `app_tag: "app:wat"` and SHALL include the surface when it is known, such as `web` or `tv`.

#### Scenario: Watchily event is captured

- **WHEN** a supported product action succeeds
- **THEN** the resulting event contains the shared Watchily application context

### Requirement: User identity follows authentication lifecycle

The client SHALL identify authenticated users using the stable Supabase user ID, SHALL NOT send email addresses as analytics identity, and SHALL reset the analytics identity after sign-out.

#### Scenario: User signs in

- **WHEN** Supabase reports an authenticated user
- **THEN** PostHog identifies that user by Supabase user ID

#### Scenario: User signs out

- **WHEN** the Supabase session ends
- **THEN** PostHog resets the anonymous identity

### Requirement: Product events are minimal and privacy-safe

The system SHALL capture successful authentication, search submission, title viewing, streaming-link clicks, list membership changes, watch-status changes, library-filter changes, and settings saves using bounded metadata, and SHALL NOT capture raw passwords, emails, query text, list names, or streaming URLs.

#### Scenario: Search is submitted

- **WHEN** a user submits a search
- **THEN** analytics records query length and selected filters, but not the query text

#### Scenario: Streaming link is opened

- **WHEN** a user opens a streaming offer
- **THEN** analytics records normalized provider and offer type, but not the destination URL
