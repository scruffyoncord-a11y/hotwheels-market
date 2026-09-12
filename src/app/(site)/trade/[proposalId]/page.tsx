"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProposals } from "@/lib/proposals-store";
import { useListings } from "@/lib/listings-store";
import { useAuth } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  ListingItemChips,
  OfferedItemChips,
  ProposalStatusBadge,
} from "@/components/ProposalChips";
import { StarPicker } from "@/components/StarPicker";
import { CheckIcon, StarIcon, SwapIcon, XIcon } from "@/components/icons";

export default function TradeConfirmationPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = use(params);
  const { proposals, loading, confirmTradeOutcome, resolveFailedTrade, submitRating } =
    useProposals();
  const { getListing } = useListings();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [ratingLoaded, setRatingLoaded] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const proposal = proposals.find((p) => p.id === proposalId);

  useEffect(() => {
    if (!proposal || proposal.status !== "COMPLETED" || !user.id) return;
    let cancelled = false;
    createClient()
      .from("ratings")
      .select("stars")
      .eq("proposal_id", proposal.id)
      .eq("rater_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setMyRating(data?.stars ?? null);
          setRatingLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [proposal, user.id]);

  async function rate(stars: number) {
    setBusy(true);
    setRatingError(null);
    const { error: err } = await submitRating(proposalId, stars);
    setBusy(false);
    if (err) {
      setRatingError(err);
      return;
    }
    setMyRating(stars);
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-semibold text-zinc-300">
          This trade isn&apos;t available to you.
        </p>
        <Link href="/profile" className="mt-3 inline-block text-sm font-semibold text-orange-500">
          ← Back to your offers
        </Link>
      </main>
    );
  }

  const isSeller = proposal.sellerId === user.id;
  const counterparty = isSeller ? proposal.proposerName : proposal.sellerName;
  const myOutcome = isSeller ? proposal.sellerOutcome : proposal.proposerOutcome;
  const theirOutcome = isSeller ? proposal.proposerOutcome : proposal.sellerOutcome;
  const listing = getListing(proposal.listingId);
  const failedOutcome = proposal.sellerOutcome === "FAILED" || proposal.proposerOutcome === "FAILED";
  const needsResolution = isSeller && failedOutcome && listing?.status === "RESERVED";

  async function respond(completed: boolean) {
    setBusy(true);
    setError(null);
    const { error: err } = await confirmTradeOutcome(proposalId, completed);
    setBusy(false);
    if (err) setError(err);
  }

  async function resolve(relist: boolean) {
    setBusy(true);
    setError(null);
    const { error: err } = await resolveFailedTrade(proposalId, relist);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      <Link href="/profile" className="mb-4 inline-block text-sm text-zinc-500 hover:text-orange-500">
        ← Back to your offers
      </Link>

      <div className="mb-6 flex items-center gap-3">
        {listing && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
            <Image src={listing.images[0]} alt="" fill unoptimized className="object-cover" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-50">
            Trade with {counterparty}
          </h1>
          <p className="text-sm text-zinc-500">{proposal.listingTitle}</p>
        </div>
        <div className="ml-auto">
          <ProposalStatusBadge status={proposal.status} />
        </div>
      </div>

      <SectionCard>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {isSeller ? `${proposal.proposerName} offered` : "You offered"}
            </p>
            <OfferedItemChips ids={proposal.myItemIds} cash={proposal.myCash} />
          </div>
          <div className="hidden text-zinc-700 sm:block">
            <SwapIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              For {isSeller ? "your" : `${proposal.sellerName}'s`}
            </p>
            <ListingItemChips ids={proposal.theirItemIds} cash={0} />
          </div>
        </div>
        {proposal.note && (
          <p className="mx-4 mb-4 rounded-md bg-zinc-800/60 px-3 py-2 text-xs italic text-zinc-400">
            &ldquo;{proposal.note}&rdquo;
          </p>
        )}
      </SectionCard>

      <div className="mt-5">
        {proposal.status === "PENDING" && (
          <SectionCard className="p-6 text-center">
            <p className="text-sm font-medium text-zinc-400">
              This trade hasn&apos;t been accepted yet.
            </p>
          </SectionCard>
        )}

        {proposal.status === "ACCEPTED" && (
          <SectionCard className="p-6">
            {myOutcome === "PENDING" ? (
              <>
                <p className="mb-4 text-center text-sm font-semibold text-zinc-100">
                  Did this trade actually happen?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => respond(true)}
                    disabled={busy}
                    className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckIcon className="mr-1.5 inline h-4 w-4" /> Yes, completed
                  </button>
                  <button
                    onClick={() => respond(false)}
                    disabled={busy}
                    className="flex-1 rounded-full border border-rose-800 py-2.5 text-sm font-bold text-rose-400 transition hover:bg-rose-950 disabled:opacity-60"
                  >
                    <XIcon className="mr-1.5 inline h-4 w-4" /> Didn&apos;t happen
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-sm font-medium text-zinc-400">
                You said this trade{" "}
                <span className={myOutcome === "COMPLETED" ? "text-emerald-400" : "text-rose-400"}>
                  {myOutcome === "COMPLETED" ? "completed" : "didn't happen"}
                </span>
                . Waiting on {counterparty}
                {theirOutcome !== "PENDING" ? "" : "…"}
              </p>
            )}
            {error && <p className="mt-3 text-center text-xs text-rose-500">{error}</p>}
          </SectionCard>
        )}

        {proposal.status === "COMPLETED" && (
          <SectionCard className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-100">
              Trade completed with {counterparty}!
            </p>
            <p className="mt-1 text-xs text-zinc-500">This listing has been marked sold.</p>

            {ratingLoaded && (
              <div className="mx-auto mt-5 max-w-xs border-t border-zinc-800 pt-5">
                {myRating ? (
                  <p className="flex items-center justify-center gap-1 text-sm font-medium text-zinc-300">
                    You rated {counterparty}
                    <span className="inline-flex items-center gap-0.5 text-amber-400">
                      <StarIcon className="h-4 w-4" filled /> {myRating}
                    </span>
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-semibold text-zinc-100">
                      How was trading with {counterparty}?
                    </p>
                    <div className="flex justify-center">
                      <StarPicker onSubmit={rate} busy={busy} />
                    </div>
                    {ratingError && <p className="mt-2 text-xs text-rose-500">{ratingError}</p>}
                  </>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {proposal.status === "DECLINED" && (
          <SectionCard className="p-6 text-center">
            {needsResolution ? (
              <>
                <p className="mb-4 text-sm font-semibold text-zinc-100">
                  This trade didn&apos;t go through — what do you want to do with the listing?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => resolve(true)}
                    disabled={busy}
                    className="flex-1 rounded-full bg-orange-600 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-60"
                  >
                    Put back up for trade
                  </button>
                  <button
                    onClick={() => resolve(false)}
                    disabled={busy}
                    className="flex-1 rounded-full border border-rose-800 py-2.5 text-sm font-bold text-rose-400 transition hover:bg-rose-950 disabled:opacity-60"
                  >
                    Remove listing
                  </button>
                </div>
                {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
              </>
            ) : (
              <p className="text-sm font-medium text-zinc-400">
                {failedOutcome
                  ? "This trade didn't go through."
                  : "This offer was declined before it was accepted."}
              </p>
            )}
          </SectionCard>
        )}
      </div>
    </main>
  );
}
