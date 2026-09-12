-- Real per-user trade ratings, replacing the hardcoded "star 5.0" that
-- used to show everywhere. Each side of a COMPLETED trade can rate the
-- other exactly once, star ratings roll up into a running sum/count on
-- profiles (public, cheap to read on every listing/profile view).
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

alter table public.profiles
  add column if not exists rating_sum integer not null default 0,
  add column if not exists rating_count integer not null default 0;

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  ratee_id uuid not null references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  unique (proposal_id, rater_id)
);

alter table public.ratings enable row level security;

drop policy if exists "raters can view their own ratings" on public.ratings;
create policy "raters can view their own ratings"
  on public.ratings for select
  to authenticated
  using (rater_id = auth.uid());

-- ============================================================
-- submit_trade_rating — either side of a COMPLETED trade rates the
-- other, once. Following the confirm_trade_outcome() pattern: the
-- client only ever calls this function, never writes ratings or the
-- profiles rollup columns directly.
-- ============================================================
create or replace function public.submit_trade_rating(p_proposal_id uuid, p_stars smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
  v_ratee uuid;
begin
  if p_stars < 1 or p_stars > 5 then
    raise exception 'Rating must be between 1 and 5 stars.';
  end if;

  select * into v_proposal from proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'Trade not found.';
  end if;
  if v_proposal.status <> 'COMPLETED' then
    raise exception 'You can only rate a completed trade.';
  end if;

  if auth.uid() = v_proposal.seller_id then
    v_ratee := v_proposal.proposer_id;
  elsif auth.uid() = v_proposal.proposer_id then
    v_ratee := v_proposal.seller_id;
  else
    raise exception 'You are not part of this trade.';
  end if;

  if exists (select 1 from ratings where proposal_id = p_proposal_id and rater_id = auth.uid()) then
    raise exception 'You already rated this trade.';
  end if;

  insert into ratings (proposal_id, rater_id, ratee_id, stars)
  values (p_proposal_id, auth.uid(), v_ratee, p_stars);

  insert into profiles (id, rating_sum, rating_count)
  values (v_ratee, p_stars, 1)
  on conflict (id) do update
    set rating_sum = profiles.rating_sum + excluded.rating_sum,
        rating_count = profiles.rating_count + 1;
end;
$$;

grant execute on function public.submit_trade_rating(uuid, smallint) to authenticated;
