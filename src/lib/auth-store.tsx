"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { syncProfileIdentity } from "@/lib/profile";

const STORAGE_KEY = "hotwheels-market:auth:v1";

export type AuthProvider = "guest" | "google" | "phone";

export interface AuthUser {
  // Shown throughout the UI (header, profile hero, settings).
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  pincode?: string;
  provider: AuthProvider;
  awayMode?: boolean;
  // Real Supabase auth.uid() for a signed-in Google user, null otherwise.
  // Listings and bids are owned by this id — it's the only thing an
  // "is this actually my listing / my bid" check should ever compare
  // against, since it's real and shared across every visitor's account.
  id: string | null;
  // Trade proposals/favorites/inventory still live in localStorage (not
  // migrated yet), so they keep matching against this fixed sentinel
  // rather than `id` — signing in only changes what's *shown* for those.
  readonly ownerKey: "You";
}

const GUEST_USER: AuthUser = {
  displayName: "You",
  provider: "guest",
  id: null,
  ownerKey: "You",
};

interface AuthContextValue {
  user: AuthUser;
  isAuthenticated: boolean;
  googleBusy: boolean;
  signInWithGoogle: (next?: string) => Promise<void>;
  signInWithPhone: (phone: string) => void;
  updateProfile: (
    patch: Partial<Pick<AuthUser, "displayName" | "phone" | "avatarUrl" | "city" | "pincode">>,
  ) => Promise<void>;
  setAwayMode: (away: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function fromSupabaseUser(supaUser: User): AuthUser {
  const meta = supaUser.user_metadata ?? {};
  return {
    displayName: meta.full_name ?? meta.name ?? supaUser.email ?? "You",
    email: supaUser.email ?? undefined,
    avatarUrl: meta.avatar_url ?? meta.picture ?? undefined,
    city: meta.city ?? undefined,
    pincode: meta.pincode ?? undefined,
    provider: "google",
    id: supaUser.id,
    ownerKey: "You",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(GUEST_USER);
  const [loaded, setLoaded] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Local (non-Supabase) session: guest or fake-phone, kept in localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.provider !== "google") setUser({ ...GUEST_USER, ...parsed });
      }
    } catch {
      // localStorage unavailable or corrupt — fall back to guest
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || user.provider === "google") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore quota/availability errors
    }
  }, [user, loaded]);

  // Real Supabase session: source of truth for Google sign-in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(fromSupabaseUser(data.session.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(fromSupabaseUser(session.user));
      } else if (event === "SIGNED_OUT") {
        setUser(GUEST_USER);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user.provider !== "guest",
      googleBusy,
      signInWithGoogle: async (next = "/profile") => {
        setGoogleBusy(true);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) setGoogleBusy(false);
        // On success the browser navigates to Google, so no further action here.
      },
      signInWithPhone: (phone) => {
        setUser((prev) => ({
          displayName: prev.provider === "guest" ? "You" : prev.displayName,
          email: prev.email,
          phone,
          avatarUrl: prev.avatarUrl,
          provider: "phone",
          id: null,
          ownerKey: "You",
        }));
      },
      updateProfile: async (patch) => {
        setUser((prev) => ({ ...prev, ...patch }));
        if (user.provider !== "google" || !user.id) return;
        // Persist to the real account so it survives a session refresh —
        // onAuthStateChange (USER_UPDATED) then re-syncs `user` from Supabase.
        const data: Record<string, string> = {};
        if (patch.displayName !== undefined) data.full_name = patch.displayName;
        if (patch.avatarUrl !== undefined) data.avatar_url = patch.avatarUrl;
        if (patch.city !== undefined) data.city = patch.city;
        if (patch.pincode !== undefined) data.pincode = patch.pincode;
        if (Object.keys(data).length > 0) await supabase.auth.updateUser({ data });
        // Also mirror the public-facing fields into `profiles` — other
        // visitors can't read user_metadata, only this denormalized copy.
        await syncProfileIdentity(supabase, user.id, {
          displayName: patch.displayName,
          avatarUrl: patch.avatarUrl,
          city: patch.city,
        });
      },
      setAwayMode: (away) => setUser((prev) => ({ ...prev, awayMode: away })),
      signOut: async () => {
        if (user.provider === "google") await supabase.auth.signOut();
        setUser(GUEST_USER);
      },
    }),
    [user, googleBusy, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
