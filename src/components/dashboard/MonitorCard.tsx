import { cn } from "../../lib/cn";
import { SensorReading } from "../../hooks/useTelemetry";
import { Sparkline } from "../ui/Sparkline";
import { StatusDot } from "../ui/StatusDot";

export function MonitorCard({ sensor }: { sensor: SensorReading }) {
  const Icon = sensor.icon;
  const isAbnormal = sensor.status !== "normal";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-stone-900/80",
        isAbnormal
          ? sensor.status === "danger"
            ? "animate-breathe-danger border-rose-200 dark:border-rose-500/40"
            : "animate-breathe-warning border-amber-200 dark:border-amber-500/40"
          : "border-stone-100 dark:border-stone-800",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl ring-1",
              sensor.status === "danger"
                ? "bg-rose-50 text-rose-600 ring-rose-100"
                : sensor.status === "warning"
                  ? "bg-amber-50 text-amber-600 ring-amber-100"
                  : "bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700",
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
              {sensor.label}
            </p>
            <p className="text-[11px] text-stone-400">{sensor.detail}</p>
          </div>
        </div>
        <StatusDot status={sensor.status} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-3xl font-semibold tracking-tight text-stone-900">
            {sensor.value}
            {sensor.unit ? (
              <span className="ml-1 text-base font-normal text-stone-400">
                {sensor.unit}
              </span>
            ) : null}
          </p>
        </div>
        <div className="w-28 opacity-80">
          <Sparkline data={sensor.trend} status={sensor.status} />
        </div>
      </div>
    </article>
  );
}