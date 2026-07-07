export type AppRoute = {
  isSystemRoute: boolean;
  systemTab: string;
  isLabRoute: boolean;
  urlLabId: number | null;
  labTab: string;
  isJoinRoute: boolean;
  inviteCode: string;
};

export function parseAppRoute(pathname: string): AppRoute {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "system") {
    return baseRoute({ isSystemRoute: true, systemTab: parts[1] || "overview" });
  }
  if (parts[0] === "labs" && parts[1]) {
    const labId = Number.parseInt(parts[1], 10);
    return baseRoute({
      isLabRoute: true,
      urlLabId: Number.isNaN(labId) ? null : labId,
      labTab: parts[2] || "overview",
    });
  }
  if (parts[0] === "join" && parts[1]) {
    return baseRoute({ isJoinRoute: true, inviteCode: parts[1] });
  }
  return baseRoute();
}

export function routeLabel(route: AppRoute) {
  if (route.isSystemRoute) return systemLabel(route.systemTab);
  if (route.isLabRoute) return labLabel(route.labTab);
  return "总览";
}

export function routePathForLabel(label: string, isSystemAdmin: boolean, labId: number) {
  if (isSystemAdmin) return systemPathForLabel(label);
  return labPathForLabel(label, labId);
}

export function routeVisibility(route: AppRoute) {
  const { isSystemRoute, systemTab, isLabRoute, labTab } = route;
  const showSystemOverview = isSystemRoute && systemTab === "overview";
  const showSystemLabs = isSystemRoute && systemTab === "labs";
  const showSystemUsers = isSystemRoute && systemTab === "users";
  const showSystemConfig = isSystemRoute && systemTab === "config";
  const showLabOverview = isLabRoute && labTab === "overview";
  const showLabRegulations = isLabRoute && labTab === "regulations";
  const showLabIncidents = isLabRoute && labTab === "incidents";
  const showLabHazards = isLabRoute && labTab === "hazards";
  const showLabTrainings = isLabRoute && labTab === "trainings";
  const showLabBookings = isLabRoute && labTab === "bookings";
  const showLabRepairs = isLabRoute && labTab === "repairs";
  const showLabAnalytics = isLabRoute && labTab === "analytics";

  return {
    showSystemOverview,
    showSystemConfig,
    showOverview: showLabOverview,
    showRegulations: showLabRegulations,
    showIncidents: showLabIncidents,
    showHazards: showLabHazards,
    showTrainings: showLabTrainings,
    showEquipment: showLabBookings,
    showRepairs: showLabRepairs,
    showUsers: showSystemUsers,
    showAnalytics: showLabAnalytics,
    showLabManagement: showSystemLabs,
    showInvitations:
      (isSystemRoute && systemTab === "invitations") ||
      (isLabRoute && labTab === "invitations"),
  };
}

function baseRoute(overrides: Partial<AppRoute> = {}): AppRoute {
  return {
    isSystemRoute: false,
    systemTab: "",
    isLabRoute: false,
    urlLabId: null,
    labTab: "",
    isJoinRoute: false,
    inviteCode: "",
    ...overrides,
  };
}

function systemLabel(tab: string) {
  switch (tab) {
    case "overview":
      return "系统总览";
    case "labs":
      return "实验室管理";
    case "users":
      return "用户管理";
    case "config":
      return "全局配置";
    case "invitations":
      return "邀请管理";
    default:
      return "系统总览";
  }
}

function labLabel(tab: string) {
  switch (tab) {
    case "regulations":
      return "法规条例";
    case "incidents":
      return "事故案例";
    case "hazards":
      return "隐患管理";
    case "trainings":
      return "培训考核";
    case "bookings":
      return "设备预约";
    case "repairs":
      return "报修工单";
    case "users":
      return "成员管理";
    case "analytics":
      return "统计分析";
    case "invitations":
      return "邀请链接";
    default:
      return "总览";
  }
}

function systemPathForLabel(label: string) {
  switch (label) {
    case "实验室管理":
      return "/system/labs";
    case "用户管理":
      return "/system/users";
    case "全局配置":
      return "/system/config";
    case "邀请管理":
      return "/system/invitations";
    default:
      return "/system/overview";
  }
}

function labPathForLabel(label: string, labId: number) {
  const id = labId || 0;
  switch (label) {
    case "法规条例":
      return `/labs/${id}/regulations`;
    case "事故案例":
      return `/labs/${id}/incidents`;
    case "隐患管理":
      return `/labs/${id}/hazards`;
    case "邀请链接":
      return `/labs/${id}/invitations`;
    case "培训考核":
      return `/labs/${id}/trainings`;
    case "设备预约":
      return `/labs/${id}/bookings`;
    case "报修工单":
      return `/labs/${id}/repairs`;
    case "成员管理":
      return `/labs/${id}/users`;
    case "统计分析":
      return `/labs/${id}/analytics`;
    default:
      return `/labs/${id}/overview`;
  }
}
