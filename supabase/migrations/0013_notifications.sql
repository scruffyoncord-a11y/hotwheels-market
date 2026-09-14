-- Real notifications for trade + auction events. Rows are only ever
-- written by security-definer trigger functions (or place_bid(), also
-- security definer) — never inserted directly by a client, so a
-- notification can't be forged as coming from an event that didn't
-- happen.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'proposal_received', 'proposal_accepted', 'proposal_declined',
    'trade_completed', 'trade_failed', 'outbid', 'auction_won'
  )),
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "users can read their own notifications" on public.notifications;
create policy "users can read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can mark their own notifications read" on public.notifications;
create policy "users can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- New proposal -> notify the seller
-- ============================================================
create or replace function public.notify_new_proposal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, type, title, body, link)
  values (
    new.seller_id,
    'proposal_received',
    'New trade proposal',
    new.proposer_name || ' wants to trade for "' || new.listing_title || '"',
    '/offers'
  );
  return new;
end;
$$;

drop trigger if exists proposals_notify_new on public.proposals;
create trigger proposals_notify_new
after insert on public.proposals
for each row execute function public.notify_new_proposal();

-- ============================================================
-- Proposal status changes -> notify whoever needs to know
-- ============================================================
create or replace function public.notify_proposal_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'ACCEPTED' then
      insert into notifications (user_id, type, title, body, link)
      values (
        new.proposer_id, 'proposal_accepted', 'Proposal accepted!',
        new.seller_name || ' accepted your trade for "' || new.listing_title || '"',
        '/trade/' || new.id
      );
    elsif new.status = 'DECLINED' and old.status = 'PENDING' then
      insert into notifications (user_id, type, title, body, link)
      values (
        new.proposer_id, 'proposal_declined', 'Proposal declined',
        new.seller_name || ' declined your trade for "' || new.listing_title || '"',
        '/offers'
      );
    elsif new.status = 'DECLINED' and old.status = 'ACCEPTED' then
      insert into notifications (user_id, type, title, body, link)
      values (
        new.proposer_id, 'trade_failed', 'Trade didn''t go through',
        'The trade for "' || new.listing_title || '" didn''t happen.',
        '/trade/' || new.id
      );
      insert into notifications (user_id, type, title, body, link)
      values (
        new.seller_id, 'trade_failed', 'Trade didn''t go through',
        'The trade for "' || new.listing_title || '" didn''t happen.',
        '/trade/' || new.id
      );
    elsif new.status = 'COMPLETED' then
      insert into notifications (user_id, type, title, body, link)
      values (
        new.proposer_id, 'trade_completed', 'Trade completed!',
        'Your trade for "' || new.listing_title || '" is complete.',
        '/trade/' || new.id
      );
      insert into notifications (user_id, type, title, body, link)
      values (
        new.seller_id, 'trade_completed', 'Trade completed!',
        'Your trade for "' || new.listing_title || '" is complete.',
        '/trade/' || new.id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_notify_status on public.proposals;
create trigger proposals_notify_status
after update on public.proposals
for each row execute function public.notify_proposal_status_change();

-- ============================================================
-- Auction marked SOLD -> notify the winning bidder
-- ============================================================
create or replace function public.notify_auction_won()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_top bids%rowtype;
begin
  if new.type = 'AUCTION' and new.status = 'SOLD' and old.status is distinct from 'SOLD' then
    select * into v_top from bids where listing_id = new.id order by amount_inr desc limit 1;
    if found then
      insert into notifications (user_id, type, title, body, link)
      values (
        v_top.bidder_id, 'auction_won', 'You won the auction!',
        'Your winning bid on "' || new.title || '" was ' || v_top.amount_inr || ' INR.',
        '/listing/' || new.id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_notify_auction_won on public.listings;
create trigger listings_notify_auction_won
after update on public.listings
for each row execute function public.notify_auction_won();

-- ============================================================
-- place_bid — re-defined to also notify whoever just got outbid.
-- Everything above the two new "insert into notifications" blocks is
-- unchanged from migration 0001.
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
    insert into notifications (user_id, type, title, body, link)
    values (
      v_top.bidder_id, 'outbid', 'You''ve been outbid',
      'Someone bid higher than you on "' || v_listing.title || '".',
      '/listing/' || p_listing_id
    );
    return query select v_bidder_name, v_challenger_amount, false;
  else
    -- Incumbent auto-defends immediately, same as eBay/Goldin proxy bidding.
    v_incumbent_amount := least(v_top.max_bid_inr, p_max_bid_inr + v_increment);
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, auth.uid(), v_bidder_name, p_max_bid_inr, p_max_bid_inr);
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, v_top.bidder_id, v_top.bidder_name, v_incumbent_amount, v_top.max_bid_inr);
    insert into notifications (user_id, type, title, body, link)
    values (
      auth.uid(), 'outbid', 'You''ve been outbid',
      'Someone defended their bid on "' || v_listing.title || '".',
      '/listing/' || p_listing_id
    );
    return query select v_top.bidder_name, v_incumbent_amount, true;
  end if;
end;
$$;

grant execute on function public.place_bid(uuid, integer) to authenticated;
