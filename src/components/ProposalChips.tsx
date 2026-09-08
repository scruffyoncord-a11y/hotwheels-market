"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useListings } from "@/lib/listings-store";
import { createClient } from "@/lib/supabase/client";
import { formatInr } from "@/lib/format";
import type { Listing, TradeProposal } from "@/lib/types";

export function ProposalStatusBadge({ status }: { status: TradeProposal["status"] }) {
  const styles = {
    PENDING: "bg-amber-500/15 text-amber-400",
    ACCEPTED: "bg-emerald-500/15 text-emerald-400",
    DECLINED: "bg-rose-500/15 text-rose-400",
    COMPLETED: "bg-emerald-500/15 text-emerald-400",
  } as const;
  const labels = {
    PENDING: "Offer Pending",
    ACCEPTED: "Offer Accepted",
    DECLINED: "Offer Declined",
    COMPLETED: "Trade Completed",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function CashChip({ amount }: { amount: number }) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-emerald-800 bg-emerald-950 p-1.5 text-center">
      <span className="text-sm font-bold text-emerald-400">{formatInr(amount)}</span>
      <span className="text-[10px] text-emerald-500">cash</span>
    </div>
  );
}

function ListingItemChip({ listing }: { listing: Listing | undefined }) {
  if (!listing) {
    return (
      <div className="flex w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-zinc-700 p-2 text-center text-[10px] text-zinc-500">
        Unavailable
      </div>
    );
  }
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="flex w-20 shrink-0 flex-col gap-1 rounded-md border border-zinc-700 bg-zinc-800 p-1.5 transition hover:border-orange-500"
    >
      <div className="relative h-12 w-full overflow-hidden rounded bg-zinc-900">
        <Image src={listing.images[0]} alt={listing.title} fill unoptimized className="object-cover" />
      </div>
      <p className="line-clamp-2 text-[10px] font-medium leading-tight text-zinc-300">
        {listing.castingName ?? listing.title}
      </p>
    </Link>
  );
}

// What's requested from the seller — real public trade listings, so
// each links to its own page.
export function ListingItemChips({ ids, cash }: { ids: string[]; cash: number }) {
  const { listings } = useListings();
  if (ids.length === 0 && cash <= 0) {
    return <p className="text-xs text-zinc-500">Nothing offered</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <ListingItemChip key={id} listing={listings.find((l) => l.id === id)} />
      ))}
      {cash > 0 && <CashChip amount={cash} />}
    </div>
  );
}

// The proposer's side of the offer — real inventory items straight from
// their private collection, not a public listing (see migration 0005's
// comment). Fetched by id directly rather than through useInventory(),
// since that hook only ever loads the *current* viewer's own inventory —
// the seller reading a received proposal needs the proposer's items
// instead, which migration 0006's RLS policy specifically allows.
export function OfferedItemChips({ ids, cash }: { ids: string[]; cash: number }) {
  const [items, setItems] = useState<Record<string, { title: string; image: string }>>({});

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    createClient()
      .from("inventory")
      .select("id, title, casting_name, image")
      .in("id", ids)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, { title: string; image: string }> = {};
        for (const row of data as {
          id: string;
          title: string;
          casting_name: string | null;
          image: string;
        }[]) {
          map[row.id] = { title: row.casting_name ?? row.title, image: row.image };
        }
        setItems(map);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);

  if (ids.length === 0 && cash <= 0) {
    return <p className="text-xs text-zinc-500">Nothing offered</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const item = items[id];
        return item ? (
          <div
            key={id}
            className="flex w-20 shrink-0 flex-col gap-1 rounded-md border border-zinc-700 bg-zinc-800 p-1.5"
          >
            <div className="relative h-12 w-full overflow-hidden rounded bg-zinc-900">
              <Image src={item.image} alt={item.title} fill unoptimized className="object-cover" />
            </div>
            <p className="line-clamp-2 text-[10px] font-medium leading-tight text-zinc-300">
              {item.title}
            </p>
          </div>
        ) : (
          <div
            key={id}
            className="flex w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-zinc-700 p-2 text-center text-[10px] text-zinc-500"
          >
            Unavailable
          </div>
        );
      })}
      {cash > 0 && <CashChip amount={cash} />}
    </div>
  );
}
