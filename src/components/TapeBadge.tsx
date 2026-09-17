// A little strip-of-tape look for the "Trade" badge — angled ends and a
// faint diagonal stripe texture, like a real piece of tape stuck on at
// a slight tilt. Same idea as CautionTape, but subtle and on-brand
// (violet) rather than hazard yellow/black, since a trade listing is
// nothing to warn anyone about.
export function TapeBadge({
  text = "Trade",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 text-xs font-medium text-violet-900 shadow-sm dark:text-violet-950 ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, #ede9fe 0px, #ede9fe 6px, #ddd6fe 6px, #ddd6fe 12px)",
        clipPath: "polygon(6% 0, 100% 0, 94% 100%, 0 100%)",
        transform: "rotate(-2deg)",
      }}
    >
      {text}
    </span>
  );
}
