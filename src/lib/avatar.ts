import type { SupabaseClient } from "@supabase/supabase-js";

// Uploads to a per-user folder (avatars/<uid>/avatar.<ext>) so storage RLS
// can check ownership from the path alone — see supabase/migrations/0002.
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the new image shows immediately after a re-upload.
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

export interface PincodeLookup {
  city?: string;
  state?: string;
  error?: string;
}

// India Post's public pincode API — no key required.
export async function lookupPincode(pincode: string): Promise<PincodeLookup> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    const office = data?.[0]?.PostOffice?.[0];
    if (data?.[0]?.Status !== "Success" || !office) {
      return { error: "Couldn't find that pincode — you can still continue." };
    }
    return { city: office.District, state: office.State };
  } catch {
    return { error: "Couldn't look up that pincode right now." };
  }
}
