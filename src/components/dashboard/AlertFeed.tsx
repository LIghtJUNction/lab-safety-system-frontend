import { AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import { SafetyHazard } from "../../api";
import { cn } from "../../lib/cn";
import type { Language } from "../../lib/types";

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
  canClaimHazards,
  canCloseHazards,
  onAssign,
  onConfirm,
  language,
}: {
  alerts: AlertItem[];
  canClaimHazards: boolean;
  canCloseHazards: boolean;
  onAssign: (hazard: SafetyHazard) => void;
  onConfirm: (hazard: SafetyHazard) => void;
  language: Language;
}) {
  const isEn = language === "en";
  return (
    <section className="surface-bezel rounded-[1.55rem] p-1.5">
      <div className="surface-core overflow-hidden rounded-[1.15rem]">
      <div className="border-b border-stone-100 px-5 py-4 dark:border-stone-800">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{isEn ? "Hazard alerts" : "隐患警报"}</h2>
        <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
          {isEn ? "From backend hazard and repair records" : "来自后端隐患和报修记录"}
        </p>
      </div>
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {alerts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
            {isEn ? "No pending alerts" : "暂无待处理警报"}
          </p>
        ) : (
          alerts.map((alert) => (
            <article key={alert.id} className="px-5 py-4 transition-colors duration-300 hover:bg-stone-50/80 dark:hover:bg-white/[0.025]">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem]",
                    alert.severity === "danger"
                      ? "bg-rose-50 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400"
                      : "bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400",
                  )}
                >
                  <AlertTriangle size={15} strokeWidth={1.55} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                    {alert.lab} · {alert.time}
                  </p>
                  {alert.hazard && (canClaimHazards || canCloseHazards) ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canClaimHazards && !alert.hazard.responsible_user_id ? (
                        <button
                          type="button"
                          onClick={() => onAssign(alert.hazard!)}
                          className="surface-interactive inline-flex min-h-9 items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-white dark:bg-stone-100 dark:text-stone-900"
                        >
                          <UserPlus size={13} strokeWidth={1.55} />
                          {isEn ? "Assign" : "指派处理"}
                        </button>
                      ) : null}
                      {canCloseHazards && alert.hazard.status === "remediation_submitted" ? (
                        <button
                          type="button"
                          onClick={() => onConfirm(alert.hazard!)}
                          className="surface-interactive inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700"
                        >
                          <CheckCircle2 size={13} strokeWidth={1.55} />
                          {isEn ? "Confirm safe" : "确认安全"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      </div>
    </section>
  );
}
