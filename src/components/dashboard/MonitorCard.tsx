import { cn } from "../../lib/cn";
import { SensorReading } from "../../hooks/useTelemetry";
import { StatusDot } from "../ui/StatusDot";

/** Summary card for counts derived from hazards/repairs (not live sensors). */
export function MonitorCard({ sensor }: { sensor: SensorReading }) {
  const Icon = sensor.icon;
  const isAbnormal = sensor.status !== "normal";

  return (
    <article
      className={cn(
        "surface-bezel surface-interactive rounded-[1.55rem] p-1.5",
        isAbnormal
          ? sensor.status === "danger"
            ? "animate-breathe-danger border-rose-300/70 dark:border-rose-500/35"
            : "animate-breathe-warning border-amber-300/70 dark:border-amber-500/35"
          : "",
      )}
    >
      <div className="surface-core rounded-[1.15rem] p-5">
        <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-[0.9rem] ring-1",
              sensor.status === "danger"
                ? "bg-rose-50 text-rose-600 ring-rose-100"
                : sensor.status === "warning"
                  ? "bg-amber-50 text-amber-600 ring-amber-100"
                  : "bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700",
            )}
          >
            <Icon size={18} strokeWidth={1.55} />
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

        <div className="mt-4">
          <p className="font-mono text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {sensor.value}
            {sensor.unit ? (
              <span className="ml-1 text-base font-normal text-stone-400">
                {sensor.unit}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </article>
  );
}
