import { cn } from "../../lib/cn";
import { SensorStatus } from "../../lib/types";

const colorMap: Record<SensorStatus, string> = {
  normal: "bg-stone-600 dark:bg-stone-400",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

const labelMap: Record<SensorStatus, string> = {
  normal: "正常",
  warning: "预警",
  danger: "异常",
};

export function StatusDot({ status }: { status: SensorStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-600 ring-1 ring-stone-200/80">
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping-dot",
            colorMap[status],
          )}
        />
        <span
          className={cn("relative inline-flex h-2 w-2 rounded-full", colorMap[status])}
        />
      </span>
      {labelMap[status]}
    </span>
  );
}