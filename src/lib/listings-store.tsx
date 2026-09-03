"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing, ListingStatus } from "./types";

interface ListingRow {
  id: string;
  type: Listing["type"];
  title: string;
  description: string;
  casting_name: string | null;
  series: string | null;
  condition: Listing["condition"];
  price_inr: number | null;
  original_price_inr: number | null;
  wants_in_exchange: string | null;
  starting_bid_inr: number | null;
  bid_increment_inr: number | null;
  buy_now_inr: number | null;
  ends_at: string | null;
  bidding_paused: boolean;
  is_private: boolean;
  access_token: string | null;
  city: string;
  status: ListingStatus;
  images: string[];
  views: number;
  likes: number;
  seller_id: string;
  seller_name: string;
  seller_city: string;
  seller_rating: number;
  seller_deals_completed: number;
  created_at: string;
}

function rowToListing(r: ListingRow): Listing {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    castingName: r.casting_name ?? undefined,
    series: r.series ?? undefined,
    condition: r.condition,
    priceInr: r.price_inr ?? undefined,
    originalPriceInr: r.original_price_inr ?? undefined,
    wantsInExchange: r.wants_in_exchange ?? undefined,
    startingBidInr: r.starting_bid_inr ?? undefined,
    bidIncrementInr: r.bid_increment_inr ?? undefined,
    buyNowInr: r.buy_now_inr ?? undefined,
    endsAt: r.ends_at ?? undefined,
    biddingPaused: r.bidding_paused,
    isPrivate: r.is_private,
    accessToken: r.access_token ?? undefined,
    city: r.city,
    status: r.status,
    images: r.images,
    views: r.views,
    likes: r.likes,
    sellerId: r.seller_id,
    seller: {
      name: r.seller_name,
      city: r.seller_city,
      rating: r.seller_rating,
      dealsCompleted: r.seller_deals_completed,
    },
    createdAt: r.created_at,
  };
}

function listingToRow(l: Listing) {
  return {
    id: l.id,
    type: l.type,
    title: l.title,
    description: l.description,
    casting_name: l.castingName ?? null,
    series: l.series ?? null,
    condition: l.condition,
    price_inr: l.priceInr ?? null,
    original_price_inr: l.originalPriceInr ?? null,
    wants_in_exchange: l.wantsInExchange ?? null,
    starting_bid_inr: l.startingBidInr ?? null,
    bid_increment_inr: l.bidIncrementInr ?? null,
    buy_now_inr: l.buyNowInr ?? null,
    ends_at: l.endsAt ?? null,
    bidding_paused: l.biddingPaused ?? false,
    is_private: l.isPrivate ?? false,
    access_token: l.accessToken ?? null,
    city: l.city,
    status: l.status,
    images: l.images,
    views: l.views ?? 0,
    likes: l.likes ?? 0,
    seller_id: l.sellerId,
    seller_name: l.seller.name,
    seller_city: l.seller.city,
    seller_rating: l.seller.rating,
    seller_deals_completed: l.seller.dealsCompleted,
  };
}

interface ListingsContextValue {
  listings: Listing[];
  loading: boolean;
  addListing: (listing: Listing) => Promise<{ error?: string }>;
  getListing: (id: string) => Listing | undefined;
  updateListingStatus: (id: string, status: ListingStatus) => void;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  removeListing: (id: string) => void;
}

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setListings((data as ListingRow[]).map(rowToListing));
        setLoading(false);
      });

    const channel = supabase
      .channel("listings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setListings((prev) => prev.filter((l) => l.id !== (payload.old as { id: string }).id));
            return;
          }
          const next = rowToListing(payload.new as ListingRow);
          setListings((prev) => {
            const exists = prev.some((l) => l.id === next.id);
            return exists ? prev.map((l) => (l.id === next.id ? next : l)) : [next, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      loading,
      addListing: async (listing) => {
        const { error } = await supabase.from("listings").insert(listingToRow(listing));
        if (error) return { error: error.message };
        return {};
      },
      getListing: (id) => listings.find((l) => l.id === id),
      updateListingStatus: (id, status) => {
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
        void supabase.from("listings").update({ status }).eq("id", id);
      },
      updateListing: (id, patch) => {
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
        const row: Record<string, unknown> = {};
        if ("status" in patch) row.status = patch.status;
        if ("biddingPaused" in patch) row.bidding_paused = patch.biddingPaused;
        if ("endsAt" in patch) row.ends_at = patch.endsAt;
        if ("views" in patch) row.views = patch.views;
        if ("likes" in patch) row.likes = patch.likes;
        if (Object.keys(row).length > 0) void supabase.from("listings").update(row).eq("id", id);
      },
      removeListing: (id) => {
        setListings((prev) => prev.filter((l) => l.id !== id));
        void supabase.from("listings").delete().eq("id", id);
      },
    }),
    [listings, loading, supabase],
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error("useListings must be used within a ListingsProvider");
  return ctx;
}
