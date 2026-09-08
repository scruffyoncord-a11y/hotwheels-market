"use client";

import { use, useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ListingCard } from "@/components/ListingCard";
import { ConditionBadge } from "@/components/ConditionBadge";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { CarIcon, LockIcon } from "@/components/icons";
import { ReportButton } from "@/components/ReportButton";
import { useListings } from "@/lib/listings-store";
import { createClient } from "@/lib/supabase/client";
import { getProfileByUsername, type Profile } from "@/lib/profile";
import type { InventoryItem } from "@/lib/types";

interface InventoryRow {
  id: string;
  title: string;
  casting_name: string | null;
  series: string | null;
  condition: InventoryItem["condition"];
  notes: string | null;
  image: string;
  created_at: string;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { listings } = useListings();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [collection, setCollection] = useState<InventoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    getProfileByUsername(supabase, username).then((p) => {
      if (cancelled) return;
      setProfile(p);
      if (!p) return;
      supabase
        .from("inventory")
        .select("*")
        .eq("owner_id", p.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (cancelled || !data) return;
          setCollection(
            (data as InventoryRow[]).map((r) => ({
              id: r.id,
              title: r.title,
              castingName: r.casting_name ?? undefined,
              series: r.series ?? undefined,
              condition: r.condition,
              notes: r.notes ?? undefined,
              image: r.image,
              createdAt: r.created_at,
            })),
          );
        });
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const theirListings = useMemo(
    () => (profile ? listings.filter((l) => l.sellerId === profile.id && l.status !== "SOLD") : []),
    [listings, profile],
  );

  if (profile === undefined) {
    return (
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </main>
    );
  }

  if (profile === null) return notFound();

  const name = profile.displayName || `@${profile.username}`;

  return (
    <main className="flex-1">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 pb-10 pt-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4">
          <Avatar name={name} url={profile.avatarUrl ?? undefined} size={64} className="text-2xl" />
          <div>
            <h1 className="text-xl font-bold text-zinc-50">{name}</h1>
            <p className="text-sm text-zinc-400">
              @{profile.username}
              {profile.city ? ` · ${profile.city}` : ""}
            </p>
          </div>
          <ReportButton targetType="user" targetId={profile.id} className="ml-auto self-start" />
        </div>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-zinc-950 px-4 pb-10 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">
            Listings ({theirListings.length})
          </h2>
          {theirListings.length === 0 ? (
            <p className="mb-8 text-sm text-zinc-500">No active listings right now.</p>
          ) : (
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {theirListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">
            Collection
          </h2>
          {!profile.collectionPublic ? (
            <EmptyState
              icon={<LockIcon className="h-8 w-8" />}
              title={`${profile.displayName || `@${profile.username}`} keeps their collection private.`}
            />
          ) : collection.length === 0 ? (
            <EmptyState icon={<CarIcon className="h-8 w-8" />} title="Nothing in their collection yet." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {collection.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm"
                >
                  <div className="relative aspect-square bg-zinc-800">
                    <Image src={item.image} alt={item.title} fill unoptimized className="object-cover" />
                    <div className="absolute left-2 top-2">
                      <ConditionBadge condition={item.condition} />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-50">{item.title}</p>
                    {item.series && <p className="text-xs text-zinc-400">{item.series}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
