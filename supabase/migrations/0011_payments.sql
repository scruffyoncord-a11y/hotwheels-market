-- Real-money features: paid listing boosts and a 7% seller-paid auction
-- fee, both processed via Razorpay. This table is a ledger of what
-- LotClub knows about each payment attempt — the money itself moves
-- through Razorpay; nothing here handles funds directly.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  purpose text not null check (purpose in ('boost', 'auction_fee')),
  listing_id uuid not null references public.listings(id) on delete cascade,
  payer_id uuid not null references auth.users(id) on delete cascade,
  amount_inr integer not null,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Payers can see their own payment history. Creating and verifying a
-- payment always goes through the service-role client from
-- src/app/api/payments/*, never directly from the browser, so no
-- insert/update policy is needed here.
drop policy if exists "payers can view their own payments" on public.payments;
create policy "payers can view their own payments"
  on public.payments for select
  to authenticated
  using (payer_id = auth.uid());

alter table public.listings add column if not exists boosted_until timestamptz;

-- Enforced at the database level (not just in the UI) so a seller can't
-- mark an auction SOLD — from the host console, the profile page's
-- generic "Mark Sold" button, or a raw API call bypassing the app
-- entirely — without the 7% fee actually having been paid first.
create or replace function public.enforce_auction_fee_before_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'AUCTION' and new.status = 'SOLD' and old.status is distinct from 'SOLD' then
    if not exists (
      select 1 from public.payments
      where listing_id = new.id and purpose = 'auction_fee' and status = 'paid'
    ) then
      raise exception 'Pay the auction fee before marking this sold.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_require_auction_fee on public.listings;
create trigger listings_require_auction_fee
before update on public.listings
for each row execute function public.enforce_auction_fee_before_sold();
