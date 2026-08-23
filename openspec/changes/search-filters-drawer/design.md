## Context

See proposal.md — Why. Today `/search` uses `SearchContent` + `PopularInfiniteGrid` (inline `ProviderFilterBar` + `useProviderFilter`). Search API already accepts optional `type`. UI primitives include Radix Dialog; there is no Sheet component yet.

## Goals / Non-Goals

**Goals:**
- Bottom-sheet filter UX on search (platforms + type), instant apply.
- Lift provider filter state to search page so both popular and results share it.
- Client type filter for popular; pass `type` to `/api/titles/search` when exactly one type is active.
- Minimal new UI surface: Sheet built on Dialog.

**Non-Goals:**
- Changing provider filter persistence key or Library/lists filter UIs.
- Multi-type API query params.
- Genre, year, or other advanced filters.
- TV-specific remote UX for the sheet (web/PWA first; TV loads same `/search` if linked).

## Decisions

1. **Bottom sheet via Dialog, not vaul**
   - Rationale: already depend on `@radix-ui/react-dialog`; avoid new deps. Style `DialogContent` as fixed bottom panel (`inset-x-0 bottom-0`, rounded top, slide-up).
   - Alternative: add `vaul` — nicer gestures, more bundle/maintenance.

2. **Lift `useProviderFilter` to `SearchContent`**
   - Pass `activeIds` / toggle handlers into `PopularInfiniteGrid` (or hide its internal bar and accept controlled props).
   - Search results: client-filter with `filterTitlesByUserProviders` after fetch (API already restricts to all subscriptions; client further narrows).
   - Alternative: new search API `providers=` param — more accurate paging later, out of scope for now.

3. **Type filter state: local React state (session), not localStorage**
   - Rationale: type preference is ephemeral for a search session; platforms already persist. Keep scope small.
   - Multi-toggle: `moviesSelected` / `seriesSelected`; effective type = both-or-neither → undefined; only movies → `movie`; only series → `series`.

4. **Remove inline `ProviderFilterBar` from popular when used under search**
   - Popular grid still used only from search today — remove/hide bar there and render platforms only inside the sheet (reuse chip UI from `ProviderFilterBar` or extract shared chips).

5. **Filter icon placement**
   - Same row as search input + Search button: `[input] [Search] [SlidersHorizontal]`.
   - Active: small primary dot or badge when `activeCount < totalCount` or effective type is set.

6. **Empty-state copy**
   - Delete h1/p under no-query branch; keep results heading when searching (`Results for "…"` / `Searching…`) for context.

## Risks / Trade-offs

- [Client-only platform filter on search] → After enrich/filter API returns subset of all subs; further client filter may empty the list quickly. Acceptable; match library behavior.
- [Popular type filter client-side] → Popular API may not accept type; filter client-side on loaded pages (may need more infinite-scroll fetches to fill grid). Mitigation: filter in grid display; optional follow-up to pass type to popular API.
- [Dialog-as-sheet a11y] → Ensure `DialogTitle` present (visually maybe sr-only or visible "Filtros"); focus trap OK via Radix.

## Migration Plan

- Deploy with web/PWA; no DB migration.
- Rollback: revert UI commit; provider localStorage unchanged.

## Open Questions

- None blocking; popular API type support can be a follow-up if empty grids after type filter are painful.
