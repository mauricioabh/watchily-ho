---
linear_story_id: "WAY-99"
linear_story_identifier: "WAY-99"
linear_story_title: "[WAT] Library IA redesign: My Library hub, Search merge, watch status"
linear_story_url: "https://linear.app/wayool/issue/WAY-99/wat-library-ia-redesign-my-library-hub-search-merge-watch-status"
linear_story_state: "Todo"
linear_team: "Wayool"
linear_project: "watchily-ho"
---

## Why

Logged-in navigation mixes Spanish and English, splits library across “Listas” and “Ver todo”, and uses Popular as the home hub. Users need a MangaTrack-style My Library as the primary destination, with discovery under Search and explicit Watching/Finished status.

## What Changes

- **BREAKING (nav):** Remove Listas / Ver todo / Popular as primary nav. Header shows Search and My Library icons; PWA small hamburger shows Settings and Sign out only.
- Default authenticated landing becomes **My Library** (`/library`), based on today’s `/lists/all` experience (no “Mis Listas” back link).
- **`/lists` redirects to `/library`**. List detail `/lists/[id]` remains for deep links; create/rename/delete move to Library (toolbar + per-group ⋯ menu).
- **Search** absorbs Popular: infinite popular grid when empty, search input + API results when querying. **`/popular` redirects to `/search`**.
- **Watch status** (global per user+title): Eye = Watching, check/finished icon = Finished; on tiles and title detail; Library filters All / Watching / Finished.
- Library UX: Find in library, sort by name (A–Z / Z–A), expand/collapse all + per list group; keep provider filter where useful.
- **English UI** across web PWA surfaces touched by this change (`lang="en"`).

## Capabilities

### New Capabilities

- `library-ia`: Logged-in information architecture — My Library hub, Search merge, header/hamburger, redirects, English copy.
- `watch-status`: Per-user title watch status (none / watching / finished), API, tile/detail toggles, Library filter chips.

### Modified Capabilities

- (none — no existing OpenSpec specs under `openspec/specs/` yet)

## Impact

- Routes: `src/app/page.tsx`, new `src/app/library/`, `src/app/search/`, redirects from `/lists`, `/lists/all`, `/popular`; header (`header-client.tsx`), manifest shortcuts.
- Components: `all-titles-content.tsx` → Library UI; `title-tile.tsx`, `title-actions.tsx`; list CRUD from Library.
- Data: new Supabase table/migration for user title status; API routes; `docs/schema.md` + types.
- PWA/TV: web routes shared via Vercel; TV standalone pages only if they hardcode old nav labels/routes.
- Linear: [WAY-99](https://linear.app/wayool/issue/WAY-99/wat-library-ia-redesign-my-library-hub-search-merge-watch-status)
