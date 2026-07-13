import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  api,
  type Booking,
  type Equipment,
  type Incident,
  type Lab,
  type Regulation,
  type RepairTicket,
  type SafetyHazard,
  type Training,
  type User,
} from "../api";
import { authProviderLabel, roleLabel } from "../lib/display";
import { actionBtnClass } from "../lib/styles";
import * as tableRows from "../lib/tableRows";

type DashboardRowsInput = {
  regulations: Regulation[];
  incidents: Incident[];
  trainings: Training[];
  equipment: Equipment[];
  bookings: Booking[];
  repairs: RepairTicket[];
  users: User[];
  labs: Lab[];
  hazards: SafetyHazard[];
  selectedLabId: number | null;
  isAdmin: boolean;
  canOperateLab: boolean;
  sessionUserId: number;
  withAction: (label: string, action: () => Promise<unknown>) => Promise<void>;
};

export function useDashboardRows({
  regulations,
  incidents,
  trainings,
  equipment,
  bookings,
  repairs,
  users,
  labs,
  hazards,
  selectedLabId,
  isAdmin,
  canOperateLab,
  sessionUserId,
  withAction,
}: DashboardRowsInput) {
  const regulationRows = useMemo(
    () => tableRows.regulationRows(regulations, selectedLabId),
    [regulations, selectedLabId],
  );
  const incidentRows = useMemo(
    () => tableRows.incidentRows(incidents, selectedLabId),
    [incidents, selectedLabId],
  );
  const trainingRows = useMemo(
    () => tableRows.trainingRows(trainings),
    [trainings],
  );
  const equipmentRows = useMemo(
    () => tableRows.equipmentRows(equipment),
    [equipment],
  );
  const bookingRows = useMemo(
    () => tableRows.bookingRows(bookings),
    [bookings],
  );
  const repairRows = useMemo(
    () =>
      repairs.map((item) => ({
        cells: [
          `#${item.id}`,
          `设备 #${item.equipment_id}`,
          item.description,
          item.status,
        ],
        actions:
          isAdmin && item.status !== "resolved" ? (
            <button
              type="button"
              className={actionBtnClass}
              onClick={() =>
                void withAction("处理报修", () =>
                  api.updateRepairStatus(item.id, "resolved"),
                ).catch(() => undefined)
              }
            >
              <CheckCircle2 size={15} />
              完成
            </button>
          ) : null,
      })),
    [repairs, isAdmin, withAction],
  );
  const userRows = useMemo(
    () =>
      users.map((item) => [
        item.display_name,
        roleLabel(item.role),
        authProviderLabel(item.auth_provider),
        item.is_active ? "启用" : "停用",
      ]),
    [users],
  );
  const labRows = useMemo(
    () =>
      labs.map((lab) => [
        lab.name,
        lab.code,
        lab.location || "-",
        lab.department || "-",
        lab.status,
      ]),
    [labs],
  );
  const hazardRows = useMemo(
    () =>
      hazards.map((item) => ({
        cells: [
          item.title,
          item.category,
          item.status,
          item.responsible_user_id
            ? `责任人 #${item.responsible_user_id}`
            : "待认领",
        ],
        href: selectedLabId
          ? `/labs/${selectedLabId}/hazards/${item.id}`
          : undefined,
        ariaLabel: item.title,
        actions:
          (canOperateLab && !item.responsible_user_id) ||
          (isAdmin && item.status === "remediation_submitted") ? (
            <>
            {canOperateLab && !item.responsible_user_id ? (
              <button
                type="button"
                className={actionBtnClass}
                onClick={() =>
                  void withAction("责任认领", () =>
                    api.claimHazard(item.id, sessionUserId),
                  ).catch(() => undefined)
                }
              >
                <CheckCircle2 size={14} />
                认领
              </button>
            ) : null}
            {isAdmin && item.status === "remediation_submitted" ? (
              <button
                type="button"
                className={actionBtnClass}
                onClick={() =>
                  void withAction("关闭隐患", () =>
                    api.updateHazardStatus(item.id, "closed"),
                  ).catch(() => undefined)
                }
              >
                <CheckCircle2 size={14} />
                闭环
              </button>
            ) : null}
            </>
          ) : null,
      })),
    [
      hazards,
      isAdmin,
      canOperateLab,
      selectedLabId,
      sessionUserId,
      withAction,
    ],
  );

  return {
    regulationRows,
    incidentRows,
    trainingRows,
    equipmentRows,
    bookingRows,
    repairRows,
    userRows,
    labRows,
    hazardRows,
  };
}
