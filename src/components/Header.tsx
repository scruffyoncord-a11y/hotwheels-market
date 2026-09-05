"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useFavorites } from "@/lib/favorites-store";
import { useAuth } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";
import { getProfileByUsername } from "@/lib/profile";
import { Avatar } from "./Avatar";
import { HeartIcon, SearchIcon } from "./icons";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const path = href.split("?")[0];
  const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active ? "bg-black/15 text-white" : "text-white/85 hover:bg-black/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

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
    <header className="sticky top-0 z-20 bg-orange-600">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-1">
          <Image
            src="/logo-icon-black.png"
            alt="LotClub"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <Image
            src="/logo-wordmark.png"
            alt="LotClub"
            width={216}
            height={72}
            className="hidden h-7 w-auto brightness-0 sm:inline-block"
            priority
          />
        </Link>

        <nav className="hidden shrink-0 items-center gap-1 sm:flex">
          <NavLink href="/">For Trade</NavLink>
          <NavLink href="/auctions">Auctions</NavLink>
        </nav>

        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search castings, series, sellers, or @username..."
              disabled={searching}
              className="w-full rounded-full border border-transparent bg-white/95 py-2 pl-8 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-900/20 focus:ring-2 focus:ring-black/10"
            />
          </div>
        </form>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/sell"
            className="rounded-full bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-black sm:px-4"
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
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/85 transition hover:bg-black/10 hover:text-white"
            title="Your wishlist"
          >
            <HeartIcon className="h-4.5 w-4.5" filled={favoriteIds.length > 0} />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white">
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
              className="rounded-full border border-white/70 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-orange-600"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-orange-800/40 px-4 py-1.5 sm:hidden">
        <NavLink href="/">For Trade</NavLink>
        <NavLink href="/auctions">Auctions</NavLink>
        <NavLink href="/inventory">Collection</NavLink>
        <NavLink href="/wishlist">Wishlist</NavLink>
        <NavLink href="/profile">Profile</NavLink>
      </nav>

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
    </header>
  );
}
