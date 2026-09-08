import type { SupabaseClient } from "@supabase/supabase-js";

// Uploads to a per-user folder (car-photos/<uid>/<random>.<ext>) so storage
// RLS can check ownership from the path alone — see supabase/migrations/0009.
// A listing or inventory item can have several photos, unlike an avatar, so
// each upload gets its own random filename rather than one fixed name.
export async function uploadCarPhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("car-photos")
    .upload(path, file, { cacheControl: "31536000" });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("car-photos").getPublicUrl(path);
  return { url: data.publicUrl };
}
