-- Trade proposals now offer straight from the proposer's private
-- inventory (no separate public listing needed just to make one offer —
-- see migration 0005's comment for why that used to be required). The
-- existing inventory policies (owner, or a public collection) don't cover
-- this: the seller receiving a proposal needs to see the specific items
-- offered even when the proposer's collection is private overall.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

drop policy if exists "counterparty can view items offered in a shared proposal" on public.inventory;
create policy "counterparty can view items offered in a shared proposal"
  on public.inventory for select
  to authenticated
  using (
    exists (
      select 1 from public.proposals p
      where inventory.id = any(p.my_item_ids)
        and (p.seller_id = auth.uid() or p.proposer_id = auth.uid())
    )
  );
