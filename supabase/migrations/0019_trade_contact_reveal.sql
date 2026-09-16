-- Once a trade is COMPLETED, each side can see the other's WhatsApp
-- number so they can coordinate a handover directly.
--
-- Phone numbers live in their own table, never in `profiles` (which is
-- publicly readable via `select *` all over the app) — this is the only
-- way to guarantee a phone number is never accidentally exposed to
-- everyone. The only way to ever read someone else's number is the
-- get_trade_contact() RPC below, which only releases it to the other
-- party of a trade that's actually COMPLETED.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.profile_phones (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null,
  updated_at timestamptz not null default now()
);

alter table public.profile_phones enable row level security;

drop policy if exists "users can read their own phone" on public.profile_phones;
create policy "users can read their own phone"
  on public.profile_phones for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "users can set their own phone" on public.profile_phones;
create policy "users can set their own phone"
  on public.profile_phones for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "users can update their own phone" on public.profile_phones;
create policy "users can update their own phone"
  on public.profile_phones for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- get_trade_contact — the counterparty's WhatsApp number, only once
-- the trade is COMPLETED and only for the two people actually on it.
-- ============================================================
create or replace function public.get_trade_contact(p_proposal_id uuid)
returns table (phone text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals%rowtype;
  v_counterparty_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required.';
  end if;

  select * into v_proposal from proposals where id = p_proposal_id;
  if not found then
    raise exception 'Trade not found.';
  end if;
  if v_proposal.status <> 'COMPLETED' then
    raise exception 'Contact details are only shared once a trade is completed.';
  end if;

  if v_proposal.seller_id = auth.uid() then
    v_counterparty_id := v_proposal.proposer_id;
  elsif v_proposal.proposer_id = auth.uid() then
    v_counterparty_id := v_proposal.seller_id;
  else
    raise exception 'You are not part of this trade.';
  end if;

  return query select pp.phone from profile_phones pp where pp.id = v_counterparty_id;
end;
$$;

grant execute on function public.get_trade_contact(uuid) to authenticated;
