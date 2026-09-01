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
  bidIncrementInr?: number;
  buyNowInr?: number;
  endsAt?: string; // ISO timestamp the auction closes
  biddingPaused?: boolean; // host has temporarily paused new bids
  city: string;
  status: ListingStatus;
  images: string[];
  views?: number;
  likes?: number;
  seller: {
    name: string;
    city: string;
    rating: number;
    dealsCompleted: number;
  };
  createdAt: string;
}

export type ProposalStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface TradeProposal {
  id: string;
  listingId: string; // the trade listing this proposal was made on
  listingTitle: string;
  sellerName: string; // owner of the listing (who receives the proposal)
  proposerName: string; // who sent the proposal
  myItemIds: string[]; // listing ids the proposer is offering
  myCash: number;
  theirItemIds: string[]; // listing ids being requested from the seller
  note?: string;
  status: ProposalStatus;
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

export interface Bid {
  id: string;
  listingId: string;
  bidderName: string;
  amountInr: number;
  // The bidder's true ceiling for proxy (max) bidding. The visible amountInr
  // is only ever raised as far as needed to stay ahead of the next-highest
  // bidder, same as eBay/Goldin-style auctions — maxBidInr itself stays
  // private except to the bidder's own future top-ups.
  maxBidInr: number;
  createdAt: string;
}
