"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConditionBadge } from "@/components/ConditionBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { CheckIcon, FlameIcon, HeartIcon, SearchIcon, SparkleIcon, TrashIcon } from "@/components/icons";
import { useListings } from "@/lib/listings-store";
import { useFavorites } from "@/lib/favorites-store";
import { useBids } from "@/lib/bids-store";
import { useProposals } from "@/lib/proposals-store";
import { isAuctionEnded } from "@/components/AuctionTimer";
import { formatInr } from "@/lib/format";
import type { Listing } from "@/lib/types";

function isAvailable(listing: Listing): boolean {
  if (listing.status !== "ACTIVE") return false;
  if (listing.type === "AUCTION" && listing.endsAt && isAuctionEnded(listing.endsAt)) return false;
  return true;
}

function WishlistCard({
  listing,
  selected,
  onToggleSelect,
  onRemove,
  available,
}: {
  listing: Listing;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  available: boolean;
}) {
  const { bidsForListing } = useBids();
  const { proposals } = useProposals();
  const isAuction = listing.type === "AUCTION";
  const offerCount = isAuction
    ? bidsForListing(listing.id).length
    : proposals.filter((p) => p.listingId === listing.id).length;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        selected ? "border-orange-500 ring-1 ring-orange-500" : "border-zinc-100 dark:border-zinc-800"
      } dark:bg-zinc-900`}
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
        <Link href={`/listing/${listing.id}`} className="absolute inset-0">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            unoptimized
            className={`object-cover ${!available ? "opacity-50 grayscale" : ""}`}
          />
        </Link>
        <button
          onClick={onToggleSelect}
          className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg border-2 text-xs font-bold shadow transition ${
            selected
              ? "border-orange-600 bg-orange-600 text-white"
              : "border-white bg-white/90 text-transparent hover:border-orange-400"
          }`}
          title={selected ? "Deselect" : "Select"}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>
        <div className="absolute left-2 top-10">
          <ConditionBadge condition={listing.condition} />
        </div>
        {!available && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white">
            {listing.status === "SOLD" ? (isAuction ? "Ended" : "Traded") : "Unavailable"}
          </span>
        )}
        {available && offerCount > 0 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-800 shadow">
            <FlameIcon className="h-2.5 w-2.5" /> {offerCount} {isAuction ? (offerCount === 1 ? "bid" : "bids") : offerCount === 1 ? "offer" : "offers"}
          </span>
        )}
      </div>

      <div className="p-3">
        <Link
          href={`/listing/${listing.id}`}
          className="line-clamp-1 text-sm font-medium text-zinc-800 hover:text-orange-600 dark:text-zinc-200"
        >
          {listing.title}
        </Link>
        <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {isAuction ? formatInr(listing.startingBidInr ?? 0) + " starting bid" : "Trade only"}
        </p>

        <button
          onClick={onRemove}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-100 py-1.5 text-sm text-zinc-600 transition hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-800 dark:text-zinc-300"
          title="Remove from wishlist"
        >
          <TrashIcon className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { listings } = useListings();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [availTab, setAvailTab] = useState<"available" | "unavailable">("available");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const wishlisted = useMemo(
    () => favoriteIds.map((id) => listings.find((l) => l.id === id)).filter((l): l is Listing => !!l),
    [favoriteIds, listings],
  );

  const availableItems = useMemo(() => wishlisted.filter(isAvailable), [wishlisted]);
  const unavailableItems = useMemo(() => wishlisted.filter((l) => !isAvailable(l)), [wishlisted]);
  const visible = availTab === "available" ? availableItems : unavailableItems;

  // Selection only makes sense scoped to what's currently in view.
  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(visible.map((l) => l.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availTab]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(
      selectedIds.size === visible.length ? new Set() : new Set(visible.map((l) => l.id)),
    );
  }

  const selectedListings = visible.filter((l) => selectedIds.has(l.id));

  function removeSelected() {
    selectedListings.forEach((l) => toggleFavorite(l.id));
    setSelectedIds(new Set());
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 pb-28 sm:px-6">
      <PageHeader
        title="Wishlist"
        subtitle={`${wishlisted.length} ${wishlisted.length === 1 ? "item" : "items"} saved`}
      />

      {wishlisted.length === 0 ? (
        <EmptyState
          icon={<HeartIcon className="h-8 w-8" />}
          title="Nothing saved yet. Tap the heart on any listing to add it here."
          action={
            <>
              <Link
                href="/"
                className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Browse trades
              </Link>
              <Link
                href="/auctions"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-red-400 dark:border-zinc-700 dark:text-zinc-300"
              >
                Browse auctions
              </Link>
            </>
          }
        />
      ) : (
        <>
          <div className="mt-4">
            <Tabs
              items={[
                { key: "available", label: "Available", count: availableItems.length },
                { key: "unavailable", label: "Unavailable", count: unavailableItems.length },
              ]}
              active={availTab}
              onChange={setAvailTab}
              accent="orange"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {selectedIds.size === 0
                ? "No items selected"
                : `${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"} selected`}
            </p>
            {visible.length > 0 && (
              <button
                onClick={selectAll}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-orange-400 dark:border-zinc-700 dark:text-zinc-300"
              >
                {selectedIds.size === visible.length ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                compact
                icon={
                  availTab === "available" ? (
                    <SearchIcon className="h-6 w-6" />
                  ) : (
                    <SparkleIcon className="h-6 w-6" />
                  )
                }
                title={
                  availTab === "available"
                    ? "No available items right now."
                    : "Nothing unavailable — nice!"
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {visible.map((listing) => (
                <WishlistCard
                  key={listing.id}
                  listing={listing}
                  selected={selectedIds.has(listing.id)}
                  onToggleSelect={() => toggleSelect(listing.id)}
                  onRemove={() => toggleFavorite(listing.id)}
                  available={availTab === "available"}
                />
              ))}
            </div>
          )}

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {selectedIds.size === 0
                  ? "Select items to remove them in bulk"
                  : `${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"} ready to remove`}
              </p>
              <button
                onClick={removeSelected}
                disabled={selectedIds.size === 0}
                className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
              >
                Remove Selected
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
