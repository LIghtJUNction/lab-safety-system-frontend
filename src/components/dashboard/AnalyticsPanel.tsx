import { Download } from "lucide-react";
import { CountBucket } from "../../api";

const palette = ["#44403c", "#78716c", "#a8a29e", "#b45309"];

export function AnalyticsPanel({
  title,
  items,
  onExport,
}: {
  title: string;
  items: CountBucket[];
  onExport: () => void;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <section className="panel analysis rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
      <div className="panel-title flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600"
        >
          <Download size={14} />
          导出
        </button>
      </div>
      <div className="bars mt-5 space-y-3">
        {items.map((item, index) => (
          <div className="bar-line flex items-center gap-3" key={item.name}>
            <span className="w-20 shrink-0 text-xs text-slate-500">{item.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <i
                className="block h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((item.count / max) * 100, item.count ? 8 : 2)}%`,
                  background: palette[index % palette.length],
                }}
              />
            </div>
            <strong className="w-8 text-right font-mono text-xs text-slate-700">
              {item.count}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}