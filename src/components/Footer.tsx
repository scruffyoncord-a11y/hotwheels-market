import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 border-t border-zinc-200 px-4 py-6 dark:border-zinc-900 sm:grid-cols-3 sm:px-6">
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
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Trade and auction Hot Wheels and diecast cars with collectors near you.
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

        <div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-white">Trading safely</p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <li>Meet in a public place or use tracked shipping</li>
            <li>Inspect the item before paying</li>
            <li>Negotiate and confirm details in chat first</li>
          </ul>
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
