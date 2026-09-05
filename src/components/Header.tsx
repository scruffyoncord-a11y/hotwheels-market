"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useFavorites } from "@/lib/favorites-store";
import { useAuth } from "@/lib/auth-store";
import { useListings } from "@/lib/listings-store";
import { createClient } from "@/lib/supabase/client";
import { getProfileByUsername } from "@/lib/profile";
import { isAuctionEnded } from "./AuctionTimer";
import { Avatar } from "./Avatar";
import { HammerIcon, HeartIcon, SearchIcon, SwapIcon } from "./icons";

function NavLink({
  href,
  icon,
  badge,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const path = href.split("?")[0];
  const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-orange-600 text-white"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
      }`}
    >
      {icon}
      {children}
      {badge}
      {active && !badge && icon && (
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
      )}
    </Link>
  );
}

export function Header() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const { listings } = useListings();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const hasLiveAuction = listings.some(
    (l) => l.type === "AUCTION" && l.status === "ACTIVE" && !(l.endsAt && isAuctionEnded(l.endsAt)),
  );

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.startsWith("@") && trimmed.length > 1) {
      setSearching(true);
      const profile = await getProfileByUsername(createClient(), trimmed.slice(1));
      setSearching(false);
      if (profile) {
        router.push(`/u/${profile.username}`);
        return;
      }
    }
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-1">
          <Image
            src="/logo-icon.png"
            alt="LotClub"
            width={32}
            height={32}
            className="h-8 w-8 rounded-xl"
            priority
          />
          <Image
            src="/logo-wordmark.png"
            alt="LotClub"
            width={216}
            height={72}
            className="hidden h-7 w-auto sm:inline-block"
            priority
          />
        </Link>

        <nav className="hidden shrink-0 items-center gap-1 sm:flex">
          <NavLink href="/" icon={<SwapIcon className="h-3.5 w-3.5" />}>
            For Trade
          </NavLink>
          <NavLink
            href="/auctions"
            icon={<HammerIcon className="h-3.5 w-3.5" />}
            badge={
              hasLiveAuction && (
                <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                  LIVE
                </span>
              )
            }
          >
            Auctions
          </NavLink>
        </nav>

        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search castings, series, sellers, or @username..."
              disabled={searching}
              className="w-full rounded-full border border-zinc-700 bg-zinc-800/80 py-2 pl-8 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </form>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/sell"
            className="rounded-full bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 sm:px-4"
          >
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">+ List a car</span>
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <NavLink href="/inventory">My Collection</NavLink>
            <NavLink href="/profile?tab=listings">My Listings</NavLink>
          </div>
          <Link
            href="/wishlist"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-orange-400"
            title="Your wishlist"
          >
            <HeartIcon className="h-4.5 w-4.5" filled={favoriteIds.length > 0} />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
                {favoriteIds.length}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <Link href="/settings" title={user.displayName}>
              <Avatar name={user.displayName} url={user.avatarUrl} size={36} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-zinc-700 px-3.5 py-2 text-sm font-semibold text-zinc-300 transition hover:border-orange-400 hover:text-orange-400"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-zinc-800 px-4 py-1.5 sm:hidden">
        <NavLink href="/" icon={<SwapIcon className="h-3.5 w-3.5" />}>
          For Trade
        </NavLink>
        <NavLink
          href="/auctions"
          icon={<HammerIcon className="h-3.5 w-3.5" />}
          badge={
            hasLiveAuction && (
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                LIVE
              </span>
            )
          }
        >
          Auctions
        </NavLink>
        <NavLink href="/inventory">Collection</NavLink>
        <NavLink href="/wishlist">Wishlist</NavLink>
        <NavLink href="/profile">Profile</NavLink>
      </nav>
    </header>
  );
}
