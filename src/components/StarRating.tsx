import { StarIcon } from "./icons";

// Read-only average display, built from a real rating_sum/rating_count
// rollup (see submit_trade_rating() in migration 0012) — never a
// hardcoded number.
export function StarRating({
  sum,
  count,
  className = "text-xs text-zinc-500 dark:text-zinc-400",
}: {
  sum: number;
  count: number;
  className?: string;
}) {
  if (count === 0) {
    return <span className={className}>No ratings yet</span>;
  }
  const average = sum / count;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <StarIcon className="h-3.5 w-3.5 text-amber-400" filled />
      {average.toFixed(1)} ({count})
    </span>
  );
}
