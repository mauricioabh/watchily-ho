-- lists: user-created lists
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.lists enable row level security;

create policy "Users can CRUD own lists"
  on public.lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public lists are readable by everyone"
  on public.lists for select
  using (is_public = true);

create index idx_lists_user_id on public.lists(user_id);

-- list_items: titles in a list (title_id from Watchmode/Streaming Availability)
create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title_id text not null,
  title_type text not null check (title_type in ('movie', 'series')),
  added_at timestamptz default now(),
  unique(list_id, title_id)
);

alter table public.list_items enable row level security;

create policy "Users can manage items in own lists"
  on public.list_items for all
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );

create policy "Public list items readable when list is public"
  on public.list_items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.is_public = true
    )
  );

create index idx_list_items_list_id on public.list_items(list_id);
create index idx_list_items_title_id on public.list_items(title_id);

-- likes: user likes a title
create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_id text not null,
  title_type text not null check (title_type in ('movie', 'series')),
  created_at timestamptz default now(),
  primary key (user_id, title_id)
);

alter table public.likes enable row level security;

create policy "Users can manage own likes"
  on public.likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_likes_user_id on public.likes(user_id);
create index idx_likes_title_id on public.likes(title_id);
