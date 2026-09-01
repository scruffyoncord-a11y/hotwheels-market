import type { Bid } from "./types";

export const MOCK_BIDS: Bid[] = [
  // a1 — Custom Olds 442, active bidding war, ends soon
  { id: "b1", listingId: "a1", bidderName: "Neha P.", amountInr: 2200, maxBidInr: 2200, createdAt: "2026-08-30T05:00:00Z" },
  { id: "b2", listingId: "a1", bidderName: "Vikram R.", amountInr: 2400, maxBidInr: 2400, createdAt: "2026-08-30T08:00:00Z" },
  { id: "b3", listingId: "a1", bidderName: "Neha P.", amountInr: 2700, maxBidInr: 2700, createdAt: "2026-08-30T11:00:00Z" },

  // a2 — RLC Datsun, a couple of early bids, days left
  { id: "b4", listingId: "a2", bidderName: "Kabir T.", amountInr: 8500, maxBidInr: 8500, createdAt: "2026-08-29T20:00:00Z" },
  { id: "b5", listingId: "a2", bidderName: "Ishaan B.", amountInr: 9200, maxBidInr: 9200, createdAt: "2026-08-30T09:00:00Z" },

  // a3 — '68 Camaro, ended, Meera J. won
  { id: "b6", listingId: "a3", bidderName: "Meera J.", amountInr: 1650, maxBidInr: 1650, createdAt: "2026-08-28T12:00:00Z" },
  { id: "b7", listingId: "a3", bidderName: "Aditya N.", amountInr: 1950, maxBidInr: 1950, createdAt: "2026-08-29T02:00:00Z" },
  { id: "b8", listingId: "a3", bidderName: "Meera J.", amountInr: 2200, maxBidInr: 2200, createdAt: "2026-08-29T09:00:00Z" },
];
