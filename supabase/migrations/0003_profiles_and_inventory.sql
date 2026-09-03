-- Usernames + public profiles + a real (shared) collection.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

-- ============================================================
-- profiles — one row per account. Holds a denormalized copy of
-- display_name/avatar_url/city (auth.users.user_metadata isn't
-- publicly readable, so a public profile page has nothing else to
-- read another account's identity from) plus the public username.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url text,
  city text,
  collection_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "users can create their own profile" on public.profiles;
create policy "users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- inventory — "My Collection", real per-account rows so a public
-- profile can actually show someone else's collection.
-- ============================================================
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  casting_name text,
  series text,
  condition text not null check (condition in ('MINT', 'NEAR_MINT', 'GOOD', 'PLAYED', 'DAMAGED')),
  notes text,
  image text not null,
  created_at timestamptz not null default now()
);

alter table public.inventory enable row level security;

drop policy if exists "owners can read their own inventory" on public.inventory;
create policy "owners can read their own inventory"
  on public.inventory for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "anyone can read a public collection" on public.inventory;
create policy "anyone can read a public collection"
  on public.inventory for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = inventory.owner_id and p.collection_public = true
    )
  );

drop policy if exists "owners can add to their own inventory" on public.inventory;
create policy "owners can add to their own inventory"
  on public.inventory for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "owners can update their own inventory" on public.inventory;
create policy "owners can update their own inventory"
  on public.inventory for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owners can delete their own inventory" on public.inventory;
create policy "owners can delete their own inventory"
  on public.inventory for delete
  to authenticated
  using (owner_id = auth.uid());
