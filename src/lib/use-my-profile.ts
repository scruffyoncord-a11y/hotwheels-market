"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";
import { getMyProfile, type Profile } from "@/lib/profile";

// Small per-page hook (not a global provider) for the caller's own
// profiles row — only a handful of pages need it (onboarding, settings,
// my collection), so a shared context would be overkill.
export function useMyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    getMyProfile(supabase, user.id).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return { profile, setProfile, loading };
}
