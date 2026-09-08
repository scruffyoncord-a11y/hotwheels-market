"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useInventory } from "@/lib/inventory-store";
import { readFileAsDataUrl } from "@/lib/files";
import { placeholderImage } from "@/lib/placeholder";
import { CameraIcon, XIcon } from "@/components/icons";
import { CONDITION_LABELS, type ListingCondition } from "@/lib/types";

const CONDITIONS = Object.keys(CONDITION_LABELS) as ListingCondition[];

export function AddCarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  function closeAndReset() {
    reset();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={closeAndReset}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Add a car</h2>
          <button onClick={closeAndReset} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
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
