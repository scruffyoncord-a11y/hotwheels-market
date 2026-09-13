// Shared between the payment API routes and the UI that displays prices —
// keep these in one place so the two never drift apart.
export const BOOST_PRICE_INR = 29;
export const BOOST_DURATION_HOURS = 6;
export const AUCTION_FEE_RATE = 0.07; // seller-paid, 7% of the winning bid

// Hides the "Boost" purchase button during beta testing. The auction fee
// stays enabled (closing an auction is gated on it server-side too), this
// only turns off the optional, purely additive boost purchase flow.
export const BOOSTS_ENABLED = false;
