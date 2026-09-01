"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useListings } from "@/lib/listings-store";
import { useProposals } from "@/lib/proposals-store";
import { CheckIcon, XIcon } from "./icons";
import { CONDITION_LABELS } from "@/lib/types";
import type { Listing } from "@/lib/types";

const MY_WALLET_INR = 5000; // demo-only cap for the "Max" cash button

function OfferItem({ listing, onRemove }: { listing: Listing; onRemove?: () => void }) {
  return (
    <div className="relative flex w-32 shrink-0 flex-col gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 p-2">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-500"
          title="Remove"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="relative h-20 w-full overflow-hidden rounded bg-zinc-900">
        <Image src={listing.images[0]} alt={listing.title} fill unoptimized className="object-cover" />
      </div>
      <div>
        <p className="line-clamp-2 text-xs font-semibold leading-tight text-zinc-100">
          {listing.castingName ?? listing.title}
        </p>
        {listing.series && <p className="mt-0.5 text-[10px] text-zinc-500">{listing.series}</p>}
        <p className="mt-1 text-[10px] font-medium text-emerald-400">
          {CONDITION_LABELS[listing.condition]}
        </p>
      </div>
    </div>
  );
}

function CashSection({
  cash,
  onCashChange,
  cashEnabled,
  onToggle,
}: {
  cash: number;
  onCashChange: (v: number) => void;
  cashEnabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  if (!cashEnabled) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-600 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400"
      >
        + Add cash to this offer
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-300">Money to Offer</p>
        <button
          type="button"
          onClick={() => {
            onCashChange(0);
            onToggle(false);
          }}
          className="text-xs font-medium text-rose-400 hover:text-rose-300"
        >
          Remove
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
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
          className="rounded-md bg-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-600"
        >
          Max
        </button>
      </div>
    </div>
  );
}

interface CashProps {
  cash: number;
  onCashChange: (v: number) => void;
  cashEnabled: boolean;
  onToggleCash: (v: boolean) => void;
}

function OfferColumn({
  heading,
  subheading,
  items,
  onRemove,
  addOptions,
  onAdd,
  cashProps,
  emptyHint,
  accent,
}: {
  heading: string;
  subheading: string;
  items: Listing[];
  onRemove?: (id: string) => void;
  addOptions: Listing[];
  onAdd?: (id: string) => void;
  cashProps?: CashProps;
  emptyHint?: string;
  accent: string;
}) {
  return (
    <div className="flex-1">
      <div className="mb-3 text-center">
        <h3 className="text-lg font-bold text-white">{heading}</h3>
        <p className="text-xs text-zinc-500">{subheading}</p>
      </div>

      <div className={`rounded-lg border p-3 ${accent}`}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-300">Items to Trade</p>
          <span className="text-xs text-zinc-500">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="flex min-h-[104px] flex-wrap gap-2 overflow-y-auto rounded-md bg-zinc-900/60 p-2">
          {items.length === 0 && (
            <p className="flex flex-1 items-center justify-center px-2 text-center text-xs text-zinc-500">
              {emptyHint ?? "No items selected"}
            </p>
          )}
          {items.map((l) => (
            <OfferItem key={l.id} listing={l} onRemove={onRemove ? () => onRemove(l.id) : undefined} />
          ))}
        </div>

        {onAdd && addOptions.length > 0 && (
          <select
            value=""
            onChange={(e) => e.target.value && onAdd(e.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
          >
            <option value="">+ Add another item...</option>
            {addOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.castingName ?? l.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {cashProps && (
        <CashSection
          cash={cashProps.cash}
          onCashChange={cashProps.onCashChange}
          cashEnabled={cashProps.cashEnabled}
          onToggle={cashProps.onToggleCash}
        />
      )}
    </div>
  );
}

export function TradeProposalModal({
  listing,
  open,
  onClose,
}: {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}) {
  const { listings } = useListings();
  const { addProposal } = useProposals();

  const [myOfferIds, setMyOfferIds] = useState<string[]>([]);
  const [theirOfferIds, setTheirOfferIds] = useState<string[]>([listing.id]);
  const [myCash, setMyCash] = useState(0);
  const [myCashEnabled, setMyCashEnabled] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const myListings = useMemo(
    () => listings.filter((l) => l.seller.name === "You" && l.status === "ACTIVE" && l.id !== listing.id),
    [listings, listing.id],
  );
  const theirListings = useMemo(
    () =>
      listings.filter(
        (l) => l.seller.name === listing.seller.name && l.type === "TRADE" && l.status === "ACTIVE",
      ),
    [listings, listing.seller.name],
  );

  const myOffer = myListings.filter((l) => myOfferIds.includes(l.id));
  const theirOffer = theirListings.filter((l) => theirOfferIds.includes(l.id));

  if (!open) return null;

  const myTotalCount = myOffer.length + (myCashEnabled && myCash > 0 ? 1 : 0);
  const theirTotalCount = theirOffer.length;
  const canSend = myTotalCount > 0 && theirTotalCount > 0;

  function sendProposal() {
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
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-8 py-5">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Trading Proposal</h2>
            <p className="text-sm text-zinc-500">
              Build an offer for <span className="text-zinc-300">{listing.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-500"
          >
            <XIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-2 px-6 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckIcon className="h-7 w-7" />
            </div>
            <p className="text-xl font-bold text-white">Proposal sent to {listing.seller.name}!</p>
            <p className="text-sm text-zinc-400">They&apos;ll respond in chat once they review it.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="flex flex-col gap-8 sm:flex-row">
                <OfferColumn
                  heading="Your Offer"
                  subheading="What you're giving up"
                  items={myOffer}
                  onRemove={(id) => setMyOfferIds((prev) => prev.filter((x) => x !== id))}
                  addOptions={myListings.filter((l) => !myOfferIds.includes(l.id))}
                  onAdd={(id) => setMyOfferIds((prev) => [...prev, id])}
                  cashProps={{
                    cash: myCash,
                    onCashChange: setMyCash,
                    cashEnabled: myCashEnabled,
                    onToggleCash: setMyCashEnabled,
                  }}
                  accent="border-orange-900/60 bg-orange-950/10"
                  emptyHint={
                    myListings.length === 0
                      ? "List a car to trade it — or just offer cash below"
                      : "No items selected"
                  }
                />

                <div className="hidden w-px shrink-0 self-stretch bg-zinc-800 sm:block" />
                <div className="flex items-center justify-center text-2xl text-zinc-600 sm:hidden">⇅</div>

                <OfferColumn
                  heading={`${listing.seller.name}'s Offer`}
                  subheading="What you'll receive"
                  items={theirOffer}
                  onRemove={(id) => setTheirOfferIds((prev) => prev.filter((x) => x !== id))}
                  addOptions={theirListings.filter((l) => !theirOfferIds.includes(l.id))}
                  onAdd={(id) => setTheirOfferIds((prev) => [...prev, id])}
                  accent="border-violet-900/60 bg-violet-950/10"
                />
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-semibold text-zinc-300">
                  Add a note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Let them know why this trade works for you..."
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-zinc-700 px-8 py-5">
              <div className="mb-3 flex items-center justify-between text-sm text-zinc-400">
                <span>
                  You give <span className="font-semibold text-zinc-200">{myTotalCount}</span>{" "}
                  {myTotalCount === 1 ? "item" : "items"}
                </span>
                <span>
                  You get <span className="font-semibold text-zinc-200">{theirTotalCount}</span>{" "}
                  {theirTotalCount === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                onClick={sendProposal}
                disabled={!canSend}
                className="w-full rounded-lg bg-emerald-600 py-3 text-lg font-extrabold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Send Proposal
              </button>
              {!canSend && (
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Add at least one item (plus cash, optionally) on your side, and at least one
                  item from {listing.seller.name}.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
