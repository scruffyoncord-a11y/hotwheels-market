"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-store";

interface AuctionWatchersContextValue {
  isWatching: (listingId: string) => boolean;
  // Toggles the caller's own "notify me" watch on a scheduled auction.
  // The publicly-visible count on the listing itself is kept in sync
  // server-side by a trigger, not updated here.
  toggleWatch: (listingId: string) => Promise<{ error?: string }>;
}

const AuctionWatchersContext = createContext<AuctionWatchersContextValue | null>(null);

export function AuctionWatchersProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!isAuthenticated || !user.id) {
      setWatchedIds(new Set());
      return;
    }
    let cancelled = false;
    supabase
      .from("auction_watchers")
      .select("listing_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setWatchedIds(new Set((data as { listing_id: string }[]).map((r) => r.listing_id)));
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user.id, supabase]);

  const value = useMemo<AuctionWatchersContextValue>(
    () => ({
      isWatching: (listingId) => watchedIds.has(listingId),
      toggleWatch: async (listingId) => {
        if (!user.id) return { error: "Sign in to get notified." };
        const wasWatching = watchedIds.has(listingId);

        setWatchedIds((prev) => {
          const next = new Set(prev);
          if (wasWatching) next.delete(listingId);
          else next.add(listingId);
          return next;
        });

        const { error } = wasWatching
          ? await supabase
              .from("auction_watchers")
              .delete()
              .eq("listing_id", listingId)
              .eq("user_id", user.id)
          : await supabase
              .from("auction_watchers")
              .insert({ listing_id: listingId, user_id: user.id });

        if (error) {
          setWatchedIds((prev) => {
            const next = new Set(prev);
            if (wasWatching) next.add(listingId);
            else next.delete(listingId);
            return next;
          });
          return { error: error.message };
        }
        return {};
      },
    }),
    [watchedIds, user.id, supabase],
  );

  return (
    <AuctionWatchersContext.Provider value={value}>{children}</AuctionWatchersContext.Provider>
  );
}

export function useAuctionWatchers() {
  const ctx = useContext(AuctionWatchersContext);
  if (!ctx) throw new Error("useAuctionWatchers must be used within an AuctionWatchersProvider");
  return ctx;
}
