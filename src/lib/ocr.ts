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
  const { preprocessForOcr } = await import("./image-preprocess");
  const image = await preprocessForOcr(file);
  const {
    data: { text },
  } = await worker.recognize(image);
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
  "Formula 1",
  "Formula One",
  "Red Line Club",
  "Retro Racers",
  "Team Wheels",
  "Mainline",
  "Premium",
];

// A Hot Wheels card back is mostly a long manufacturer/compliance block
// (address, warnings, certifications, barcode) underneath the actual
// name — these catch the most common shapes of that block regardless of
// language, rather than trying to list every possible legal phrase.
const NOISE_LINE =
  /copyright|mattel|made in|manufactured|imported|distributed|customer (complaint|service|care)|retail price|sale price|net quantity|product no|conforms to|choking|hazard|small parts|warning|advertencia|atenção|attention|www\.|\.com|barcode|astm|\bbis\b/i;
const MOSTLY_NON_LETTERS = /^[\d\s./\\_-]+$/;
const HAS_LABEL_COLON = /:/;
const MAX_CANDIDATE_LENGTH = 45;

// Words Tesseract commonly misreads on glossy/stylized packaging print,
// corrected so a recognizable brand name doesn't end up misspelled in
// the autofilled fields.
const WORD_CORRECTIONS: Record<string, string> = {
  HARTIN: "MARTIN",
  ARANCO: "ARAMCO",
};

function cleanLine(line: string): string {
  return line
    // A stray 1-3 letter OCR artifact immediately before a ©/®/™ mark,
    // e.g. "IR © ASTON MARTIN..." — drop the artifact and the mark.
    .replace(/^\s*[A-Za-z]{1,3}\s*[©®™]\s*/, "")
    .replace(/[©®™]/g, "")
    .replace(/\b[A-Za-z]+\b/g, (word) => WORD_CORRECTIONS[word.toUpperCase()] ?? word)
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface CardOcrGuess {
  castingName?: string;
  series?: string;
}

export function guessDetailsFromCardText(rawText: string): CardOcrGuess {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => cleanLine(l))
    .filter((l) => l.length >= 3 && /[a-zA-Z]/.test(l));

  // The name and series always print above the manufacturer/compliance
  // block, and OCR text comes out roughly in that same top-to-bottom
  // order — so only look near the top rather than across the whole card,
  // which is mostly that block.
  const topLines = lines.slice(0, Math.max(8, Math.ceil(lines.length * 0.35)));

  const series = KNOWN_SERIES.find((s) =>
    topLines.some((l) => l.toLowerCase().includes(s.toLowerCase())),
  );

  // The printed model name tends to be the longest short line up there
  // that isn't a barcode/number string, a "Label: value" compliance
  // line (regardless of language, almost the entire block is shaped
  // that way), or one of the small-print legal/safety lines.
  const candidates = topLines
    .filter((l) => !MOSTLY_NON_LETTERS.test(l))
    .filter((l) => !HAS_LABEL_COLON.test(l))
    .filter((l) => l.length <= MAX_CANDIDATE_LENGTH)
    .filter((l) => !NOISE_LINE.test(l));
  const castingName = [...candidates].sort((a, b) => b.length - a.length)[0];

  return { castingName, series };
}
