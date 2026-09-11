"use client";

import { useEffect, useState } from "react";
import { XIcon } from "@/components/icons";

const AD_DURATION_SECONDS = 5;

// Placeholder ad experience — swap the contents of the ad slot below for
// whatever ad network's actual embed/script once one is wired up (see the
// TODO inside). The gating flow (countdown, disabled-until-done Continue
// button) stays the same regardless of ad network.
//
// Rendered conditionally by the caller (`{adOpen && <WatchAdModal .../>}`)
// rather than taking an `open` prop — that way each attempt is a fresh
// mount, so the countdown always restarts instead of staying stuck at 0
// from a previous watch.
export function WatchAdModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const done = secondsLeft === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Watch an ad to continue
          </p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* TODO: replace with the real ad network's embed once one is
            chosen (e.g. Adsterra/PropellerAds/ExoClick rewarded unit).
            Keep this div's id stable if the network needs a mount point. */}
        <div
          id="ad-slot"
          className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
        >
          <span className="text-xs font-bold uppercase tracking-wide">Advertisement</span>
          <span className="text-[11px]">Ad content goes here</span>
        </div>

        <div className="mt-4">
          {!done ? (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Continue in {secondsLeft}s…
            </p>
          ) : (
            <button
              onClick={onComplete}
              className="w-full rounded-full bg-orange-600 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
