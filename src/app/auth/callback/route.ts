import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const hasPincode = !!data.user?.user_metadata?.pincode;
      const { data: phoneRow } = await supabase
        .from("profile_phones")
        .select("phone")
        .eq("id", data.user.id)
        .maybeSingle();
      // A verified WhatsApp number is required to trade, so an account
      // without one (new, or from before it was required) finishes setup first.
      if (!hasPincode || !phoneRow?.phone) {
        return NextResponse.redirect(
          `${origin}/onboarding?next=${encodeURIComponent(next)}`,
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
