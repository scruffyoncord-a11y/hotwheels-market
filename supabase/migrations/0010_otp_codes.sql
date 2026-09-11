-- Short-lived storage for WhatsApp OTP codes used by phone sign-in.
-- Only ever touched by the service-role client from server-side API
-- routes (src/app/api/otp/*), never directly by a browser — RLS with no
-- policies at all denies anon/authenticated access outright.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.otp_codes (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.otp_codes enable row level security;
