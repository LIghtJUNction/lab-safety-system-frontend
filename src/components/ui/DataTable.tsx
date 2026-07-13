import { ChevronRight, Inbox } from "lucide-react";
import type { MouseEvent } from "react";
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
  onNavigate,
  emptyHint,
}: {
  title: string;
  rows: TableRow[];
  onViewAll?: () => void;
  onNavigate?: (href: string) => void;
  emptyHint?: string;
}) {
  const language = currentLanguage();
  const empty =
    emptyHint ||
    (language === "en"
      ? "No data yet. Use the action panel below to create records."
      : "暂无数据，使用下方操作台创建记录。");

  return (
    <section className="panel surface-bezel overflow-hidden rounded-[1.55rem] p-1.5">
      <div className="surface-core overflow-hidden rounded-[1.15rem]">
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
            className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium text-stone-600 transition-[transform,color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
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
            const href = Array.isArray(row) ? undefined : row.href;
            const ariaLabel = Array.isArray(row) ? undefined : row.ariaLabel;
            const cellContent = cells.map((cell, cellIndex) => (
              <span
                key={`${cellIndex}-${cell}`}
                className={tableCellClass(cell, cellIndex)}
                title={cell}
              >
                {formatCell(cell)}
              </span>
            ));
            const handleNavigate = (event: MouseEvent<HTMLAnchorElement>) => {
              if (
                onNavigate &&
                href &&
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                onNavigate(href);
              }
            };

            if (href && !actions) {
              return (
                <a
                  href={href}
                  aria-label={ariaLabel}
                  className="data-row flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5 text-sm outline-none transition-colors duration-300 hover:bg-amber-50/35 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:hover:bg-amber-500/[0.035] dark:hover:text-amber-300"
                  key={`${title}-${index}-${cells.join("-")}`}
                  onClick={handleNavigate}
                >
                  {cellContent}
                </a>
              );
            }

            return (
              <div
                className={cn(
                  "data-row text-sm transition-colors duration-300 hover:bg-amber-50/35 dark:hover:bg-amber-500/[0.035]",
                  actions ? "grid grid-cols-[minmax(0,1fr)_auto]" : "flex",
                  !href && "items-center gap-3 px-5 py-3.5",
                  !href && !actions && "flex-wrap gap-x-3 gap-y-1.5",
                )}
                key={`${title}-${index}-${cells.join("-")}`}
              >
                {href ? (
                  <a
                    href={href}
                    aria-label={ariaLabel}
                    className="flex h-full w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5 outline-none transition-colors hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:hover:text-amber-300"
                    onClick={handleNavigate}
                  >
                    {cellContent}
                  </a>
                ) : (
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                    {cellContent}
                  </div>
                )}
                {actions ? (
                  <span
                    className={cn(
                      "row-actions flex items-center justify-end gap-2",
                      href && "h-full py-3.5 pl-3 pr-5",
                    )}
                  >
                    {actions}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      </div>
    </section>
  );
}
