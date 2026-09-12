"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useListings } from "@/lib/listings-store";
import { useProposals } from "@/lib/proposals-store";
import { useBids } from "@/lib/bids-store";
import { useAuth } from "@/lib/auth-store";
import { AuctionTimer, isAuctionEnded } from "@/components/AuctionTimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/Avatar";
import { StarRating } from "@/components/StarRating";
import { CarIcon, HammerIcon, HandshakeIcon, ZapIcon } from "@/components/icons";
import { formatInr, timeAgo } from "@/lib/format";
import { CONDITION_LABELS } from "@/lib/types";
import type { Listing, ListingStatus } from "@/lib/types";
import { useRazorpayPayment } from "@/lib/use-razorpay";
import { BOOST_PRICE_INR } from "@/lib/pricing";
import { useMyProfile } from "@/lib/use-my-profile";

function StatusBadge({ status }: { status: ListingStatus }) {
  const styles: Record<ListingStatus, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-400",
    RESERVED: "bg-amber-500/15 text-amber-400",
    SOLD: "bg-zinc-700 text-zinc-300",
  };
  const labels: Record<ListingStatus, string> = {
    ACTIVE: "Active",
    RESERVED: "Reserved",
    SOLD: "Sold / Traded",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function MyListingRow({ listing }: { listing: Listing }) {
  const { updateListingStatus, removeListing } = useListings();
  const { highestBid } = useBids();
  const { pay, busy, error } = useRazorpayPayment();
  const isTrade = listing.type === "TRADE";
  const isAuction = listing.type === "AUCTION";
  const topBid = isAuction ? highestBid(listing.id) : undefined;
  const isBoosted = !!listing.boostedUntil && new Date(listing.boostedUntil).getTime() > Date.now();

  function remove() {
    if (window.confirm(`Remove "${listing.title}"? This can't be undone.`)) {
      removeListing(listing.id);
    }
  }

  async function boost() {
    await pay({ purpose: "boost", listingId: listing.id, description: `Boost "${listing.title}" for 6 hours` });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-sm sm:flex-row sm:items-center">
      <Link href={`/listing/${listing.id}`} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
        <Image src={listing.images[0]} alt={listing.title} fill unoptimized className="object-cover" />
      </Link>
      <div className="flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isTrade ? "bg-violet-500/15 text-violet-400" : "bg-red-500/15 text-red-400"
            }`}
          >
            {isTrade ? "Trade" : "Auction"}
          </span>
          <StatusBadge status={listing.status} />
          <span className="text-xs text-zinc-500">{CONDITION_LABELS[listing.condition]}</span>
        </div>
        <Link
          href={`/listing/${listing.id}`}
          className="text-sm font-semibold text-zinc-50 hover:text-orange-400"
        >
          {listing.title}
        </Link>
        <p className="text-sm font-medium text-zinc-400">
          {isTrade
            ? `Wants: ${listing.wantsInExchange}`
            : `${formatInr(topBid?.amountInr ?? listing.startingBidInr ?? 0)} · ${topBid ? "current bid" : "starting bid"}`}
        </p>
        <p className="text-xs text-zinc-500">{listing.city} · Listed {timeAgo(listing.createdAt)}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
        {isAuction && (
          <Link
            href={`/listing/${listing.id}/host`}
            className="flex items-center justify-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1 text-center text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            <HammerIcon className="h-3.5 w-3.5" /> Host
          </Link>
        )}
        {listing.status === "ACTIVE" && !isBoosted && (
          <button
            onClick={boost}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-full border border-orange-800 px-3 py-1 text-xs font-semibold text-orange-400 transition hover:bg-orange-950 disabled:opacity-50"
          >
            <ZapIcon className="h-3.5 w-3.5" /> {busy ? "Processing…" : `Boost (₹${BOOST_PRICE_INR})`}
          </button>
        )}
        {listing.status === "ACTIVE" && (
          <button
            onClick={() => updateListingStatus(listing.id, "RESERVED")}
            className="rounded-full border border-amber-800 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-950"
          >
            Mark Reserved
          </button>
        )}
        {listing.status !== "SOLD" && !isAuction && (
          <button
            onClick={() => updateListingStatus(listing.id, "SOLD")}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
          >
            Mark {isTrade ? "Traded" : "Sold"}
          </button>
        )}
        {listing.status !== "SOLD" && isAuction && (
          <Link
            href={`/listing/${listing.id}/host`}
            className="rounded-full border border-zinc-700 px-3 py-1 text-center text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
          >
            Close via Host
          </Link>
        )}
        {listing.status !== "ACTIVE" && (
          <button
            onClick={() => updateListingStatus(listing.id, "ACTIVE")}
            className="rounded-full border border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-950"
          >
            Reactivate
          </button>
        )}
        <button
          onClick={remove}
          className="rounded-full border border-rose-800 px-3 py-1 text-xs font-semibold text-rose-400 transition hover:bg-rose-950"
        >
          Remove
        </button>
        {error && <p className="max-w-40 text-right text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
}

function MyBidRow({ listing }: { listing: Listing }) {
  const { bidsForListing, highestBid } = useBids();
  const { user } = useAuth();
  const listingBids = bidsForListing(listing.id);
  const myBest = Math.max(...listingBids.filter((b) => b.bidderId === user.id).map((b) => b.amountInr));
  const top = highestBid(listing.id);
  const ended = listing.status !== "ACTIVE" || (listing.endsAt ? isAuctionEnded(listing.endsAt) : false);
  const winning = !!user.id && top?.bidderId === user.id;

  let statusLabel: string;
  let statusStyle: string;
  if (ended) {
    statusLabel = winning ? "Won" : "Lost";
    statusStyle = winning ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700 text-zinc-300";
  } else {
    statusLabel = winning ? "Winning" : "Outbid";
    statusStyle = winning ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400";
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-sm sm:flex-row sm:items-center">
      <Link
        href={`/listing/${listing.id}`}
        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
      >
        <Image src={listing.images[0]} alt={listing.title} fill unoptimized className="object-cover" />
      </Link>
      <div className="flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
            {statusLabel}
          </span>
          {!ended && listing.endsAt && (
            <AuctionTimer endsAt={listing.endsAt} className="text-xs text-zinc-400" />
          )}
        </div>
        <Link
          href={`/listing/${listing.id}`}
          className="text-sm font-semibold text-zinc-50 hover:text-orange-400"
        >
          {listing.title}
        </Link>
        <p className="text-sm text-zinc-400">
          Your bid: <span className="font-semibold text-zinc-200">{formatInr(myBest)}</span>
          {!winning && top && (
            <>
              {" "}
              · Current: <span className="font-semibold text-red-400">{formatInr(top.amountInr)}</span>
            </>
          )}
        </p>
      </div>
      {!ended && !winning && (
        <Link
          href={`/listing/${listing.id}`}
          className="shrink-0 rounded-full border border-red-800 px-3 py-1.5 text-center text-xs font-semibold text-red-400 transition hover:bg-red-950"
        >
          Bid again
        </Link>
      )}
    </div>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const { listings } = useListings();
  const { proposals } = useProposals();
  const { bids } = useBids();
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const initialTab = searchParams.get("tab") === "bids" ? "bids" : "listings";
  const [tab, setTab] = useState<"listings" | "bids">(initialTab);

  const myListings = useMemo(
    () =>
      listings
        .filter((l) => !!user.id && l.sellerId === user.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [listings, user.id],
  );
  // Only needed for joinedLabel below — the full received/sent proposal
  // list now lives on its own page at /offers.
  const sent = useMemo(
    () => proposals.filter((p) => p.proposerId === user.id),
    [proposals, user.id],
  );
  const dealsCompleted = proposals.filter((p) => p.status === "COMPLETED").length;

  const myBidListings = useMemo(() => {
    const listingIds = Array.from(
      new Set(bids.filter((b) => b.bidderId === user.id).map((b) => b.listingId)),
    );
    return listingIds
      .map((id) => listings.find((l) => l.id === id))
      .filter((l): l is Listing => !!l)
      .sort((a, b) => (a.endsAt ?? "").localeCompare(b.endsAt ?? ""));
  }, [bids, listings, user.id]);

  const joinedLabel = useMemo(() => {
    const earliest = [...myListings, ...sent].reduce<string | null>((min, item) => {
      if (!min || item.createdAt < min) return item.createdAt;
      return min;
    }, null);
    const date = earliest ? new Date(earliest) : new Date();
    return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }, [myListings, sent]);

  const segments = [
    { key: "listings" as const, label: "Listings", count: myListings.length },
    { key: "bids" as const, label: "Bids", count: myBidListings.length },
  ];

  return (
    <main className="flex-1">
      {/* Dark profile hero */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 pb-10 pt-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={user.displayName} url={user.avatarUrl} size={64} className="text-2xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-50">{user.displayName}</h1>
                <Link
                  href="/settings"
                  className="text-xs font-semibold text-zinc-500 hover:text-orange-400"
                >
                  Settings
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                {profile && <StarRating sum={profile.ratingSum} count={profile.ratingCount} />}
                {(user.city ?? myListings[0]?.seller.city) && (
                  <span>{user.city ?? myListings[0]?.seller.city}</span>
                )}
              </div>
              <p className="text-xs italic text-zinc-500">Collector since {joinedLabel}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/30 px-4 py-3">
              <HandshakeIcon className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-xs text-zinc-500">Deals Done</p>
                <p className="text-lg font-bold text-zinc-50">{dealsCompleted}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/30 px-4 py-3">
              <CarIcon className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-xs text-zinc-500">Active Listings</p>
                <p className="text-lg font-bold text-zinc-50">
                  {myListings.filter((l) => l.status === "ACTIVE").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content sheet */}
      <div className="-mt-6 rounded-t-3xl bg-zinc-950 px-4 pb-10 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5">
            {segments.map((s) => (
              <button
                key={s.key}
                onClick={() => setTab(s.key)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  tab === s.key
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {s.label}
                {typeof s.count === "number" && (
                  <span className={`ml-1.5 text-xs ${tab === s.key ? "opacity-80" : "text-zinc-500"}`}>
                    {s.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "listings" ? (
            <div className="mt-5 flex flex-col gap-3">
              {myListings.length === 0 ? (
                <EmptyState
                  icon={<CarIcon className="h-8 w-8" />}
                  title="You haven't listed anything yet."
                  action={
                    <Link href="/sell" className="text-sm font-semibold text-orange-400 hover:underline">
                      List your first car →
                    </Link>
                  }
                />
              ) : (
                myListings.map((l) => <MyListingRow key={l.id} listing={l} />)
              )}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {myBidListings.length === 0 ? (
                <EmptyState
                  icon={<HammerIcon className="h-8 w-8" />}
                  title="You haven't bid on any auctions yet."
                  action={
                    <Link href="/auctions" className="text-sm font-semibold text-red-400 hover:underline">
                      Browse live auctions →
                    </Link>
                  }
                />
              ) : (
                myBidListings.map((l) => <MyBidRow key={l.id} listing={l} />)
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}
