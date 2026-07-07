import type { Booking, Equipment, Incident, Regulation, Training } from "../api";
import type { TableRow } from "./types";

export function regulationRows(regulations: Regulation[]): TableRow[] {
  return regulations.map((item) => [
    item.title,
    item.regulation_type,
    item.issuing_authority,
    item.effective_date ?? "-",
  ]);
}

export function incidentRows(incidents: Incident[]): TableRow[] {
  return incidents.map((item) => [
    item.title,
    item.lab_name,
    item.severity,
    item.occurred_on,
  ]);
}

export function trainingRows(trainings: Training[]): TableRow[] {
  return trainings.map((item) => [
    item.title,
    item.target_role,
    item.status,
    `及格 ${item.exam_required_score}`,
  ]);
}

export function equipmentRows(equipment: Equipment[]): TableRow[] {
  return equipment.map((item) => [
    item.name,
    item.asset_code,
    item.lab_name,
    item.status,
  ]);
}

export function bookingRows(bookings: Booking[]): TableRow[] {
  return bookings.map((item) => [
    new Date(item.starts_at).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    `设备 #${item.equipment_id}`,
    item.purpose,
    "已预约",
  ]);
}
