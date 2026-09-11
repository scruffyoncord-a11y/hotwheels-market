import Link from "next/link";
import Image from "next/image";
import { useListings } from "@/lib/listings-store";
import { ListingCard } from "@/components/ListingCard";
import {
  CheckIcon,
  HammerIcon,
  HandshakeIcon,
  ShieldIcon,
  SwapIcon,
  UsersIcon,
} from "@/components/icons";

function TrustCard({
  icon,
  title,
  body,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
        {icon}
      </span>
      <p className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{body}</p>
      <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-orange-500 dark:text-orange-400">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400" /> {tag}
      </p>
    </div>
  );
}

function StepCard({
  icon,
  eyebrow,
  title,
  steps,
  accent,
  footnote,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  steps: string[];
  accent: "violet" | "red";
  footnote: string;
}) {
  const accentClasses =
    accent === "violet"
      ? "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
      : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400";
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClasses}`}>
        {icon}
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {eyebrow}
      </p>
      <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{title}</p>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        {footnote}
      </p>
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-2xl">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>
  );
}

export function LandingPage({ onContinue }: { onContinue: () => void }) {
  const { listings } = useListings();
  const activeListings = listings.filter((l) => l.status === "ACTIVE");
  const previewListings = activeListings.slice(0, 4);

  return (
    <main className="flex-1">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-900 dark:from-zinc-950 dark:to-zinc-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background:
              "radial-gradient(600px circle at 30% 20%, rgba(249,115,22,0.16), transparent 60%), " +
              "radial-gradient(500px circle at 75% 60%, rgba(139,92,246,0.14), transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
          <Image
            src="/logo-lockup-crop.png"
            alt="LotClub"
            width={1431}
            height={355}
            className="h-10 w-auto brightness-0 dark:brightness-100 sm:h-12"
            priority
          />
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-400">
            For collectors, not scalpers
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Trade and bid with real Hot Wheels collectors.
          </h1>
          <p className="mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Swap cars from your own collection, or bid in live auctions — every listing is a
            genuine trade or auction between real, signed-in collectors near you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onContinue}
              className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(249,115,22,0.35)] transition hover:bg-orange-700 hover:shadow-[0_0_36px_rgba(249,115,22,0.55)]"
            >
              Browse trades
            </button>
            <Link
              href="/auctions"
              onClick={onContinue}
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 shadow-[0_0_20px_rgba(244,244,245,0.08)] transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]"
            >
              See live auctions
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            <StatPill value={String(activeListings.length)} label="Active Listings" />
            <StatPill value="0%" label="Scalper Markup" />
            <StatPill value="100%" label="Google-Verified" />
          </div>
        </div>
      </div>

      {/* Trust section */}
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Built by collectors, for collectors — not scalpers.
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Every listing here is a genuine trade or auction between real collectors — no
            scalping, no bots, no inflated flips.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TrustCard
            icon={<ShieldIcon className="h-5 w-5" />}
            title="No scalping, ever"
            body="Trades happen car-for-car, and auctions go to the highest genuine bid — nobody's marking up a restock to flip it."
            tag="Fair Play Protocol"
          />
          <TrustCard
            icon={<UsersIcon className="h-5 w-5" />}
            title="Real accounts only"
            body="Every collector signs in with a real Google account and builds a public trading history — no anonymous flipping."
            tag="1-Click Google Auth"
          />
          <TrustCard
            icon={<HandshakeIcon className="h-5 w-5" />}
            title="Confirmed both ways"
            body="A trade only closes once both sides confirm it actually happened — no one-sided disputes."
            tag="Dual-Party Lock"
          />
        </div>
      </div>

      {/* How it works */}
      <div className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Two ways to get the car you want
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <StepCard
              icon={<SwapIcon className="h-5 w-5" />}
              eyebrow="Trade"
              title="Swap cars, no cash needed"
              accent="violet"
              steps={[
                "List a car from your collection and say what you'd trade it for",
                "Other collectors propose trades using cars from their own collection",
                "Accept an offer, coordinate the handover, and confirm the trade",
              ]}
              footnote="Direct collector swap — no cash changes hands."
            />
            <StepCard
              icon={<HammerIcon className="h-5 w-5" />}
              eyebrow="Auction"
              title="Bid it out, highest offer wins"
              accent="red"
              steps={[
                "Set a starting bid and, if you want, a Buy Now price",
                "Collectors place max bids — we only bid as much as needed to keep them ahead",
                "A late bid extends the clock, so the real highest bidder always wins",
              ]}
              footnote="Anti-snipe extension keeps the last few minutes fair."
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      {previewListings.length > 0 && (
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            On the board right now
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {previewListings.map((l) => (
              <div key={l.id} onClick={onContinue}>
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closing CTA */}
      <div className="bg-zinc-100 px-4 py-14 dark:bg-black sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-3xl border border-zinc-200 bg-white px-4 py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-[0_0_24px_rgba(249,115,22,0.5)]">
            <CheckIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-zinc-900 dark:text-white">
            Ready to find your next trade?
          </h2>
          <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Join real Hot Wheels collectors near you. List a car in under two minutes — every
            listing is between genuine collectors, never a scalper.
          </p>
          <button
            onClick={onContinue}
            className="mt-6 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(249,115,22,0.4)] transition hover:bg-orange-700 hover:shadow-[0_0_36px_rgba(249,115,22,0.6)]"
          >
            Browse trades
          </button>
        </div>
      </div>
    </main>
  );
}
