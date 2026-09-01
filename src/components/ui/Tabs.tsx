interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

/** Pill-style tab bar. Purely presentational — caller owns the active state. */
export function Tabs<T extends string>({
  items,
  active,
  onChange,
  accent = "orange",
}: {
  items: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  accent?: "orange" | "violet" | "red" | "zinc";
}) {
  const activeClass = {
    orange: "bg-orange-600 text-white",
    violet: "bg-violet-600 text-white",
    red: "bg-red-600 text-white",
    zinc: "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900",
  }[accent];

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            active === item.key ? activeClass : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {item.label}
          {typeof item.count === "number" && (
            <span
              className={`ml-1.5 text-xs ${active === item.key ? "opacity-80" : "text-zinc-400"}`}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
