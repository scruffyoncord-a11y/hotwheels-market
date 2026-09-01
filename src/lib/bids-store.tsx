"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_BIDS } from "./mock-bids";
import type { Bid } from "./types";

const STORAGE_KEY = "hotwheels-market:bids:v1";

interface BidsContextValue {
  bids: Bid[];
  addBid: (bid: Bid) => void;
  removeBid: (id: string) => void;
  bidsForListing: (listingId: string) => Bid[];
  highestBid: (listingId: string) => Bid | undefined;
}

const BidsContext = createContext<BidsContextValue | null>(null);

export function BidsProvider({ children }: { children: React.ReactNode }) {
  const [bids, setBids] = useState<Bid[]>(MOCK_BIDS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const stored: Bid[] = raw ? JSON.parse(raw) : [];
      const storedIds = new Set(stored.map((b) => b.id));
      const newMockBids = MOCK_BIDS.filter((m) => !storedIds.has(m.id));
      setBids([...stored, ...newMockBids]);
    } catch {
      // localStorage unavailable or corrupt — fall back to mock data only
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bids));
    } catch {
      // ignore quota/availability errors
    }
  }, [bids, loaded]);

  const value = useMemo<BidsContextValue>(
    () => ({
      bids,
      addBid: (bid) => setBids((prev) => [bid, ...prev]),
      removeBid: (id) => setBids((prev) => prev.filter((b) => b.id !== id)),
      bidsForListing: (listingId) =>
        bids
          .filter((b) => b.listingId === listingId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      highestBid: (listingId) => {
        const forListing = bids.filter((b) => b.listingId === listingId);
        if (forListing.length === 0) return undefined;
        return forListing.reduce((max, b) => (b.amountInr > max.amountInr ? b : max));
      },
    }),
    [bids],
  );

  return <BidsContext.Provider value={value}>{children}</BidsContext.Provider>;
}

export function useBids() {
  const ctx = useContext(BidsContext);
  if (!ctx) throw new Error("useBids must be used within a BidsProvider");
  return ctx;
}
