## ADDED Requirements

### Requirement: Canonical brand for subscription sources

The system SHALL resolve each streaming source `providerName` to a canonical brand id when it matches a known provider family (netflix, disney_plus, hbo_max, amazon_prime, apple_tv_plus, paramount_plus, crunchyroll). Names that include a channel host suffix such as "(via …)" SHALL resolve to the content brand, not the host.

#### Scenario: HBO channel variants map to HBO Max

- **WHEN** sources include "HBO Max", "MAX (via Amazon Prime)", and "HBO (Via Hulu)"
- **THEN** each resolves to the canonical brand `hbo_max`

#### Scenario: Unknown provider keeps raw key

- **WHEN** a source name does not match any known provider family
- **THEN** the system uses a normalized form of the raw name as its dedupe key

### Requirement: One subscription display entry per brand

On library tiles, search tiles, title detail (web), and TV title standalone, the system SHALL show at most one subscription entry per canonical brand after deduplication.

#### Scenario: Tile shows a single HBO icon

- **WHEN** a title has multiple HBO Max brand subscription sources
- **THEN** the tile displays exactly one HBO Max icon

#### Scenario: Detail shows a single HBO subscription card

- **WHEN** a title detail page lists subscription sources with multiple HBO Max brand variants
- **THEN** the "Disponible con suscripción" section shows exactly one HBO Max entry

### Requirement: Prefer native source over via variants

When collapsing multiple sources of the same brand, the system SHALL prefer a source whose name does not indicate a channel host ("via …") over one that does, and SHALL use that preferred source for display URL and fallback naming.

#### Scenario: Native preferred

- **WHEN** both "HBO Max" and "MAX (via Amazon Prime)" exist as subscription sources
- **THEN** the kept entry uses the native "HBO Max" source (or equivalent non-via source) for its link
