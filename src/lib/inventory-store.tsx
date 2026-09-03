"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import type { InventoryItem } from "./types";

interface InventoryRow {
  id: string;
  owner_id: string;
  title: string;
  casting_name: string | null;
  series: string | null;
  condition: InventoryItem["condition"];
  notes: string | null;
  image: string;
  created_at: string;
}

function rowToItem(r: InventoryRow): InventoryItem {
  return {
    id: r.id,
    title: r.title,
    castingName: r.casting_name ?? undefined,
    series: r.series ?? undefined,
    condition: r.condition,
    notes: r.notes ?? undefined,
    image: r.image,
    createdAt: r.created_at,
  };
}

type NewInventoryItem = Omit<InventoryItem, "id" | "createdAt">;

interface InventoryContextValue {
  items: InventoryItem[];
  loading: boolean;
  addItem: (item: NewInventoryItem) => Promise<{ error?: string }>;
  getItem: (id: string) => InventoryItem | undefined;
  removeItem: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("inventory")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setItems((data as InventoryRow[]).map(rowToItem));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, supabase]);

  const value = useMemo<InventoryContextValue>(
    () => ({
      items,
      loading,
      addItem: async (item) => {
        if (!user.id) return { error: "Sign in to add to your collection." };
        const { data, error } = await supabase
          .from("inventory")
          .insert({
            owner_id: user.id,
            title: item.title,
            casting_name: item.castingName ?? null,
            series: item.series ?? null,
            condition: item.condition,
            notes: item.notes ?? null,
            image: item.image,
          })
          .select()
          .single();
        if (error) return { error: error.message };
        setItems((prev) => [rowToItem(data as InventoryRow), ...prev]);
        return {};
      },
      getItem: (id) => items.find((i) => i.id === id),
      removeItem: (id) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        void supabase.from("inventory").delete().eq("id", id);
      },
    }),
    [items, loading, supabase, user.id],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within an InventoryProvider");
  return ctx;
}
