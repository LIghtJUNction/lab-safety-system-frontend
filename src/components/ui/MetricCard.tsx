import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent?: "primary" | "amber" | "rose" | "slate";
}) {
  const accents = {
    primary:
      "text-stone-700 bg-stone-100 ring-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:ring-stone-700",
    amber:
      "text-amber-700 bg-amber-50 ring-amber-100 dark:text-amber-400 dark:bg-amber-500/15 dark:ring-amber-500/25",
    rose: "text-rose-600 bg-rose-50 ring-rose-100 dark:text-rose-400 dark:bg-rose-500/15 dark:ring-rose-500/25",
    slate:
      "text-stone-600 bg-stone-50 ring-stone-200 dark:text-stone-400 dark:bg-stone-900 dark:ring-stone-800",
  };

  return (
    <div className="group rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
            {label}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {value}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl ring-1",
            accents[accent],
          )}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}