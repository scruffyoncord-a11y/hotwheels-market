"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListingCard } from "./ListingCard";
import { EmptyState } from "./ui/EmptyState";
import { PageHeader } from "./ui/PageHeader";
import { SearchIcon } from "./icons";
import { useListings } from "@/lib/listings-store";
import { useBids } from "@/lib/bids-store";
import { CONDITION_LABELS, type ListingCondition, type ListingType } from "@/lib/types";

const CONDITIONS = Object.keys(CONDITION_LABELS) as ListingCondition[];
type SortKey = "newest" | "price-asc" | "price-desc" | "ending-soon" | "bid-desc";

export function BrowseListings({
  type,
  subheading,
}: {
  type: ListingType;
  subheading: string;
}) {
  const { listings } = useListings();
  const { highestBid } = useBids();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const isAuction = type === "AUCTION";

  const [activeConditions, setActiveConditions] = useState<Set<ListingCondition>>(new Set());
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<SortKey>(isAuction ? "ending-soon" : "newest");
  const [hideUnavailable, setHideUnavailable] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const byType = useMemo(() => listings.filter((l) => l.type === type), [listings, type]);

  const cities = useMemo(() => Array.from(new Set(byType.map((l) => l.city))).sort(), [byType]);

  const filtered = useMemo(() => {
    let result = byType.filter((l) => {
      if (hideUnavailable && l.status !== "ACTIVE") return false;
      if (activeConditions.size > 0 && !activeConditions.has(l.condition)) return false;
      if (city && l.city !== city) return false;
      if (query) {
        const haystack = `${l.title} ${l.castingName ?? ""} ${l.series ?? ""} ${
          l.wantsInExchange ?? ""
        }`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (isAuction && sort === "ending-soon") {
        return new Date(a.endsAt ?? 0).getTime() - new Date(b.endsAt ?? 0).getTime();
      }
      if (isAuction && sort === "bid-desc") {
        const bidA = highestBid(a.id)?.amountInr ?? a.startingBidInr ?? 0;
        const bidB = highestBid(b.id)?.amountInr ?? b.startingBidInr ?? 0;
        return bidB - bidA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [byType, activeConditions, city, sort, hideUnavailable, query, isAuction, highestBid]);

  function toggleCondition(c: ListingCondition) {
    setActiveConditions((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  const activeFilterCount = activeConditions.size + (city ? 1 : 0);

  function clearFilters() {
    setActiveConditions(new Set());
    setCity("");
  }

  const filterPanel = (
    <div className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-50">Refine Search</h2>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-orange-400 hover:underline"
          >
            Reset ({activeFilterCount})
          </button>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Card Condition
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => {
            const active = activeConditions.has(c);
            return (
              <button
                key={c}
                onClick={() => toggleCondition(c)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {CONDITION_LABELS[c]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Collector Location
        </h3>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="input w-full"
        >
          <option value="">All cities across India</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isAuction && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Sort
          </h3>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input w-full"
          >
            <option value="ending-soon">Ending soon</option>
            <option value="bid-desc">Highest bid</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={hideUnavailable}
          onChange={(e) => setHideUnavailable(e.target.checked)}
          className="rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
        />
        Hide Pending/Reserved
      </label>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">
      <PageHeader
        title={query ? `Results for "${query}"` : isAuction ? "Live auctions" : "For trade"}
        subtitle={
          <>
            {filtered.length} {filtered.length === 1 ? "listing" : "listings"} · {subheading}
          </>
        }
        actions={
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-sm font-semibold text-zinc-300 shadow-sm transition hover:border-orange-500 lg:hidden"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className={`w-full shrink-0 lg:block lg:w-56 ${filtersOpen ? "block" : "hidden"}`}>
          <div className="lg:sticky lg:top-32">{filterPanel}</div>
        </aside>

        <div className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="h-8 w-8" />}
              title="No listings match your filters."
              action={
                activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    Clear filters
                  </button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
