import { useMemo } from "react";
import type {
  Booking,
  DashboardStats,
  HazardAnalytics,
  IncidentAnalytics,
  RegulationAnalytics,
  RepairTicket,
  SafetyHazard,
} from "../api";
import { exportCsv } from "../lib/csv";
import * as metrics from "../lib/derivedMetrics";

type DashboardMetricsInput = {
  analytics: IncidentAnalytics;
  regulationAnalytics: RegulationAnalytics;
  hazardAnalytics: HazardAnalytics;
  hazards: SafetyHazard[];
  repairs: RepairTicket[];
  bookings: Booking[];
  stats: DashboardStats | null;
  isAdmin: boolean;
};

export function useDashboardMetrics({
  analytics,
  regulationAnalytics,
  hazardAnalytics,
  hazards,
  repairs,
  bookings,
  stats,
  isAdmin,
}: DashboardMetricsInput) {
  const incidentBars = metrics.incidentBars(analytics);
  const regulationBars = metrics.regulationBars(regulationAnalytics);
  const openHazards = metrics.openHazards(hazards);
  const openRepairs = metrics.openRepairs(repairs);
  const alertCount = metrics.alertCount(hazards, repairs);
  const onlineCount = metrics.onlineCount(bookings);
  const safetyDays = metrics.safetyDays(stats);
  const alertItems = useMemo(
    () => metrics.alertItems(hazards, repairs),
    [hazards, repairs],
  );

  function exportAnalytics() {
    const rows = isAdmin
      ? [
          ["分类", "数量"],
          ...incidentBars.map((item) => [item.name, item.count]),
        ]
      : [
          ["状态", "数量"],
          ...hazardAnalytics.by_status.map((item) => [item.name, item.count]),
        ];
    exportCsv(
      isAdmin ? "incident-analytics.csv" : "hazard-analytics.csv",
      rows,
    );
  }

  return {
    incidentBars,
    regulationBars,
    openHazards,
    openRepairs,
    alertCount,
    onlineCount,
    safetyDays,
    alertItems,
    exportAnalytics,
  };
}
