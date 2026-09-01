"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hotwheels-market:auth:v1";

export type AuthProvider = "guest" | "google" | "phone";

export interface AuthUser {
  // Shown throughout the UI (header, profile hero, settings).
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  provider: AuthProvider;
  awayMode?: boolean;
  // Every trade/bid/listing in this demo is owned by the fixed "You"
  // identity so existing marketplace data keeps matching correctly —
  // signing in only changes what's *shown*, not who "you" are internally.
  readonly ownerKey: "You";
}

const GUEST_USER: AuthUser = {
  displayName: "You",
  provider: "guest",
  ownerKey: "You",
};

interface AuthContextValue {
  user: AuthUser;
  isAuthenticated: boolean;
  signInWithGoogle: () => void;
  signInWithPhone: (phone: string) => void;
  updateProfile: (patch: Partial<Pick<AuthUser, "displayName" | "phone">>) => void;
  setAwayMode: (away: boolean) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// A few demo identities so "Continue with Google" feels real without a
// real OAuth app behind it yet.
const DEMO_GOOGLE_IDENTITIES = [
  { displayName: "Rahul Menon", email: "rahul.menon@gmail.com" },
  { displayName: "Ananya Iyer", email: "ananya.iyer@gmail.com" },
  { displayName: "Kabir Shah", email: "kabir.shah@gmail.com" },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(GUEST_USER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser({ ...GUEST_USER, ...JSON.parse(raw) });
    } catch {
      // localStorage unavailable or corrupt — fall back to guest
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore quota/availability errors
    }
  }, [user, loaded]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user.provider !== "guest",
      signInWithGoogle: () => {
        const identity =
          DEMO_GOOGLE_IDENTITIES[Math.floor(Math.random() * DEMO_GOOGLE_IDENTITIES.length)];
        setUser({
          displayName: identity.displayName,
          email: identity.email,
          avatarUrl: undefined,
          provider: "google",
          ownerKey: "You",
        });
      },
      signInWithPhone: (phone) => {
        setUser((prev) => ({
          displayName: prev.provider === "guest" ? "You" : prev.displayName,
          email: prev.email,
          phone,
          avatarUrl: prev.avatarUrl,
          provider: "phone",
          ownerKey: "You",
        }));
      },
      updateProfile: (patch) => setUser((prev) => ({ ...prev, ...patch })),
      setAwayMode: (away) => setUser((prev) => ({ ...prev, awayMode: away })),
      signOut: () => setUser(GUEST_USER),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
