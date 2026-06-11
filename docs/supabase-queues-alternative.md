# Supabase Queues — alternative to Inngest (watchlist refresh)

Watchily-ho uses **Inngest** for watchlist availability refresh (see README Production practices). **Supabase Queues** (pgmq) is a valid alternative if you prefer all async infra inside Supabase.

## When to choose Supabase Queues

| | Inngest (current) | Supabase Queues |
|--|-------------------|-----------------|
| **Ops** | Inngest Cloud + Vercel `/api/inngest` | Supabase Dashboard → Queues + Edge Function consumer |
| **Retries** | Built-in per function | Consumer implements retry/backoff |
| **Cron** | `cron` on Inngest functions | pg_cron or Supabase scheduled Edge Function |
| **CV stack alignment** | Same pattern as CRT Líneas, Health-erino | Watchily-only |

## Sketch (not implemented)

1. Enable **Queues** in Supabase project settings.
2. Create queue `watchlist_refresh` with payload `{ title_id, country_code }`.
3. **Producer:** `POST /api/lists/[listId]/items` enqueues after insert (via `createAdminClient()`).
4. **Consumer:** Edge Function `supabase/functions/watchlist-refresh/index.ts`:
   - `pgmq.read('watchlist_refresh')`
   - Call Watchmode via shared fetch helper
   - Upsert `title_availability_cache`
   - `pgmq.delete` on success; requeue with delay on transient failure
5. **Reader:** list pages read cache first; trigger enqueue if `refreshed_at` older than TTL (24h).

## Env (Queues path)

No extra env in Next.js beyond existing Supabase keys. Edge Function needs `WATCHMODE_API_KEY` as a secret.

## Reference

- [Supabase Queues docs](https://supabase.com/docs/guides/queues)
- Portfolio pattern doc: `docs/inngest-pattern.md` (Inngest path)
