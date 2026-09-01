import type { TradeProposal } from "./types";

export const MOCK_PROPOSALS: TradeProposal[] = [
  // Received: someone offering the Supra you asked for, straight swap.
  {
    id: "p1",
    listingId: "m1",
    listingTitle: "Toyota MR2 - Tooned #94 - Trade for a Supra",
    sellerName: "You",
    proposerName: "Rohan S.",
    myItemIds: ["l10"],
    myCash: 0,
    theirItemIds: ["m1"],
    note: "Got the Supra you're after — clean swap?",
    status: "PENDING",
    createdAt: "2026-08-29T10:15:00Z",
  },
  // Received: a bundle + cash sweetener on the same listing.
  {
    id: "p2",
    listingId: "m1",
    listingTitle: "Toyota MR2 - Tooned #94 - Trade for a Supra",
    sellerName: "You",
    proposerName: "Neha P.",
    myItemIds: ["l5"],
    myCash: 300,
    theirItemIds: ["m1"],
    note: "No Supra on hand, but the Countach bundle plus a bit of cash?",
    status: "PENDING",
    createdAt: "2026-08-29T12:40:00Z",
  },
  // Sent: a proposal you made on someone else's trade listing.
  {
    id: "p3",
    listingId: "t3",
    listingTitle: "Premium BMW M3 GTR - Trade for RLC piece",
    sellerName: "Priya D.",
    proposerName: "You",
    myItemIds: ["m2"],
    myCash: 0,
    theirItemIds: ["t3"],
    note: "This isn't RLC but it's a sealed Premium — worth a look?",
    status: "PENDING",
    createdAt: "2026-08-29T13:05:00Z",
  },
];
