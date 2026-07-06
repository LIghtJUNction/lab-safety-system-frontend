import { SafetyHazard } from "../../api";
import { SensorReading } from "../../hooks/useTelemetry";
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
  onLock,
  onReport,
  onScan,
}: {
  safetyDays: number;
  onlineCount: number;
  alertCount: number;
  sensors: SensorReading[];
  alerts: AlertItem[];
  onAssign: (hazard: SafetyHazard) => void;
  onConfirm: (hazard: SafetyHazard) => void;
  onLock: () => void;
  onReport: () => void;
  onScan: () => void;
}) {
  return (
    <div className="space-y-6">
      <AsciiBurn label="实时监控热迹" cols={96} className="opacity-95" />
      <GlobalStatusBar
        safetyDays={safetyDays}
        onlineCount={onlineCount}
        alertCount={alertCount}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {sensors.map((sensor) => (
            <MonitorCard key={sensor.id} sensor={sensor} />
          ))}
        </div>

        <div className="space-y-4">
          <AlertFeed alerts={alerts} onAssign={onAssign} onConfirm={onConfirm} />
          <QuickActions onLock={onLock} onReport={onReport} onScan={onScan} />
        </div>
      </div>
    </div>
  );
}