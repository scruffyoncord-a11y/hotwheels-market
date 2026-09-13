"use client";

// Best-effort autofill from the printed text on a Hot Wheels card photo
// (front or back) — runs entirely client-side (tesseract.js/WASM), no
// API key or per-image cost. Never authoritative: callers should only
// prefill fields the seller hasn't already typed into, and the seller
// reviews/edits before publishing either way.

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    const { createWorker } = await import("tesseract.js");
    workerPromise = createWorker("eng");
  }
  return workerPromise;
}

export async function recognizeCardText(file: File): Promise<string> {
  const worker = await getWorker();
  const {
    data: { text },
  } = await worker.recognize(file);
  return text;
}

// Series/segment names Hot Wheels actually prints on card backs. Not
// exhaustive — matching is a plain substring check, so a name that isn't
// here just falls back to no series guess rather than a wrong one.
const KNOWN_SERIES = [
  "Super Treasure Hunt",
  "Treasure Hunt",
  "HW Exotics",
  "HW Race Day",
  "HW Flames",
  "HW Speed Graphics",
  "HW Space",
  "HW Metro",
  "HW Rescue",
  "HW Screen Time",
  "HW Art Cars",
  "HW Hot Trucks",
  "HW J-Imports",
  "Car Culture",
  "Team Transport",
  "Boulevard",
  "Pop Culture",
  "Entertainment",
  "Fast & Furious",
  "Red Line Club",
  "Retro Racers",
  "Mainline",
  "Premium",
];

const NOISE_LINE = /copyright|mattel|made in|choking|hazard|warning|www\.|\.com|barcode/i;
const MOSTLY_NON_LETTERS = /^[\d\s./\\_-]+$/;

export interface CardOcrGuess {
  castingName?: string;
  series?: string;
}

export function guessDetailsFromCardText(rawText: string): CardOcrGuess {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && /[a-zA-Z]/.test(l));

  const series = KNOWN_SERIES.find((s) =>
    lines.some((l) => l.toLowerCase().includes(s.toLowerCase())),
  );

  // The printed model name tends to be the longest line that isn't a
  // barcode/number string or one of the small-print legal/safety lines.
  const candidates = lines
    .filter((l) => !MOSTLY_NON_LETTERS.test(l))
    .filter((l) => !NOISE_LINE.test(l));
  const castingName = [...candidates].sort((a, b) => b.length - a.length)[0];

  return { castingName, series };
}
