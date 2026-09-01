const PALETTES: [string, string][] = [
  ["#f97316", "#ea580c"], // orange
  ["#3b82f6", "#1d4ed8"], // blue
  ["#ef4444", "#b91c1c"], // red
  ["#22c55e", "#15803d"], // green
  ["#a855f7", "#7e22ce"], // purple
  ["#eab308", "#a16207"], // yellow
  ["#06b6d4", "#0e7490"], // cyan
  ["#ec4899", "#be185d"], // pink
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Generates a deterministic SVG "box art" placeholder for a listing, so the
// UI has consistent, offline-friendly imagery without needing real photos.
export function placeholderImage(seed: string, label: string): string {
  const idx = hashSeed(seed) % PALETTES.length;
  const [from, to] = PALETTES[idx];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}" />
          <stop offset="1" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="600" height="450" fill="url(#g)" />
      <g transform="translate(150,190)" opacity="0.9">
        <rect x="0" y="40" width="300" height="55" rx="14" fill="#111827" />
        <path d="M20 40 L70 -10 L230 -10 L280 40 Z" fill="#111827" />
        <path d="M85 35 L110 0 L215 0 L235 35 Z" fill="${to}" opacity="0.5" />
        <circle cx="70" cy="100" r="32" fill="#111827" />
        <circle cx="70" cy="100" r="14" fill="#9ca3af" />
        <circle cx="230" cy="100" r="32" fill="#111827" />
        <circle cx="230" cy="100" r="14" fill="#9ca3af" />
      </g>
      <text x="300" y="410" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,0.85)" text-anchor="middle">${label}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
