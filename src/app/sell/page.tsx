"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useListings } from "@/lib/listings-store";
import { useInventory } from "@/lib/inventory-store";
import { useAuth } from "@/lib/auth-store";
import { placeholderImage } from "@/lib/placeholder";
import { readFileAsDataUrl } from "@/lib/files";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { CameraIcon, XIcon } from "@/components/icons";
import { CONDITION_LABELS, type ListingCondition, type ListingType } from "@/lib/types";

const CONDITIONS = Object.keys(CONDITION_LABELS) as ListingCondition[];

function PhotoSlot({
  label,
  photo,
  onChange,
  onRemove,
}: {
  label: string;
  photo: string | null;
  onChange: (file: File) => void;
  onRemove?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex aspect-square w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 text-center transition ${
          photo
            ? "border-solid border-zinc-300 dark:border-zinc-700"
            : "border-dashed border-zinc-300 text-zinc-400 hover:border-orange-400 hover:text-orange-500 dark:border-zinc-700"
        }`}
      >
        {photo ? (
          <Image src={photo} alt={label} fill unoptimized className="object-cover" />
        ) : (
          <>
            <CameraIcon className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </>
        )}
      </button>
      {photo && (
        <>
          <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {label}
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-500"
              title="Remove"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SellForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addListing } = useListings();
  const { getItem } = useInventory();
  const { user, isAuthenticated } = useAuth();
  const inventoryId = searchParams.get("inventoryId");

  const [type, setType] = useState<ListingType>(
    searchParams.get("type") === "AUCTION" ? "AUCTION" : "TRADE",
  );
  const [title, setTitle] = useState("");
  const [castingName, setCastingName] = useState("");
  const [series, setSeries] = useState("");
  const [condition, setCondition] = useState<ListingCondition>("GOOD");
  const [wantsInExchange, setWantsInExchange] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [startingBid, setStartingBid] = useState("");
  const [bidIncrement, setBidIncrement] = useState("100");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [durationDays, setDurationDays] = useState("3");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [prefilledFromInventory, setPrefilledFromInventory] = useState(false);

  useEffect(() => {
    if (!inventoryId) return;
    const item = getItem(inventoryId);
    if (!item) return;
    setTitle(item.title);
    setCastingName(item.castingName ?? "");
    setSeries(item.series ?? "");
    setCondition(item.condition);
    setFrontPhoto(item.image);
    setPrefilledFromInventory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryId]);

  const previewSeed = title || "New Listing";
  const fallbackPreview = placeholderImage(previewSeed + "-preview", castingName || title || "Preview");
  const previewImage = frontPhoto ?? fallbackPreview;
  const isTrade = type === "TRADE";
  const isAuction = type === "AUCTION";

  async function handleSlotChange(file: File, setter: (url: string) => void) {
    setter(await readFileAsDataUrl(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isAuthenticated || !user.id) {
      setError("Sign in with a real account to publish a listing.");
      return;
    }

    const missing = [
      !title.trim() && "title",
      !city.trim() && "city",
      !description.trim() && "description",
    ].filter(Boolean) as string[];
    if (missing.length > 0) {
      setError(`Please fill in ${missing.join(", ")}.`);
      return;
    }
    if (!frontPhoto || !backPhoto) {
      setError("Add at least 2 photos — front and back of the car.");
      return;
    }
    if (isTrade && !wantsInExchange.trim()) {
      setError("Let others know what you're looking for in exchange.");
      return;
    }
    const startingBidInr = Number(startingBid);
    const buyNowInr = buyNowPrice ? Number(buyNowPrice) : undefined;
    if (isAuction) {
      if (!startingBidInr || startingBidInr <= 0) {
        setError("Please enter a valid starting bid.");
        return;
      }
      if (buyNowInr && buyNowInr <= startingBidInr) {
        setError("Buy Now price should be higher than the starting bid.");
        return;
      }
    }

    const id = crypto.randomUUID();
    const { error: submitError } = await addListing({
      id,
      type,
      title: title.trim(),
      description: description.trim(),
      castingName: castingName.trim() || undefined,
      series: series.trim() || undefined,
      condition,
      wantsInExchange: isTrade ? wantsInExchange.trim() : undefined,
      startingBidInr: isAuction ? startingBidInr : undefined,
      bidIncrementInr: isAuction ? Number(bidIncrement) || 100 : undefined,
      buyNowInr: isAuction ? buyNowInr : undefined,
      endsAt: isAuction
        ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      isPrivate: isAuction ? isPrivate : undefined,
      accessToken: isAuction && isPrivate ? Math.random().toString(36).slice(2, 10) : undefined,
      city: city.trim(),
      status: "ACTIVE",
      images: [frontPhoto, backPhoto, ...extraPhotos],
      sellerId: user.id,
      seller: { name: user.displayName, city: city.trim() || "—", rating: 5.0, dealsCompleted: 0 },
      createdAt: new Date().toISOString(),
    });

    if (submitError) {
      setError(submitError);
      return;
    }

    const next = searchParams.get("next");
    router.push(next || `/listing/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        title="List a car"
        subtitle="Trades and pickup/shipping are arranged directly with the other collector through in-app chat."
      />

      {!isAuthenticated && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
          Sign in with a real account to publish a listing.
          <Link href="/login?next=%2Fsell" className="font-bold underline">
            Sign in
          </Link>
        </p>
      )}

      {prefilledFromInventory && (
        <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          Prefilled from your collection — add a back photo and a few more details to publish.
        </p>
      )}

      <div className="mt-4 inline-flex rounded-full border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setType("TRADE")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            isTrade
              ? "bg-violet-600 text-white"
              : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          Trade for another car
        </button>
        <button
          type="button"
          onClick={() => setType("AUCTION")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            isAuction ? "bg-red-600 text-white" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          Start an auction
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_260px]">
        <SectionCard title="Car details">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Photos <span className="text-zinc-400">— at least 2 required</span>
            </span>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              <PhotoSlot
                label="Front"
                photo={frontPhoto}
                onChange={(file) => handleSlotChange(file, setFrontPhoto)}
                onRemove={() => setFrontPhoto(null)}
              />
              <PhotoSlot
                label="Back"
                photo={backPhoto}
                onChange={(file) => handleSlotChange(file, setBackPhoto)}
                onRemove={() => setBackPhoto(null)}
              />
              {extraPhotos.map((photo, i) => (
                <PhotoSlot
                  key={i}
                  label={`Photo ${i + 3}`}
                  photo={photo}
                  onChange={(file) =>
                    handleSlotChange(file, (url) =>
                      setExtraPhotos((prev) => prev.map((p, idx) => (idx === i ? url : p))),
                    )
                  }
                  onRemove={() => setExtraPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                />
              ))}
              {extraPhotos.length < 2 && (
                <PhotoSlot
                  label="Add more"
                  photo={null}
                  onChange={(file) =>
                    handleSlotChange(file, (url) => setExtraPhotos((prev) => [...prev, url]))
                  }
                />
              )}
            </div>
          </div>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. "Super Treasure Hunt '18 Camaro SS"`}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Casting name (optional)">
              <input
                value={castingName}
                onChange={(e) => setCastingName(e.target.value)}
                placeholder="e.g. Boss 302 Mustang"
                className="input"
              />
            </Field>
            <Field label="Series (optional)">
              <input
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="e.g. Premium, Treasure Hunt, RLC"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Condition">
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
            </Field>
            {isTrade ? (
              <Field label="City">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="input"
                />
              </Field>
            ) : (
              <Field label="Starting bid (INR)">
                <input
                  value={startingBid}
                  onChange={(e) => setStartingBid(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="e.g. 2000"
                  className="input"
                />
              </Field>
            )}
          </div>

          {isTrade ? (
            <Field label="What are you looking for in exchange?">
              <input
                value={wantsInExchange}
                onChange={(e) => setWantsInExchange(e.target.value)}
                placeholder="e.g. Any Nissan Skyline GT-R, mint condition"
                className="input"
              />
            </Field>
          ) : (
            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="input"
              />
            </Field>
          )}

          {isAuction && (
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
              <Field label="Bid increment (INR)">
                <input
                  value={bidIncrement}
                  onChange={(e) => setBidIncrement(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="e.g. 100"
                  className="input"
                />
              </Field>
              <Field label="Auction duration">
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="input"
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Buy Now price (optional)">
                  <input
                    value={buyNowPrice}
                    onChange={(e) => setBuyNowPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    placeholder="Skip bidding — let a buyer purchase instantly"
                    className="input"
                  />
                </Field>
              </div>
              <label className="col-span-2 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
                <span>
                  <span className="font-medium">Make this a private auction</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    It still shows up on the auctions page, but bidders need your approval — or an
                    invite link — before they can see it.
                  </span>
                </span>
              </label>
            </div>
          )}

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Condition details, packaging, why it's special..."
              className="input resize-none"
            />
          </Field>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            className={`mt-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition ${
              isTrade ? "bg-violet-600 hover:bg-violet-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isTrade ? "Publish trade listing" : "Start auction"}
          </button>
        </form>
        </SectionCard>

        <SectionCard title="Preview">
          <div className="p-5">
            <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
              <Image src={previewImage} alt="" fill unoptimized className="object-cover" />
            </div>
            <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {title || "Your listing title"}
            </p>
            {isTrade ? (
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-400">
                Wants: {wantsInExchange || "—"}
              </p>
            ) : (
              <div>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  Starting bid: {startingBid ? `₹${Number(startingBid).toLocaleString("en-IN")}` : "₹—"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Runs {durationDays} {durationDays === "1" ? "day" : "days"}
                  {buyNowPrice && ` · Buy Now ₹${Number(buyNowPrice).toLocaleString("en-IN")}`}
                </p>
              </div>
            )}
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {frontPhoto
                ? "Shows your uploaded front photo."
                : "Upload a front photo to replace this placeholder."}
            </p>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

export default function SellPage() {
  return (
    <Suspense>
      <SellForm />
    </Suspense>
  );
}
