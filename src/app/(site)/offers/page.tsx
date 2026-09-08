"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProposals } from "@/lib/proposals-store";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProposalCard } from "@/components/ProposalCard";
import { SwapIcon } from "@/components/icons";

export default function OffersPage() {
  const { proposals } = useProposals();
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"received" | "sent">("received");

  const received = useMemo(
    () =>
      proposals
        .filter((p) => p.sellerId === user.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [proposals, user.id],
  );
  const sent = useMemo(
    () =>
      proposals
        .filter((p) => p.proposerId === user.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [proposals, user.id],
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
      <PageHeader title="Offers" subtitle="Trade proposals you've sent and received" />

      {!isAuthenticated ? (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
          Sign in with a real account to see your offers.
          <Link href="/login?next=%2Foffers" className="font-bold underline">
            Sign in
          </Link>
        </p>
      ) : (
        <>
          <div className="mb-4 inline-flex gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 p-1">
            <button
              onClick={() => setTab("received")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === "received" ? "bg-zinc-50 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Received ({received.length})
            </button>
            <button
              onClick={() => setTab("sent")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === "sent" ? "bg-zinc-50 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sent ({sent.length})
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {(tab === "received" ? received : sent).length === 0 ? (
              <EmptyState icon={<SwapIcon className="h-8 w-8" />} title={`No ${tab} offers yet.`} />
            ) : (
              (tab === "received" ? received : sent).map((p) => (
                <ProposalCard key={p.id} proposal={p} direction={tab} />
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
