## 1. Data & API — watch status

- [x] 1.1 Add Supabase migration `user_title_statuses` with RLS (select/insert/update/delete own rows)
- [x] 1.2 Update `docs/schema.md` and regenerate `src/types/database.ts`
- [x] 1.3 Add API routes GET/PUT/DELETE (or upsert) for watch status under `/api/watch-status`

## 2. Routes & redirects

- [x] 2.1 Create `/library` page (port data loading from `/lists/all`)
- [x] 2.2 Redirect `/lists` and `/lists/all` → `/library`; `/popular` → `/search`
- [x] 2.3 Change authenticated `/` redirect from `/popular` to `/library`
- [x] 2.4 Update PWA `manifest.ts` shortcuts (Search, My Library)

## 3. Header & English shell

- [x] 3.1 Rebuild `header-client.tsx`: Search + My Library icons; hamburger Settings + Sign out; remove Popular/Listas/Ver todo and inline search
- [x] 3.2 Set `lang="en"` and English strings on layout/settings/login/footer surfaces touched

## 4. My Library UI

- [x] 4.1 Implement Library content: Find in library, All/Watching/Finished chips, name sort, expand/collapse all + per section
- [x] 4.2 Add New list + per-group ⋯ (Rename / Delete / View list); English copy; remove Mis Listas back link
- [x] 4.3 Keep provider filter bar; hide empty sections after filters

## 5. Watch status UI

- [x] 5.1 Add Eye / Finished toggles on `title-tile` (auth) wired to API
- [x] 5.2 Add same toggles on title detail actions
- [x] 5.3 Pass status map into Library and filter chips accordingly

## 6. Search merge

- [x] 6.1 Merge popular infinite grid into Search empty state; keep search-when-query; English copy
- [x] 6.2 Ensure `/search` works as primary discover entry from header

## 7. Cleanup & verify

- [x] 7.1 English pass on list detail and remaining list components; deprecate unused lists-index UI paths
- [x] 7.2 `npm run build` passes
