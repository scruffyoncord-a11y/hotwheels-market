"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites-store";
import { useAuth } from "@/lib/auth-store";
import { HeartIcon, SearchIcon } from "./icons";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const path = href.split("?")[0];
  const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const { favoriteIds } = useFavorites();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
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
          <NavLink href="/">For Trade</NavLink>
          <NavLink href="/auctions">Auctions</NavLink>
          <NavLink href="/inventory">My Collection</NavLink>
          <NavLink href="/profile?tab=listings">My Listings</NavLink>
        </nav>

        <form action="/" className="flex-1">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              name="q"
              placeholder="Search castings, series, sellers..."
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-900"
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
          <Link
            href="/wishlist"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-orange-600 dark:hover:bg-zinc-800"
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
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
              title={user.displayName}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-1.5 sm:hidden dark:border-zinc-900">
        <NavLink href="/">For Trade</NavLink>
        <NavLink href="/auctions">Auctions</NavLink>
        <NavLink href="/inventory">Collection</NavLink>
        <NavLink href="/wishlist">Wishlist</NavLink>
        <NavLink href="/profile">Profile</NavLink>
      </nav>
    </header>
  );
}
