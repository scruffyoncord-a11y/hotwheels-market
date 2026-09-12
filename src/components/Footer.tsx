import Link from "next/link";
import Image from "next/image";
import { CheckIcon, ShieldIcon } from "./icons";

const SAFETY_ITEMS = [
  { title: "Public Meetup", body: "Meet the other collector in a public place." },
  { title: "Tracked Shipping", body: "Use tracked shipping if you're not meeting in person." },
  { title: "Condition Inspection", body: "Inspect the item before paying or handing anything over." },
  { title: "Chat Confirmation", body: "Negotiate and confirm every detail in chat first." },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 border-t border-zinc-200 px-4 py-6 dark:border-zinc-900 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1fr_1fr_1.6fr]">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/logo-icon.png"
              alt="LotClub"
              width={32}
              height={32}
              className="h-6 w-6 rounded-md"
            />
            <Image
              src="/logo-wordmark.png"
              alt="LotClub"
              width={216}
              height={72}
              className="h-4 w-auto brightness-0 dark:brightness-100"
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Built by collectors, for collectors — not scalpers.
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Every listing here is a genuine trade or auction between real collectors — no
            scalping, no bots, no inflated flips.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-white">Marketplace</p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <li>
              <Link href="/" className="hover:text-orange-500 dark:hover:text-orange-400">
                Browse trades
              </Link>
            </li>
            <li>
              <Link href="/auctions" className="hover:text-orange-500 dark:hover:text-orange-400">
                Browse auctions
              </Link>
            </li>
            <li>
              <Link href="/sell" className="hover:text-orange-500 dark:hover:text-orange-400">
                List a car
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-orange-500 dark:hover:text-orange-400">
                Your profile
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white">
              Trading Safety Checklist
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldIcon className="h-2.5 w-2.5" /> Anti-Scalp Protocol
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SAFETY_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {item.title}
                  </p>
                  <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-900 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 dark:text-zinc-600">
          <span>© {new Date().getFullYear()} LotClub. All rights reserved.</span>
          <span className="flex gap-3">
            <Link href="/terms" className="hover:text-orange-500 dark:hover:text-orange-400">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-orange-500 dark:hover:text-orange-400">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="hover:text-orange-500 dark:hover:text-orange-400">
              Refund Policy
            </Link>
          </span>
        </div>
      </div>

      {/* Checkered-flag finish line, tilted for a subtle 3D racing feel. */}
      <div
        className="h-2.5 w-full origin-top"
        style={{
          transform: "perspective(40px) rotateX(25deg) scaleY(1.4)",
          backgroundImage:
            "linear-gradient(45deg, #0a0a0a 25%, transparent 25%, transparent 75%, #0a0a0a 75%, #0a0a0a), " +
            "linear-gradient(45deg, #0a0a0a 25%, #f4f4f5 25%, #f4f4f5 75%, #0a0a0a 75%, #0a0a0a)",
          backgroundSize: "11px 11px",
          backgroundPosition: "0 0, 5.5px 5.5px",
          boxShadow:
            "inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 -1.5px 0 rgba(0,0,0,0.55), 0 3px 6px rgba(0,0,0,0.35)",
        }}
      />
    </footer>
  );
}
