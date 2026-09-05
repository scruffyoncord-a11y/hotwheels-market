-- Admin panel support: ban flag on profiles + a reports queue.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
--
-- Admin access itself is NOT role-based in the database — it's an email
-- allow-list checked server-side against the ADMIN_EMAILS env var (see
-- src/lib/admin-auth.ts). Every admin read/write goes through the
-- service-role client (src/lib/supabase/admin.ts), which bypasses RLS
-- entirely, so there is no "is_admin" policy to maintain here.

alter table public.profiles
  add column if not exists banned boolean not null default false,
  add column if not exists banned_reason text;

-- ============================================================
-- reports — a user flagging a listing or another user for review.
-- ============================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('listing', 'user')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED', 'DISMISSED')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Reports are write-only from the client's perspective — filing a report
-- doesn't let you read the queue (that's the admin dashboard's job, via
-- the service-role client, which bypasses RLS).
drop policy if exists "authenticated users can file a report" on public.reports;
create policy "authenticated users can file a report"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());
