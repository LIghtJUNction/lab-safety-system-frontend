import { AlertTriangle, ShieldCheck, Users } from "lucide-react";
import type { Language } from "../../lib/types";
import { MetricCard } from "../ui/MetricCard";

export function GlobalStatusBar({
  safetyDays,
  onlineCount,
  alertCount,
  language,
}: {
  safetyDays: number;
  onlineCount: number;
  alertCount: number;
  language: Language;
}) {
  const isEn = language === "en";
  const unit = isEn ? "records" : "条";

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <MetricCard
        label={isEn ? "Incident records" : "事故记录"}
        value={`${safetyDays} ${unit}`}
        hint={isEn ? "Backend incident case count" : "后端事故案例数量"}
        icon={ShieldCheck}
        accent="primary"
      />
      <MetricCard
        label={isEn ? "Booking records" : "预约记录"}
        value={`${onlineCount} ${unit}`}
        hint={isEn ? "Backend equipment booking count" : "后端设备预约数量"}
        icon={Users}
        accent="slate"
      />
      <MetricCard
        label={isEn ? "Open alerts" : "未处理警报"}
        value={`${alertCount} ${unit}`}
        hint={isEn ? "Hazards pending assignment or confirmation" : "待指派或待确认隐患"}
        icon={AlertTriangle}
        accent={alertCount > 0 ? "amber" : "primary"}
      />
    </section>
  );
}
