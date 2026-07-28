## Context

My Library groups titles by user lists. Today: lists ordered by `created_at DESC`; `list_items` by `added_at`; status chips and name sort are ephemeral client state. Prefs must be identical on web, PWA, and TV — **not** `localStorage`. Linear: [WAY-101](https://linear.app/wayool/issue/WAY-101/wat-my-library-reordenar-listas-y-recordar-filtrossort).

## Goals / Non-Goals

**Goals:**

- Server-side custom order for lists and for titles within each list.
- Drag-to-reorder both levels on web/PWA; persist on drop.
- New lists and newly added titles **prepend** (appear first).
- Server-side Library prefs (status filter + title sort mode) shared across web / PWA / TV.
- TV and other clients **respect** saved order and prefs when displaying Library/lists.

**Non-Goals:**

- TV remote drag-and-drop UI (optional later; order still applies).
- Fractional indexing / CRDTs.
- Syncing expand/collapse UI chrome (optional follow-up; not required for congruence of shelf content).

## Decisions

### 1. `lists.position` and `list_items.position` (integers)

- `lists.position integer not null`; backfill per user by current `created_at DESC` → `0..n-1`.
- `list_items.position integer not null`; backfill per `list_id` by current `added_at DESC` → `0..n-1` (newest first matches today’s feel).
- Indexes: `(user_id, position)` on lists; `(list_id, position)` on list_items.
- **Why:** Same pattern at both levels; simple `ORDER BY position`.

### 2. Prepend on create / add

- **New list:** bump all of the user’s list positions by +1, insert new list at `position = 0`.
- **New list item:** bump items in that list by +1, insert at `position = 0`.
- **Why:** Matches “newest / just added at top”; user asked for new lists at the start.

### 3. Reorder APIs

```
PATCH /api/lists/reorder
{ "orderedIds": ["list-uuid…"] }

PATCH /api/lists/{listId}/items/reorder
{ "orderedIds": ["title_id…"] }   // or list_item ids — prefer title_id if unique per list
```

- Validate ownership; assign `position = index`; optimistic UI + revert on failure.

### 4. Title sort mode vs manual order (important)

Display modes for titles **within** a list:

| Mode | Behavior |
|------|----------|
| `custom` | `ORDER BY list_items.position`; drag handles enabled |
| `asc` / `desc` | Display sorted by title name; **do not** rewrite `position`; drag disabled or hidden |

- Persisted prefs field: `library_title_sort` ∈ `custom` \| `asc` \| `desc`.
- Default after migration: `custom` (so saved positions are visible). Existing “Name A–Z” UI becomes three options: Custom / A–Z / Z–A.
- **Why:** Avoid destroying manual order when the user peeks at alphabetical view (Spotify-style: playlist order is canonical; other sorts are views).

### 5. Library prefs on the server (no localStorage)

- Store on `profiles` (or a 1:1 `user_library_prefs` row):

  - `library_status_filter`: `all` \| `watching` \| `finished` (default `all`)
  - `library_title_sort`: `custom` \| `asc` \| `desc` (default `custom`)

- `GET` with Library payload (or `GET /api/library/prefs`); `PATCH` on chip/sort change.
- Web, PWA, and TV all read/write the same row — congruent.
- Expand/collapse may remain client-only for now (UI chrome, not shelf content).

### 6. DnD UX

- `@dnd-kit` sortable: nested or two contexts — outer = list groups, inner = titles in expanded group.
- Drag handles to avoid fighting collapse / overflow / title navigation.
- TV: no drag required in V1; still orders by `position` and applies prefs if Library-like UI exists.

### 7. How title reorder works (end-to-end)

```
┌──────────────┐     drop      ┌─────────────────────────────┐
│ Library UI   │──────────────▶│ PATCH .../items/reorder     │
│ (sortable    │  orderedIds   │ set position = 0..n-1       │
│  titles)     │               └─────────────┬───────────────┘
└──────────────┘                             │
                                             ▼
                                    list_items.position
                                             │
                    ┌────────────────────────┼────────────────────┐
                    ▼                        ▼                    ▼
                 Web/PWA                   TV                  APIs
              ORDER BY position      ORDER BY position    same reads
```

Same pattern as list reorder; scope is per-list, not global across lists.

## Risks / Trade-offs

- **[Risk] Nested DnD complexity** → Mitigation: only enable title sortable when section expanded and sort mode is `custom`; use distinct activation handles.
- **[Risk] Prefs write on every chip tap** → Mitigation: PATCH debounce optional; payload tiny.
- **[Risk] Prepend bumps many rows** → Mitigation: fine for typical list sizes; single SQL `UPDATE ... SET position = position + 1`.
- **[Trade-off] Alphabetical view does not persist as a rewrite of positions** → Intentional; Custom is canonical.
- **[Trade-off] Expand/collapse not synced** → Accepted for V1 unless product wants it later.

## Migration Plan

1. Migration: `lists.position`, `list_items.position`, prefs columns; backfills; docs + types.
2. APIs: create/add prepend; reorder endpoints; prefs read/write; all owner reads by `position`.
3. Library UI: DnD both levels; sort mode Custom/A–Z/Z–A; wire prefs to server.
4. TV/other clients: consume `position` + prefs (no drag required).
5. Rollback: ignore positions in UI; columns can remain.

## Open Questions

- None blocking. Optional later: sync expand/collapse; TV remote reorder gestures.
