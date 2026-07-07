import { SafetyHazard } from "../../api";
import { SensorReading } from "../../hooks/useTelemetry";
import type { Language } from "../../lib/types";
import { AlertFeed, AlertItem } from "./AlertFeed";
import { GlobalStatusBar } from "./GlobalStatusBar";
import { MonitorCard } from "./MonitorCard";
import { QuickActions } from "./QuickActions";
import { AsciiBurn } from "../ui/AsciiBurn";

export function OverviewDashboard({
  safetyDays,
  onlineCount,
  alertCount,
  sensors,
  alerts,
  onAssign,
  onConfirm,
onReport,
onEquipment,
onTraining,
language,
isDark = true,
}: {
  safetyDays: number;
  onlineCount: number;
  alertCount: number;
  sensors: SensorReading[];
  alerts: AlertItem[];
  onAssign: (hazard: SafetyHazard) => void;
  onConfirm: (hazard: SafetyHazard) => void;
onReport: () => void;
onEquipment: () => void;
onTraining: () => void;
language: Language;
isDark?: boolean;
}) {
  return (
    <div className="space-y-6">
      <AsciiBurn label="安全态势热迹" cols={96} className="opacity-95" isDark={isDark} />
      <GlobalStatusBar
        safetyDays={safetyDays}
        onlineCount={onlineCount}
        alertCount={alertCount}
        language={language}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {sensors.map((sensor) => (
            <MonitorCard key={sensor.id} sensor={sensor} />
          ))}
        </div>

        <div className="space-y-4">
<AlertFeed alerts={alerts} onAssign={onAssign} onConfirm={onConfirm} language={language} />
<QuickActions
  onReport={onReport}
  onEquipment={onEquipment}
  onTraining={onTraining}
  language={language}
/>
        </div>
      </div>
    </div>
  );
}
