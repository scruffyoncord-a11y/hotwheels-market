-- Switch auctions from proxy (hidden max) bidding to simple bidding:
-- what you enter is what becomes the visible current bid, immediately.
-- Two different real bidders independently found the proxy mechanic
-- confusing ("why does the price stay flat after I raise my bid?") —
-- with no competing bidder, a proxy bid's visible amount never moves
-- past the starting bid, which is correct eBay-style behavior but not
-- what people here expected.
--
-- place_bid() now takes a plain bid amount instead of a private max.
-- The fixed bid_increment_for() schedule (migration 0014) still
-- enforces a minimum raise over the current bid — that protection was
-- never proxy-bidding-specific. Return type changed (leader_name and
-- you_were_outbid are gone, nothing in the app read them), so the old
-- function has to be dropped before being re-created.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

drop function if exists public.place_bid(uuid, integer);

create function public.place_bid(p_listing_id uuid, p_amount_inr integer)
returns table (leader_amount integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing listings%rowtype;
  v_top bids%rowtype;
  v_bidder_name text;
  v_min_next integer;
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
  if p_amount_inr is null or p_amount_inr <= 0 then
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
    if p_amount_inr < coalesce(v_listing.starting_bid_inr, 0) then
      raise exception 'Bid must be at least the starting bid of %.', coalesce(v_listing.starting_bid_inr, 0);
    end if;
    insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
    values (p_listing_id, auth.uid(), v_bidder_name, p_amount_inr, p_amount_inr);
    return query select p_amount_inr;
    return;
  end if;

  v_min_next := v_top.amount_inr + public.bid_increment_for(v_top.amount_inr);
  if p_amount_inr < v_min_next then
    raise exception 'Bid must be at least %.', v_min_next;
  end if;

  if v_listing.ends_at is not null and v_listing.ends_at - now() < interval '5 minutes' then
    update listings set ends_at = now() + interval '5 minutes' where id = p_listing_id;
  end if;

  insert into bids (listing_id, bidder_id, bidder_name, amount_inr, max_bid_inr)
  values (p_listing_id, auth.uid(), v_bidder_name, p_amount_inr, p_amount_inr);

  if v_top.bidder_id <> auth.uid() then
    insert into notifications (user_id, type, title, body, link)
    values (
      v_top.bidder_id, 'outbid', 'You''ve been outbid',
      'Someone bid higher than you on "' || v_listing.title || '".',
      '/listing/' || p_listing_id
    );
  end if;

  return query select p_amount_inr;
end;
$$;

grant execute on function public.place_bid(uuid, integer) to authenticated;
