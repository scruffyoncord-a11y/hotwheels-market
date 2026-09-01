export function EmptyState({
  icon,
  title,
  action,
  compact,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 text-center dark:border-zinc-700 ${
        compact ? "py-12" : "py-20"
      }`}
    >
      {icon && <span className="text-4xl opacity-80">{icon}</span>}
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
