import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 5;

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

export async function POST(req: Request) {
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = body.phone?.trim();
  const code = body.code?.trim();
  if (!phone || !code) {
    return NextResponse.json({ error: "Missing phone or code." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("otp_codes")
    .select("code_hash, expires_at, attempts")
    .eq("phone", phone)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Request a new code." }, { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabase.from("otp_codes").delete().eq("phone", phone);
    return NextResponse.json({ error: "That code expired — request a new one." }, { status: 400 });
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await supabase.from("otp_codes").delete().eq("phone", phone);
    return NextResponse.json({ error: "Too many attempts — request a new code." }, { status: 429 });
  }

  if (hashCode(phone, code) !== row.code_hash) {
    await supabase
      .from("otp_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("phone", phone);
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  await supabase.from("otp_codes").delete().eq("phone", phone);
  return NextResponse.json({ ok: true });
}
