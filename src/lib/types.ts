export type ListingCondition = "MINT" | "NEAR_MINT" | "GOOD" | "PLAYED" | "DAMAGED";

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  MINT: "Mint (still sealed)",
  NEAR_MINT: "Near Mint",
  GOOD: "Good",
  PLAYED: "Played With",
  DAMAGED: "Damaged / Parts",
};

export type ListingStatus = "ACTIVE" | "RESERVED" | "SOLD";

export type ListingType = "SALE" | "TRADE" | "AUCTION";

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  castingName?: string;
  series?: string;
  condition: ListingCondition;
  // Asking price for SALE listings. Optional/absent for TRADE/AUCTION listings.
  priceInr?: number;
  // Reference/market price for comparison, if the seller wants to show a discount.
  originalPriceInr?: number;
  // What the seller wants in exchange, for TRADE listings.
  wantsInExchange?: string;
  // --- AUCTION-only fields ---
  startingBidInr?: number;
  buyNowInr?: number;
  // ISO timestamp the auction goes live and bidding opens. Undefined
  // means it went live immediately at creation, same as before scheduled
  // auctions existed.
  startsAt?: string;
  endsAt?: string; // ISO timestamp the auction closes
  biddingPaused?: boolean; // host has temporarily paused new bids
  // Publicly-visible count of people who tapped "Notify me" on a
  // scheduled auction — kept in sync by a trigger, same pattern as
  // pendingOffersCount.
  watchersCount?: number;
  // --- Private auction access control ---
  isPrivate?: boolean;
  // Secret shared via an invite link (?access=<token>) that grants a
  // viewer access instantly, without needing the seller to approve a request.
  accessToken?: string;
  city: string;
  status: ListingStatus;
  images: string[];
  views?: number;
  likes?: number;
  // Publicly-visible count of currently-pending trade proposals on this
  // listing — the proposals themselves are private (only the two people
  // on one can see it), this is just a number kept in sync by a trigger.
  pendingOffersCount?: number;
  // Set (in the future) while a paid boost is active — pins the listing
  // to the top of the board. Paid via Razorpay, see src/lib/pricing.ts.
  boostedUntil?: string;
  // The real, authenticated Supabase account that owns this listing —
  // this is the only thing "am I the seller" should ever be checked
  // against. `seller` below is a display-only snapshot.
  sellerId: string;
  seller: {
    name: string;
    city: string;
    rating: number;
    dealsCompleted: number;
  };
  createdAt: string;
}

export type ProposalStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";

// Whether one side has confirmed the handover actually happened, once a
// proposal is ACCEPTED. Both COMPLETED finalizes the trade; either FAILED
// declines it and leaves the listing awaiting the seller's call on what
// to do next (relist or remove).
export type TradeOutcome = "PENDING" | "COMPLETED" | "FAILED";

export interface TradeProposal {
  id: string;
  listingId: string; // the trade listing this proposal was made on
  listingTitle: string;
  sellerId: string; // real Supabase account of the listing owner (who receives the proposal)
  sellerName: string;
  proposerId: string; // real Supabase account of who sent the proposal
  proposerName: string;
  myItemIds: string[]; // listing ids the proposer is offering
  myCash: number;
  theirItemIds: string[]; // listing ids being requested from the seller
  note?: string;
  status: ProposalStatus;
  sellerOutcome: TradeOutcome;
  proposerOutcome: TradeOutcome;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  title: string;
  castingName?: string;
  series?: string;
  condition: ListingCondition;
  notes?: string;
  image: string;
  createdAt: string;
}

export type AccessRequestStatus = "PENDING" | "APPROVED" | "DENIED";

export interface AccessRequest {
  id: string;
  listingId: string;
  requesterName: string;
  status: AccessRequestStatus;
  createdAt: string;
}

export interface AccessGrant {
  listingId: string;
  viewerName: string;
  grantedAt: string;
}

export interface Bid {
  id: string;
  listingId: string;
  // The real, authenticated Supabase account that placed this bid.
  bidderId: string;
  bidderName: string;
  // What was actually bid — simple bidding, not a hidden proxy max, so
  // this is always what the bidder entered and immediately visible to
  // everyone as the current bid.
  amountInr: number;
  // Equal to amountInr for every bid placed after the switch to simple
  // bidding — kept only because older rows from the previous proxy
  // (hidden max) system still have a real, different value here.
  maxBidInr: number;
  createdAt: string;
}
