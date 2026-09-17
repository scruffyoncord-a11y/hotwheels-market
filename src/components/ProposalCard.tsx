"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useListings } from "@/lib/listings-store";
import { useProposals } from "@/lib/proposals-store";
import { useInventory } from "@/lib/inventory-store";
import { useAuth } from "@/lib/auth-store";
import { AddCarModal } from "@/components/AddCarModal";
import {
  ListingItemChips,
  OfferedItemChips,
  ProposalStatusBadge,
} from "@/components/ProposalChips";
import { CheckIcon, PlusIcon, SwapIcon, XIcon } from "@/components/icons";
import { timeAgo } from "@/lib/format";
import type { TradeProposal } from "@/lib/types";

function AskForMoreBox({ proposal }: { proposal: TradeProposal }) {
  const { requestMoreItems } = useProposals();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (proposal.moreRequested) {
    return (
      <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400">
        Waiting for {proposal.proposerName} to respond to your request for more items
        {proposal.moreRequestNote ? ` — "${proposal.moreRequestNote}"` : ""}.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-2">
        {proposal.moreRequestDeclined && (
          <p className="text-xs text-zinc-500">{proposal.proposerName} chose not to add more.</p>
        )}
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-orange-400 hover:underline"
        >
          {proposal.moreRequestDeclined ? "Ask again" : "Ask for more items"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="What else would make this work for you? (optional)"
        className="input resize-none text-xs"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          className="rounded-xl px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await requestMoreItems(proposal.id, note.trim() || undefined);
            setBusy(false);
            setOpen(false);
          }}
          className="rounded-xl bg-orange-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  );
}

function RespondToMoreItemsBox({ proposal }: { proposal: TradeProposal }) {
  const { respondToMoreItems } = useProposals();
  const { items: myInventory } = useInventory();
  const [picking, setPicking] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickable = myInventory.filter((item) => !proposal.myItemIds.includes(item.id));

  if (!proposal.moreRequested) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-orange-900/60 bg-orange-950/20 p-3">
      <p className="text-xs font-semibold text-orange-300">
        {proposal.sellerName} asked you to add more items to your offer
        {proposal.moreRequestNote ? `: "${proposal.moreRequestNote}"` : "."}
      </p>

      {picking ? (
        <>
          {pickable.length === 0 ? (
            <p className="text-xs text-zinc-400">
              Nothing left in your collection to add.{" "}
              <button
                onClick={() => setAddCarOpen(true)}
                className="font-semibold text-orange-400 hover:underline"
              >
                Add a car
              </button>
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {pickable.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSelectedIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((x) => x !== item.id)
                          : [...prev, item.id],
                      )
                    }
                    className={`relative flex flex-col overflow-hidden rounded-lg border-2 text-left transition ${
                      selected ? "border-orange-500" : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div className="relative aspect-4/3 bg-zinc-800">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 33vw, 25vw"
                        className="object-cover"
                      />
                      {selected && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-white">
                          <CheckIcon className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 bg-zinc-900 px-1.5 py-1 text-[10px] font-medium text-zinc-200">
                      {item.castingName ?? item.title}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setAddCarOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-orange-400"
            >
              <PlusIcon className="h-3 w-3" /> Add a car
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPicking(false);
                  setSelectedIds([]);
                }}
                className="rounded-xl px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                disabled={busy || selectedIds.length === 0}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  const result = await respondToMoreItems(proposal.id, { itemIds: selectedIds });
                  setBusy(false);
                  if (result.error) setError(result.error);
                  else {
                    setPicking(false);
                    setSelectedIds([]);
                  }
                }}
                className="rounded-xl bg-orange-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
              >
                {busy ? "Adding…" : `Add ${selectedIds.length || ""} item${selectedIds.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setPicking(true)}
            className="flex-1 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700"
          >
            Add items
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await respondToMoreItems(proposal.id, { decline: true });
              setBusy(false);
            }}
            className="flex-1 rounded-xl border border-rose-800 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-950 disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      )}

      <AddCarModal open={addCarOpen} onClose={() => setAddCarOpen(false)} />
    </div>
  );
}

export function ProposalCard({
  proposal,
  direction,
}: {
  proposal: TradeProposal;
  direction: "received" | "sent";
}) {
  const { listings, updateListingStatus } = useListings();
  const { updateProposalStatus } = useProposals();
  const { user } = useAuth();
  const listing = listings.find((l) => l.id === proposal.listingId);
  const counterparty = direction === "received" ? proposal.proposerName : proposal.sellerName;
  const isSeller = proposal.sellerId === user.id;
  const failedOutcome = proposal.sellerOutcome === "FAILED" || proposal.proposerOutcome === "FAILED";
  const needsResolution = isSeller && failedOutcome && listing?.status === "RESERVED";

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
              <Image src={listing.images[0]} alt="" fill sizes="56px" className="object-cover" />
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
          <OfferedItemChips ids={proposal.myItemIds} cash={proposal.myCash} />
        </div>
        <div className="hidden text-zinc-700 sm:block">
          <SwapIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            For {direction === "received" ? "your" : `${proposal.sellerName}'s`}
          </p>
          <ListingItemChips ids={proposal.theirItemIds} cash={0} />
        </div>
      </div>

      {proposal.note && (
        <p className="mt-3 rounded-md bg-zinc-800/60 px-3 py-2 text-xs italic text-zinc-400">
          &ldquo;{proposal.note}&rdquo;
        </p>
      )}

      <div className="mt-3 border-t border-zinc-800 pt-3">
        {proposal.status === "ACCEPTED" && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
              Trade confirmed! Coordinate the handover with {counterparty} in chat.
            </p>
            <Link
              href={`/trade/${proposal.id}`}
              className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Confirm trade →
            </Link>
          </div>
        )}
        {proposal.status === "COMPLETED" && (
          <p className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckIcon className="h-2.5 w-2.5" />
            </span>
            Trade completed with {counterparty}.
          </p>
        )}
        {proposal.status === "DECLINED" && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-medium text-rose-400">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                <XIcon className="h-2.5 w-2.5" />
              </span>
              {failedOutcome
                ? "This trade didn't go through."
                : direction === "received"
                  ? "You declined this offer."
                  : "Offer declined by the seller."}
            </p>
            {needsResolution ? (
              <Link
                href={`/trade/${proposal.id}`}
                className="rounded-xl bg-orange-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-700"
              >
                Resolve listing →
              </Link>
            ) : (
              direction === "sent" &&
              listing && (
                <Link
                  href={`/listing/${proposal.listingId}`}
                  className="rounded-xl border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                >
                  Make Another Offer
                </Link>
              )
            )}
          </div>
        )}
        {proposal.status === "PENDING" && (
          <div className="flex flex-col gap-2">
            {direction === "received" && <AskForMoreBox proposal={proposal} />}
            {direction === "sent" && <RespondToMoreItemsBox proposal={proposal} />}
            <div className="flex gap-2">
              {direction === "received" ? (
                <>
                  <button
                    onClick={accept}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={decline}
                    className="flex-1 rounded-xl border border-rose-800 px-4 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-950"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  onClick={decline}
                  className="rounded-xl border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-rose-800 hover:text-rose-400"
                >
                  Withdraw proposal
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {!listing && (
        <p className="mt-2 text-[10px] text-zinc-500">This listing is no longer available.</p>
      )}
    </div>
  );
}
