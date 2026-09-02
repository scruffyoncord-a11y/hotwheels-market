"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConditionBadge } from "@/components/ConditionBadge";
import { ListingCard } from "@/components/ListingCard";
import { TradeProposalModal } from "@/components/TradeProposalModal";
import { AuctionTimer, AuctionTimerBig, isAuctionEnded } from "@/components/AuctionTimer";
import { SectionCard } from "@/components/ui/SectionCard";
import { AiInsights } from "@/components/AiInsights";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  FlameIcon,
  HammerIcon,
  HeartIcon,
  LinkIcon,
  LockIcon,
  MessageIcon,
  PauseIcon,
  ShareIcon,
  TrophyIcon,
  ZapIcon,
} from "@/components/icons";
import { useListings } from "@/lib/listings-store";
import { useProposals } from "@/lib/proposals-store";
import { useBids } from "@/lib/bids-store";
import { useFavorites } from "@/lib/favorites-store";
import { useAccess } from "@/lib/access-store";
import { formatInr, timeAgo } from "@/lib/format";
import { computeProxyBid, maybeExtendEndTime } from "@/lib/auction";
import { CONDITION_LABELS } from "@/lib/types";

interface ChatMessage {
  from: "me" | "seller";
  body: string;
}

// Rival bidders the demo can pick from to simulate a live auction room.
const RIVAL_BIDDERS = [
  "Neha P.",
  "Vikram R.",
  "Ishaan B.",
  "Kabir T.",
  "Meera J.",
  "Divya K.",
  "Farhan I.",
  "Sana W.",
];
const MAX_SIMULATED_BIDS_PER_VISIT = 6;

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { listings, getListing, updateListing } = useListings();
  const { proposals } = useProposals();
  const { bidsForListing, highestBid, addBid } = useBids();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { hasAccess, grantViaToken, requestAccess, respondToRequest, requestsForListing, myRequest } =
    useAccess();
  const listing = getListing(id);
  const viewerName = "You";

  const [activeImage, setActiveImage] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidPlaced, setBidPlaced] = useState(false);
  const [liveFlash, setLiveFlash] = useState<{ name: string; amount: number } | null>(null);
  const [extendedFlash, setExtendedFlash] = useState(false);
  const [accessTokenParam, setAccessTokenParam] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const similarRailRef = useRef<HTMLDivElement>(null);
  const simulatedCountRef = useRef(0);
  const fireSimulatedBidRef = useRef<() => void>(() => {});

  if (!listing) return notFound();

  const similar = listings
    .filter(
      (l) =>
        l.id !== listing.id &&
        l.status === "ACTIVE" &&
        l.type === listing.type &&
        l.series === listing.series,
    )
    .slice(0, 8);

  const isTrade = listing.type === "TRADE";
  const isAuction = listing.type === "AUCTION";
  const auctionEnded = isAuction && listing.endsAt ? isAuctionEnded(listing.endsAt) : false;
  const disabled = listing.status !== "ACTIVE" || auctionEnded;
  const offerCount = proposals.filter((p) => p.listingId === listing.id).length;
  const favorited = isFavorited(listing.id);
  const likeCount = (listing.likes ?? 0) + (favorited ? 1 : 0);

  const listingBids = isAuction ? bidsForListing(listing.id) : [];
  const topBid = isAuction ? highestBid(listing.id) : undefined;
  const currentBid = topBid?.amountInr ?? listing.startingBidInr ?? 0;
  const nextMinBid =
    listingBids.length === 0 ? currentBid : currentBid + (listing.bidIncrementInr ?? 100);
  const youAreHighestBidder = topBid?.bidderName === "You";
  const myLatestBid = listingBids.find((b) => b.bidderName === "You");
  const isPopular = (listing.views ?? 0) > 400 || offerCount >= 2 || listingBids.length >= 3;
  const biddingPaused = !!listing.biddingPaused;
  const biddingBlocked = disabled || biddingPaused;
  const isHost = isAuction && listing.seller.name === "You";
  const increment = listing.bidIncrementInr ?? 100;

  const isPrivateAuction = isAuction && !!listing.isPrivate;
  const hasAccessGranted = isHost || !isPrivateAuction || hasAccess(listing.id, viewerName);
  const myAccessRequest = myRequest(listing.id, viewerName);
  const accessRequests = requestsForListing(listing.id);

  useEffect(() => {
    setAccessTokenParam(new URLSearchParams(window.location.search).get("access"));
  }, []);

  useEffect(() => {
    if (!isPrivateAuction || !accessTokenParam) return;
    if (accessTokenParam === listing!.accessToken) {
      grantViaToken(listing!.id, viewerName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivateAuction, accessTokenParam, listing?.id]);

  // Keep a ref to the latest version of this handler so the scheduling
  // effect below never fires against a stale bids/listing snapshot — only
  // the timer loop itself needs to survive across renders, not the data.
  fireSimulatedBidRef.current = function fireSimulatedBid() {
    if (simulatedCountRef.current >= MAX_SIMULATED_BIDS_PER_VISIT) return;
    if (listing!.endsAt && isAuctionEnded(listing!.endsAt)) return;

    const latest = highestBid(listing!.id);
    const base = latest?.amountInr ?? listing!.startingBidInr ?? 0;
    const step = listing!.bidIncrementInr ?? 100;
    const bump = Math.random() < 0.3 ? step * 2 : step;
    const candidates = RIVAL_BIDDERS.filter((n) => n !== latest?.bidderName);
    const name = candidates[Math.floor(Math.random() * candidates.length)];

    const result = computeProxyBid({
      topBid: latest,
      bidderName: name,
      maxBidInr: base + bump,
      increment: step,
      startingBid: listing!.startingBidInr ?? 0,
    });
    if (!("error" in result)) {
      const now = Date.now();
      result.entries.forEach((entry, i) => {
        addBid({
          id: `sim-${now}-${i}`,
          listingId: listing!.id,
          ...entry,
          createdAt: new Date(now + i).toISOString(),
        });
      });
      setLiveFlash({ name: result.leaderName, amount: result.leaderAmount });
      setTimeout(() => setLiveFlash(null), 3200);

      if (listing!.endsAt) {
        const extended = maybeExtendEndTime(listing!.endsAt, now);
        if (extended) {
          updateListing(listing!.id, { endsAt: extended });
          setExtendedFlash(true);
          setTimeout(() => setExtendedFlash(false), 3200);
        }
      }
    }
    simulatedCountRef.current += 1;
  };

  // Simulate a live auction room: while this active auction is open, other
  // collectors occasionally jump in with a bid — so the page feels alive
  // instead of static, and you can actually get outbid in real time.
  useEffect(() => {
    if (!isAuction || disabled || biddingPaused) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const delay = 18000 + Math.random() * 27000; // ~18-45s
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        fireSimulatedBidRef.current();
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isAuction, disabled, biddingPaused, listing?.id]);

  function sendMessage() {
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [...prev, { from: "me", body }]);
    setDraft("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: "seller",
          body: isTrade
            ? "Thanks for reaching out! Still looking to trade — send a photo of what you've got?"
            : "Thanks for reaching out! Any more questions, happy to help.",
        },
      ]);
    }, 900);
  }

  function scrollSimilar(dir: -1 | 1) {
    similarRailRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  function placeBid(maxBid: number) {
    if (disabled) return;
    const result = computeProxyBid({
      topBid,
      bidderName: "You",
      maxBidInr: maxBid,
      increment,
      startingBid: listing!.startingBidInr ?? 0,
    });
    if ("error" in result) {
      setBidError(result.error);
      return;
    }
    const now = Date.now();
    result.entries.forEach((entry, i) => {
      addBid({
        id: `bid-${now}-${i}`,
        listingId: listing!.id,
        ...entry,
        createdAt: new Date(now + i).toISOString(),
      });
    });

    if (listing!.endsAt) {
      const extended = maybeExtendEndTime(listing!.endsAt, now);
      if (extended) {
        updateListing(listing!.id, { endsAt: extended });
        setExtendedFlash(true);
        setTimeout(() => setExtendedFlash(false), 3200);
      }
    }

    setBidError("");
    setBidAmount("");
    setBidPlaced(true);
    setTimeout(() => setBidPlaced(false), 2000);
  }

  function handleBidSubmit(e: React.FormEvent) {
    e.preventDefault();
    placeBid(Number(bidAmount));
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">
      <Link
        href={isAuction ? "/auctions" : "/"}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-orange-600 dark:text-zinc-400"
      >
        ← Back to {isAuction ? "auctions" : "trades"}
      </Link>

      {isPrivateAuction && !hasAccessGranted ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <LockIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Private auction</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {listing.seller.name} has kept this auction invite-only. Request access, or ask
              them to share your invite link directly.
            </p>
          </div>
          {myAccessRequest?.status === "PENDING" ? (
            <p className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Request sent — waiting on {listing.seller.name}
            </p>
          ) : myAccessRequest?.status === "DENIED" ? (
            <div className="flex flex-col items-center gap-2">
              <p className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                Your request was declined
              </p>
              <button
                onClick={() => requestAccess(listing.id, viewerName)}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Ask again
              </button>
            </div>
          ) : (
            <button
              onClick={() => requestAccess(listing.id, viewerName)}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Request Access
            </button>
          )}
        </div>
      ) : (
        <>
          {isPrivateAuction && isHost && (
            <SectionCard title="Private Auction — Manage Access" className="mb-6">
              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <LinkIcon className="h-3.5 w-3.5" /> Invite link grants access instantly, no
                    request needed
                  </span>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/listing/${listing.id}?access=${listing.accessToken}`;
                      navigator.clipboard?.writeText(url);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 1800);
                    }}
                    className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    {linkCopied ? "Copied!" : "Copy invite link"}
                  </button>
                </div>
                {accessRequests.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No access requests yet.
                  </p>
                ) : (
                  accessRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {r.requesterName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {r.status === "PENDING"
                            ? "Waiting for your response"
                            : r.status === "APPROVED"
                              ? "Approved"
                              : "Declined"}{" "}
                          · {timeAgo(r.createdAt)}
                        </p>
                      </div>
                      {r.status === "PENDING" && (
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            onClick={() => respondToRequest(r.id, true)}
                            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => respondToRequest(r.id, false)}
                            className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        {/* Left: gallery + tabbed content */}
        <div className="flex flex-col gap-6">
          <div className="mx-auto flex w-full max-w-md flex-col gap-3">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.images[activeImage]}
                  alt={listing.title}
                  className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain"
                />
                {disabled && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                    <span className="rounded-full bg-white px-4 py-1.5 text-base font-bold uppercase tracking-wide text-zinc-900">
                      {isAuction && (auctionEnded || listing.status === "SOLD")
                        ? "Auction Ended"
                        : listing.status === "SOLD"
                          ? "Traded"
                          : "Reserved"}
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute left-2 top-2">
                <ConditionBadge condition={listing.condition} />
              </div>

              {listing.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage(
                        (i) => (i - 1 + listing.images.length) % listing.images.length,
                      )
                    }
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg font-bold text-white transition hover:bg-black/70"
                    aria-label="Previous photo"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((i) => (i + 1) % listing.images.length)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg font-bold text-white transition hover:bg-black/70"
                    aria-label="Next photo"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                    {activeImage + 1} / {listing.images.length}
                  </span>
                </>
              )}
            </div>

            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                      i === activeImage ? "border-orange-600" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt="" fill unoptimized className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
            <SectionCard title="Overview">
              <div className="flex flex-col gap-4 p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {listing.description}
                </p>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Trade safely:
                  </span>{" "}
                  meet in a public place or use tracked shipping, and inspect the item before you
                  commit — LotClub doesn&apos;t process payments directly.
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Product Details">
              <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  ["Condition", CONDITION_LABELS[listing.condition]],
                  ["Packaging", listing.condition === "MINT" ? "Sealed on card" : "Opened / loose"],
                  ...(listing.castingName ? [["Casting", listing.castingName]] : []),
                  ...(listing.series ? [["Series", listing.series]] : []),
                  ["Listing type", isAuction ? "Auction" : "Trade only"],
                  ...(isAuction && listing.startingBidInr
                    ? [["Starting bid", formatInr(listing.startingBidInr)]]
                    : []),
                  ...(isAuction && listing.bidIncrementInr
                    ? [["Bid increment", formatInr(listing.bidIncrementInr)]]
                    : []),
                  ...(isAuction && listing.endsAt
                    ? [
                        [
                          "Auction ends",
                          new Date(listing.endsAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          }),
                        ],
                      ]
                    : []),
                  ["Location", listing.city],
                ].map(([label, value]) => (
                  <div key={label} className="flex px-4 py-2.5 text-sm">
                    <dt className="w-36 shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
                    <dd className="font-medium text-zinc-800 dark:text-zinc-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </div>

          {isAuction && (
            <SectionCard title="Bid History">
              {listingBids.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No bids yet — be the first.
                </p>
              ) : (
                <div className="max-h-80 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
                  {listingBids.map((b) => {
                    const isLeading = b.id === topBid?.id;
                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between px-4 py-2.5 text-sm"
                      >
                        <span
                          className={
                            isLeading
                              ? "font-semibold text-zinc-900 dark:text-zinc-50"
                              : "text-zinc-600 dark:text-zinc-400"
                          }
                        >
                          {b.bidderName}
                          {isLeading && (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              HIGH BID
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className={
                              isLeading ? "font-bold text-red-600 dark:text-red-400" : "text-zinc-500"
                            }
                          >
                            {formatInr(b.amountInr)}
                          </span>
                          <span className="text-xs text-zinc-400">{timeAgo(b.createdAt)}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}
        </div>

        {/* Right: sticky action panel */}
        <div className="lg:sticky lg:top-24">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
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
                  {isAuction && !disabled && !biddingPaused && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                    </span>
                  )}
                  {isAuction && biddingPaused && !disabled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      <PauseIcon className="h-2.5 w-2.5" /> Paused
                    </span>
                  )}
                  {isPrivateAuction && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
                      <LockIcon className="h-2.5 w-2.5" /> Private
                    </span>
                  )}
                  {listing.series && (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {listing.series}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {listing.title}
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {listing.city} · Listed {timeAgo(listing.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => toggleFavorite(listing.id)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-base shadow-sm transition ${
                    favorited
                      ? "border-orange-600 bg-orange-50 text-orange-600 dark:bg-orange-950"
                      : "border-zinc-200 text-zinc-500 hover:border-orange-400 dark:border-zinc-700"
                  }`}
                  title={favorited ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <HeartIcon className="h-4 w-4" filled={favorited} />
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-sm text-zinc-500 shadow-sm transition hover:border-orange-400 dark:border-zinc-700"
                  title="Share"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isAuction ? (
              <div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {listingBids.length > 0 ? "Current bid" : "Starting bid"}
                    </p>
                    <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                      {formatInr(currentBid)}
                    </p>
                  </div>
                  {listing.endsAt && !disabled && (
                    <AuctionTimer
                      endsAt={listing.endsAt}
                      className="text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                    />
                  )}
                </div>
                {youAreHighestBidder && !disabled && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckIcon className="h-3.5 w-3.5" /> You&apos;re the highest bidder
                    {myLatestBid && myLatestBid.maxBidInr > currentBid && (
                      <span className="font-normal text-emerald-600/80 dark:text-emerald-400/80">
                        (max {formatInr(myLatestBid.maxBidInr)})
                      </span>
                    )}
                  </p>
                )}
                {!youAreHighestBidder && myLatestBid && !disabled && (
                  <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    You&apos;ve been outbid — your max was {formatInr(myLatestBid.maxBidInr)}
                  </p>
                )}
                {disabled && topBid && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {topBid.bidderName === "You" && <TrophyIcon className="h-3.5 w-3.5" />}
                    Won by {topBid.bidderName === "You" ? "you" : topBid.bidderName}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-violet-50 px-4 py-3 dark:bg-violet-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  Looking for
                </p>
                <p className="text-lg font-bold text-violet-800 dark:text-violet-300">
                  {listing.wantsInExchange}
                </p>
              </div>
            )}

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              {isPopular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  <FlameIcon className="h-3 w-3" /> Popular
                </span>
              )}
              {isTrade && offerCount > 0 && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium dark:bg-zinc-800">
                  {offerCount} {offerCount === 1 ? "offer" : "offers"} made
                </span>
              )}
              {isAuction && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium dark:bg-zinc-800">
                  {listingBids.length} {listingBids.length === 1 ? "bid" : "bids"}
                </span>
              )}
              {typeof listing.views === "number" && (
                <span className="inline-flex items-center gap-1">
                  <EyeIcon className="h-3.5 w-3.5" /> {listing.views}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <HeartIcon className="h-3.5 w-3.5" filled /> {likeCount}
              </span>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {isAuction ? (
              <div className="flex flex-col gap-3">
                {!disabled && listing.endsAt && <AuctionTimerBig endsAt={listing.endsAt} />}

                {biddingPaused && !disabled && (
                  <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <PauseIcon className="h-4 w-4 shrink-0" /> The seller has paused bidding — check back shortly.
                  </p>
                )}

                {isHost && !disabled && (
                  <p className="rounded-xl bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    This is your listing — you can&apos;t bid on your own auction.
                  </p>
                )}

                {!biddingBlocked && !isHost && (
                  <form
                    onSubmit={handleBidSubmit}
                    className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800"
                  >
                    <p className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Enter your max bid
                    </p>
                    <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                      We&apos;ll only bid as much as needed to keep you in the lead, up to this
                      amount — like eBay proxy bidding.
                    </p>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {[nextMinBid, nextMinBid + increment, nextMinBid + 2 * increment].map(
                        (amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setBidAmount(String(amt))}
                            className="rounded-full border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 transition hover:border-red-400 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-300"
                          >
                            {formatInr(amt)}
                          </button>
                        ),
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={nextMinBid}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`${formatInr(nextMinBid)} or more`}
                        className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                      >
                        Place Bid
                      </button>
                    </div>
                    {bidError && <p className="mt-2 text-xs text-rose-600">{bidError}</p>}
                    {bidPlaced && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckIcon className="h-3.5 w-3.5" /> Max bid placed.
                      </p>
                    )}
                  </form>
                )}
                <button
                  onClick={() => setChatOpen((v) => !v)}
                  className="flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-red-400 dark:border-zinc-700 dark:text-zinc-300"
                  title="Message seller"
                >
                  <MessageIcon className="h-4 w-4" /> Ask a question
                </button>
                {disabled && (
                  <p className="text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    This auction has ended.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  disabled={disabled}
                  onClick={() => setTradeModalOpen(true)}
                  className="flex-1 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none dark:disabled:bg-zinc-700"
                >
                  {disabled ? "No longer available" : "Propose a Trade"}
                </button>
                {!disabled && (
                  <button
                    onClick={() => setChatOpen((v) => !v)}
                    className="flex items-center justify-center rounded-full border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-violet-400 dark:border-zinc-700 dark:text-zinc-300"
                    title="Message seller"
                  >
                    <MessageIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {chatOpen && (
              <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex max-h-56 flex-col gap-2 overflow-y-auto">
                  {messages.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Start the conversation with {listing.seller.name.split(" ")[0]} about this
                      listing.
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                        m.from === "me"
                          ? "self-end bg-orange-600 text-white"
                          : "self-start bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {m.body}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={
                      isTrade
                        ? "I have a car that might interest you..."
                        : "Any more details on this piece?"
                    }
                    className="flex-1 rounded-full border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <button
                    onClick={sendMessage}
                    className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {listing.seller.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {listing.seller.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  ★ {listing.seller.rating.toFixed(1)} · {listing.seller.dealsCompleted} deals ·{" "}
                  {listing.seller.city}
                </p>
              </div>
            </div>

            <AiInsights listing={listing} />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              More from {listing.series}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollSimilar(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 shadow-sm transition hover:border-orange-400 dark:border-zinc-700 dark:text-zinc-300"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollSimilar(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 shadow-sm transition hover:border-orange-400 dark:border-zinc-700 dark:text-zinc-300"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div
            ref={similarRailRef}
            className="flex snap-x gap-4 overflow-x-auto pb-2 scroll-smooth"
          >
            {similar.map((l) => (
              <div key={l.id} className="w-44 shrink-0 snap-start sm:w-52">
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {isTrade && (
        <TradeProposalModal
          listing={listing}
          open={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
        />
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {liveFlash && (
          <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <ZapIcon className="h-4 w-4 text-orange-400" /> {liveFlash.name} just bid {formatInr(liveFlash.amount)}!
          </div>
        )}
        {extendedFlash && (
          <div className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-xl">
            <ClockIcon className="h-4 w-4" /> Late bid — auction extended by 5 minutes!
          </div>
        )}
      </div>
    </main>
  );
}
