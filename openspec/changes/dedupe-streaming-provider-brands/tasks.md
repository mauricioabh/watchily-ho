## 1. Shared helper

- [x] 1.1 Add `canonicalProviderId(providerName)` using `PROVIDER_MATCHERS` with brand-before-host priority (strip/ignore `(via …)` for host matching)
- [x] 1.2 Add `dedupeSourcesByBrand(sources)` that collapses by canonical id + type, preferring non-via sources
- [x] 1.3 Export helpers from `src/lib/streaming/providers.ts` (or sibling module imported by UI)

## 2. Wire UI surfaces

- [x] 2.1 Replace `getSubscriptionSources` dedupe in `title-tile.tsx` with shared helper
- [x] 2.2 Replace exact-name dedupe in `src/app/title/[id]/page.tsx` with shared helper
- [x] 2.3 Replace exact-name dedupe in `src/app/title-standalone/[id]/route.ts` with shared helper

## 3. Verify

- [x] 3.1 Sanity-check known brands (HBO via Amazon/Hulu, Disney+/Prime patterns) collapse to one entry
- [ ] 3.2 Run `npm run build` and complete TV update flow (push, vercel Ready, tv:package, tv:install)
