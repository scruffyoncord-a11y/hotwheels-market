import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely. Only ever
// import this from admin server code that has already called
// requireAdmin() (src/lib/admin-auth.ts); never expose it to the client
// or use it to serve regular user-facing requests.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
