import { createHmac } from "crypto";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function authHeader(): string | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export async function createRazorpayOrder(
  amountInr: number,
  receipt: string,
): Promise<{ orderId?: string; error?: string }> {
  const auth = authHeader();
  if (!auth) return { error: "Payments are not configured." };

  try {
    const res = await fetch(`${RAZORPAY_API}/orders`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      // Razorpay wants the amount in paise (smallest currency unit).
      body: JSON.stringify({ amount: amountInr * 100, currency: "INR", receipt }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Razorpay order creation failed:", res.status, detail);
      return { error: "Could not start payment." };
    }
    const data = await res.json();
    return { orderId: data.id as string };
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    return { error: "Could not start payment." };
  }
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected === signature;
}
