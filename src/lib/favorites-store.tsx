"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hotwheels-market:favorites:v1";

interface FavoritesContextValue {
  favoriteIds: string[];
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {
      // localStorage unavailable or corrupt — start with an empty wishlist
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // ignore quota/availability errors
    }
  }, [favoriteIds, loaded]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isFavorited: (listingId) => favoriteIds.includes(listingId),
      toggleFavorite: (listingId) =>
        setFavoriteIds((prev) =>
          prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [listingId, ...prev],
        ),
    }),
    [favoriteIds],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
