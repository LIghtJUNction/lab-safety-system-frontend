import { ChevronRight, Inbox } from "lucide-react";
import { LANGUAGE_KEY } from "../../lib/constants";
import { hazardStatusLabel, isStatusToken, repairStatusLabel, tableCellClass } from "../../lib/display";
import { TableRow } from "../../lib/types";
import { cn } from "../../lib/cn";

function currentLanguage() {
  return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
}

function formatCell(cell: string) {
  const language = currentLanguage();
  if (!isStatusToken(cell)) return cell;
  // Prefer localized hazard/repair labels when token matches lifecycle set
  if (
    ["open", "reported", "claimed", "remediation_submitted", "closed"].includes(cell)
  ) {
    // Ambiguous "open"/"closed" shared by hazard+repair — use hazard wording for open/closed
    // and repair-only for in_progress/resolved (handled below).
    if (cell === "in_progress" || cell === "resolved") {
      return repairStatusLabel(cell, language);
    }
    return hazardStatusLabel(cell, language);
  }
  if (cell === "in_progress" || cell === "resolved") {
    return repairStatusLabel(cell, language);
  }
  return cell;
}

export function DataTable({
  title,
  rows,
  onViewAll,
  emptyHint,
}: {
  title: string;
  rows: TableRow[];
  onViewAll?: () => void;
  emptyHint?: string;
}) {
  const language = currentLanguage();
  const empty =
    emptyHint ||
    (language === "en"
      ? "No data yet. Use the action panel below to create records."
      : "暂无数据，使用下方操作台创建记录。");

  return (
    <section className="panel overflow-hidden rounded-2xl border border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80">
      <div className="panel-title flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4 dark:border-stone-800">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </h2>
          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            {rows.length}
          </span>
        </div>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-stone-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
          >
            {language === "en" ? "View all" : "查看全部"}
            <ChevronRight size={14} />
          </button>
        ) : null}
      </div>
      <div className="rows divide-y divide-stone-100 dark:divide-stone-800">
        {rows.length === 0 ? (
          <div className="empty flex flex-col items-center gap-2 px-5 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
              <Inbox size={20} strokeWidth={1.5} />
            </div>
            <p className="max-w-xs text-sm text-stone-400 dark:text-stone-500">{empty}</p>
          </div>
        ) : (
          rows.map((row, index) => {
            const cells = Array.isArray(row) ? row : row.cells;
            const actions = Array.isArray(row) ? null : row.actions;
            return (
              <div
                className={cn(
                  "data-row items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-stone-50/90 dark:hover:bg-stone-800/40",
                  actions
                    ? "grid grid-cols-[1fr_auto]"
                    : "flex flex-wrap gap-x-3 gap-y-1.5",
                )}
                key={`${title}-${index}-${cells.join("-")}`}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                  {cells.map((cell, cellIndex) => (
                    <span
                      key={`${cellIndex}-${cell}`}
                      className={tableCellClass(cell, cellIndex)}
                      title={cell}
                    >
                      {formatCell(cell)}
                    </span>
                  ))}
                </div>
                {actions ? (
                  <span className="row-actions flex items-center justify-end gap-2">
                    {actions}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
