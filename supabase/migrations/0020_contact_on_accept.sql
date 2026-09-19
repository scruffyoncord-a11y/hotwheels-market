-- Reveal the counterparty's WhatsApp number as soon as a trade is
-- ACCEPTED (not only after both sides confirm it COMPLETED) — the two
-- people need each other's contact to actually arrange the handover
-- before there's anything to confirm.
-- Also: a WhatsApp number can only belong to one account.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

create unique index if not exists profile_phones_phone_key
  on public.profile_phones (phone);

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
  if v_proposal.status not in ('ACCEPTED', 'COMPLETED') then
    raise exception 'Contact details are shared once a trade is accepted.';
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
