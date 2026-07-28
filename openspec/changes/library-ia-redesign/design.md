## Context

Watchily PWA today: authenticated users land on `/popular`; header links Popular / Listas / Ver todo (mixed ES/EN); library content is split between `/lists` (CRUD create) and `/lists/all` (grouped titles). There is no Watching/Finished model — only free-text lists and likes. MangaTrack’s `/dashboard` is the UX reference for filter chips, Find in library, and name sort (without list grouping).

Constraints: Supabase RLS, existing list APIs, Vercel deploy + webOS hosted shell loading production URL, English-only copy for touched surfaces.

## Goals / Non-Goals

**Goals:**
- Single Library hub at `/library` with list groups, filters, expand/collapse, and list CRUD.
- Global watch status per user+title with UI on tiles and detail.
- Search = discover (popular infinite) + query.
- Icon header + mobile hamburger for Settings/Sign out.
- English UI on changed surfaces.

**Non-Goals:**
- Expo app rewrite; MangaTrack “New” chip; redesigning TV remote focus maps beyond route redirects/shared pages; changing likes semantics.

## Decisions

1. **Watch status storage: table `user_title_statuses`**
   - Columns: `user_id`, `title_id`, `status` (`watching` | `finished`), `updated_at`, PK `(user_id, title_id)`.
   - Rationale: status is independent of which lists contain the title (Decision A from explore). Clearing status = delete row (or `none` not stored).
   - Alternative rejected: column on `list_items` (ambiguous when title is in multiple lists).

2. **Mutual exclusivity:** Setting Watching clears Finished and vice versa. Second click on active status clears to none. Likes remain separate.

3. **Routes:** New `/library` page (evolve `all-titles-content`). Permanent redirects: `/lists` → `/library`, `/lists/all` → `/library`, `/popular` → `/search`. Keep `/lists/[id]` for deep links with English copy and no “Mis listas” hub dependency. Auth home redirect `/` → `/library`.

4. **Header:** Desktop/md+: logo + Search icon link + My Library icon link; Settings + Sign out remain as icons on md+ (or only in hamburger on small — follow explore: hamburger on PWA small has Settings + Sign out; md+ can keep gear/logout icons for parity with current desktop). No text nav links for Popular/Listas/Ver todo. Remove inline search form from header (search lives on Search page).

5. **Library list CRUD:** Toolbar “New list”; each section header gets ⋯ → Rename / Delete / View list (`/lists/[id]`). Reuse `list-actions` patterns / existing PATCH/DELETE APIs.

6. **Expand/collapse:** Client state (Set of collapsed list ids); Expand all / Collapse all; persist optional in `localStorage` key `watchily.library.collapsed`.

7. **Filters:** Client-side chip filter on titles that have status maps loaded with library data. Sort titles within each section by name; optionally sort sections by list name. Provider filter bar retained.

8. **Search page:** Compose popular infinite grid (empty query) + existing search content when `q` present; English strings.

9. **Migration:** Supabase migration + RLS (user owns rows) + update `docs/schema.md` + regenerate types.

## Risks / Trade-offs

- [Missing status on old data] → Default “none”; All chip shows everything; empty Watching/Finished until user marks.
- [Broken bookmarks to /popular or /lists] → Redirects preserve destinations.
- [TV standalone pages still Spanish / old nav] → Update shared components; spot-check `*-standalone` if they duplicate header strings.
- [Large library client filter] → Acceptable for typical list sizes; server filter later if needed.

## Migration Plan

1. Apply DB migration to remote Supabase.
2. Deploy web with redirects and new UI.
3. Rollback: revert deploy; migration is additive (table drop only if full rollback needed).

## Open Questions

- None blocking — decisions locked from explore recommendations.
