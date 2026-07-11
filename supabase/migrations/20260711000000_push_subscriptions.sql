-- push_subscriptions: Web Push (PWA) subscriptions per user/device.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions(user_id);

-- PostgREST role privileges (RLS policies alone are not enough).
grant select, insert, update, delete on public.push_subscriptions to authenticated;
