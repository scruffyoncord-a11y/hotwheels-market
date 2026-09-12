"use client";

import { useState } from "react";
import { StarIcon } from "./icons";

const STARS = [1, 2, 3, 4, 5] as const;

export function StarPicker({
  onSubmit,
  busy = false,
}: {
  onSubmit: (stars: number) => void;
  busy?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          disabled={busy}
          onClick={() => {
            setSelected(n);
            onSubmit(n);
          }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 disabled:opacity-50"
          aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
        >
          <StarIcon
            className={`h-6 w-6 transition ${
              n <= (hovered || selected) ? "text-amber-400" : "text-zinc-700"
            }`}
            filled={n <= (hovered || selected)}
          />
        </button>
      ))}
    </div>
  );
}
