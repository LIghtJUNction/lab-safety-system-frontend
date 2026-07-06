import { AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import { SafetyHazard } from "../../api";
import { cn } from "../../lib/cn";

export type AlertItem = {
  id: number;
  title: string;
  lab: string;
  severity: "warning" | "danger";
  time: string;
  hazard?: SafetyHazard;
};

export function AlertFeed({
  alerts,
  onAssign,
  onConfirm,
}: {
  alerts: AlertItem[];
  onAssign: (hazard: SafetyHazard) => void;
  onConfirm: (hazard: SafetyHazard) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">实时警报</h2>
        <p className="mt-0.5 text-xs text-slate-400">最新安全隐患流水</p>
      </div>
      <div className="divide-y divide-slate-100">
        {alerts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            暂无待处理警报
          </p>
        ) : (
          alerts.map((alert) => (
            <article key={alert.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    alert.severity === "danger"
                      ? "bg-rose-50 text-rose-500"
                      : "bg-amber-50 text-amber-500",
                  )}
                >
                  <AlertTriangle size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {alert.lab} · {alert.time}
                  </p>
                  {alert.hazard ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!alert.hazard.responsible_user_id ? (
                        <button
                          type="button"
                          onClick={() => onAssign(alert.hazard!)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <UserPlus size={13} />
                          指派处理
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onConfirm(alert.hazard!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600"
                      >
                        <CheckCircle2 size={13} />
                        确认安全
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}