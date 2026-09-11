import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely. Only ever
// import this from server-only code (admin routes that have called
// requireAdmin() in src/lib/admin-auth.ts, or other API routes that need
// to read/write tables no RLS policy grants the anon/authenticated role,
// like otp_codes); never expose it to the client.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
