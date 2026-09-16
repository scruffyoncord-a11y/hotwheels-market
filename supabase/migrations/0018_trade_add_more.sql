-- Trade negotiation: the host (seller who received a proposal) can ask
-- the proposer to sweeten a pending offer with more items; the proposer
-- can then add items from their collection or decline the request.
-- Both moves go through security-definer RPCs (not direct RLS updates)
-- so a seller can never rewrite what the proposer is offering, and a
-- proposer can never add items they don't actually own.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

alter table public.proposals
  add column if not exists more_requested boolean not null default false,
  add column if not exists more_request_note text,
  add column if not exists more_request_declined boolean not null default false;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'proposal_received', 'proposal_accepted', 'proposal_declined',
  'trade_completed', 'trade_failed', 'outbid', 'auction_won', 'auction_live',
  'more_items_requested', 'more_items_added', 'more_items_declined'
));

-- ============================================================
-- request_more_items — seller asks the proposer to add to their offer
-- ============================================================
create or replace function public.request_more_items(p_proposal_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in required.';
  end if;

  select * into v_proposal from proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'Proposal not found.';
  end if;
  if v_proposal.seller_id <> auth.uid() then
    raise exception 'Only the seller can ask for more items.';
  end if;
  if v_proposal.status <> 'PENDING' then
    raise exception 'This proposal is no longer pending.';
  end if;

  update proposals
    set more_requested = true, more_request_note = p_note, more_request_declined = false
    where id = p_proposal_id;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_proposal.proposer_id, 'more_items_requested', 'Asked to add more items',
    v_proposal.seller_name || ' asked you to add more to your offer on "' || v_proposal.listing_title || '".',
    '/offers'
  );
end;
$$;

grant execute on function public.request_more_items(uuid, text) to authenticated;

-- ============================================================
-- respond_to_more_items — proposer adds items or declines the request
-- ============================================================
create or replace function public.respond_to_more_items(
  p_proposal_id uuid,
  p_item_ids uuid[],
  p_decline boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
  v_owned_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in required.';
  end if;

  select * into v_proposal from proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'Proposal not found.';
  end if;
  if v_proposal.proposer_id <> auth.uid() then
    raise exception 'Only the proposer can respond to this request.';
  end if;
  if v_proposal.status <> 'PENDING' then
    raise exception 'This proposal is no longer pending.';
  end if;
  if not v_proposal.more_requested then
    raise exception 'There is no pending request to respond to.';
  end if;

  if p_decline then
    update proposals
      set more_requested = false, more_request_declined = true
      where id = p_proposal_id;

    insert into notifications (user_id, type, title, body, link)
    values (
      v_proposal.seller_id, 'more_items_declined', 'Buyer declined to add more',
      v_proposal.proposer_name || ' didn''t add more items to their offer on "' || v_proposal.listing_title || '".',
      '/offers'
    );
    return;
  end if;

  if p_item_ids is null or array_length(p_item_ids, 1) is null then
    raise exception 'Pick at least one item to add.';
  end if;

  select count(*) into v_owned_count
    from inventory where id = any(p_item_ids) and owner_id = auth.uid();
  if v_owned_count <> array_length(p_item_ids, 1) then
    raise exception 'You can only add items from your own collection.';
  end if;

  update proposals
    set
      my_item_ids = (
        select array_agg(distinct x) from unnest(my_item_ids || p_item_ids) as x
      ),
      more_requested = false,
      more_request_declined = false
    where id = p_proposal_id;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_proposal.seller_id, 'more_items_added', 'Buyer added more items',
    v_proposal.proposer_name || ' added more items to their offer on "' || v_proposal.listing_title || '".',
    '/offers'
  );
end;
$$;

grant execute on function public.respond_to_more_items(uuid, uuid[], boolean) to authenticated;
