"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import type { ProposalStatus, TradeProposal } from "./types";

interface ProposalRow {
  id: string;
  listing_id: string;
  listing_title: string;
  seller_id: string;
  seller_name: string;
  proposer_id: string;
  proposer_name: string;
  my_item_ids: string[];
  my_cash_inr: number;
  their_item_ids: string[];
  note: string | null;
  status: ProposalStatus;
  created_at: string;
}

function rowToProposal(r: ProposalRow): TradeProposal {
  return {
    id: r.id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    proposerId: r.proposer_id,
    proposerName: r.proposer_name,
    myItemIds: r.my_item_ids ?? [],
    myCash: r.my_cash_inr,
    theirItemIds: r.their_item_ids ?? [],
    note: r.note ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  };
}

interface ProposalsContextValue {
  proposals: TradeProposal[];
  loading: boolean;
  addProposal: (proposal: Omit<TradeProposal, "id" | "createdAt">) => Promise<{ error?: string }>;
  updateProposalStatus: (id: string, status: ProposalStatus) => Promise<void>;
}

const ProposalsContext = createContext<ProposalsContextValue | null>(null);

export function ProposalsProvider({ children }: { children: React.ReactNode }) {
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Guests and phone-only sessions have no real account, so there's
    // nothing to fetch — RLS would return nothing anyway.
    if (!user.id) {
      setProposals([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("proposals")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setProposals((data as ProposalRow[]).map(rowToProposal));
        setLoading(false);
      });

    const channel = supabase
      .channel("proposals-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "proposals" },
        (payload) => {
          const next = rowToProposal(payload.new as ProposalRow);
          setProposals((prev) => (prev.some((p) => p.id === next.id) ? prev : [next, ...prev]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "proposals" },
        (payload) => {
          const next = rowToProposal(payload.new as ProposalRow);
          setProposals((prev) => prev.map((p) => (p.id === next.id ? next : p)));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, user.id]);

  const value = useMemo<ProposalsContextValue>(
    () => ({
      proposals,
      loading,
      addProposal: async (proposal) => {
        const { data, error } = await supabase
          .from("proposals")
          .insert({
            listing_id: proposal.listingId,
            listing_title: proposal.listingTitle,
            seller_id: proposal.sellerId,
            seller_name: proposal.sellerName,
            proposer_id: proposal.proposerId,
            proposer_name: proposal.proposerName,
            my_item_ids: proposal.myItemIds,
            my_cash_inr: proposal.myCash,
            their_item_ids: proposal.theirItemIds,
            note: proposal.note ?? null,
            status: proposal.status,
          })
          .select()
          .single();
        if (error) return { error: error.message };
        setProposals((prev) => [rowToProposal(data as ProposalRow), ...prev]);
        return {};
      },
      updateProposalStatus: async (id, status) => {
        const { data, error } = await supabase
          .from("proposals")
          .update({ status })
          .eq("id", id)
          .select()
          .single();
        if (!error && data) {
          const next = rowToProposal(data as ProposalRow);
          setProposals((prev) => prev.map((p) => (p.id === next.id ? next : p)));
        }
      },
    }),
    [proposals, loading, supabase],
  );

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export function useProposals() {
  const ctx = useContext(ProposalsContext);
  if (!ctx) throw new Error("useProposals must be used within a ProposalsProvider");
  return ctx;
}
