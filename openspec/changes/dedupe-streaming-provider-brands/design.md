## Context

Watchmode returns multiple `type=sub` sources with distinct `name` strings for the same brand (native app + channel add-ons like "MAX (via Amazon Prime)"). Today:

- `title-tile.tsx` dedupes by exact `providerName` (whitespace-stripped).
- Title detail (web + TV) dedupes by `providerName + type`.
- Icon matchers already map many name variants to one brand icon (e.g. `/\b(hbo|max)\b/`), so users see duplicate identical icons.

`PROVIDER_MATCHERS` in `src/lib/streaming/providers.ts` already defines brand → regex for filtering by user subscriptions.

## Goals / Non-Goals

**Goals:**

- One subscription icon/card per canonical brand in tiles, search, title detail (web), and TV standalone.
- Brand identity from the content library (HBO Max), not the channel host (Amazon/Hulu).
- Shared helper used by all surfaces so behavior stays consistent.
- Prefer native brand source over "via …" when choosing which URL/name to keep.

**Non-Goals:**

- Changing Watchmode ingestion, DB cache schema, or API response shapes.
- Changing rent/buy/free source listing beyond applying the same brand dedupe where useful.
- Renaming providers in settings or remapping Watchmode `source_id` catalogs.
- Showing channel-host as a separate brand when only a "via" source exists (still show content brand).

## Decisions

### 1. Canonical brand key from provider name

Resolve each source to a canonical id using `PROVIDER_MATCHERS` (order: brand matchers; for names containing `via`, strip/ignore the host clause when matching brand, or match brand tokens before host).

**Alternative considered:** Dedupe by icon `label` only in UI — rejected; duplicates logic and breaks text cards that don't use icons.

**Alternative considered:** Map by Watchmode `source_id` whitelist — rejected; brittle across regions and new channel IDs.

### 2. Display-layer helper, not ingestion rewrite

Add something like `dedupeSourcesByBrand(sources)` / `canonicalProviderId(name)` in `src/lib/streaming/providers.ts` (or a small sibling module) and call it from tile + detail surfaces.

**Alternative considered:** Normalize in `mapWatchmodeDetailsToUnified` — possible later, but display-layer keeps filtering (`filterTitlesByUserProviders`) intact and is lower risk.

### 3. Preference when collapsing

When multiple sources share a brand:

1. Prefer names that do **not** match `/\(\s*via\b/i`.
2. Else keep the first remaining source (stable order from API).

Display name for cards: use canonical brand label from `PROVIDER_META` when resolved; fall back to kept `providerName`.

### 4. "via" brand vs host

For `"MAX (via Amazon Prime)"`, match **Max/HBO** as brand (same as current `PLATFORMS` order). Do not treat as Prime Video for display icons.

For user-provider filtering, existing `sourceMatchesProvider` may still match both; this change does not alter filter semantics beyond display dedupe after filter.

## Risks / Trade-offs

- **[Risk]** Ambiguous names matching multiple matchers → **Mitigation:** evaluate matchers in a fixed priority order aligned with `PLATFORMS` / `PROVIDER_META` (HBO before Amazon).
- **[Risk]** Losing a useful deep-link (Amazon channel URL) when collapsing → **Mitigation:** accept for UX clarity; keep native URL when present.
- **[Risk]** Unknown providers with no matcher still dedupe only by exact name → **Mitigation:** acceptable; unchanged for unknowns.

## Migration Plan

- Ship as pure UI/helper change; no data migration.
- Rollback: revert helper usage / commit.

## Open Questions

- None blocking; prefer native over via is decided.
