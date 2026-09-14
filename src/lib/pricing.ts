// Shared between the payment API routes and the UI that displays prices —
// keep these in one place so the two never drift apart.
export const BOOST_PRICE_INR = 29;
export const BOOST_DURATION_HOURS = 6;
export const AUCTION_FEE_RATE = 0.07; // seller-paid, 7% of the winning bid

// Hides the "Boost" purchase button during beta testing. The auction fee
// stays enabled (closing an auction is gated on it server-side too), this
// only turns off the optional, purely additive boost purchase flow.
export const BOOSTS_ENABLED = false;

// Bid increment is a fixed, non-configurable schedule — sellers used to
// set this per-listing, which let a seller pick an unfair increment
// (huge jumps forcing bidders to overcommit, or tiny ones dragging out
// bidding) to their own advantage. This mirrors bid_increment_for() in
// the database (see migration 0014) exactly, so the UI's quick-bid
// suggestions always match what place_bid() will actually enforce.
export function getBidIncrement(currentBidInr: number): number {
  if (currentBidInr < 100) return 10;
  if (currentBidInr < 500) return 25;
  if (currentBidInr < 1000) return 50;
  if (currentBidInr < 5000) return 100;
  if (currentBidInr < 10000) return 250;
  return 500;
}
