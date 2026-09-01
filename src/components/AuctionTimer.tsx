"use client";

import { useEffect, useState } from "react";
import { ZapIcon } from "./icons";

interface RemainingParts {
  ended: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getRemaining(endsAt: string, now: number): RemainingParts {
  const totalMs = new Date(endsAt).getTime() - now;
  if (totalMs <= 0) {
    return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    ended: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

function formatRemaining(p: RemainingParts): string {
  if (p.ended) return "Auction ended";
  if (p.days > 0) return `${p.days}d ${p.hours}h left`;
  if (p.hours > 0) return `${p.hours}h ${p.minutes}m left`;
  if (p.minutes > 0) return `${p.minutes}m ${p.seconds}s left`;
  return `${p.seconds}s left`;
}

/** Uses null-until-mounted so server and first client render match (both blank). */
function useNow(tickMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);
  return now;
}

export function AuctionTimer({
  endsAt,
  className,
}: {
  endsAt: string;
  className?: string;
}) {
  const now = useNow(1000);

  if (now === null) {
    return <span className={className}>&nbsp;</span>;
  }

  const remaining = getRemaining(endsAt, now);
  const urgent = !remaining.ended && remaining.totalMs < 60 * 60 * 1000;

  return (
    <span
      className={`${className ?? ""} ${
        remaining.ended ? "text-zinc-400" : urgent ? "text-red-600 dark:text-red-400" : ""
      }`}
    >
      {formatRemaining(remaining)}
    </span>
  );
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-xl font-black tabular-nums text-white shadow-sm dark:bg-zinc-800 sm:h-14 sm:w-14 sm:text-2xl">
        {String(value).padStart(2, "0")}
      </div>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
    </div>
  );
}

/** Big boxed-digit countdown for the auction detail page — pulses red under 5 minutes. */
export function AuctionTimerBig({ endsAt }: { endsAt: string }) {
  const now = useNow(1000);

  if (now === null) {
    return <div className="h-14" />;
  }

  const remaining = getRemaining(endsAt, now);

  if (remaining.ended) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-lg font-bold text-zinc-500">Auction ended</span>
      </div>
    );
  }

  const critical = remaining.totalMs < 5 * 60 * 1000;
  const urgent = remaining.totalMs < 60 * 60 * 1000;

  const closesLabel = new Date(endsAt).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-2xl border px-4 py-3 shadow-sm ${
        critical
          ? "animate-pulse border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40"
          : urgent
            ? "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20"
            : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
    <div className="flex items-center gap-3">
      <span className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${critical ? "text-red-600" : "text-zinc-500"}`}>
        {critical ? (
          <>
            <ZapIcon className="h-3 w-3" /> Ending now
          </>
        ) : (
          "Time left"
        )}
      </span>
      <div className="flex items-center gap-1.5">
        {remaining.days > 0 && (
          <>
            <Digit value={remaining.days} label="days" />
            <span className="pb-4 text-lg font-bold text-zinc-400">:</span>
          </>
        )}
        <Digit value={remaining.hours} label="hrs" />
        <span className="pb-4 text-lg font-bold text-zinc-400">:</span>
        <Digit value={remaining.minutes} label="min" />
        <span className="pb-4 text-lg font-bold text-zinc-400">:</span>
        <Digit value={remaining.seconds} label="sec" />
      </div>
    </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Closes {closesLabel}</p>
    </div>
  );
}

export function isAuctionEnded(endsAt: string): boolean {
  return new Date(endsAt).getTime() <= Date.now();
}
