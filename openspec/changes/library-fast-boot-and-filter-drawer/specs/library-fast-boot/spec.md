## Purpose

Make My Library paint immediately on PWA open using database + availability cache, then fill missing title details in the background without blocking first paint.

## ADDED Requirements

### Requirement: PWA opens on My Library
The installed PWA SHALL use `/library` as `start_url`. Unauthenticated users landing on `/library` SHALL be redirected to login.

#### Scenario: Cold start authenticated
- **WHEN** an authenticated user opens the installed PWA
- **THEN** the first navigation targets `/library` (not `/` then redirect)

### Requirement: Library first paint does not wait on external title APIs
The system SHALL render My Library chrome and list sections from Supabase data (and cached title payloads when present) without waiting for external title-detail API calls to complete for every title.

#### Scenario: Cache hit
- **WHEN** a listed title exists in `title_availability_cache`
- **THEN** its details appear on first paint from cache

#### Scenario: Cache miss
- **WHEN** a listed title is not in cache
- **THEN** the UI shows a placeholder/skeleton tile for that title until enrich completes

### Requirement: Background title enrich
The system SHALL fetch missing title details after first paint and update tiles in place. Successful fetches SHOULD be written to `title_availability_cache` for later visits.

#### Scenario: Misses fill in
- **WHEN** the library has titles without cached payloads
- **THEN** those tiles update with name/poster/sources after enrich without a full page reload
