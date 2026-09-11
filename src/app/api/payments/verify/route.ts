import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { BOOST_DURATION_HOURS } from "@/lib/pricing";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, purpose, listing_id, payer_id, status")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();

  if (!payment || payment.payer_id !== user.id) {
    return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
  }
  // Already processed — respond success without re-applying the side
  // effect twice (e.g. a duplicate client retry after a slow response).
  if (payment.status === "paid") {
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await admin
    .from("payments")
    .update({ status: "paid", razorpay_payment_id })
    .eq("id", payment.id);
  if (updateError) {
    return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
  }

  if (payment.purpose === "boost") {
    await admin
      .from("listings")
      .update({
        boosted_until: new Date(Date.now() + BOOST_DURATION_HOURS * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", payment.listing_id);
  } else {
    // auction_fee — the payments row above is what the database trigger
    // (migration 0011) checks for before allowing this SOLD transition.
    const { error: soldError } = await admin
      .from("listings")
      .update({ status: "SOLD", bidding_paused: true })
      .eq("id", payment.listing_id);
    if (soldError) {
      return NextResponse.json({ error: soldError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
