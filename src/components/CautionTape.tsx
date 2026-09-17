// A diagonal hazard-tape banner — used to flag an ended auction the way
// a real caution tape strip would, rather than a plain text pill.
export function CautionTape({
  text = "AUCTION ENDED",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden ${className}`}
    >
      <div
        className="w-[140%] -rotate-6 border-y-2 border-black py-1.5 text-center shadow-lg"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #f5c518 0px, #f5c518 18px, #18181b 18px, #18181b 36px)",
        }}
      >
        <span
          className="text-sm font-extrabold tracking-[0.2em] text-white"
          style={{
            textShadow:
              "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 0 4px rgba(0,0,0,0.6)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
