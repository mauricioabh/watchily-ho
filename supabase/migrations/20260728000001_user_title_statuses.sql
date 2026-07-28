-- user_title_statuses: global watch status per user+title (watching | finished)
create table if not exists public.user_title_statuses (
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_id text not null,
  status text not null check (status in ('watching', 'finished')),
  updated_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

alter table public.user_title_statuses enable row level security;

create policy "Users can manage own title statuses"
  on public.user_title_statuses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_user_title_statuses_user_id
  on public.user_title_statuses(user_id);

create index if not exists idx_user_title_statuses_user_status
  on public.user_title_statuses(user_id, status);
