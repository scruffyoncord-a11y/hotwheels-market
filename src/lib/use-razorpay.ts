"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-store";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  theme?: { color: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment form."));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function useRazorpayPayment() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay({
    purpose,
    listingId,
    description,
  }: {
    purpose: "boost" | "auction_fee";
    listingId: string;
    description: string;
  }): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, listingId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error ?? "Could not start payment.");
        return false;
      }

      return await new Promise<boolean>((resolve) => {
        const razorpay = new window.Razorpay({
          key: orderData.keyId,
          order_id: orderData.orderId,
          amount: orderData.amountInr * 100,
          currency: "INR",
          name: "LotClub",
          description,
          prefill: { name: user.displayName, email: user.email },
          theme: { color: "#ea580c" },
          handler: async (response) => {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setError(verifyData.error ?? "Payment could not be verified.");
              resolve(false);
              return;
            }
            resolve(true);
          },
          modal: {
            ondismiss: () => resolve(false),
          },
        });
        razorpay.open();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { pay, busy, error };
}
