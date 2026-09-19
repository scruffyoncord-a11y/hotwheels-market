// Thin wrapper around Telnyx's Messaging API. Server-only — needs
// TELNYX_API_KEY, which must never reach the browser.

interface SendResult {
  ok: boolean;
  error?: string;
}

export async function sendSmsOtp(toE164: string, code: string): Promise<SendResult> {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_FROM_NUMBER;
  if (!apiKey || !from) {
    return { ok: false, error: "SMS is not configured." };
  }

  const body: Record<string, string> = {
    from,
    to: toE164.replace(/[^\d+]/g, ""),
    text: `Your LotClub verification code is ${code}. It expires in 5 minutes.`,
  };
  if (process.env.TELNYX_MESSAGING_PROFILE_ID) {
    body.messaging_profile_id = process.env.TELNYX_MESSAGING_PROFILE_ID;
  }

  try {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Telnyx send failed:", res.status, detail);
      return { ok: false, error: "Couldn't send the code." };
    }
    return { ok: true };
  } catch (err) {
    console.error("Telnyx send error:", err);
    return { ok: false, error: "Couldn't send the code." };
  }
}
