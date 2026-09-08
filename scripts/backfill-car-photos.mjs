// One-time backfill: converts existing base64 data-URI images in
// `listings.images` and `inventory.image` into real Supabase Storage
// uploads, replacing the column value with the resulting public URL.
// Safe to re-run — anything that's already a real URL is left alone.
//
// Usage: node scripts/backfill-car-photos.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].trim();
  }
}
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function decodeDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!match) return null;
  const [, mime, base64] = match;
  const ext = mime.split("/")[1]?.split("+")[0] || "jpg";
  return { buffer: Buffer.from(base64, "base64"), mime, ext };
}

async function uploadDataUrl(dataUrl, path) {
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return null;
  const { error } = await supabase.storage
    .from("car-photos")
    .upload(path, decoded.buffer, { contentType: decoded.mime, cacheControl: "31536000", upsert: true });
  if (error) {
    console.error(`  upload failed for ${path}:`, error.message);
    return null;
  }
  return supabase.storage.from("car-photos").getPublicUrl(path).data.publicUrl;
}

async function backfillListings() {
  const { data: listings, error } = await supabase.from("listings").select("id, seller_id, images");
  if (error) throw error;

  let converted = 0;
  for (const listing of listings) {
    if (!listing.images?.some((img) => img.startsWith("data:"))) continue;

    const newImages = [];
    for (let i = 0; i < listing.images.length; i++) {
      const img = listing.images[i];
      if (!img.startsWith("data:")) {
        newImages.push(img);
        continue;
      }
      const decoded = decodeDataUrl(img);
      const path = `${listing.seller_id}/migrated-${listing.id}-${i}.${decoded?.ext ?? "jpg"}`;
      const url = await uploadDataUrl(img, path);
      newImages.push(url ?? img); // keep the original if upload somehow fails
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({ images: newImages })
      .eq("id", listing.id);
    if (updateError) {
      console.error(`  failed to update listing ${listing.id}:`, updateError.message);
      continue;
    }
    converted++;
    console.log(`  listing ${listing.id}: converted ${newImages.length} image(s)`);
  }
  console.log(`Listings: ${converted} row(s) updated.`);
}

async function backfillInventory() {
  const { data: items, error } = await supabase.from("inventory").select("id, owner_id, image");
  if (error) throw error;

  let converted = 0;
  for (const item of items) {
    if (!item.image?.startsWith("data:")) continue;
    const decoded = decodeDataUrl(item.image);
    const path = `${item.owner_id}/migrated-${item.id}.${decoded?.ext ?? "jpg"}`;
    const url = await uploadDataUrl(item.image, path);
    if (!url) continue;

    const { error: updateError } = await supabase.from("inventory").update({ image: url }).eq("id", item.id);
    if (updateError) {
      console.error(`  failed to update inventory ${item.id}:`, updateError.message);
      continue;
    }
    converted++;
    console.log(`  inventory ${item.id}: converted`);
  }
  console.log(`Inventory: ${converted} row(s) updated.`);
}

console.log("Backfilling listings...");
await backfillListings();
console.log("Backfilling inventory...");
await backfillInventory();
console.log("Done.");
