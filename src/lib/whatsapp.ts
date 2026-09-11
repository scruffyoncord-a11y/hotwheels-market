// Thin wrapper around the WhatsApp Cloud API. Server-only — every caller
// needs WHATSAPP_ACCESS_TOKEN, which must never reach the browser.

const GRAPH_VERSION = "v21.0";

interface SendResult {
  ok: boolean;
  error?: string;
}

async function sendTemplate(
  toE164: string,
  templateName: string,
  bodyParams: string[],
): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return { ok: false, error: "WhatsApp is not configured." };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toE164.replace(/[^\d+]/g, ""),
          type: "template",
          template: {
            name: templateName,
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: bodyParams.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("WhatsApp send failed:", res.status, detail);
      return { ok: false, error: "WhatsApp message failed to send." };
    }
    return { ok: true };
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return { ok: false, error: "WhatsApp message failed to send." };
  }
}

// Requires an Authentication-category template (Meta's auto-generated
// "your code is {{1}}" format) named by WHATSAPP_OTP_TEMPLATE_NAME —
// see supabase/migrations/0010's comment. Falls back to "otp_login".
export function sendWhatsAppOtp(toE164: string, code: string) {
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp_login";
  return sendTemplate(toE164, templateName, [code]);
}

// Generic alert send — expects a template with a single {{1}} body
// variable (the message text). Callers building new alert types can add
// dedicated templates/wrappers as needed instead of overloading this one
// if the copy needs more than one variable.
export function sendWhatsAppAlert(toE164: string, templateName: string, message: string) {
  return sendTemplate(toE164, templateName, [message]);
}
