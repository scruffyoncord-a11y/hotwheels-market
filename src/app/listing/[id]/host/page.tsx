"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useListings } from "@/lib/listings-store";
import { useBids } from "@/lib/bids-store";
import { AuctionTimerBig, isAuctionEnded } from "@/components/AuctionTimer";
import { SectionCard } from "@/components/ui/SectionCard";
import { CheckIcon, DotIcon, HammerIcon, PauseIcon } from "@/components/icons";
import { computeProxyBid, maybeExtendEndTime } from "@/lib/auction";
import { formatInr, timeAgo } from "@/lib/format";

const CALL_STEPS = [
  { label: "Accepting Bids", color: "bg-emerald-600 hover:bg-emerald-700" },
  { label: "Going Once", color: "bg-amber-500 hover:bg-amber-600" },
  { label: "Going Twice", color: "bg-orange-600 hover:bg-orange-700" },
  { label: "Going Three Times", color: "bg-red-600 hover:bg-red-700" },
] as const;

export default function HostAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getListing, updateListing } = useListings();
  const { bidsForListing, highestBid, addBid, removeBid } = useBids();
  const listing = getListing(id);
  const [callStage, setCallStage] = useState(0);

  const bids = listing ? bidsForListing(listing.id) : [];
  const topBid = listing ? highestBid(listing.id) : undefined;

  // A fresh bid interrupts the countdown — the room's still live.
  useEffect(() => {
    setCallStage(0);
  }, [bids.length]);

  if (!listing || listing.type !== "AUCTION" || listing.seller.name !== "You") {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          You can only host auctions you&apos;re selling.
        </p>
        <Link href="/auctions" className="mt-3 inline-block text-sm font-semibold text-red-600">
          ← Back to auctions
        </Link>
      </main>
    );
  }

  const ended = listing.status !== "ACTIVE" || (listing.endsAt ? isAuctionEnded(listing.endsAt) : false);
  const currentBid = topBid?.amountInr ?? listing.startingBidInr ?? 0;
  const increment = listing.bidIncrementInr ?? 100;

  function recordRoomBid() {
    const result = computeProxyBid({
      topBid,
      bidderName: "Room",
      maxBidInr: currentBid + increment,
      increment,
      startingBid: listing!.startingBidInr ?? 0,
    });
    if ("error" in result) return;
    const now = Date.now();
    result.entries.forEach((entry, i) => {
      addBid({
        id: `room-${now}-${i}`,
        listingId: listing!.id,
        ...entry,
        createdAt: new Date(now + i).toISOString(),
      });
    });
    if (listing!.endsAt) {
      const extended = maybeExtendEndTime(listing!.endsAt, now);
      if (extended) updateListing(listing!.id, { endsAt: extended });
    }
  }

  function undoLastBid() {
    if (topBid) removeBid(topBid.id);
  }

  function toggleAccepting() {
    updateListing(listing!.id, { biddingPaused: !listing!.biddingPaused });
  }

  function advanceCall() {
    if (callStage < CALL_STEPS.length - 1) {
      setCallStage((s) => s + 1);
    }
  }

  function hammer() {
    updateListing(listing!.id, { status: "SOLD", biddingPaused: true });
    setCallStage(0);
  }

  function pauseBidding() {
    updateListing(listing!.id, { biddingPaused: true });
  }

  function cancelAuction() {
    if (window.confirm("Cancel this auction? All bids will be discarded. This can't be undone.")) {
      router.push("/profile");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/listing/${listing.id}`}
          className="text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400"
        >
          ← Back to listing
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> AUCTIONEER CONSOLE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 lg:h-full">
          <Image src={listing.images[0]} alt={listing.title} fill unoptimized className="object-cover" />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{listing.title}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {listing.city} · {bids.length} {bids.length === 1 ? "bid" : "bids"} so far
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Current bid
                </p>
                <p className="text-3xl font-black text-red-600 dark:text-red-400">
                  {formatInr(currentBid)}
                </p>
                {topBid && (
                  <p className="text-xs text-zinc-500">
                    {topBid.bidderName} · {timeAgo(topBid.createdAt)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={recordRoomBid}
                  disabled={ended}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 dark:border-zinc-700"
                  title={`Record a room bid (+${formatInr(increment)})`}
                >
                  ▲
                </button>
                <button
                  onClick={undoLastBid}
                  disabled={!topBid}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 transition hover:border-rose-400 hover:text-rose-600 disabled:opacity-40 dark:border-zinc-700"
                  title="Remove the last bid"
                >
                  ▼
                </button>
              </div>
            </div>

            {!ended && listing.endsAt && (
              <div className="ml-auto">
                <AuctionTimerBig endsAt={listing.endsAt} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-zinc-100 px-4 py-3 shadow-sm dark:border-zinc-800">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {listing.biddingPaused ? (
                <>
                  <PauseIcon className="h-3.5 w-3.5" /> Bidding paused
                </>
              ) : (
                <>
                  <DotIcon className="h-2.5 w-2.5 text-emerald-500" /> Accepting bids
                </>
              )}
            </span>
            <button
              onClick={toggleAccepting}
              disabled={ended}
              className={`rounded-full px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-40 ${
                listing.biddingPaused ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              {listing.biddingPaused ? "Resume Bidding" : "Pause Bidding"}
            </button>
          </div>

          {ended ? (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {listing.status === "SOLD" && topBid ? (
                <p className="flex items-center justify-center gap-2 font-bold text-zinc-800 dark:text-zinc-100">
                  <HammerIcon className="h-4 w-4" /> SOLD to {topBid.bidderName} for {formatInr(topBid.amountInr)}
                </p>
              ) : (
                <p className="font-bold text-zinc-800 dark:text-zinc-100">This auction has ended.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Call the lot
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CALL_STEPS.map((step, i) => (
                  <button
                    key={step.label}
                    onClick={i === 0 ? undefined : advanceCall}
                    disabled={i === 0 || i > callStage + 1}
                    className={`rounded-lg px-3 py-3 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-30 ${
                      i === callStage ? step.color : i < callStage ? "bg-zinc-400" : step.color
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {i <= callStage && <CheckIcon className="h-3 w-3" />}
                      {step.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={hammer}
                disabled={callStage < CALL_STEPS.length - 1}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-4 text-lg font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-zinc-50 dark:text-zinc-900"
              >
                <HammerIcon className="h-5 w-5" /> SOLD!
              </button>
              {callStage < CALL_STEPS.length - 1 && (
                <p className="text-center text-xs text-zinc-400">
                  Call through all three warnings before the hammer.
                </p>
              )}
            </div>
          )}

          <button
            onClick={cancelAuction}
            className="self-start text-xs font-semibold text-rose-600 hover:underline"
          >
            Cancel this auction
          </button>
        </div>
      </div>

      <div className="mt-6">
      <SectionCard title="Bids">
        {bids.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">No bids yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="px-4 py-2 font-semibold">Bidder</th>
                <th className="px-4 py-2 font-semibold">Time</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Value</th>
                <th className="px-4 py-2 font-semibold">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {bids.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                    {b.bidderName}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{timeAgo(b.createdAt)}</td>
                  <td className="px-4 py-2">
                    {b.id === topBid?.id ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {ended ? "Winner" : "Leading"}
                      </span>
                    ) : (
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800">
                        Outbid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatInr(b.amountInr)}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeBid(b.id)}
                      className="rounded border border-rose-300 px-2 py-0.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
      </div>
    </main>
  );
}
