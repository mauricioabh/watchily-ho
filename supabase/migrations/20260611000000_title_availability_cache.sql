-- Cached Watchmode title details for async watchlist refresh (Inngest workers).
create table if not exists public.title_availability_cache (
  title_id text not null,
  country_code text not null default 'MX',
  payload jsonb not null,
  refreshed_at timestamptz not null default now(),
  primary key (title_id, country_code)
);

create index if not exists title_availability_cache_refreshed_at_idx
  on public.title_availability_cache (refreshed_at);

alter table public.title_availability_cache enable row level security;

-- Readable by authenticated users; writes via service role / Inngest only.
create policy "title_availability_cache_select_authenticated"
  on public.title_availability_cache for select
  to authenticated
  using (true);
