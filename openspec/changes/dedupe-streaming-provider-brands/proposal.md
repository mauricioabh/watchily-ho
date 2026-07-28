## Why

Watchmode returns multiple subscription rows for the same brand (e.g. "HBO Max", "MAX (via Amazon Prime)", "HBO (Via Hulu)"). The UI dedupes by exact `providerName`, so tiles and detail pages show the same icon/card repeated. Users expect one icon per streaming brand.

## What Changes

- Canonicalize streaming sources by **brand family** (Netflix, Disney+, HBO Max, Prime Video, Apple TV+, Paramount+, Crunchyroll) before display.
- Treat "(via …)" / channel-host variants as the **content brand**, not the host (e.g. MAX via Amazon → HBO Max).
- Deduplicate subscription sources by canonical brand so library tiles, search tiles, title detail, and TV standalone show each brand once.
- Prefer a single representative source per brand (prefer native name/URL over "via" variants when both exist).

## Capabilities

### New Capabilities

- `streaming-provider-dedupe`: Canonical brand resolution and deduplication of subscription sources for display across web and TV.

### Modified Capabilities

- (none)

## Impact

- Shared helper in `src/lib/streaming/` (reuse/extend `PROVIDER_MATCHERS`).
- `src/components/title-tile.tsx` (library + search tiles).
- `src/app/title/[id]/page.tsx` (web detail).
- `src/app/title-standalone/[id]/route.ts` (TV detail).
- No API contract or DB schema changes; display-layer only.
