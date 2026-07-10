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
    <div className="surface-bezel surface-interactive group rounded-[1.45rem] p-1.5">
      <div className="surface-core flex h-full items-start justify-between gap-3 rounded-[1.1rem] p-4">
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
            "flex h-10 w-10 items-center justify-center rounded-[0.9rem] ring-1 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[-3deg] group-hover:scale-105",
            accents[accent],
          )}
        >
          <Icon size={18} strokeWidth={1.55} />
        </div>
      </div>
    </div>
  );
}
