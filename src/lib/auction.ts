import type { Bid } from "./types";

// If a bid lands within this window of the close time, the auction gets
// pushed back — the classic "soft close" anti-sniping mechanic (Goldin uses
// 30 minutes; ours are shorter-running demo auctions so the window scales
// down accordingly).
export const ANTI_SNIPE_WINDOW_MS = 5 * 60 * 1000;
export const ANTI_SNIPE_EXTENSION_MS = 5 * 60 * 1000;

/** Returns a new ISO end time if this bid should push the close back, else null. */
export function maybeExtendEndTime(endsAt: string, now: number = Date.now()): string | null {
  const remaining = new Date(endsAt).getTime() - now;
  if (remaining > 0 && remaining < ANTI_SNIPE_WINDOW_MS) {
    return new Date(now + ANTI_SNIPE_EXTENSION_MS).toISOString();
  }
  return null;
}

export interface ProxyBidEntry {
  bidderName: string;
  amountInr: number;
  maxBidInr: number;
}

export interface ProxyBidResult {
  entries: ProxyBidEntry[];
  leaderName: string;
  leaderAmount: number;
}

export interface ProxyBidError {
  error: string;
}

/**
 * Resolves a new max bid against the current top bid, eBay/Goldin-style:
 * the visible price only ever rises as far as needed to clear the next
 * bidder, and a losing bidder's incumbent immediately auto-defends up to
 * their own stored max if it's still higher.
 */
export function computeProxyBid({
  topBid,
  bidderName,
  maxBidInr,
  increment,
  startingBid,
}: {
  topBid: Bid | undefined;
  bidderName: string;
  maxBidInr: number;
  increment: number;
  startingBid: number;
}): ProxyBidResult | ProxyBidError {
  const minAllowed = topBid ? topBid.amountInr + increment : startingBid;
  if (maxBidInr < minAllowed) {
    return { error: `Your max bid must be at least ₹${minAllowed.toLocaleString("en-IN")}.` };
  }

  if (!topBid || topBid.bidderName === bidderName) {
    // No competing bidder yet, or the leader is raising their own ceiling.
    const visible = topBid ? topBid.amountInr : startingBid;
    return {
      entries: [{ bidderName, amountInr: visible, maxBidInr }],
      leaderName: bidderName,
      leaderAmount: visible,
    };
  }

  const existingMax = topBid.maxBidInr ?? topBid.amountInr;
  if (maxBidInr > existingMax) {
    const newVisible = Math.min(maxBidInr, existingMax + increment);
    return {
      entries: [{ bidderName, amountInr: newVisible, maxBidInr }],
      leaderName: bidderName,
      leaderAmount: newVisible,
    };
  }

  // The incumbent's proxy still beats this bid — it auto-defends immediately.
  const incumbentVisible = Math.min(existingMax, maxBidInr + increment);
  return {
    entries: [
      { bidderName, amountInr: maxBidInr, maxBidInr },
      { bidderName: topBid.bidderName, amountInr: incumbentVisible, maxBidInr: existingMax },
    ],
    leaderName: topBid.bidderName,
    leaderAmount: incumbentVisible,
  };
}
