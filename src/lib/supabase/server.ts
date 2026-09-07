import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Shares the session cookie across lotclub.in and admin.lotclub.in — see
// the matching comment in supabase/client.ts.
const cookieOptions = process.env.NODE_ENV === "production" ? { domain: ".lotclub.in" } : undefined;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component — the proxy refreshes the
            // session instead, so writes here can be safely ignored.
          }
        },
      },
    },
  );
}
