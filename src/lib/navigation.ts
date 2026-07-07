import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  UserCog,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Language } from "./types";

export type NavItem = {
  label: string;
  icon: LucideIcon;
};

type LabSummary = {
  id: number;
  name: string;
};

const navLabelEn: Record<string, string> = {
  "系统总览": "System overview",
  "实验室管理": "Labs",
  "用户管理": "Users",
  "邀请管理": "Invitations",
  "全局配置": "Settings",
  "总览": "Overview",
  "法规条例": "Regulations",
  "事故案例": "Incidents",
  "隐患管理": "Hazards",
  "成员管理": "Members",
  "邀请链接": "Invites",
  "培训考核": "Training",
  "设备预约": "Equipment",
  "报修工单": "Repairs",
  "统计分析": "Analytics",
};

export function navDisplayLabel(label: string, language: Language) {
  return language === "en" ? navLabelEn[label] ?? label : label;
}

export function visibleNavForRole(isSystemAdmin: boolean, currentLabRole: string | null): NavItem[] {
  if (isSystemAdmin) {
    return [
      { label: "系统总览", icon: LayoutDashboard },
      { label: "实验室管理", icon: ClipboardList },
      { label: "用户管理", icon: UserCog },
      { label: "邀请管理", icon: Link2 },
      { label: "全局配置", icon: Wrench },
    ];
  }

  const baseNav = [
    { label: "总览", icon: LayoutDashboard },
    { label: "法规条例", icon: ClipboardList },
    { label: "事故案例", icon: AlertTriangle },
  ];

  if (!currentLabRole) return baseNav;
  if (currentLabRole === "lab_admin") {
    return [
      ...baseNav,
      { label: "隐患管理", icon: ShieldCheck },
      { label: "成员管理", icon: UserCog },
      { label: "邀请链接", icon: Link2 },
      { label: "培训考核", icon: GraduationCap },
      { label: "设备预约", icon: CalendarClock },
      { label: "报修工单", icon: Wrench },
      { label: "统计分析", icon: BarChart3 },
    ];
  }

  if (currentLabRole === "lab_member") {
    return [
      ...baseNav,
      { label: "隐患管理", icon: ShieldCheck },
      { label: "培训考核", icon: GraduationCap },
      { label: "设备预约", icon: CalendarClock },
      { label: "报修工单", icon: Wrench },
      { label: "统计分析", icon: BarChart3 },
    ];
  }

  return [...baseNav, { label: "隐患管理", icon: ShieldCheck }];
}

export function pageTitleForContext(
  isSystemAdmin: boolean,
  currentLabRole: string | null,
  labs: LabSummary[],
  selectedLabId: number | null,
  language: Language,
) {
  if (isSystemAdmin) return language === "en" ? "Laboratory management system" : "实验室管理系统";
  if (currentLabRole) {
    const labName = labs.find((lab) => lab.id === selectedLabId)?.name || (language === "en" ? "Not selected" : "未选择");
    return language === "en" ? `Lab - ${labName}` : `实验室 - ${labName}`;
  }
  return language === "en" ? "My lab safety tasks" : "我的实验室安全任务";
}

export function pageCopyForRole(isSystemAdmin: boolean, currentLabRole: string | null, language: Language) {
  if (language === "en") {
    if (isSystemAdmin) return "System maintenance: labs, users, global configuration, and cross-lab analytics.";
    if (currentLabRole === "lab_admin") return "Manage lab members, hazard closure, training, and equipment.";
    if (currentLabRole === "lab_member") return "Report hazards, handle remediation tasks, and review lab information.";
    return "View permitted laboratory information.";
  }
  if (isSystemAdmin) return "系统维护：实验室管理、用户管理、全局配置与跨实验室统计。";
  if (currentLabRole === "lab_admin") return "管理本实验室成员、隐患闭环、培训与设备。";
  if (currentLabRole === "lab_member") return "上报隐患、处理整改任务、查看本实验室信息。";
  return "查看允许访问的实验室信息。";
}
