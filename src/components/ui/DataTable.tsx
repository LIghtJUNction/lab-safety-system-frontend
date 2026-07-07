import { ChevronRight } from "lucide-react";
import { LANGUAGE_KEY } from "../../lib/constants";
import { tableCellClass } from "../../lib/display";
import { TableRow } from "../../lib/types";

function currentLanguage() {
  return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
}

export function DataTable({
  title,
  rows,
  onViewAll,
}: {
  title: string;
  rows: TableRow[];
  onViewAll?: () => void;
}) {
const language = currentLanguage();
 return (
    <section className="panel overflow-hidden rounded-2xl border border-stone-100 bg-white/90 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80">
      <div className="panel-title flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
          >
 {language === "en" ? "View all" : "查看全部"}
            <ChevronRight size={14} />
          </button>
        ) : null}
      </div>
      <div className="rows divide-y divide-stone-100 dark:divide-stone-800">
        {rows.length === 0 ? (
          <p className="empty px-5 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
 {language === "en" ? "No data yet. Use the action panel below to create records." : "暂无数据，使用下方操作台创建记录。"}
          </p>
        ) : (
          rows.map((row, index) => {
            const cells = Array.isArray(row) ? row : row.cells;
            const actions = Array.isArray(row) ? null : row.actions;
            return (
              <div
                className={
                  actions
                    ? "data-row with-actions grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/50"
                    : "data-row flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5 text-sm transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/50"
                }
                key={`${title}-${index}-${cells.join("-")}`}
              >
                {cells.map((cell, cellIndex) => (
                  <span
                    key={`${cellIndex}-${cell}`}
                    className={tableCellClass(cell, cellIndex)}
                  >
                    {cell}
                  </span>
                ))}
                {actions ? (
                  <span className="row-actions flex items-center gap-2 justify-end">
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
