import { LucideIcon, DoorOpen, FlaskConical, Thermometer, Wrench } from "lucide-react";
import { useMemo } from "react";
import { RepairTicket, SafetyHazard } from "../api";
import { SensorStatus } from "../lib/types";

export type SensorReading = {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: SensorStatus;
  trend: number[];
  icon: LucideIcon;
  detail: string;
};

function statusFor(count: number, dangerAt = 3): SensorStatus {
  if (count >= dangerAt) return "danger";
  if (count > 0) return "warning";
  return "normal";
}

function trendFromCount(count: number) {
  return [0, count, count, count, count, count];
}

function activeHazards(hazards: SafetyHazard[]) {
  return hazards.filter((hazard) => hazard.status !== "closed");
}

export function useTelemetry(hazards: SafetyHazard[], repairs: RepairTicket[]) {
  return useMemo(() => {
    const active = activeHazards(hazards);
    const gasCount = active.filter((h) =>
      /气体|危化|通风|泄漏/i.test(`${h.category} ${h.title}`),
    ).length;
    const accessCount = active.filter((h) =>
      /门禁|通道|出口|消防/i.test(`${h.category} ${h.title}`),
    ).length;
    const chemicalCount = active.filter((h) =>
      /危化|试剂|库存|化学品/i.test(`${h.category} ${h.title}`),
    ).length;
    const openRepairCount = repairs.filter((repair) => repair.status !== "resolved").length;

    return [
      {
        id: "gas",
        label: "气体相关隐患",
        value: String(gasCount),
        unit: "条",
        status: statusFor(gasCount),
        trend: trendFromCount(gasCount),
        icon: FlaskConical,
        detail: "由后端隐患标题和分类派生",
      },
      {
        id: "repair",
        label: "未完成报修",
        value: String(openRepairCount),
        unit: "单",
        status: statusFor(openRepairCount, 2),
        trend: trendFromCount(openRepairCount),
        icon: Wrench,
        detail: "来自后端报修工单状态",
      },
      {
        id: "access",
        label: "通道/门禁隐患",
        value: String(accessCount),
        unit: "条",
        status: statusFor(accessCount),
        trend: trendFromCount(accessCount),
        icon: DoorOpen,
        detail: "由后端隐患标题和分类派生",
      },
      {
        id: "chemical",
        label: "化学品相关隐患",
        value: String(chemicalCount),
        unit: "条",
        status: statusFor(chemicalCount),
        trend: trendFromCount(chemicalCount),
        icon: Thermometer,
        detail: "由后端隐患标题和分类派生",
      },
    ] satisfies SensorReading[];
  }, [hazards, repairs]);
}
