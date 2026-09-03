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
import {
  CarIcon,
  CheckIcon,
  HammerIcon,
  HandshakeIcon,
  SwapIcon,
  XIcon,
} from "@/components/icons";
import { formatInr, timeAgo } from "@/lib/format";
import { CONDITION_LABELS } from "@/lib/types";
import type { Listing, ListingStatus, TradeProposal } from "@/lib/types";

const ME = "You";

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

function ProposalStatusBadge({ status }: { status: TradeProposal["status"] }) {
  const styles = {
    PENDING: "bg-amber-500/15 text-amber-400",
    ACCEPTED: "bg-emerald-500/15 text-emerald-400",
    DECLINED: "bg-rose-500/15 text-rose-400",
  } as const;
  const labels = { PENDING: "Offer Pending", ACCEPTED: "Offer Accepted", DECLINED: "Offer Declined" } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ItemChip({ listing }: { listing: Listing | undefined }) {
  if (!listing) {
    return (
      <div className="flex w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-zinc-700 p-2 text-center text-[10px] text-zinc-500">
        Unavailable
      </div>
    );
  }
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="flex w-20 shrink-0 flex-col gap-1 rounded-md border border-zinc-700 bg-zinc-800 p-1.5 transition hover:border-orange-500"
    >
      <div className="relative h-12 w-full overflow-hidden rounded bg-zinc-900">
        <Image src={listing.images[0]} alt={listing.title} fill unoptimized className="object-cover" />
      </div>
      <p className="line-clamp-2 text-[10px] font-medium leading-tight text-zinc-300">
        {listing.castingName ?? listing.title}
      </p>
    </Link>
  );
}

function ItemChips({ ids, cash }: { ids: string[]; cash: number }) {
  const { listings } = useListings();
  if (ids.length === 0 && cash <= 0) {
    return <p className="text-xs text-zinc-500">Nothing offered</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <ItemChip key={id} listing={listings.find((l) => l.id === id)} />
      ))}
      {cash > 0 && (
        <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-emerald-800 bg-emerald-950 p-1.5 text-center">
          <span className="text-sm font-bold text-emerald-400">{formatInr(cash)}</span>
          <span className="text-[10px] text-emerald-500">cash</span>
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal, direction }: { proposal: TradeProposal; direction: "received" | "sent" }) {
  const { listings, updateListingStatus } = useListings();
  const { updateProposalStatus } = useProposals();
  const listing = listings.find((l) => l.id === proposal.listingId);
  const counterparty = direction === "received" ? proposal.proposerName : proposal.sellerName;

  function accept() {
    updateProposalStatus(proposal.id, "ACCEPTED");
    updateListingStatus(proposal.listingId, "RESERVED");
  }
  function decline() {
    updateProposalStatus(proposal.id, "DECLINED");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link
            href={`/listing/${proposal.listingId}`}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
          >
            {listing && (
              <Image src={listing.images[0]} alt="" fill unoptimized className="object-cover" />
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[8px] font-bold uppercase tracking-wide text-white">
              View
            </span>
          </Link>
          <div>
            <Link
              href={`/listing/${proposal.listingId}`}
              className="text-sm font-semibold text-zinc-50 hover:text-orange-400"
            >
              {proposal.listingTitle}
            </Link>
            <p className="mt-0.5 text-xs text-zinc-500">
              {direction === "received" ? "From" : "To"}{" "}
              <span className="font-medium text-zinc-300">{counterparty}</span>
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <ProposalStatusBadge status={proposal.status} />
          <p className="mt-1 text-[10px] text-zinc-500">{timeAgo(proposal.createdAt)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {direction === "received" ? `${proposal.proposerName} offers` : "You offer"}
          </p>
          <ItemChips ids={proposal.myItemIds} cash={proposal.myCash} />
        </div>
        <div className="hidden text-zinc-700 sm:block">
          <SwapIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            For {direction === "received" ? "your" : `${proposal.sellerName}'s`}
          </p>
          <ItemChips ids={proposal.theirItemIds} cash={0} />
        </div>
      </div>

      {proposal.note && (
        <p className="mt-3 rounded-md bg-zinc-800/60 px-3 py-2 text-xs italic text-zinc-400">
          &ldquo;{proposal.note}&rdquo;
        </p>
      )}

      <div className="mt-3 border-t border-zinc-800 pt-3">
        {proposal.status === "ACCEPTED" && (
          <p className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckIcon className="h-2.5 w-2.5" />
            </span>
            Trade confirmed! Coordinate the handover with {counterparty} in chat.
          </p>
        )}
        {proposal.status === "DECLINED" && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-medium text-rose-400">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                <XIcon className="h-2.5 w-2.5" />
              </span>
              {direction === "received" ? "You declined this offer." : "Offer declined by the seller."}
            </p>
            {direction === "sent" && listing && (
              <Link
                href={`/listing/${proposal.listingId}`}
                className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
              >
                Make Another Offer
              </Link>
            )}
          </div>
        )}
        {proposal.status === "PENDING" && (
          <div className="flex gap-2">
            {direction === "received" ? (
              <>
                <button
                  onClick={accept}
                  className="flex-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Accept
                </button>
                <button
                  onClick={decline}
                  className="flex-1 rounded-full border border-rose-800 px-4 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-950"
                >
                  Decline
                </button>
              </>
            ) : (
              <button
                onClick={decline}
                className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-rose-800 hover:text-rose-400"
              >
                Withdraw proposal
              </button>
            )}
          </div>
        )}
      </div>
      {!listing && (
        <p className="mt-2 text-[10px] text-zinc-500">This listing is no longer available.</p>
      )}
    </div>
  );
}

function MyListingRow({ listing }: { listing: Listing }) {
  const { updateListingStatus, removeListing } = useListings();
  const { highestBid } = useBids();
  const isTrade = listing.type === "TRADE";
  const isAuction = listing.type === "AUCTION";
  const topBid = isAuction ? highestBid(listing.id) : undefined;

  function remove() {
    if (window.confirm(`Remove "${listing.title}"? This can't be undone.`)) {
      removeListing(listing.id);
    }
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
        {listing.status === "ACTIVE" && (
          <button
            onClick={() => updateListingStatus(listing.id, "RESERVED")}
            className="rounded-full border border-amber-800 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-950"
          >
            Mark Reserved
          </button>
        )}
        {listing.status !== "SOLD" && (
          <button
            onClick={() => updateListingStatus(listing.id, "SOLD")}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
          >
            Mark {isTrade ? "Traded" : "Sold"}
          </button>
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
  const initialTab = searchParams.get("tab") === "listings" ? "listings" : "proposals";
  const [tab, setTab] = useState<"listings" | "proposals" | "bids">(initialTab);
  const [proposalTab, setProposalTab] = useState<"received" | "sent">("received");

  const myListings = useMemo(
    () =>
      listings
        .filter((l) => !!user.id && l.sellerId === user.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [listings, user.id],
  );
  const received = useMemo(
    () =>
      proposals
        .filter((p) => p.sellerName === ME)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [proposals],
  );
  const sent = useMemo(
    () =>
      proposals
        .filter((p) => p.proposerName === ME)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [proposals],
  );
  const pendingReceivedCount = received.filter((p) => p.status === "PENDING").length;
  const dealsCompleted = proposals.filter(
    (p) => p.status === "ACCEPTED" && (p.sellerName === ME || p.proposerName === ME),
  ).length;

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
    { key: "proposals" as const, label: "Offers", count: pendingReceivedCount || undefined },
    { key: "bids" as const, label: "Bids", count: myBidListings.length },
  ];

  return (
    <main className="flex-1">
      {/* Dark profile hero */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 pb-10 pt-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-500 text-2xl font-bold text-white">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
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
              <p className="text-sm text-zinc-400">★ 5.0 · {myListings[0]?.seller.city ?? "Kochi"}</p>
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
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5">
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
          ) : tab === "bids" ? (
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
          ) : (
            <div className="mt-5">
              <div className="mb-4 inline-flex gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 p-1">
                <button
                  onClick={() => setProposalTab("received")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    proposalTab === "received"
                      ? "bg-zinc-50 text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Received ({received.length})
                </button>
                <button
                  onClick={() => setProposalTab("sent")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    proposalTab === "sent"
                      ? "bg-zinc-50 text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sent ({sent.length})
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {(proposalTab === "received" ? received : sent).length === 0 ? (
                  <EmptyState icon={<SwapIcon className="h-8 w-8" />} title={`No ${proposalTab} proposals yet.`} />
                ) : (
                  (proposalTab === "received" ? received : sent).map((p) => (
                    <ProposalCard key={p.id} proposal={p} direction={proposalTab} />
                  ))
                )}
              </div>
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
