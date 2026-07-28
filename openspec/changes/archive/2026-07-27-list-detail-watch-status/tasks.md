## 1. Wire status data into list detail

- [x] 1.1 In `src/app/lists/[id]/page.tsx`, load `user_title_statuses` for the current user into a `StatusMap` (same pattern as `/library`)
- [x] 1.2 Pass `statusMap` into `ListTitlesContent`

## 2. Show controls on list detail tiles

- [x] 2.1 Update `ListTitlesContent` to accept `statusMap`, keep optimistic local state, and handle `onWatchStatusChange`
- [x] 2.2 Render each `TitleTile` with `showWatchStatus`, `watchStatus={statusMap[title.id]}`, and the change handler

## 3. Validate

- [x] 3.1 Run `openspec validate list-detail-watch-status --strict`
- [x] 3.2 Run `npm run build` and fix any type errors from the wiring
