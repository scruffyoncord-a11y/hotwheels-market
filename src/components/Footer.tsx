import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600 text-sm font-black text-white">
              HW
            </span>
            <span className="text-lg font-bold text-white">TrackTrade</span>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            Trade and auction Hot Wheels and diecast cars with collectors near you.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Marketplace</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
            <li>
              <Link href="/" className="hover:text-orange-400">
                Browse trades
              </Link>
            </li>
            <li>
              <Link href="/auctions" className="hover:text-orange-400">
                Browse auctions
              </Link>
            </li>
            <li>
              <Link href="/sell" className="hover:text-orange-400">
                List a car
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-orange-400">
                Your profile
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Trading safely</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
            <li>Meet in a public place or use tracked shipping</li>
            <li>Inspect the item before paying</li>
            <li>Negotiate and confirm details in chat first</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-900 px-4 py-4 text-center text-xs text-zinc-500 sm:px-6">
        TrackTrade is a peer-to-peer listing board — payments and shipping are arranged directly
        between collectors.
      </div>
    </footer>
  );
}
