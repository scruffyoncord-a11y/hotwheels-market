-- Storage bucket for listing and inventory photos.
--
-- These were previously converted to base64 data URIs client-side and
-- stored directly in the listings.images / inventory.image columns —
-- meaning every single fetch of the listings grid (or anyone's
-- collection) downloaded the full weight of every photo inline in the
-- JSON response, before a single pixel could render. That's the real
-- cause of "it takes 3-5+ seconds for the page to show anything" — the
-- data-fetch itself was shipping megabytes of embedded images upfront
-- instead of a lightweight query the browser can render immediately
-- and load images into progressively.
--
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Run this BEFORE deploying the code changes that use it.

insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

drop policy if exists "Car photos are publicly accessible" on storage.objects;
create policy "Car photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'car-photos');

drop policy if exists "Users can upload their own car photos" on storage.objects;
create policy "Users can upload their own car photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own car photos" on storage.objects;
create policy "Users can delete their own car photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-photos' and (storage.foldername(name))[1] = auth.uid()::text);
