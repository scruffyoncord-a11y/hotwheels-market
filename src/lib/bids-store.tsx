"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bid } from "./types";

interface BidRow {
  id: string;
  listing_id: string;
  bidder_id: string;
  bidder_name: string;
  amount_inr: number;
  max_bid_inr: number;
  created_at: string;
}

function rowToBid(r: BidRow): Bid {
  return {
    id: r.id,
    listingId: r.listing_id,
    bidderId: r.bidder_id,
    bidderName: r.bidder_name,
    amountInr: r.amount_inr,
    maxBidInr: r.max_bid_inr,
    createdAt: r.created_at,
  };
}

export type PlaceBidResult = { error: string } | { leaderAmount: number };

interface BidsContextValue {
  bids: Bid[];
  loading: boolean;
  bidsForListing: (listingId: string) => Bid[];
  highestBid: (listingId: string) => Bid | undefined;
  // The only way a bid can ever be created — enforced server-side by the
  // place_bid() Postgres function: requires a real signed-in account,
  // blocks the listing's own seller, and enforces the minimum-raise
  // schedule itself so the client can never fabricate or lowball a bid.
  // Simple bidding: the amount you pass in becomes the visible current
  // bid immediately (no hidden proxy max).
  placeBid: (listingId: string, amountInr: number) => Promise<PlaceBidResult>;
}

const BidsContext = createContext<BidsContextValue | null>(null);

export function BidsProvider({ children }: { children: React.ReactNode }) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("bids")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setBids((data as BidRow[]).map(rowToBid));
        setLoading(false);
      });

    const channel = supabase
      .channel("bids-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids" },
        (payload) => {
          const next = rowToBid(payload.new as BidRow);
          setBids((prev) => (prev.some((b) => b.id === next.id) ? prev : [next, ...prev]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const value = useMemo<BidsContextValue>(
    () => ({
      bids,
      loading,
      bidsForListing: (listingId) =>
        bids
          .filter((b) => b.listingId === listingId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      highestBid: (listingId) => {
        const forListing = bids.filter((b) => b.listingId === listingId);
        if (forListing.length === 0) return undefined;
        // Ties on amountInr are real (proxy bids from the same bidder
        // re-raising their own max keep the same amount) — break them by
        // createdAt so the most recent bid always wins, matching
        // place_bid()'s tiebreak server-side.
        return forListing.reduce((max, b) => {
          if (b.amountInr !== max.amountInr) return b.amountInr > max.amountInr ? b : max;
          return b.createdAt > max.createdAt ? b : max;
        });
      },
      placeBid: async (listingId, amountInr) => {
        const { data, error } = await supabase
          .rpc("place_bid", { p_listing_id: listingId, p_amount_inr: amountInr })
          .single();
        if (error) return { error: error.message };
        const row = data as { leader_amount: number };
        return { leaderAmount: row.leader_amount };
      },
    }),
    [bids, loading, supabase],
  );

  return <BidsContext.Provider value={value}>{children}</BidsContext.Provider>;
}

export function useBids() {
  const ctx = useContext(BidsContext);
  if (!ctx) throw new Error("useBids must be used within a BidsProvider");
  return ctx;
}
