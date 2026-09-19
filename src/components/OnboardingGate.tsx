"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

// Pages a signed-in user without a WhatsApp number can still open — the
// setup page itself, and the legal pages linked from sign-in.
const OPEN_PREFIXES = ["/onboarding", "/login", "/terms", "/privacy", "/refund-policy", "/auth"];

// A verified WhatsApp number is required to use the marketplace, so any
// signed-in account without one (new, or from before it was required)
// is sent to finish setup instead of getting stuck later mid-trade.
export function OnboardingGate() {
  const { user, isAuthenticated, phoneChecked } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const needsPhone = isAuthenticated && !!user.id && phoneChecked && !user.phone;
  const onOpenPage = OPEN_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (needsPhone && !onOpenPage) {
      router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
    }
  }, [needsPhone, onOpenPage, pathname, router]);

  return null;
}
