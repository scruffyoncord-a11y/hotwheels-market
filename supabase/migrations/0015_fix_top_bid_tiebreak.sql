-- Real bug: `select * from bids where listing_id = X order by amount_inr
-- desc limit 1` has no tiebreaker. Every bid_increment >= amount_inr,
-- proxy bids from the SAME bidder re-raising their own max keep
-- amount_inr identical across many rows (only max_bid_inr changes) —
-- exactly the case this auction hit (five rows all at amount_inr=250).
-- With ties, Postgres can return ANY of them, so "your top" ended up
-- being an arbitrary old row instead of the true latest one, and the
-- "new max must exceed your current max" check compared against the
-- wrong row — letting a LOWER max (275, then 276) slip in after a
-- higher one (550) had already been recorded.
--
-- Fix: break ties by created_at desc, so among equal amounts the most
-- recent bid always wins — it's always the true current state.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

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

  select * into v_top from bids
    where listing_id = p_listing_id
    order by amount_inr desc, created_at desc
    limit 1;

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

  v_increment := public.bid_increment_for(v_top.amount_inr);

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

-- notify_auction_won() has the same unstable-tie risk picking the
-- "winning" bid — apply the same tiebreaker there.
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
    select * into v_top from bids
      where listing_id = new.id
      order by amount_inr desc, created_at desc
      limit 1;
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
