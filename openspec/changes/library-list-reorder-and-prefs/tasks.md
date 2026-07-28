## 1. Schema and types

- [x] 1.1 Migration: `lists.position`, backfill per user by `created_at DESC`, index `(user_id, position)`
- [x] 1.2 Migration: `list_items.position`, backfill per list by `added_at DESC`, index `(list_id, position)`
- [x] 1.3 Migration: server Library prefs (`library_status_filter`, `library_title_sort` on profiles or 1:1 prefs table) with defaults `all` / `custom`
- [x] 1.4 Update `docs/schema.md` and regenerate `src/types/database.ts`

## 2. List and item order APIs

- [x] 2.1 Create list (web + TV): prepend — bump positions, insert at `0`
- [x] 2.2 Add list item: prepend within list at `0`
- [x] 2.3 `PATCH /api/lists/reorder` with owned `orderedIds`
- [x] 2.4 `PATCH /api/lists/[listId]/items/reorder` with owned list membership checks
- [x] 2.5 Owner reads: lists and items `ORDER BY position` (Library, `/api/lists`, TV pickers, list detail)

## 3. Library prefs API

- [x] 3.1 Read prefs with Library (or `GET /api/library/prefs`)
- [x] 3.2 `PATCH` prefs for status filter and title sort mode; enforce owner-only

## 4. Library UI

- [x] 4.1 Add `@dnd-kit` (core + sortable)
- [x] 4.2 Sortable list groups + sortable titles (custom mode only); handles; optimistic PATCH on drop
- [x] 4.3 Wire chips and sort select to server prefs (load on mount, save on change); options Custom / A–Z / Z–A
- [x] 4.4 Verify collapse, overflow CRUD, and Find still work

## 5. Cross-client congruence

- [x] 5.1 TV (and any other list UIs): consume `position` order and prefs where Library filters/sort apply
- [x] 5.2 Manual check: reorder lists/titles and prefs survive reload and match across web/PWA/TV; new list/item appears first
- [x] 5.3 `npm run build` passes
