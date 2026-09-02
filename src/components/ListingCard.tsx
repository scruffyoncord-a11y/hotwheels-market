"use client";

import Link from "next/link";
import Image from "next/image";
import { ConditionBadge } from "./ConditionBadge";
import { AuctionTimer } from "./AuctionTimer";
import { useBids } from "@/lib/bids-store";
import { useFavorites } from "@/lib/favorites-store";
import { useAccess } from "@/lib/access-store";
import { formatInr, timeAgo } from "@/lib/format";
import { HammerIcon, HeartIcon, LockIcon, PauseIcon, SwapIcon } from "./icons";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  const { bidsForListing, highestBid } = useBids();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { hasAccess } = useAccess();
  const favorited = isFavorited(listing.id);
  const sold = listing.status === "SOLD";
  const reserved = listing.status === "RESERVED";
  const isTrade = listing.type === "TRADE";
  const isAuction = listing.type === "AUCTION";
  const isHost = listing.seller.name === "You";
  const isPrivateAuction = isAuction && !!listing.isPrivate;
  const isLocked = isPrivateAuction && !isHost && !hasAccess(listing.id, "You");

  const topBid = isAuction ? highestBid(listing.id) : undefined;
  const bidCount = isAuction ? bidsForListing(listing.id).length : 0;
  const currentBid = isAuction ? (topBid?.amountInr ?? listing.startingBidInr ?? 0) : 0;
  const auctionOver = isAuction && listing.endsAt ? new Date(listing.endsAt).getTime() <= Date.now() : false;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          unoptimized
          className="object-cover transition group-hover:scale-105"
        />
        {(sold || reserved) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold uppercase tracking-wide text-zinc-900 shadow-sm">
              {sold ? (isAuction ? "Ended" : "Traded") : "Reserved"}
            </span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {isAuction && !sold && !reserved && !auctionOver && (
            listing.biddingPaused ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                <PauseIcon className="h-2.5 w-2.5" /> Paused
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
              </span>
            )
          )}
          {isPrivateAuction && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white">
              <LockIcon className="h-2.5 w-2.5" /> Private
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(listing.id);
          }}
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-sm shadow transition ${
            favorited ? "bg-orange-600 text-white" : "bg-white/90 text-zinc-500 hover:text-orange-600"
          }`}
          title={favorited ? "Remove from wishlist" : "Save to wishlist"}
        >
          <HeartIcon className="h-3.5 w-3.5" filled={favorited} />
        </button>
        {isAuction && listing.endsAt && !auctionOver && !sold && !reserved && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
            <AuctionTimer endsAt={listing.endsAt} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
          {isTrade && (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
              Trade
            </span>
          )}
          {isAuction && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              <HammerIcon className="h-3 w-3" /> Auction
            </span>
          )}
          <ConditionBadge condition={listing.condition} />
        </div>
        {listing.series && (
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">
            {listing.series}
          </p>
        )}
        <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {listing.title}
        </p>
        {isAuction ? (
          <div className="mt-1">
            {isLocked ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                <LockIcon className="h-3.5 w-3.5" /> Request access to view bidding
              </p>
            ) : (
              <>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatInr(currentBid)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {bidCount > 0 ? `${bidCount} ${bidCount === 1 ? "bid" : "bids"}` : "No bids yet"}
                  {listing.buyNowInr && ` · Buy Now ${formatInr(listing.buyNowInr)}`}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="mt-1 flex items-start gap-1.5 rounded-xl bg-violet-50 px-2 py-1.5 dark:bg-violet-950/60">
            <span className="mt-0.5 shrink-0 text-violet-500 dark:text-violet-400" aria-hidden>
              <SwapIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400">
                Wants
              </p>
              <p className="line-clamp-2 text-xs font-semibold leading-snug text-violet-800 dark:text-violet-300">
                {listing.wantsInExchange}
              </p>
            </div>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{listing.city}</span>
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
