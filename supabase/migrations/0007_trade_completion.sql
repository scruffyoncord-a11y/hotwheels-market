-- Trade completion confirmation flow. Accepting a proposal only meant
-- "let's do this" — it never tracked whether the handover actually
-- happened. Adds a per-side outcome (did the trade go through?) and two
-- RPCs, following the same security-definer pattern as place_bid(): the
-- client can only ever call these functions, never write the outcome
-- columns or the resulting listing status directly.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

alter table public.proposals drop constraint if exists proposals_status_check;
alter table public.proposals add constraint proposals_status_check
  check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED'));

alter table public.proposals
  add column if not exists seller_outcome text not null default 'PENDING'
    check (seller_outcome in ('PENDING', 'COMPLETED', 'FAILED')),
  add column if not exists proposer_outcome text not null default 'PENDING'
    check (proposer_outcome in ('PENDING', 'COMPLETED', 'FAILED'));

-- ============================================================
-- confirm_trade_outcome — either side reports whether the handover
-- actually happened, once. If both sides confirm it did, the trade is
-- finalized: the listing is marked SOLD (permanently off the
-- marketplace) and the proposal is marked COMPLETED. If either side
-- says it didn't happen, the proposal is marked DECLINED right away —
-- the listing is left RESERVED, awaiting the seller's call on
-- resolve_failed_trade() below.
-- ============================================================
create or replace function public.confirm_trade_outcome(p_proposal_id uuid, p_completed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
  v_outcome text := case when p_completed then 'COMPLETED' else 'FAILED' end;
begin
  select * into v_proposal from proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'Proposal not found.';
  end if;
  if v_proposal.status <> 'ACCEPTED' then
    raise exception 'This trade isn''t awaiting confirmation.';
  end if;

  if auth.uid() = v_proposal.seller_id then
    update proposals set seller_outcome = v_outcome where id = p_proposal_id;
    v_proposal.seller_outcome := v_outcome;
  elsif auth.uid() = v_proposal.proposer_id then
    update proposals set proposer_outcome = v_outcome where id = p_proposal_id;
    v_proposal.proposer_outcome := v_outcome;
  else
    raise exception 'You are not part of this trade.';
  end if;

  if not p_completed then
    update proposals set status = 'DECLINED' where id = p_proposal_id;
  elsif v_proposal.seller_outcome = 'COMPLETED' and v_proposal.proposer_outcome = 'COMPLETED' then
    update proposals set status = 'COMPLETED' where id = p_proposal_id;
    update listings set status = 'SOLD' where id = v_proposal.listing_id;
  end if;
end;
$$;

grant execute on function public.confirm_trade_outcome(uuid, boolean) to authenticated;

-- ============================================================
-- resolve_failed_trade — only the seller, only once a FAILED outcome
-- has left their listing stuck at RESERVED with nothing decided yet.
-- ============================================================
create or replace function public.resolve_failed_trade(p_proposal_id uuid, p_relist boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
begin
  select * into v_proposal from proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'Proposal not found.';
  end if;
  if auth.uid() <> v_proposal.seller_id then
    raise exception 'Only the seller can resolve this.';
  end if;
  if v_proposal.status <> 'DECLINED'
     or (v_proposal.seller_outcome <> 'FAILED' and v_proposal.proposer_outcome <> 'FAILED') then
    raise exception 'This trade has nothing to resolve.';
  end if;

  if p_relist then
    update listings set status = 'ACTIVE' where id = v_proposal.listing_id and status = 'RESERVED';
  else
    delete from listings where id = v_proposal.listing_id;
  end if;
end;
$$;

grant execute on function public.resolve_failed_trade(uuid, boolean) to authenticated;
