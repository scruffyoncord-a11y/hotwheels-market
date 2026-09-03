import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  collectionPublic: boolean;
}

interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  collection_public: boolean;
}

function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    city: r.city,
    collectionPublic: r.collection_public,
  };
}

export async function getMyProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function getProfileByUsername(
  supabase: SupabaseClient,
  username: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data ? rowToProfile(data as ProfileRow) : null;
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

// Upserts the caller's own profile row. Relies on the DB's unique
// constraint on `username` to reject a name someone else already has —
// that's the only race-proof way to enforce uniqueness.
export async function claimUsername(
  supabase: SupabaseClient,
  userId: string,
  username: string,
): Promise<{ error?: string }> {
  const normalized = username.trim().toLowerCase();
  if (!isValidUsername(normalized)) {
    return { error: "Usernames are 3-20 characters: lowercase letters, numbers, underscores." };
  }
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, username: normalized }, { onConflict: "id" });
  if (error) {
    if (error.code === "23505") return { error: "That username is taken." };
    return { error: error.message };
  }
  return {};
}

export async function setCollectionPublic(
  supabase: SupabaseClient,
  userId: string,
  isPublic: boolean,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, collection_public: isPublic }, { onConflict: "id" });
  return error ? { error: error.message } : {};
}

// Keeps the public-readable profiles row in sync with whatever identity
// fields change — auth.users.user_metadata isn't queryable by other
// visitors, so this denormalized copy is the only thing a public
// profile page (or username search) has to read from.
export async function syncProfileIdentity(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<{ displayName: string; avatarUrl: string; city: string }>,
): Promise<void> {
  const row: Record<string, unknown> = { id: userId };
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (patch.city !== undefined) row.city = patch.city;
  if (Object.keys(row).length > 1) {
    await supabase.from("profiles").upsert(row, { onConflict: "id" });
  }
}
