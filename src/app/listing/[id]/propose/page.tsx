"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useListings } from "@/lib/listings-store";
import { useProposals } from "@/lib/proposals-store";
import { useAuth } from "@/lib/auth-store";
import { SectionCard } from "@/components/ui/SectionCard";
import { CheckIcon, SwapIcon } from "@/components/icons";
import { CONDITION_LABELS } from "@/lib/types";
import type { Listing } from "@/lib/types";

const MY_WALLET_INR = 5000; // demo-only cap for the "Max" cash button

function PickerCard({
  listing,
  selected,
  onToggle,
}: {
  listing: Listing;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition ${
        selected
          ? "border-orange-500 ring-2 ring-orange-500/30"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <div className="relative aspect-4/3 bg-zinc-800">
        <Image src={listing.images[0]} alt={listing.title} fill unoptimized className="object-cover" />
        <div
          className={`absolute inset-0 transition ${selected ? "bg-orange-600/20" : "bg-black/0 group-hover:bg-black/10"}`}
        />
        <span
          className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-white transition ${
            selected ? "border-orange-500 bg-orange-600" : "border-white/70 bg-black/30"
          }`}
        >
          {selected && <CheckIcon className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div className="bg-zinc-900 p-2">
        <p className="line-clamp-1 text-xs font-semibold text-zinc-100">
          {listing.castingName ?? listing.title}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-zinc-500">
          {CONDITION_LABELS[listing.condition]}
        </p>
      </div>
    </button>
  );
}

function OfferSide({
  heading,
  subheading,
  options,
  selectedIds,
  onToggle,
  emptyHint,
  cash,
  onCashChange,
  cashEnabled,
  onToggleCash,
}: {
  heading: string;
  subheading: string;
  options: Listing[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyHint?: string;
  cash?: number;
  onCashChange?: (v: number) => void;
  cashEnabled?: boolean;
  onToggleCash?: (v: boolean) => void;
}) {
  const hasCash = cash !== undefined && onCashChange && onToggleCash;

  return (
    <SectionCard
      title={
        <div>
          <p className="text-sm font-bold text-zinc-50">{heading}</p>
          <p className="text-xs font-normal text-zinc-500">{subheading}</p>
        </div>
      }
      action={
        <span className="text-xs font-semibold text-zinc-500">
          {selectedIds.length} selected
        </span>
      }
    >
      <div className="p-4">
        {options.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            {emptyHint ?? "Nothing available."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {options.map((l) => (
              <PickerCard
                key={l.id}
                listing={l}
                selected={selectedIds.includes(l.id)}
                onToggle={() => onToggle(l.id)}
              />
            ))}
          </div>
        )}

        {hasCash && (
          <div className="mt-4">
            {!cashEnabled ? (
              <button
                type="button"
                onClick={() => onToggleCash(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400"
              >
                + Add cash to this offer
              </button>
            ) : (
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-300">Cash to offer</p>
                  <button
                    type="button"
                    onClick={() => {
                      onCashChange(0);
                      onToggleCash(false);
                    }}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
                    <span className="font-bold text-emerald-400">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={cash === 0 ? "" : cash}
                      onChange={(e) => onCashChange(Math.max(0, Number(e.target.value) || 0))}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className="w-full bg-transparent text-zinc-100 outline-none"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onCashChange(MY_WALLET_INR)}
                    className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-600"
                  >
                    Max
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default function ProposeTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { listings, getListing, loading: listingsLoading } = useListings();
  const { addProposal } = useProposals();
  const { user, isAuthenticated } = useAuth();

  const listing = getListing(id);

  const [myOfferIds, setMyOfferIds] = useState<string[]>([]);
  const [theirOfferIds, setTheirOfferIds] = useState<string[]>(listing ? [listing.id] : []);
  const [myCash, setMyCash] = useState(0);
  const [myCashEnabled, setMyCashEnabled] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const myListings = useMemo(
    () =>
      listing
        ? listings.filter(
            (l) => !!user.id && l.sellerId === user.id && l.status === "ACTIVE" && l.id !== listing.id,
          )
        : [],
    [listings, listing, user.id],
  );
  const theirListings = useMemo(
    () =>
      listing
        ? listings.filter(
            (l) => l.sellerId === listing.sellerId && l.type === "TRADE" && l.status === "ACTIVE",
          )
        : [],
    [listings, listing],
  );

  if (!listing) {
    if (listingsLoading) {
      return (
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-zinc-500">Loading…</p>
        </main>
      );
    }
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-semibold text-zinc-300">This listing isn&apos;t available.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-semibold text-orange-500">
          ← Back to trades
        </Link>
      </main>
    );
  }

  const isOwnListing = !!user.id && listing.sellerId === user.id;
  const myTotalCount = myOfferIds.length + (myCashEnabled && myCash > 0 ? 1 : 0);
  const theirTotalCount = theirOfferIds.length;
  const canSend = myTotalCount > 0 && theirTotalCount > 0;

  function sendProposal() {
    if (!listing) return;
    addProposal({
      id: `p-${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      sellerName: listing.seller.name,
      proposerName: "You",
      myItemIds: myOfferIds,
      myCash: myCashEnabled ? myCash : 0,
      theirItemIds: theirOfferIds,
      note: note.trim() || undefined,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center sm:px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckIcon className="h-7 w-7" />
        </div>
        <p className="text-xl font-bold text-zinc-50">Proposal sent to {listing.seller.name}!</p>
        <p className="text-sm text-zinc-400">They&apos;ll respond in chat once they review it.</p>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/listing/${listing.id}`}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-orange-400"
          >
            Back to listing
          </Link>
          <Link
            href="/profile"
            className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            View your offers
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      <Link
        href={`/listing/${listing.id}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-orange-500"
      >
        ← Back to listing
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          <Image src={listing.images[0]} alt="" fill unoptimized className="object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-50">Propose a Trade</h1>
          <p className="text-sm text-zinc-500">
            for <span className="text-zinc-300">{listing.title}</span>
          </p>
        </div>
      </div>

      {!isAuthenticated ? (
        <SectionCard className="p-8 text-center">
          <p className="text-sm font-medium text-zinc-400">
            Sign in with a real account to propose a trade.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/listing/${listing.id}/propose`)}`}
            className="mt-3 inline-block rounded-full bg-orange-600 px-5 py-2 text-sm font-bold text-white hover:bg-orange-700"
          >
            Sign in
          </Link>
        </SectionCard>
      ) : isOwnListing ? (
        <SectionCard className="p-8 text-center">
          <p className="text-sm font-medium text-zinc-400">This is your own listing.</p>
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
            <OfferSide
              heading="Your Offer"
              subheading="What you're giving up"
              options={myListings}
              selectedIds={myOfferIds}
              onToggle={(itemId) =>
                setMyOfferIds((prev) =>
                  prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId],
                )
              }
              emptyHint="List a car to trade it — or just offer cash below."
              cash={myCash}
              onCashChange={setMyCash}
              cashEnabled={myCashEnabled}
              onToggleCash={setMyCashEnabled}
            />

            <OfferSide
              heading={`${listing.seller.name}'s items`}
              subheading="What you'll receive"
              options={theirListings}
              selectedIds={theirOfferIds}
              onToggle={(itemId) =>
                setTheirOfferIds((prev) =>
                  prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId],
                )
              }
            />
          </div>

          <div className="mt-5">
            <SectionCard title="Add a note (optional)">
              <div className="p-4">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Let them know why this trade works for you..."
                  className="input w-full resize-none"
                />
              </div>
            </SectionCard>
          </div>

          <div className="sticky bottom-4 mt-5">
            <SectionCard className="p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-center gap-2 text-sm text-zinc-400">
                <SwapIcon className="h-4 w-4 text-zinc-600" />
                <span>
                  You give <span className="font-semibold text-zinc-100">{myTotalCount}</span>{" "}
                  {myTotalCount === 1 ? "item" : "items"}
                </span>
                <span className="text-zinc-700">·</span>
                <span>
                  You get <span className="font-semibold text-zinc-100">{theirTotalCount}</span>{" "}
                  {theirTotalCount === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                onClick={sendProposal}
                disabled={!canSend}
                className="w-full rounded-full bg-orange-600 py-3 text-base font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                Send Proposal
              </button>
              {!canSend && (
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Add at least one item (plus cash, optionally) on your side, and at least one
                  item from {listing.seller.name}.
                </p>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </main>
  );
}
