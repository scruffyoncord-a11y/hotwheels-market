import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

// Call at the top of every admin page/layout and every admin Server
// Action — each is independently reachable, so each must independently
// re-check. Redirects non-admins back to the marketplace rather than
// revealing that an admin area exists at all.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) redirect("/");

  return user!;
}
