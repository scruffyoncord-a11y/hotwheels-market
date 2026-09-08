-- A public "X offers" count on trade listings. Proposal rows themselves
-- are private (RLS only lets the two parties on a proposal see it — see
-- migration 0005), so a plain visitor browsing the grid can't just count
-- rows in `proposals` for a listing. This denormalizes a count of
-- currently-pending offers onto the (already publicly-readable) listing
-- row instead, kept in sync by a trigger — no proposal details are ever
-- exposed, just a number.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).

alter table public.listings add column if not exists pending_offers_count integer not null default 0;

create or replace function public.sync_listing_pending_offers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    if new.status = 'PENDING' then
      update listings set pending_offers_count = pending_offers_count + 1 where id = new.listing_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if old.status = 'PENDING' and new.status <> 'PENDING' then
      update listings set pending_offers_count = greatest(pending_offers_count - 1, 0) where id = new.listing_id;
    elsif old.status <> 'PENDING' and new.status = 'PENDING' then
      update listings set pending_offers_count = pending_offers_count + 1 where id = new.listing_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if old.status = 'PENDING' then
      update listings set pending_offers_count = greatest(pending_offers_count - 1, 0) where id = old.listing_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists proposals_sync_pending_offers on public.proposals;
create trigger proposals_sync_pending_offers
after insert or update or delete on public.proposals
for each row execute function public.sync_listing_pending_offers();

-- Backfill for any proposals that already existed before this migration.
update public.listings l
set pending_offers_count = coalesce(
  (select count(*) from public.proposals p where p.listing_id = l.id and p.status = 'PENDING'),
  0
);
