import { createBrowserClient } from "@supabase/ssr";

// A leading-dot domain shares the session cookie across lotclub.in and
// admin.lotclub.in — without it, signing in on the main site doesn't
// authenticate you on the admin subdomain (browsers treat subdomains as
// separate cookie scopes by default). Only applies in production; in
// local dev there's no real domain to scope to, so omit it there.
const cookieOptions = process.env.NODE_ENV === "production" ? { domain: ".lotclub.in" } : undefined;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions },
  );
}
