## Purpose

Routes streaming availability by country so users outside the Watchmode plan’s enabled regions (e.g. Mexico) get SA-backed providers instead of a remapped US catalog, while preserving Watchmode for title discovery metadata.

## ADDED Requirements

### Requirement: Unsupported Watchmode regions use SA for availability

When resolving streaming sources for a title, if the viewer’s country code is not in the Watchmode plan-enabled region set, the system SHALL obtain availability from Streaming Availability (SA) for that country and MUST NOT present Watchmode sources remapped to another country as if they were local.

#### Scenario: Mexico title page sources

- **WHEN** a user with country `MX` opens a title detail page (e.g. Watchmode id `145946` / Bee Movie)
- **THEN** subscription/rent/buy sources shown MUST come from SA with `country=mx` (or from cache populated that way)
- **AND** the system MUST NOT show sources that were produced only by remapping MX to US on Watchmode

#### Scenario: Plan-enabled country still uses Watchmode sources

- **WHEN** a user with country `US` (or another plan-enabled region) opens a title detail page
- **THEN** availability MAY be resolved via Watchmode for that region
- **AND** the system MUST NOT call SA solely because Watchmode returned metadata successfully

### Requirement: Metadata remains Watchmode-backed

Search, autocomplete, and title identity (Watchmode id, posters used for discovery) SHALL continue to use Watchmode and MUST NOT require SA for those operations.

#### Scenario: Search does not require SA

- **WHEN** a user searches for a title
- **THEN** results are produced via Watchmode (or existing Watchmode fallbacks)
- **AND** SA is not required to return search hits

### Requirement: Title id bridge to SA

For SA availability lookups, the system SHALL resolve an IMDb id or TMDB id from Watchmode title metadata and call SA with that identifier while keeping the app-facing title id as the Watchmode id.

#### Scenario: IMDb preferred for SA lookup

- **WHEN** Watchmode details include `imdb_id` for a title
- **THEN** SA availability for an unsupported region is requested using that IMDb id
- **AND** the UnifiedTitle id exposed to the app remains the Watchmode id string

### Requirement: Availability caching respects SA quota

SA-backed availability responses SHALL be cacheable for approximately 24 hours at the HTTP fetch layer and in `title_availability_cache` so repeat views within that window avoid new SA requests when a fresh cache row exists.

#### Scenario: Fresh cache skips SA

- **WHEN** `title_availability_cache` has a row for `(title_id, country_code)` with `refreshed_at` within 24 hours
- **THEN** library/enrich/refresh paths that honor freshness MUST reuse that payload instead of calling SA again

### Requirement: SA public attribution

When availability shown to users was sourced from SA, the UI SHALL include attribution required by Streaming Availability / movieofthenight terms.

#### Scenario: Providers from SA show attribution

- **WHEN** a title page displays sources obtained via SA
- **THEN** an attribution notice for Streaming Availability / movieofthenight is visible on that surface

### Requirement: Rollback without redeploying Watchmode-only logic

The system SHALL support disabling SA routing for unsupported regions via configuration so production can revert to the previous Watchmode-first availability behavior quickly.

#### Scenario: Feature flag off

- **WHEN** the SA-unsupported-regions routing flag is disabled
- **THEN** availability resolution follows the previous Watchmode-primary path (including remap behavior)
