"use client";

import { useState } from "react";
import Link from "next/link";
import { useListings } from "@/lib/listings-store";
import { useBids } from "@/lib/bids-store";
import { SparkleIcon } from "./icons";
import type { Listing } from "@/lib/types";

interface Match {
  id: string;
  reason: string;
}

export function AiInsights({ listing }: { listing: Listing }) {
  const { listings } = useListings();
  const { highestBid } = useBids();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [priceInsight, setPriceInsight] = useState("");

  async function runInsights() {
    setOpen(true);
    if (matches !== null || loading) return;
    setLoading(true);
    setError(false);

    const candidates = listings
      .filter((l) => l.id !== listing.id && l.type === listing.type && l.status === "ACTIVE")
      .slice(0, 25)
      .map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        condition: l.condition,
        series: l.series,
        castingName: l.castingName,
        wantsInExchange: l.wantsInExchange,
        city: l.city,
        currentBidInr:
          l.type === "AUCTION" ? (highestBid(l.id)?.amountInr ?? l.startingBidInr) : undefined,
      }));

    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing: {
            title: listing.title,
            type: listing.type,
            condition: listing.condition,
            series: listing.series,
            castingName: listing.castingName,
            wantsInExchange: listing.wantsInExchange,
            startingBidInr: listing.startingBidInr,
            bidIncrementInr: listing.bidIncrementInr,
            currentBidInr:
              listing.type === "AUCTION"
                ? (highestBid(listing.id)?.amountInr ?? listing.startingBidInr)
                : undefined,
            city: listing.city,
          },
          candidates,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setMatches(data.matches ?? []);
      setPriceInsight(data.priceInsight ?? "");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const listingById = (id: string) => listings.find((l) => l.id === id);

  if (!open) {
    return (
      <button
        onClick={runInsights}
        className="flex items-center justify-center gap-1.5 rounded-full border border-dashed border-violet-300 px-3 py-2 text-xs font-semibold text-violet-600 transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40"
      >
        <SparkleIcon className="h-3.5 w-3.5" /> Get AI Insights
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3 text-xs dark:border-violet-900 dark:bg-violet-950/20">
      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-400">
        <SparkleIcon className="h-3.5 w-3.5" /> AI Insights
      </div>

      {loading && <p className="text-zinc-500 dark:text-zinc-400">Thinking...</p>}

      {error && (
        <p className="text-zinc-500 dark:text-zinc-400">
          Couldn&apos;t reach the AI right now — try again shortly.
        </p>
      )}

      {!loading && !error && matches !== null && (
        <div className="flex flex-col gap-2">
          {priceInsight && (
            <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{priceInsight}</p>
          )}
          {matches.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {matches.map((m) => {
                const l = listingById(m.id);
                if (!l) return null;
                return (
                  <Link
                    key={m.id}
                    href={`/listing/${m.id}`}
                    className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 transition hover:border-violet-400 dark:border-violet-900 dark:bg-zinc-900"
                  >
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{l.title}</p>
                    <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{m.reason}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            !priceInsight && (
              <p className="text-zinc-500 dark:text-zinc-400">No strong matches right now.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
