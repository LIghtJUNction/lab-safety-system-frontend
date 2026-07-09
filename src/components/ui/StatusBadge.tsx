import { cn } from "../../lib/cn";
import { hazardStatusLabel, repairStatusLabel, statusTone } from "../../lib/display";
import type { Language } from "../../lib/types";

export function StatusBadge({
  status,
  kind = "generic",
  language = "zh",
}: {
  status: string;
  kind?: "hazard" | "repair" | "generic";
  language?: Language;
}) {
  const tone = statusTone(status);
  const label =
    kind === "hazard"
      ? hazardStatusLabel(status, language)
      : kind === "repair"
        ? repairStatusLabel(status, language)
        : status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "ok" &&
          "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
        tone === "warn" &&
          "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
        tone === "danger" &&
          "bg-rose-100 text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25",
        tone === "info" &&
          "bg-stone-200 text-stone-700 ring-1 ring-stone-300/80 dark:bg-stone-700 dark:text-stone-200 dark:ring-stone-600",
        tone === "muted" &&
          "bg-stone-100 text-stone-500 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-700",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "ok" && "bg-emerald-500",
          tone === "warn" && "bg-amber-500",
          tone === "danger" && "bg-rose-500",
          tone === "info" && "bg-stone-500",
          tone === "muted" && "bg-stone-400",
        )}
      />
      {label}
    </span>
  );
}
