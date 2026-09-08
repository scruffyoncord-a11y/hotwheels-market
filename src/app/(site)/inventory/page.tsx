"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConditionBadge } from "@/components/ConditionBadge";
import { CameraIcon, CarIcon, LockIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";
import { useInventory } from "@/lib/inventory-store";
import { useAuth } from "@/lib/auth-store";
import { useMyProfile } from "@/lib/use-my-profile";
import { setCollectionPublic } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { readFileAsDataUrl } from "@/lib/files";
import { placeholderImage } from "@/lib/placeholder";
import { CONDITION_LABELS, type ListingCondition } from "@/lib/types";

const CONDITIONS = Object.keys(CONDITION_LABELS) as ListingCondition[];

function AddCarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addItem } = useInventory();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [castingName, setCastingName] = useState("");
  const [series, setSeries] = useState("");
  const [condition, setCondition] = useState<ListingCondition>("MINT");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    setTitle("");
    setCastingName("");
    setSeries("");
    setCondition("MINT");
    setNotes("");
    setPhoto(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give it a title so you can find it later.");
      return;
    }
    const { error: submitError } = await addItem({
      title: title.trim(),
      castingName: castingName.trim() || undefined,
      series: series.trim() || undefined,
      condition,
      notes: notes.trim() || undefined,
      image: photo ?? placeholderImage(title, castingName || title),
    });
    if (submitError) {
      setError(submitError);
      return;
    }
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-100 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Add a car</h2>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setPhoto(await readFileAsDataUrl(file));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 transition hover:border-orange-400 hover:text-orange-500 dark:border-zinc-700"
          >
            {photo ? (
              <Image src={photo} alt="" fill unoptimized className="object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-sm font-medium">
                <CameraIcon className="h-5 w-5" />
                Add a photo (optional)
              </span>
            )}
          </button>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. "Nissan Skyline GT-R (R34)"`}
              className="input"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Casting (optional)
              </span>
              <input
                value={castingName}
                onChange={(e) => setCastingName(e.target.value)}
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Series (optional)
              </span>
              <input value={series} onChange={(e) => setSeries(e.target.value)} className="input" />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Condition</span>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ListingCondition)}
              className="input"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Where you got it, condition details..."
              className="input resize-none"
            />
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            className="mt-1 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Add to collection
          </button>
        </form>
      </div>
    </div>
  );
}

function CollectionPrivacyCard() {
  const { user } = useAuth();
  const { profile, setProfile, loading } = useMyProfile();
  const [saving, setSaving] = useState(false);

  if (loading || !user.id) return null;

  if (!profile?.username) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <LockIcon className="h-4 w-4" /> Set a username to control who can see your collection.
        </span>
        <Link href="/settings" className="font-semibold text-orange-600 hover:underline">
          Set up in Settings →
        </Link>
      </div>
    );
  }

  async function toggle() {
    if (!user.id || !profile) return;
    setSaving(true);
    const next = !profile.collectionPublic;
    const { error } = await setCollectionPublic(createClient(), user.id, next);
    setSaving(false);
    if (!error) setProfile({ ...profile, collectionPublic: next });
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {profile.collectionPublic ? "Your collection is public" : "Your collection is private"}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {profile.collectionPublic
            ? `Visible to anyone who views @${profile.username}'s profile.`
            : "Only you can see it — not shown on your public profile."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`rounded-full px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-60 ${
          profile.collectionPublic
            ? "bg-zinc-700 hover:bg-zinc-600"
            : "bg-orange-600 hover:bg-orange-700"
        }`}
      >
        {saving ? "Saving…" : profile.collectionPublic ? "Make Private" : "Make Public"}
      </button>
    </div>
  );
}

export default function InventoryPage() {
  const { items, removeItem } = useInventory();
  const { isAuthenticated } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">
      <PageHeader
        title="My Collection"
        subtitle={`${items.length} ${items.length === 1 ? "car" : "cars"} in your inventory — not listed yet`}
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            + Add car
          </button>
        }
      />

      {!isAuthenticated && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
          Sign in with a real account to build a collection.
          <Link href="/login?next=%2Finventory" className="font-bold underline">
            Sign in
          </Link>
        </p>
      )}

      {isAuthenticated && <div className="mt-6"><CollectionPrivacyCard /></div>}

      {items.length === 0 ? (
        <EmptyState
          icon={<CarIcon className="h-8 w-8" />}
          title="Nothing in your collection yet. Add the cars you own to keep track of them, then list any of them for trade or auction whenever you're ready."
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              + Add your first car
            </button>
          }
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          <button
            onClick={() => setModalOpen(true)}
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 text-zinc-400 transition hover:border-orange-400 hover:text-orange-500 dark:border-zinc-700 dark:hover:border-orange-500"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-current">
              <PlusIcon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Add a car</span>
          </button>
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                <Image src={item.image} alt={item.title} fill unoptimized className="object-cover" />
                <div className="absolute left-2 top-2">
                  <ConditionBadge condition={item.condition} />
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </p>
                {item.series && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.series}</p>
                )}
                {item.notes && (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.notes}
                  </p>
                )}
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <Link
                      href={`/sell?type=TRADE&inventoryId=${item.id}`}
                      className="flex-1 rounded-full bg-violet-600 px-2 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-violet-700"
                    >
                      List for Trade
                    </Link>
                    <Link
                      href={`/sell?type=AUCTION&inventoryId=${item.id}`}
                      className="flex-1 rounded-full bg-red-600 px-2 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      Auction
                    </Link>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-zinc-100 py-1.5 text-xs text-zinc-600 transition hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <TrashIcon className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCarModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  );
}
