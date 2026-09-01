"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_PROPOSALS } from "./mock-proposals";
import type { ProposalStatus, TradeProposal } from "./types";

const STORAGE_KEY = "hotwheels-market:proposals:v1";

interface ProposalsContextValue {
  proposals: TradeProposal[];
  addProposal: (proposal: TradeProposal) => void;
  updateProposalStatus: (id: string, status: ProposalStatus) => void;
}

const ProposalsContext = createContext<ProposalsContextValue | null>(null);

export function ProposalsProvider({ children }: { children: React.ReactNode }) {
  const [proposals, setProposals] = useState<TradeProposal[]>(MOCK_PROPOSALS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const stored: TradeProposal[] = raw ? JSON.parse(raw) : [];
      const storedIds = new Set(stored.map((p) => p.id));
      // Keep any stored proposal as-is (preserves status changes on mock
      // seeds too), and append newly-added mock proposals not seen yet.
      const newMockProposals = MOCK_PROPOSALS.filter((m) => !storedIds.has(m.id));
      setProposals([...stored, ...newMockProposals]);
    } catch {
      // localStorage unavailable or corrupt — fall back to mock data only
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
    } catch {
      // ignore quota/availability errors
    }
  }, [proposals, loaded]);

  const value = useMemo<ProposalsContextValue>(
    () => ({
      proposals,
      addProposal: (proposal) => setProposals((prev) => [proposal, ...prev]),
      updateProposalStatus: (id, status) =>
        setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p))),
    }),
    [proposals],
  );

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export function useProposals() {
  const ctx = useContext(ProposalsContext);
  if (!ctx) throw new Error("useProposals must be used within a ProposalsProvider");
  return ctx;
}
