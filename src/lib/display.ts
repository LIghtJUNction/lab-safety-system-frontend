import type { Language } from "./types";

export function roleLabel(role: string) {
  switch (role) {
    case "system_admin":
      return "系统管理员";
    case "lab_admin":
      return "实验室管理员";
    case "lab_member":
      return "实验室成员";
    case "visitor":
      return "访客";
    default:
      return role;
  }
}

export function authProviderLabel(provider: string) {
  switch (provider) {
    case "password":
      return "账号密码";
    case "sso":
      return "SSO";
    case "oauth":
      return "OAuth";
    default:
      return provider;
  }
}

/** Visual tone for status chips across hazards/repairs/users. */
export type StatusTone = "ok" | "warn" | "danger" | "info" | "muted";

export function statusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (s === "closed" || s === "resolved" || s === "启用" || s === "active" || s === "passed") {
    return "ok";
  }
  if (
    s === "open" ||
    s === "reported" ||
    s === "high" ||
    s === "critical" ||
    s === "danger"
  ) {
    return "danger";
  }
  if (
    s === "claimed" ||
    s === "remediation_submitted" ||
    s === "in_progress" ||
    s === "maintenance" ||
    s === "warning"
  ) {
    return "warn";
  }
  if (s === "停用" || s === "inactive" || s === "retired" || s === "archived") {
    return "muted";
  }
  return "info";
}

export function hazardStatusLabel(status: string, language: Language = "zh") {
  const map: Record<string, { zh: string; en: string }> = {
    open: { zh: "待认领", en: "Open" },
    reported: { zh: "待认领", en: "Open" },
    claimed: { zh: "已认领", en: "Claimed" },
    remediation_submitted: { zh: "待复核", en: "Remediation" },
    closed: { zh: "已闭环", en: "Closed" },
  };
  const hit = map[status];
  if (!hit) return status;
  return language === "en" ? hit.en : hit.zh;
}

export function repairStatusLabel(status: string, language: Language = "zh") {
  const map: Record<string, { zh: string; en: string }> = {
    open: { zh: "待处理", en: "Open" },
    in_progress: { zh: "处理中", en: "In progress" },
    resolved: { zh: "已解决", en: "Resolved" },
    closed: { zh: "已关闭", en: "Closed" },
  };
  const hit = map[status];
  if (!hit) return status;
  return language === "en" ? hit.en : hit.zh;
}

/** Known lifecycle status tokens rendered as chips in DataTable. */
export function isStatusToken(cell: string) {
  return (
    cell === "启用" ||
    cell === "停用" ||
    [
      "open",
      "reported",
      "claimed",
      "remediation_submitted",
      "closed",
      "in_progress",
      "resolved",
      "available",
      "in_use",
      "maintenance",
      "retired",
      "active",
      "draft",
      "archived",
    ].includes(cell)
  );
}

export function tableCellClass(cell: string, cellIndex: number) {
  if (isStatusToken(cell)) {
    const tone = statusTone(cell);
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1";
    if (tone === "ok") {
      return `${base} bg-emerald-100 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30`;
    }
    if (tone === "danger") {
      return `${base} bg-rose-100 text-rose-800 ring-rose-200/80 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-500/30`;
    }
    if (tone === "warn") {
      return `${base} bg-amber-100 text-amber-900 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30`;
    }
    if (tone === "muted") {
      return `${base} bg-stone-200 text-stone-600 ring-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:ring-stone-600`;
    }
    return `${base} bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700`;
  }
  return cellIndex === 0
    ? "font-medium text-stone-800 dark:text-stone-200"
    : "text-stone-500 dark:text-stone-400";
}
