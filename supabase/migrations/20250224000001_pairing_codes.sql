-- Pairing codes for TV second-screen login (JustWatch-style)
-- Codes are short-lived; no RLS (accessed only by server API routes with admin client)

create table public.pairing_codes (
  code text primary key,
  exchange_token text,
  user_id uuid references auth.users(id) on delete cascade,
  refresh_token text,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create index idx_pairing_codes_expires on public.pairing_codes(expires_at);

alter table public.pairing_codes enable row level security;
-- No policies: table accessed only via service role in API routes (createAdminClient)
comment on table public.pairing_codes is 'TV pairing codes for second-screen login. Code generated on TV, claimed on web by logged-in user.';
