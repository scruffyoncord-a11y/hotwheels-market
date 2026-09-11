import { NextResponse } from "next/server";
import { randomInt, createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppOtp } from "@/lib/whatsapp";

const RESEND_COOLDOWN_MS = 30_000;
const EXPIRY_MS = 5 * 60_000;

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = body.phone?.trim();
  if (!phone || !/^\+\d{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("otp_codes")
    .select("created_at")
    .eq("phone", phone)
    .maybeSingle();
  if (existing && Date.now() - new Date(existing.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return NextResponse.json({ error: "Wait a bit before requesting another code." }, { status: 429 });
  }

  const code = String(randomInt(100000, 1000000));
  const { error: upsertError } = await supabase.from("otp_codes").upsert({
    phone,
    code_hash: hashCode(phone, code),
    expires_at: new Date(Date.now() + EXPIRY_MS).toISOString(),
    attempts: 0,
    created_at: new Date().toISOString(),
  });
  if (upsertError) {
    return NextResponse.json({ error: "Couldn't start verification." }, { status: 500 });
  }

  const { ok, error } = await sendWhatsAppOtp(phone, code);
  if (!ok) {
    return NextResponse.json({ error: error ?? "Couldn't send the code." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
