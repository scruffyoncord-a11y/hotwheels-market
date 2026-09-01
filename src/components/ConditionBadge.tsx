import { CONDITION_LABELS, type ListingCondition } from "@/lib/types";

const STYLES: Record<ListingCondition, string> = {
  MINT: "bg-emerald-100 text-emerald-800",
  NEAR_MINT: "bg-teal-100 text-teal-800",
  GOOD: "bg-sky-100 text-sky-800",
  PLAYED: "bg-amber-100 text-amber-800",
  DAMAGED: "bg-rose-100 text-rose-800",
};

export function ConditionBadge({ condition }: { condition: ListingCondition }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[condition]}`}
    >
      {CONDITION_LABELS[condition]}
    </span>
  );
}
