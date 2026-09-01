import { NextResponse } from "next/server";

interface CandidateListing {
  id: string;
  title: string;
  type: "TRADE" | "AUCTION";
  condition: string;
  series?: string;
  castingName?: string;
  wantsInExchange?: string;
  city?: string;
  currentBidInr?: number;
}

interface RequestBody {
  listing: {
    title: string;
    type: "TRADE" | "AUCTION";
    condition: string;
    series?: string;
    castingName?: string;
    wantsInExchange?: string;
    startingBidInr?: number;
    bidIncrementInr?: number;
    currentBidInr?: number;
    city?: string;
  };
  candidates: CandidateListing[];
}

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI insights are not configured." }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { listing, candidates } = body;
  if (!listing) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  const trimmedCandidates = (candidates ?? []).slice(0, 25);

  const isTrade = listing.type === "TRADE";
  const systemPrompt = isTrade
    ? `You are a Hot Wheels/diecast trading assistant embedded in a peer-to-peer marketplace app. Given one listing (what this collector is offering and what they want in return) and a pool of other active trade listings, pick up to 3 candidates that would make the best trade match — prioritize listings whose "wants" align with what's being offered, and whose own item matches what the collector is looking for. Also give one short, concrete sentence of pricing/value context for the offered item (e.g. rarity, typical trade value tier) based on general Hot Wheels collector market knowledge. Respond ONLY with strict JSON: {"matches": [{"id": "<candidate id>", "reason": "<one short sentence>"}], "priceInsight": "<one short sentence>"}. If nothing is a good match, return an empty matches array. Never invent a candidate id that wasn't provided.`
    : `You are a Hot Wheels/diecast auction assistant embedded in a peer-to-peer marketplace app. Given one auction listing and a pool of other similar/recent auction listings for price context, give one short, concrete sentence estimating whether the current bid looks like fair value, a good deal, or pricey, based on the comparable listings and general Hot Wheels collector market knowledge — and up to 3 comparable listings worth watching. Respond ONLY with strict JSON: {"matches": [{"id": "<candidate id>", "reason": "<one short sentence>"}], "priceInsight": "<one short sentence>"}. If there isn't enough data, return an empty matches array and say so plainly in priceInsight. Never invent a candidate id that wasn't provided.`;

  const userPrompt = JSON.stringify({ listing, candidates: trimmedCandidates });

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("DeepSeek request failed:", res.status, detail);
      return NextResponse.json({ error: "AI request failed." }, { status: 502 });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "AI returned no content." }, { status: 502 });
    }

    let parsed: { matches?: { id: string; reason: string }[]; priceInsight?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned malformed response." }, { status: 502 });
    }

    const validIds = new Set(trimmedCandidates.map((c) => c.id));
    const matches = (parsed.matches ?? []).filter((m) => validIds.has(m.id)).slice(0, 3);

    return NextResponse.json({
      matches,
      priceInsight: parsed.priceInsight ?? "",
    });
  } catch {
    return NextResponse.json({ error: "AI request failed." }, { status: 502 });
  }
}
