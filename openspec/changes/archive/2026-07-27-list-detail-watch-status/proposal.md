---
linear_story_id: WAY-100
linear_story_identifier: WAY-100
linear_story_title: "[WAT] Iconos Watching/Finished en tiles del detalle de lista"
linear_story_url: https://linear.app/wayool/issue/WAY-100/wat-iconos-watchingfinished-en-tiles-del-detalle-de-lista
linear_story_state: Todo
linear_team: Wayool
linear_project: watchily-ho
---

## Why

My Library tiles show Watching/Finished controls, but the single-list detail page (`/lists/[id]`) does not. Users lose status visibility and control when drilling into one list, despite the global watch-status requirement already covering authenticated title tiles.

## What Changes

- Show compact Watching (Eye) and Finished controls on title tiles in list detail, matching My Library
- Load and pass the user's watch-status map into list detail so tiles reflect current state and support toggle
- No Watching/Finished filter chips on list detail in this change
- No change to Search, Popular, or All Titles tiles

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `watch-status`: Clarify that single-list detail tiles (`/lists/[id]`) MUST show the same Watching/Finished controls as My Library tiles

## Impact

- `src/app/lists/[id]/page.tsx` — fetch `user_title_statuses` → `statusMap`
- `src/components/list-titles-content.tsx` — wire `showWatchStatus` / `watchStatus` / optimistic updates on `TitleTile`
- Reuses existing `TitleTile`, `WatchStatusControls`, and `/api/watch-status` (no API/schema changes)
- Linear: [WAY-100](https://linear.app/wayool/issue/WAY-100/wat-iconos-watchingfinished-en-tiles-del-detalle-de-lista)
