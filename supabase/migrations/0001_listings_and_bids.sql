-- Real backend for listings + auctions.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

-- ============================================================
-- listings
-- ============================================================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('SALE', 'TRADE', 'AUCTION')),
  title text not null,
  description text not null default '',
  casting_name text,
  series text,
  condition text not null check (condition in ('MINT', 'NEAR_MINT', 'GOOD', 'PLAYED', 'DAMAGED')),
  price_inr integer,
  original_price_inr integer,
  wants_in_exchange text,
  starting_bid_inr integer,
  bid_increment_inr integer,
  buy_now_inr integer,
  ends_at timestamptz,
  bidding_paused boolean not null default false,
  is_private boolean not null default false,
  access_token text,
  city text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'RESERVED', 'SOLD')),
  images text[] not null default '{}',
  views integer not null default 0,
  likes integer not null default 0,
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_name text not null,
  seller_city text not null,
  seller_rating numeric not null default 5.0,
  seller_deals_completed integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

drop policy if exists "listings are publicly readable" on public.listings;
create policy "listings are publicly readable"
  on public.listings for select
  using (true);

drop policy if exists "users can create their own listings" on public.listings;
create policy "users can create their own listings"
  on public.listings for insert
  to authenticated
  with check (seller_id = auth.uid());

drop policy if exists "sellers can update their own listings" on public.listings;
create policy "sellers can update their own listings"
  on public.listings for update
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists "sellers can delete their own listings" on public.listings;
create policy "sellers can delete their own listings"
  on public.listings for delete
  to authenticated
  using (seller_id = auth.uid());

-- ============================================================
-- bids
-- ============================================================
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  bidder_id uuid not null references auth.users(id) on delete cascade,
  bidder_name text not null,
  amount_inr integer not null,
  max_bid_inr integer not null,
  created_at timestamptz not null default now()
);

alter table public.bids enable row level security;

drop policy if exists "bids are publicly readable" on public.bids;
create policy "bids are publicly readable"
  on public.bids for select
  using (true);

-- No insert/update/delete policies for bids on purpose: every write goes
-- through place_bid() below, which is the only place proxy-bid math,
-- anti-snipe extension, and "not your own listing" are enforced. Bids are
-- otherwise immutable — nobody, including the seller, can edit or delete one.

-- ============================================================
-- place_bid — the only way a bid can ever be created
-- ============================================================
create or replace function public.place_bid(p_listing_id uuid, p_max_bid_inr integer)
returns table (leader_name text, leader_amount integer, you_were_outbid boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing listings%rowtype;
  v_top bids%rowtype;
  v_bidder_name text;
  v_increment integer;
  v_challenger_amount integer;
  v_incumbent_amount integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to place a bid.';
  end if;

  select * into v_listing from listings where id = p_listing_id for update;
  if not found then
    raise exception 'Listing not found.';
  end if;
  if v_listing.type <> 'AUCTION' then
    raise exception 'This listing is not an auction.';
  end if;
  if v_listing.seller_id = auth.uid() then
    raise exception 'You cannot bid on your own listing.';
  end if;
  if v_listing.status <> 'ACTIVE' then
    raise exception 'This auction is no longer active.';
  end if;
  if v_listing.ends_at is not null and v_listing.ends_at <= now() then
    raise exception 'This auction has ended.';
  end if;
  if v_listing.bidding_paused then
    raise exception 'The seller has paused bidding.';
  end if;
  if p_max_bid_inr is null or p_max_bid_inr <= 0 then
    raise exception 'Enter a valid bid amount.';
  end if;

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email, 'Bidder')
    into v_bidder_name
  from auth.users where id = auth.uid();

  v_increment := coalesce(v_listing.bid_increment_inr, 100);

  select * into v_top from bids where listing_id = p_listing_id order by amount_inr desc limit 1;

  if not found then
    if p_max_bid_inr < coalesce(v_listing.starting_bid_inr, 0) then
      raise exception 'Bid must be at least the starting bid.';
    end if;
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, auth.uid(), v_bidder_name, coalesce(v_listing.starting_bid_inr, 0), p_max_bid_inr);
    return query select v_bidder_name, coalesce(v_listing.starting_bid_inr, 0), false;
    return;
  end if;

  if v_top.bidder_id = auth.uid() then
    if p_max_bid_inr <= v_top.max_bid_inr then
      raise exception 'Your new max must be higher than your current max of %.', v_top.max_bid_inr;
    end if;
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, auth.uid(), v_bidder_name, v_top.amount_inr, p_max_bid_inr);
    return query select v_bidder_name, v_top.amount_inr, false;
    return;
  end if;

  if p_max_bid_inr <= v_top.amount_inr then
    raise exception 'Bid must be higher than the current bid of %.', v_top.amount_inr;
  end if;

  if v_listing.ends_at is not null and v_listing.ends_at - now() < interval '5 minutes' then
    update listings set ends_at = now() + interval '5 minutes' where id = p_listing_id;
  end if;

  if p_max_bid_inr > v_top.max_bid_inr then
    -- Challenger takes the lead, capped at what's needed to beat the incumbent's max.
    v_challenger_amount := least(p_max_bid_inr, v_top.max_bid_inr + v_increment);
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, auth.uid(), v_bidder_name, v_challenger_amount, p_max_bid_inr);
    return query select v_bidder_name, v_challenger_amount, false;
  else
    -- Incumbent auto-defends immediately, same as eBay/Goldin proxy bidding.
    v_incumbent_amount := least(v_top.max_bid_inr, p_max_bid_inr + v_increment);
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, auth.uid(), v_bidder_name, p_max_bid_inr, p_max_bid_inr);
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, v_top.bidder_id, v_top.bidder_name, v_incumbent_amount, v_top.max_bid_inr);
    return query select v_top.bidder_name, v_incumbent_amount, true;
  end if;
end;
$$;

grant execute on function public.place_bid(uuid, integer) to authenticated;

-- ============================================================
-- Realtime: let the app see new bids and listing changes (anti-snipe
-- extension, pause/resume, sold/hammer) live, from real accounts only.
-- ============================================================
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.bids;
