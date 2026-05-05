-- Run this in Supabase SQL Editor before testing shared shopping list sync.
-- Uses the same group membership helpers as the existing travel app tables.

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.travel_groups(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  owner_key text not null check (owner_key in ('vik', 'mike')),
  item_type text not null default 'text' check (item_type in ('text', 'photo')),
  title text not null,
  note text,
  photo_data text,
  checked boolean not null default false,
  sort_order bigint not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shopping_items
  add column if not exists item_type text not null default 'text';

alter table public.shopping_items
  drop constraint if exists shopping_items_item_type_check;

alter table public.shopping_items
  add constraint shopping_items_item_type_check
  check (item_type in ('text', 'photo'));

create index if not exists shopping_items_group_trip_owner_idx
  on public.shopping_items (group_id, trip_id, owner_key, sort_order desc);

create index if not exists shopping_items_group_trip_owner_type_idx
  on public.shopping_items (group_id, trip_id, owner_key, item_type, sort_order desc);

alter table public.shopping_items enable row level security;

drop policy if exists "shopping_items_select_group_members" on public.shopping_items;
create policy "shopping_items_select_group_members"
  on public.shopping_items
  for select
  to authenticated
  using (private.is_group_member(group_id));

drop policy if exists "shopping_items_insert_group_members" on public.shopping_items;
create policy "shopping_items_insert_group_members"
  on public.shopping_items
  for insert
  to authenticated
  with check (
    private.is_group_member(group_id)
    and created_by = auth.uid()
  );

drop policy if exists "shopping_items_update_group_members" on public.shopping_items;
create policy "shopping_items_update_group_members"
  on public.shopping_items
  for update
  to authenticated
  using (private.is_group_member(group_id))
  with check (private.is_group_member(group_id));

drop policy if exists "shopping_items_delete_group_members" on public.shopping_items;
create policy "shopping_items_delete_group_members"
  on public.shopping_items
  for delete
  to authenticated
  using (private.is_group_member(group_id));
