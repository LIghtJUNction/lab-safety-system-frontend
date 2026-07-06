import { LucideIcon, DoorOpen, FlaskConical, Thermometer, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

function seedTrend(base: number, variance: number, length = 12) {
  const points: number[] = [];
  let current = base;
  for (let i = 0; i < length; i += 1) {
    current += (Math.random() - 0.5) * variance;
    points.push(Number(current.toFixed(2)));
  }
  return points;
}

function deriveGasStatus(hazards: SafetyHazard[]): SensorStatus {
  const gasHazards = hazards.filter(
    (h) =>
      h.status !== "closed" &&
      /气体|危化|通风|泄漏/i.test(`${h.category} ${h.title}`),
  );
  if (gasHazards.some((h) => h.status === "open")) return "danger";
  if (gasHazards.length > 0) return "warning";
  return "normal";
}

function deriveTempStatus(repairs: RepairTicket[]): SensorStatus {
  const open = repairs.filter((r) => r.status !== "resolved");
  if (open.length >= 2) return "danger";
  if (open.length > 0) return "warning";
  return "normal";
}

function deriveDoorStatus(hazards: SafetyHazard[]): SensorStatus {
  const access = hazards.filter(
    (h) =>
      h.status !== "closed" &&
      /门禁|通道|出口|消防/i.test(`${h.category} ${h.title}`),
  );
  if (access.length > 0) return "warning";
  return "normal";
}

function deriveInventoryStatus(hazards: SafetyHazard[]): SensorStatus {
  const chem = hazards.filter(
    (h) =>
      h.status !== "closed" &&
      /危化|试剂|库存|化学品/i.test(`${h.category} ${h.title}`),
  );
  if (chem.some((h) => h.status === "open")) return "danger";
  if (chem.length > 0) return "warning";
  return "normal";
}

export function useTelemetry(hazards: SafetyHazard[], repairs: RepairTicket[]) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 8000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    const gasStatus = deriveGasStatus(hazards);
    const tempStatus = deriveTempStatus(repairs);
    const doorStatus = deriveDoorStatus(hazards);
    const inventoryStatus = deriveInventoryStatus(hazards);

    const gasBase = gasStatus === "danger" ? 86 : gasStatus === "warning" ? 62 : 28;
    const tempBase = tempStatus === "danger" ? 31.8 : tempStatus === "warning" ? 27.4 : 22.1;
    const inventoryBase =
      inventoryStatus === "danger" ? 94 : inventoryStatus === "warning" ? 78 : 54;

    const sensors: SensorReading[] = [
      {
        id: "gas",
        label: "气体浓度",
        value: String(Math.round(gasBase + (tick % 3) * 2)),
        unit: "ppm",
        status: gasStatus,
        trend: seedTrend(gasBase, gasStatus === "normal" ? 3 : 8),
        icon: Wind,
        detail: "通风柜 VOC 实时监测",
      },
      {
        id: "temp",
        label: "核心温度",
        value: tempBase.toFixed(1),
        unit: "°C",
        status: tempStatus,
        trend: seedTrend(tempBase, tempStatus === "normal" ? 0.4 : 1.2),
        icon: Thermometer,
        detail: "反应釜区温控传感器",
      },
      {
        id: "door",
        label: "门禁状态",
        value: doorStatus === "normal" ? "已锁定" : "待复核",
        unit: "",
        status: doorStatus,
        trend: seedTrend(doorStatus === "normal" ? 1 : 0.4, 0.15),
        icon: DoorOpen,
        detail: "主入口 · 生物安全二级",
      },
      {
        id: "inventory",
        label: "危险品库存",
        value: String(inventoryBase),
        unit: "%",
        status: inventoryStatus,
        trend: seedTrend(inventoryBase, 4),
        icon: FlaskConical,
        detail: "危化品柜容量占用率",
      },
    ];

    return sensors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hazards, repairs, tick]);
}