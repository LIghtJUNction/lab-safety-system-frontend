import type {
  Booking,
  DashboardStats,
  IncidentAnalytics,
  RegulationAnalytics,
  RepairTicket,
  SafetyHazard,
} from "../api";
import type { AlertItem } from "../components/dashboard/AlertFeed";

/** Active hazard statuses (everything except closed). Includes legacy `reported`. */
const ACTIVE_HAZARD = new Set([
  "open",
  "reported",
  "claimed",
  "remediation_submitted",
]);

export function incidentBars(analytics: IncidentAnalytics) {
  return analytics.by_category;
}

export function regulationBars(analytics: RegulationAnalytics) {
  return analytics.by_type;
}

export function openHazards(hazards: SafetyHazard[]) {
  return hazards.filter((hazard) => hazard.status !== "closed");
}

export function openRepairs(repairs: RepairTicket[]) {
  return repairs.filter(
    (repair) => repair.status !== "resolved" && repair.status !== "closed",
  );
}

export function alertCount(hazards: SafetyHazard[], repairs: RepairTicket[]) {
  return openHazards(hazards).length + openRepairs(repairs).length;
}

export function onlineCount(bookings: Booking[]) {
  return bookings.length;
}

/** Incident case count from dashboard stats (not "days without accident"). */
export function incidentCount(stats: DashboardStats | null) {
  return stats?.incident_count ?? 0;
}

/** @deprecated Use incidentCount — name kept for call-site compatibility. */
export function safetyDays(stats: DashboardStats | null) {
  return incidentCount(stats);
}

export function isUrgentHazard(status: string) {
  return status === "open" || status === "reported";
}

export function alertItems(hazards: SafetyHazard[], repairs: RepairTicket[]): AlertItem[] {
  const hazardAlerts: AlertItem[] = openHazards(hazards)
    .filter((hazard) => ACTIVE_HAZARD.has(hazard.status) || hazard.status !== "closed")
    .slice(0, 3)
    .map((hazard) => ({
      id: hazard.id,
      title: hazard.title,
      lab: hazard.lab_name || "未知实验室",
      severity: isUrgentHazard(hazard.status) ? "danger" : "warning",
      time: hazard.category,
      hazard,
    }));

  if (hazardAlerts.length >= 3) return hazardAlerts;

  const repairAlerts: AlertItem[] = openRepairs(repairs)
    .slice(0, 3 - hazardAlerts.length)
    .map((repair) => ({
      id: repair.id + 10000,
      title: repair.description,
      lab: `设备 #${repair.equipment_id}`,
      severity: "warning" as const,
      time: repair.status,
    }));

  return [...hazardAlerts, ...repairAlerts];
}
