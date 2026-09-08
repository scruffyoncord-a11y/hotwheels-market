-- Real backend for trade proposals — these were previously localStorage-only
-- (each browser kept its own copy, matched against a fixed "You" sentinel),
-- so a proposal never actually reached the other person's account. This
-- table is the one two accounts can both see.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  -- Denormalized snapshot, same reasoning as listings.seller_name — a
  -- display fallback if the listing is later deleted.
  listing_title text not null,
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_name text not null,
  proposer_id uuid not null references auth.users(id) on delete cascade,
  proposer_name text not null,
  my_item_ids uuid[] not null default '{}',
  my_cash_inr integer not null default 0,
  their_item_ids uuid[] not null default '{}',
  note text,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED')),
  created_at timestamptz not null default now()
);

alter table public.proposals enable row level security;

drop policy if exists "either side of a proposal can view it" on public.proposals;
create policy "either side of a proposal can view it"
  on public.proposals for select
  to authenticated
  using (proposer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "authenticated users can propose a trade" on public.proposals;
create policy "authenticated users can propose a trade"
  on public.proposals for insert
  to authenticated
  with check (
    proposer_id = auth.uid()
    and seller_id <> auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = seller_id and l.type = 'TRADE'
    )
  );

-- Two separate policies (Postgres OR's them together) so each side can
-- only make the moves the UI actually offers them: the proposer can only
-- withdraw (PENDING -> DECLINED) their own proposal, the seller can only
-- accept or decline (PENDING -> ACCEPTED/DECLINED) one made to them.
drop policy if exists "proposer can withdraw their own pending proposal" on public.proposals;
create policy "proposer can withdraw their own pending proposal"
  on public.proposals for update
  to authenticated
  using (proposer_id = auth.uid() and status = 'PENDING')
  with check (proposer_id = auth.uid() and status = 'DECLINED');

drop policy if exists "seller can respond to a pending proposal" on public.proposals;
create policy "seller can respond to a pending proposal"
  on public.proposals for update
  to authenticated
  using (seller_id = auth.uid() and status = 'PENDING')
  with check (seller_id = auth.uid() and status in ('ACCEPTED', 'DECLINED'));

alter publication supabase_realtime add table public.proposals;
