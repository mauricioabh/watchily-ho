-- lists.position: custom shelf order per user
alter table public.lists
  add column if not exists position integer not null default 0;

with ranked as (
  select
    id,
    (row_number() over (
      partition by user_id
      order by created_at desc nulls last, id
    ) - 1)::integer as pos
  from public.lists
)
update public.lists l
set position = ranked.pos
from ranked
where l.id = ranked.id;

create index if not exists idx_lists_user_id_position
  on public.lists (user_id, position);

-- list_items.position: custom title order within a list
alter table public.list_items
  add column if not exists position integer not null default 0;

with ranked_items as (
  select
    id,
    (row_number() over (
      partition by list_id
      order by added_at desc nulls last, id
    ) - 1)::integer as pos
  from public.list_items
)
update public.list_items li
set position = ranked_items.pos
from ranked_items
where li.id = ranked_items.id;

create index if not exists idx_list_items_list_id_position
  on public.list_items (list_id, position);

-- Library prefs (shared web / PWA / TV)
alter table public.profiles
  add column if not exists library_status_filter text not null default 'all';

alter table public.profiles
  add column if not exists library_title_sort text not null default 'custom';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_library_status_filter_check'
  ) then
    alter table public.profiles
      add constraint profiles_library_status_filter_check
      check (library_status_filter in ('all', 'watching', 'finished'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_library_title_sort_check'
  ) then
    alter table public.profiles
      add constraint profiles_library_title_sort_check
      check (library_title_sort in ('custom', 'asc', 'desc'));
  end if;
end $$;
