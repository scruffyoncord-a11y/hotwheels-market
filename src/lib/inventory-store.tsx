"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_INVENTORY } from "./mock-inventory";
import type { InventoryItem } from "./types";

const STORAGE_KEY = "hotwheels-market:inventory:v1";

interface InventoryContextValue {
  items: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  getItem: (id: string) => InventoryItem | undefined;
  removeItem: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const userItems: InventoryItem[] = JSON.parse(raw);
        setItems([...userItems, ...MOCK_INVENTORY]);
      }
    } catch {
      // localStorage unavailable or corrupt — fall back to mock data only
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const userItems = items.filter((i) => !MOCK_INVENTORY.some((m) => m.id === i.id));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userItems));
    } catch {
      // ignore quota/availability errors
    }
  }, [items, loaded]);

  const value = useMemo<InventoryContextValue>(
    () => ({
      items,
      addItem: (item) => setItems((prev) => [item, ...prev]),
      getItem: (id) => items.find((i) => i.id === id),
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    }),
    [items],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within an InventoryProvider");
  return ctx;
}
