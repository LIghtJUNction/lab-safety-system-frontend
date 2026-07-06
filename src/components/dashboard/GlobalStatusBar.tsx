import { AlertTriangle, ShieldCheck, Users } from "lucide-react";
import { MetricCard } from "../ui/MetricCard";

export function GlobalStatusBar({
  safetyDays,
  onlineCount,
  alertCount,
}: {
  safetyDays: number;
  onlineCount: number;
  alertCount: number;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <MetricCard
        label="安全运行"
        value={`${safetyDays} 天`}
        hint="连续无重大事故记录"
        icon={ShieldCheck}
        accent="primary"
      />
      <MetricCard
        label="当前在线"
        value={`${onlineCount} 人`}
        hint="实验室内活跃人员"
        icon={Users}
        accent="slate"
      />
      <MetricCard
        label="未处理警报"
        value={`${alertCount} 条`}
        hint="待指派或待确认隐患"
        icon={AlertTriangle}
        accent={alertCount > 0 ? "amber" : "primary"}
      />
    </section>
  );
}