---
linear_story_id: WAY-101
linear_story_identifier: WAY-101
linear_story_title: "[WAT] My Library: reordenar listas y recordar filtros/sort"
linear_story_url: https://linear.app/wayool/issue/WAY-101/wat-my-library-reordenar-listas-y-recordar-filtrossort
linear_story_state: Todo
linear_team: Wayool
linear_project: watchily-ho
---

## Why

My Library always shows lists by `created_at` and resets status chips and name sort on every visit (and per device). Users cannot pin important lists or titles, and prefs must stay the same on web, PWA, and TV. Custom order + server-side Library prefs make the shelf personal and cross-client.

## What Changes

- Persist **custom list order** on the server (`lists.position`).
- Persist **custom title order within each list** on the server (`list_items.position`).
- My Library (web/PWA): **drag-to-reorder** list groups and titles within a group (handle / long-press), optimistic UI, persist on drop.
- **New lists appear at the start** of the user’s order (`position = 0`, bump others).
- New titles added to a list appear at the **start** of that list’s order (same convention).
- Owner-facing fetches (Library, `/api/lists`, TV list surfaces) order by `position`.
- Persist **All / Watching / Finished** and **Name A–Z / Z–A** (plus a **Custom** title order mode when using manual positions) on the **server** so web / PWA / TV stay congruent — **no localStorage** for these prefs.
- TV: **reads** saved order and prefs; remote drag UI may remain limited, but displayed order and chips/sort match other clients.
- **Out of scope:** fractional indexing; multiplayer concurrent reorder.

## Capabilities

### New Capabilities

- `list-order`: Custom ordering of lists and of titles within a list (`position`, reorder APIs, prepend on create/add).
- `library-prefs`: Server-persisted My Library status filter and title sort mode, shared across clients.

### Modified Capabilities

- `library-ia`: Drag-to-reorder list groups and titles; load/save Library prefs from the server; Custom vs name sort interaction.

## Impact

- Schema: `lists.position`, `list_items.position`, library prefs columns (or prefs table) on the user; migrations, `docs/schema.md`, `database.ts`.
- API: list reorder, list-item reorder, prefs GET/PATCH; create list / add item prepend; reads `ORDER BY position`.
- UI: `@dnd-kit` in Library (and list detail if shown); prefs wired to API on change.
- Linear: [WAY-101](https://linear.app/wayool/issue/WAY-101/wat-my-library-reordenar-listas-y-recordar-filtrossort).
