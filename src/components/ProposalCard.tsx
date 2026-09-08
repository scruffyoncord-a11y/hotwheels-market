"use client";

import Image from "next/image";
import Link from "next/link";
import { useListings } from "@/lib/listings-store";
import { useProposals } from "@/lib/proposals-store";
import { useAuth } from "@/lib/auth-store";
import {
  ListingItemChips,
  OfferedItemChips,
  ProposalStatusBadge,
} from "@/components/ProposalChips";
import { CheckIcon, SwapIcon, XIcon } from "@/components/icons";
import { timeAgo } from "@/lib/format";
import type { TradeProposal } from "@/lib/types";

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
              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
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
                className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-700"
              >
                Resolve listing →
              </Link>
            ) : (
              direction === "sent" &&
              listing && (
                <Link
                  href={`/listing/${proposal.listingId}`}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                >
                  Make Another Offer
                </Link>
              )
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
