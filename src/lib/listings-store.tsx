"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_LISTINGS } from "./mock-listings";
import type { Listing, ListingStatus } from "./types";

const STORAGE_KEY = "hotwheels-market:listings:v1";

interface ListingsContextValue {
  listings: Listing[];
  addListing: (listing: Listing) => void;
  getListing: (id: string) => Listing | undefined;
  updateListingStatus: (id: string, status: ListingStatus) => void;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  removeListing: (id: string) => void;
}

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const userListings: Listing[] = JSON.parse(raw);
        setListings([...userListings, ...MOCK_LISTINGS]);
      }
    } catch {
      // localStorage unavailable or corrupt — fall back to mock data only
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const userListings = listings.filter((l) => !MOCK_LISTINGS.some((m) => m.id === l.id));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userListings));
    } catch {
      // ignore quota/availability errors
    }
  }, [listings, loaded]);

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      addListing: (listing) => setListings((prev) => [listing, ...prev]),
      getListing: (id) => listings.find((l) => l.id === id),
      updateListingStatus: (id, status) =>
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l))),
      updateListing: (id, patch) =>
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l))),
      removeListing: (id) => setListings((prev) => prev.filter((l) => l.id !== id)),
    }),
    [listings],
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error("useListings must be used within a ListingsProvider");
  return ctx;
}
