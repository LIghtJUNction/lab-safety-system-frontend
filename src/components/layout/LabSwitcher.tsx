import { Building2, ChevronDown } from "lucide-react";
import type { Lab } from "../../api";
import { cn } from "../../lib/cn";
import type { Language } from "../../lib/types";

export function LabSwitcher({
  labs,
  selectedLabId,
  language,
  onChange,
  compact = false,
}: {
  labs: Lab[];
  selectedLabId: number | null;
  language: Language;
  onChange: (labId: number) => void;
  compact?: boolean;
}) {
  const isEn = language === "en";
  const selected = labs.find((lab) => lab.id === selectedLabId);

  if (labs.length === 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-500 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-400",
          compact && "max-w-full",
        )}
      >
        <Building2 size={14} />
        {isEn ? "No lab assigned" : "未绑定实验室"}
      </div>
    );
  }

  return (
    <label
      className={cn(
        "group relative inline-flex min-w-0 items-center gap-2 rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600",
        compact ? "max-w-[min(100%,16rem)]" : "max-w-xs",
      )}
    >
      <span className="pointer-events-none absolute left-3 text-amber-600 dark:text-amber-400">
        <Building2 size={15} strokeWidth={1.75} />
      </span>
      <select
        value={selectedLabId ?? ""}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (next) onChange(next);
        }}
        aria-label={isEn ? "Select laboratory" : "选择实验室"}
        className={cn(
          "w-full appearance-none truncate rounded-xl bg-transparent py-2.5 pl-9 pr-9 text-sm font-medium text-stone-800 outline-none dark:text-stone-100",
          "cursor-pointer",
        )}
      >
        {!selectedLabId ? (
          <option value="" disabled>
            {isEn ? "Select lab" : "选择实验室"}
          </option>
        ) : null}
        {labs.map((lab) => (
          <option key={lab.id} value={lab.id}>
            {lab.name}
            {lab.code ? ` · ${lab.code}` : ""}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300"
      />
      {selected?.status === "maintenance" ? (
        <span className="sr-only">
          {isEn ? "Lab under maintenance" : "实验室维护中"}
        </span>
      ) : null}
    </label>
  );
}
