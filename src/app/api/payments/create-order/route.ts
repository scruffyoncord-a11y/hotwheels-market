import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayOrder } from "@/lib/razorpay";
import { AUCTION_FEE_RATE, BOOST_PRICE_INR } from "@/lib/pricing";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: { purpose?: "boost" | "auction_fee"; listingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { purpose, listingId } = body;
  if (!purpose || !listingId || !["boost", "auction_fee"].includes(purpose)) {
    return NextResponse.json({ error: "Missing purpose or listing." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("id, type, seller_id, status")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  // Both a boost and the auction fee are paid by the listing's own
  // seller — never let anyone pay for someone else's listing.
  if (listing.seller_id !== user.id) {
    return NextResponse.json({ error: "This isn't your listing." }, { status: 403 });
  }

  let amountInr: number;
  if (purpose === "boost") {
    amountInr = BOOST_PRICE_INR;
  } else {
    if (listing.type !== "AUCTION") {
      return NextResponse.json({ error: "Only auctions have a closing fee." }, { status: 400 });
    }
    const { data: topBid } = await admin
      .from("bids")
      .select("amount_inr")
      .eq("listing_id", listingId)
      .order("amount_inr", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!topBid) {
      return NextResponse.json({ error: "This auction has no bids to close." }, { status: 400 });
    }
    amountInr = Math.max(1, Math.round(topBid.amount_inr * AUCTION_FEE_RATE));
  }

  const { orderId, error: orderError } = await createRazorpayOrder(
    amountInr,
    `${purpose}-${listingId}-${Date.now()}`,
  );
  if (orderError || !orderId) {
    return NextResponse.json({ error: orderError ?? "Could not start payment." }, { status: 502 });
  }

  const { error: insertError } = await admin.from("payments").insert({
    purpose,
    listing_id: listingId,
    payer_id: user.id,
    amount_inr: amountInr,
    razorpay_order_id: orderId,
    status: "created",
  });
  if (insertError) {
    return NextResponse.json({ error: "Could not start payment." }, { status: 500 });
  }

  return NextResponse.json({
    orderId,
    amountInr,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
