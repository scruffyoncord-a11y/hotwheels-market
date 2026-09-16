-- Scheduled auctions: a seller can set a future start time instead of
-- going live immediately. The listing is visible right away (with a
-- countdown) but bidding is blocked until starts_at. Also adds a
-- "Notify me" watch button for scheduled auctions, with a publicly
-- visible watcher count kept in sync by a trigger (same pattern as
-- pending_offers_count).
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

alter table public.listings
  add column if not exists starts_at timestamptz,
  add column if not exists watchers_count integer not null default 0,
  add column if not exists live_notified boolean not null default false;

-- ============================================================
-- auction_watchers — "notify me when this goes live"
-- ============================================================
create table if not exists public.auction_watchers (
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

alter table public.auction_watchers enable row level security;

drop policy if exists "watch rows are publicly readable" on public.auction_watchers;
create policy "watch rows are publicly readable"
  on public.auction_watchers for select
  using (true);

drop policy if exists "users can watch on their own behalf" on public.auction_watchers;
create policy "users can watch on their own behalf"
  on public.auction_watchers for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can remove their own watch" on public.auction_watchers;
create policy "users can remove their own watch"
  on public.auction_watchers for delete
  to authenticated
  using (user_id = auth.uid());

alter publication supabase_realtime add table public.auction_watchers;

create or replace function public.sync_watchers_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update listings set watchers_count = watchers_count + 1 where id = new.listing_id;
    return new;
  else
    update listings set watchers_count = greatest(watchers_count - 1, 0) where id = old.listing_id;
    return old;
  end if;
end;
$$;

drop trigger if exists trg_watchers_count_ins on public.auction_watchers;
create trigger trg_watchers_count_ins
  after insert on public.auction_watchers
  for each row execute function public.sync_watchers_count();

drop trigger if exists trg_watchers_count_del on public.auction_watchers;
create trigger trg_watchers_count_del
  after delete on public.auction_watchers
  for each row execute function public.sync_watchers_count();

-- ============================================================
-- place_bid — re-defined only to add the "hasn't started yet" check.
-- Everything else is unchanged from migration 0016.
-- ============================================================
create or replace function public.place_bid(p_listing_id uuid, p_amount_inr integer)
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
  if v_listing.starts_at is not null and v_listing.starts_at > now() then
    raise exception 'This auction hasn''t started yet.';
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

-- ============================================================
-- Notifications: allow the new 'auction_live' type
-- ============================================================
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'proposal_received', 'proposal_accepted', 'proposal_declined',
  'trade_completed', 'trade_failed', 'outbid', 'auction_won', 'auction_live'
));

-- ============================================================
-- notify_scheduled_auctions_live — meant to be run on a schedule (every
-- minute) via pg_cron. Notifies everyone watching a scheduled auction
-- the moment its starts_at arrives, then marks it so it's never sent
-- twice.
-- ============================================================
create or replace function public.notify_scheduled_auctions_live()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
begin
  for l in
    select id, title from listings
    where type = 'AUCTION' and status = 'ACTIVE' and starts_at is not null
      and starts_at <= now() and not live_notified
  loop
    insert into notifications (user_id, type, title, body, link)
    select user_id, 'auction_live', 'Auction is live', l.title || ' just went live — place your bid.',
      '/listing/' || l.id
    from auction_watchers where listing_id = l.id;

    update listings set live_notified = true where id = l.id;
  end loop;
end;
$$;

-- Schedules the check above to run every minute. If your Supabase
-- project doesn't have pg_cron available yet, enable it first from the
-- dashboard (Database -> Extensions -> pg_cron), then re-run just the
-- two statements below.
create extension if not exists pg_cron with schema extensions;

-- cron.schedule() upserts by job name, so re-running this migration
-- just re-points the existing job rather than creating a duplicate.
select cron.schedule(
  'notify-scheduled-auctions-live',
  '* * * * *',
  $$select public.notify_scheduled_auctions_live();$$
);
