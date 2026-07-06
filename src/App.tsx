import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  ShieldCheck,
  Wrench,
  LayoutDashboard,
  UserCog,
  BarChart3,
  Link2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  AuthMethods,
  AuthSession,
  Booking,
  DashboardStats,
  Equipment,
  HazardAnalytics,
  Incident,
  IncidentAnalytics,
  Regulation,
  RegulationAnalytics,
  RepairTicket,
  SafetyHazard,
  Training,
  User,
  UserCreate,
  Lab,
  LabMembership,
  LabUser,
  getApiBase,
  getDbUrl,
  setApiBase,
  setDbUrl,
  type LoginCarouselSettings,
  type CarouselSlide,
} from "./api";
import { LoginScreen } from "./components/auth/LoginScreen";
import { InvitationRegisterScreen } from "./components/auth/InvitationRegisterScreen";
import { InvitationsManager } from "./components/dashboard/InvitationsManager";
import { AlertItem } from "./components/dashboard/AlertFeed";
import { AnalyticsPanel } from "./components/dashboard/AnalyticsPanel";
import { OverviewDashboard } from "./components/dashboard/OverviewDashboard";
import { MobileNav } from "./components/layout/MobileNav";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { ActionForm } from "./components/ui/ActionForm";
import { DataTable } from "./components/ui/DataTable";
import { FormInput, FormSelect, UploadButton } from "./components/ui/FormField";
import { MetricCard } from "./components/ui/MetricCard";
import { TrainingHighlight } from "./components/workspace/TrainingHighlight";
import { useTelemetry } from "./hooks/useTelemetry";
import {
  creationOptionsFromServer,
  publicKeyCredentialToJson,
  readSession,
  validateStrongPassword,
} from "./lib/auth";
import {
  LANGUAGE_KEY,
  nav,
  SESSION_KEY,
  THEME_KEY,
  introSlides,
} from "./lib/constants";
import { Language, ThemeMode } from "./lib/types";

const canManageSystem = (user: any) => user?.role === "system_admin";
const canManageLab = (user: any, labId: number | null, memberships: any[]) => {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some(m => m.lab_id === labId && m.role === "lab_admin");
};
const canCreateHazard = (user: any, labId: number | null, memberships: any[]) => {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some(m => m.lab_id === labId && ["lab_admin", "lab_member", "visitor"].includes(m.role));
};
const canClaimHazard = (user: any, labId: number | null, memberships: any[]) => {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some(m => m.lab_id === labId && ["lab_admin", "lab_member"].includes(m.role));
};
const canViewLab = (user: any, labId: number | null, memberships: any[]) => {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some(m => m.lab_id === labId);
};

const actionBtnClass =
  "inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600";

export function App() {
  const [language, setLanguageState] = useState<Language>(
    () => (window.localStorage.getItem(LANGUAGE_KEY) as Language) || "zh",
  );
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (window.localStorage.getItem(THEME_KEY) as ThemeMode) || "light",
  );
  const isDark = theme === "dark";
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true";
    }
    return false;
  });
  const [notice, setNotice] = useState("正在连接后端 API");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<IncidentAnalytics>({
    by_category: [],
    by_severity: [],
  });
  const [hazardAnalytics, setHazardAnalytics] = useState<HazardAnalytics>({
    by_status: [],
    by_category: [],
  });
  const [regulationAnalytics, setRegulationAnalytics] = useState<RegulationAnalytics>({
    by_type: [],
    by_authority: [],
  });
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hazards, setHazards] = useState<SafetyHazard[]>([]);
  const [session, setSession] = useState<AuthSession | null>(() => readSession());

  // New multi-lab support states
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [labMemberships, setLabMemberships] = useState<LabMembership[]>([]);
  const [labMembers, setLabMembers] = useState<LabUser[]>([]);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [viewingLabMembers, setViewingLabMembers] = useState<{ labId: number; name: string } | null>(null);
  const [viewingLabMembersList, setViewingLabMembersList] = useState<LabUser[]>([]);

  // Backend persisted login carousel (editable only by system_admin)
  const [loginCarousel, setLoginCarousel] = useState<LoginCarouselSettings | null>(null);
  const [carouselSaving, setCarouselSaving] = useState(false);

  async function saveLoginCarousel(updated: LoginCarouselSettings) {
    setCarouselSaving(true);
    try {
      const saved = await api.updateLoginCarousel(updated);
      setLoginCarousel(saved);
      setNotice("登录页轮播设置已保存（后端持久化）");
    } catch (err: any) {
      setNotice("保存失败：" + (err?.message || String(err)));
    } finally {
      setCarouselSaving(false);
    }
  }

  function getDefaultSlides(lang: "zh" | "en"): CarouselSlide[] {
    return (introSlides[lang] || []).map((s) => ({
      stat: s.stat,
      title: s.title,
      body: s.body,
    }));
  }

  async function resetToDefault() {
    if (!confirm("确定要重置为默认文案吗？此操作会清除后端自定义设置。")) return;
    setCarouselSaving(true);
    try {
      await api.resetLoginCarousel();
      // After reset, reload from backend (will get defaults)
      const fresh = await api.loginCarousel();
      setLoginCarousel(fresh);
      setNotice("已重置为默认文案");
    } catch (err: any) {
      setNotice("重置失败：" + (err?.message || String(err)));
    } finally {
      setCarouselSaving(false);
    }
  }

  function syncLanguages(from: "zh" | "en", to: "zh" | "en") {
    if (!loginCarousel) return;
    const source = loginCarousel[from] || getDefaultSlides(from);
    const next = { ...loginCarousel, [to]: [...source] };
    setLoginCarousel(next);
    setNotice(`已将 ${from === "zh" ? "中文" : "英文"} 复制到 ${to === "zh" ? "中文" : "英文"}`);
  }

  const [authMethods, setAuthMethods] = useState<AuthMethods>({
    password: true,
    sso: false,
    oauth: false,
    sso_login_url: null,
    oauth_login_url: null,
  });
  const lastActionAt = useRef(0);

  // Custom router state
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (pathStr: string) => {
    window.history.pushState({}, "", pathStr);
    setCurrentPath(pathStr);
  };

  const parsedRoute = useMemo(() => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts[0] === "system") {
      return {
        isSystemRoute: true,
        systemTab: parts[1] || "overview",
        isLabRoute: false,
        urlLabId: null,
        labTab: "",
        isJoinRoute: false,
        inviteCode: "",
      };
    } else if (parts[0] === "labs" && parts[1]) {
      const labId = parseInt(parts[1], 10);
      return {
        isSystemRoute: false,
        systemTab: "",
        isLabRoute: true,
        urlLabId: isNaN(labId) ? null : labId,
        labTab: parts[2] || "overview",
        isJoinRoute: false,
        inviteCode: "",
      };
    } else if (parts[0] === "join" && parts[1]) {
      return {
        isSystemRoute: false,
        systemTab: "",
        isLabRoute: false,
        urlLabId: null,
        labTab: "",
        isJoinRoute: true,
        inviteCode: parts[1],
      };
    }
    return {
      isSystemRoute: false,
      systemTab: "",
      isLabRoute: false,
      urlLabId: null,
      labTab: "",
      isJoinRoute: false,
      inviteCode: "",
    };
  }, [currentPath]);

  const isSystemAdmin = session?.user.role === "system_admin";
  const globalIsAdmin = isSystemAdmin || session?.user.role === "admin" || session?.user.role === "super_admin";

  const currentLabRole = (() => {
    if (!selectedLabId || !session) return null;
    if (isSystemAdmin) return "system_admin" as const;
    const m = labMemberships.find((m) => m.lab_id === selectedLabId);
    return m ? m.role : null;
  })();

  const isAdmin = isSystemAdmin || currentLabRole === "lab_admin" || session?.user.role === "admin" || session?.user.role === "super_admin";

  const canManageLab = currentLabRole === "lab_admin" || currentLabRole === "system_admin";
  const canReportHazard = currentLabRole === "lab_member" || currentLabRole === "lab_admin" || currentLabRole === "system_admin";

  const sensors = useTelemetry(hazards, repairs);

  function setLanguage(language: Language) {
    setLanguageState(language);
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }

  function setTheme(theme: ThemeMode) {
    setThemeState(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(next));
    }
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [theme, language]);

  async function refresh(search = query, options?: { silent?: boolean }) {
    setLoading(true);
    try {
      const canManageUsers = isSystemAdmin || currentLabRole === "lab_admin";
      const [
        nextStats,
        nextAnalytics,
        nextHazardAnalytics,
        nextRegulationAnalytics,
        nextRegulations,
        nextIncidents,
        nextTrainings,
        nextEquipment,
        nextBookings,
        nextRepairs,
        nextUsers,
        nextHazards,
        nextLabMembers,
      ] = await Promise.all([
        api.dashboard(),
        api.incidentAnalytics(),
        api.hazardAnalytics(),
        api.regulationAnalytics(),
        api.regulations(search),
        api.incidents(),
        api.trainings(),
        api.equipment(search),
        api.bookings(),
        api.repairs(),
        canManageUsers ? api.users() : Promise.resolve([]),
        api.hazards(search, selectedLabId || undefined),
        selectedLabId ? api.listLabUsers(selectedLabId) : Promise.resolve([]),
      ]);
      setStats(nextStats);
      setAnalytics(nextAnalytics);
      setHazardAnalytics(nextHazardAnalytics);
      setRegulationAnalytics(nextRegulationAnalytics);
      setRegulations(nextRegulations);
      setIncidents(nextIncidents);
      setTrainings(nextTrainings);
      setEquipment(nextEquipment);
      setBookings(nextBookings);
      setRepairs(nextRepairs);
      setUsers(nextUsers);
      setHazards(nextHazards);
      setLabMembers(nextLabMembers);
      if (!options?.silent && Date.now() - lastActionAt.current > 4000) {
        setNotice("已连接后端 API，数据来自 PostgreSQL");
      }
    } catch (error) {
      const currentBase = getApiBase ? getApiBase() : "/api/v1";
      setNotice(
        error instanceof Error
          ? `后端连接失败：${error.message} (当前API地址: ${currentBase})。请检查后端服务是否运行，或在登录页“高级配置”中设置正确的后端地址（默认 /api/v1）。`
          : "后端连接失败",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void api.authMethods().then(setAuthMethods).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!session) return;
    api.setAccessToken(session.access_token);
    void api
      .me()
      .then(async (user) => {
        const nextSession = { ...session, user };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);

        try {
          const memberships = await api.myLabMemberships();
          setLabMemberships(memberships);

          let userLabs: Lab[] = [];
          if (user.role === "system_admin") {
            userLabs = await api.labs();
            // Load global login carousel for editing
            api.loginCarousel().then(setLoginCarousel).catch(() => {});
          } else {
            const allLabs = await api.labs();
            const myLabIds = new Set(memberships.map((m) => m.lab_id));
            userLabs = allLabs.filter((l) => myLabIds.has(l.id));
          }
          setLabs(userLabs);

          const parts = window.location.pathname.split("/").filter(Boolean);
          if (parts[0] === "labs" && parts[1]) {
            const parsedId = parseInt(parts[1], 10);
            if (!isNaN(parsedId)) {
              setSelectedLabId(parsedId);
            }
          } else if (userLabs.length > 0) {
            setSelectedLabId(userLabs[0].id);
          }
        } catch (e) {
          console.warn("Failed to load labs/memberships", e);
        }

        return refresh("");
      })
      .catch(() => {
        api.setAccessToken(null);
        window.localStorage.removeItem(SESSION_KEY);
        setSession(null);
      });
  }, [session?.access_token]);

  useEffect(() => {
    if (!session) return undefined;
    const timer = window.setTimeout(() => void refresh(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, session]);

  useEffect(() => {
    if (session) {
      void refresh(query);
    }
  }, [selectedLabId]);

  useEffect(() => {
    if (!session) return;
    const user = session.user;
    const { isSystemRoute, isLabRoute, urlLabId } = parsedRoute;

    if (currentPath === "/" || currentPath === "/index.html") {
      if (user.role === "system_admin") {
        navigateTo("/system/overview");
      } else if (labs.length > 0) {
        navigateTo(`/labs/${labs[0].id}/overview`);
      } else {
        navigateTo("/labs/0/overview");
      }
      return;
    }

    if (isSystemRoute && !canManageSystem(user)) {
      if (labs.length > 0) {
        navigateTo(`/labs/${labs[0].id}/overview`);
      } else {
        navigateTo("/labs/0/overview");
      }
      return;
    }

    if (isLabRoute && urlLabId !== null && urlLabId !== selectedLabId) {
      if (user.role === "system_admin" || labMemberships.some((m) => m.lab_id === urlLabId)) {
        setSelectedLabId(urlLabId);
      } else {
        if (labs.length > 0) {
          navigateTo(`/labs/${labs[0].id}/overview`);
        } else {
          navigateTo("/labs/0/overview");
        }
      }
    }
  }, [currentPath, session, labs, labMemberships, parsedRoute, selectedLabId]);

  const regulationRows = useMemo(
    () =>
      regulations.map((item) => [
        item.title,
        item.regulation_type,
        item.issuing_authority,
        item.effective_date ?? "-",
      ]),
    [regulations],
  );
  const incidentRows = useMemo(
    () =>
      incidents.map((item) => [
        item.title,
        item.lab_name,
        item.severity,
        item.occurred_on,
      ]),
    [incidents],
  );
  const trainingRows = useMemo(
    () =>
      trainings.map((item) => [
        item.title,
        item.target_role,
        item.status,
        `及格 ${item.exam_required_score}`,
      ]),
    [trainings],
  );
  const equipmentRows = useMemo(
    () =>
      equipment.map((item) => [
        item.name,
        item.asset_code,
        item.lab_name,
        item.status,
      ]),
    [equipment],
  );
  const bookingRows = useMemo(
    () =>
      bookings.map((item) => [
        new Date(item.starts_at).toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        `设备 #${item.equipment_id}`,
        item.purpose,
        "已预约",
      ]),
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
                withAction("处理报修", () =>
                  api.updateRepairStatus(item.id, "resolved"),
                )
              }
            >
              <CheckCircle2 size={15} />
              完成
            </button>
          ) : null,
      })),
    [repairs, isAdmin],
  );
  const userRows = useMemo(
    () =>
      users.map((item) => [
        item.display_name,
        item.role,
        item.auth_provider,
        item.is_active ? "启用" : "停用",
      ]),
    [users],
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
        actions: (
          <>
            {!item.responsible_user_id ? (
              <button
                type="button"
                className={actionBtnClass}
                onClick={() =>
                  withAction("责任认领", () =>
                    api.claimHazard(item.id, session!.user.id),
                  )
                }
              >
                认领
              </button>
            ) : null}
            {isAdmin && item.status === "remediation_submitted" ? (
              <button
                type="button"
                className={actionBtnClass}
                onClick={() =>
                  withAction("关闭隐患", () =>
                    api.updateHazardStatus(item.id, "closed"),
                  )
                }
              >
                关闭
              </button>
            ) : null}
          </>
        ),
      })),
    [hazards, isAdmin, session?.user.id],
  );

  const incidentBars = analytics.by_category.length
    ? analytics.by_category
    : [
        { name: "危化品", count: 0 },
        { name: "用电隐患", count: 0 },
        { name: "设备故障", count: 0 },
        { name: "违规操作", count: 0 },
      ];

  const regulationBars = regulationAnalytics.by_type.length
    ? regulationAnalytics.by_type
    : [];

  const openHazards = hazards.filter((h) => h.status !== "closed");
  const openRepairs = repairs.filter((r) => r.status !== "resolved");
  const alertCount = openHazards.length + openRepairs.length;
  const onlineCount = Math.max(1, bookings.length + (users.length > 0 ? 1 : 0));
  const safetyDays = Math.max(1, 365 - (stats?.incident_count ?? 0) * 12);

  const alertItems: AlertItem[] = useMemo(() => {
    const hazardAlerts: AlertItem[] = openHazards.slice(0, 3).map((h) => ({
      id: h.id,
      title: h.title,
      lab: h.lab_name || "未知实验室",
      severity: h.status === "open" ? "danger" : "warning",
      time: h.category,
      hazard: h,
    }));
    if (hazardAlerts.length >= 3) return hazardAlerts;
    const repairAlerts: AlertItem[] = openRepairs
      .slice(0, 3 - hazardAlerts.length)
      .map((r) => ({
        id: r.id + 10000,
        title: r.description,
        lab: `设备 #${r.equipment_id}`,
        severity: "warning" as const,
        time: "报修工单",
      }));
    return [...hazardAlerts, ...repairAlerts];
  }, [openHazards, openRepairs]);

  function exportCsv(filename: string, rows: Array<Array<string | number>>) {
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

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

  async function withAction(label: string, action: () => Promise<unknown>) {
    lastActionAt.current = Date.now();
    setNotice(`${label}处理中`);
    try {
      await action();
      await refresh(query, { silent: true });
      lastActionAt.current = Date.now();
      setNotice(`${label}成功`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `${label}失败：${error.message}`
          : `${label}失败`,
      );
    }
  }

  async function submitAction(label: string, action: () => Promise<unknown>) {
    await withAction(label, action);
  }

  function value(form: FormData, key: string) {
    const raw = form.get(key)?.toString().trim();
    if (!raw) throw new Error(`${key} 不能为空`);
    return raw;
  }

  function optionalValue(form: FormData, key: string) {
    const raw = form.get(key)?.toString().trim();
    return raw || null;
  }

  function numberValue(form: FormData, key: string) {
    const raw = Number(value(form, key));
    if (!Number.isFinite(raw)) throw new Error(`${key} 必须是数字`);
    return raw;
  }

  function datetimeValue(form: FormData, key: string) {
    return new Date(value(form, key)).toISOString();
  }

  function userCreateValue(form: FormData): UserCreate {
    const authProvider = value(
      form,
      "auth_provider",
    ) as UserCreate["auth_provider"];
    const password = optionalValue(form, "password") ?? undefined;
    if (authProvider === "password") {
      if (!password) throw new Error("password 不能为空");
      if (!validateStrongPassword(password)) {
        throw new Error("密码至少 12 位，并包含大小写字母、数字和符号");
      }
    }
    return {
      username: value(form, "username"),
      display_name: value(form, "display_name"),
      email: value(form, "email"),
      role: value(form, "role") as UserCreate["role"],
      auth_provider: authProvider,
      department: optionalValue(form, "department"),
      password,
    };
  }

  async function ensureTrainingAndUser() {
    const training =
      trainings[0] ??
      (isAdmin
        ? await api.createTraining({
            title: "临时安全培训",
            target_role: "researcher",
            status: "active",
            starts_on: new Date().toISOString().slice(0, 10),
            exam_required_score: 80,
          })
        : null);
    if (!training) {
      throw new Error("当前没有可登记的培训项目，请联系管理员先创建培训");
    }
    return { userId: session!.user.id, trainingId: training.id };
  }

  async function ensureUser() {
    if (session?.user) {
      return {
        id: session.user.id,
        username: session.user.username,
        display_name: session.user.display_name,
        email: session.user.email,
        role: session.user.role,
        auth_provider: session.user.auth_provider,
        department: null,
        is_active: true,
      };
    }
    throw new Error("请先登录后再操作");
  }

  async function createHazardWithOptionalPhoto(file?: File) {
    const user = await ensureUser();
    const upload = file ? await api.uploadHazardIssuePhoto(file) : undefined;
    const labId = selectedLabId || (labs[0]?.id ?? 1);
    return api.createHazard({
      lab_id: labId,
      title: "消防通道堆放杂物",
      category: "消防通道",
      description: "安全出口附近堆放纸箱，影响应急疏散。",
      reported_by: user.id,
      issue_photo_url: upload?.url ?? null,
    });
  }

  async function claimFirstHazard() {
    const user = await ensureUser();
    const labId = selectedLabId || (labs[0]?.id ?? 1);
    const hazard =
      hazards.find((item) => !item.responsible_user_id) ??
      (await api.createHazard({
        lab_id: labId,
        title: "待认领隐患",
        category: "日常巡检",
        description: "巡检发现的问题需要认领处理。",
        reported_by: user.id,
        issue_photo_url: null,
      }));
    return api.claimHazard(hazard.id, user.id);
  }

  async function remediateFirstHazard(file: File) {
    const user = await ensureUser();
    let hazard =
      hazards.find((item) => item.responsible_user_id === user.id) ??
      hazards[0];
    if (!hazard) {
      const labId = selectedLabId || (labs[0]?.id ?? 1);
      hazard = await api.createHazard({
        lab_id: labId,
        title: "待整改隐患",
        category: "日常巡检",
        description: "需要上传整改照片的隐患。",
        reported_by: user.id,
        issue_photo_url: null,
      });
    }
    if (!hazard.responsible_user_id) {
      hazard = await api.claimHazard(hazard.id, user.id);
    }
    const upload = await api.uploadHazardRemediationPhoto(file);
    return api.submitHazardRemediation(hazard.id, upload.url);
  }

  async function bindPasskey() {
    if (!window.PublicKeyCredential) {
      throw new Error("当前浏览器不支持 Passkey");
    }
    const challenge = await api.passkeyRegisterStart();
    const credential = await navigator.credentials.create({
      publicKey: creationOptionsFromServer(challenge.options),
    });
    if (!credential) throw new Error("Passkey 绑定已取消");
    return api.passkeyRegisterFinish(
      challenge.challenge_id,
      publicKeyCredentialToJson(credential),
      `${session!.user.display_name} Passkey`,
    );
  }

  const { isSystemRoute, systemTab, isLabRoute, labTab } = parsedRoute;

  const active = (() => {
    if (isSystemRoute) {
      if (systemTab === "overview") return "系统总览";
      if (systemTab === "labs") return "实验室管理";
      if (systemTab === "users") return "用户管理";
      if (systemTab === "config") return "全局配置";
      if (systemTab === "invitations") return "邀请管理";
    } else if (isLabRoute) {
      if (labTab === "overview") return "总览";
      if (labTab === "regulations") return "法规条例";
      if (labTab === "incidents") return "事故案例";
      if (labTab === "hazards") return "隐患管理";
      if (labTab === "trainings") return "培训考核";
      if (labTab === "bookings") return "设备预约";
      if (labTab === "repairs") return "报修工单";
      if (labTab === "users") return "成员管理";
      if (labTab === "analytics") return "统计分析";
      if (labTab === "invitations") return "邀请链接";
    }
    return "总览";
  })();

  const setActive = (label: string) => {
    if (isSystemAdmin) {
      if (label === "系统总览") {
        navigateTo("/system/overview");
        return;
      }
      if (label === "实验室管理") {
        navigateTo("/system/labs");
        return;
      }
      if (label === "用户管理") {
        navigateTo("/system/users");
        return;
      }
      if (label === "全局配置") {
        navigateTo("/system/config");
        return;
      }
      if (label === "邀请管理") {
        navigateTo("/system/invitations");
        return;
      }
    }
    const id = selectedLabId || 0;
    if (label === "总览") navigateTo(`/labs/${id}/overview`);
    else if (label === "法规条例") navigateTo(`/labs/${id}/regulations`);
    else if (label === "事故案例") navigateTo(`/labs/${id}/incidents`);
    else if (label === "隐患管理") navigateTo(`/labs/${id}/hazards`);
    else if (label === "邀请链接") navigateTo(`/labs/${id}/invitations`);
    else if (label === "培训考核") navigateTo(`/labs/${id}/trainings`);
    else if (label === "设备预约") navigateTo(`/labs/${id}/bookings`);
    else if (label === "报修工单") navigateTo(`/labs/${id}/repairs`);
    else if (label === "成员管理") navigateTo(`/labs/${id}/users`);
    else if (label === "统计分析") navigateTo(`/labs/${id}/analytics`);
  };

  const getVisibleNav = () => {
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

    if (!currentLabRole) {
      return baseNav;
    }

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

    // visitor: only sees overview, regulations, incidents + hazards (as read-only)
    return [
      ...baseNav,
      { label: "隐患管理", icon: ShieldCheck },
    ];
  };

  const visibleNav = getVisibleNav();
  const pageTitle = isSystemAdmin
    ? "实验室管理系统"
    : currentLabRole
      ? `实验室 - ${labs.find((l) => l.id === selectedLabId)?.name || "未选择"}`
      : "我的实验室安全任务";

  const pageCopy = isSystemAdmin
    ? "系统维护：实验室管理、用户管理、全局配置与跨实验室统计。"
    : currentLabRole === "lab_admin"
      ? "管理本实验室成员、隐患闭环、培训与设备。"
      : currentLabRole === "lab_member"
        ? "上报隐患、处理整改任务、查看本实验室信息。"
        : "查看允许访问的实验室信息。";

  // System Admin route targets
  const showSystemOverview = isSystemRoute && systemTab === "overview";
  const showSystemLabs = isSystemRoute && systemTab === "labs";
  const showSystemUsers = isSystemRoute && systemTab === "users";
  const showSystemConfig = isSystemRoute && systemTab === "config";

  // Lab route targets
  const showLabOverview = isLabRoute && labTab === "overview";
  const showLabRegulations = isLabRoute && labTab === "regulations";
  const showLabIncidents = isLabRoute && labTab === "incidents";
  const showLabHazards = isLabRoute && labTab === "hazards";
  const showLabTrainings = isLabRoute && labTab === "trainings";
  const showLabBookings = isLabRoute && labTab === "bookings";
  const showLabRepairs = isLabRoute && labTab === "repairs";
  const showLabUsers = isLabRoute && labTab === "users";
  const showLabAnalytics = isLabRoute && labTab === "analytics";

  // Helper flags matching the legacy render triggers
  const showOverview = showLabOverview;
  const showRegulations = showLabRegulations;
  const showIncidents = showLabIncidents;
  const showHazards = showLabHazards;
  const showTrainings = showLabTrainings;
  const showEquipment = showLabBookings;
  const showRepairs = showLabRepairs;
  const showUsers = showSystemUsers;
  const showAnalytics = showLabAnalytics;
  const showLabManagement = showSystemLabs;
  const showInvitations = (isSystemRoute && systemTab === "invitations") || (isLabRoute && labTab === "invitations");

  if (!session) {
    if (parsedRoute.isJoinRoute) {
      return (
        <InvitationRegisterScreen
          code={parsedRoute.inviteCode}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onBackToLogin={() => navigateTo("/")}
        />
      );
    }
    return (
      <LoginScreen
        authMethods={authMethods}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        onLogin={setSession}
      />
    );
  }

  return (
    <main className="app-shell flex min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar
        active={active}
        visibleNav={visibleNav}
        onNavigate={setActive}
      />

      <section className="workspace lab-grid-bg flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
          <MobileNav
            active={active}
            visibleNav={visibleNav}
            onNavigate={setActive}
          />
          <TopBar
            pageTitle={pageTitle}
            pageCopy={pageCopy}
            notice={notice}
            loading={loading}
            session={session}
            isAdmin={isAdmin}
            query={query}
            theme={theme}
            onQueryChange={setQuery}
            onBindPasskey={() => withAction("绑定 Passkey", bindPasskey)}
            onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
            onLogout={() => {
              api.setAccessToken(null);
              window.localStorage.removeItem(SESSION_KEY);
              setSession(null);
            }}
          />

          {showOverview ? (
            <div className="mt-8">
              <OverviewDashboard
                safetyDays={safetyDays}
                onlineCount={onlineCount}
                alertCount={alertCount}
                sensors={sensors}
                alerts={alertItems}
                onAssign={(hazard) =>
                  withAction("指派处理", () =>
                    api.claimHazard(hazard.id, session.user.id),
                  )
                }
                onConfirm={(hazard) =>
                  withAction("确认安全", () =>
                    api.updateHazardStatus(hazard.id, "closed"),
                  )
                }
                onLock={() => setNotice("实验室已进入紧急锁定模式")}
                onReport={() => {
                  setActive("隐患管理");
                  document
                    .querySelector('[data-action="hazard-report"]')
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                onScan={() =>
                  setNotice("请使用扫码枪扫描耗材条码，或手动在设备台账中登记")
                }
              />
            </div>
          ) : null}

          {showInvitations ? (
            <div className="mt-8">
              <InvitationsManager
                labId={isSystemRoute ? null : selectedLabId}
                isSystemAdmin={isSystemAdmin}
                labs={labs}
                language={language}
              />
            </div>
          ) : null}

          {!showInvitations ? (
            <section className="metrics mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="法规条例"
                value={`${stats?.regulation_count ?? 0}`}
                hint="支持上传、查询 and 分类管理"
                icon={ClipboardList}
              />
              <MetricCard
                label="培训通过率"
                value={`${Math.round((stats?.exam_pass_rate ?? 0) * 100)}%`}
                hint={`${stats?.training_count ?? 0} 个培训项目`}
                icon={GraduationCap}
              />
              <MetricCard
                label="设备数量"
                value={`${stats?.equipment_count ?? 0}`}
                hint="支持查询、预约和报修"
                icon={CalendarClock}
              />
              <MetricCard
                label={isAdmin ? "隐患闭环" : "我的隐患"}
                value={`${hazards.length}`}
                hint={isAdmin ? "问题照片、认领、整改照片" : "上报和整改任务"}
                icon={ShieldCheck}
                accent={hazards.some((h) => h.status !== "closed") ? "amber" : "primary"}
              />
            </section>
          ) : null}

          {isSystemAdmin && (
            <div className="mt-4 mb-2 rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm dark:border-stone-700 dark:bg-stone-900/50">
              <span className="mr-2">登录页自定义文案已接入后端存储。</span>
              <button
                onClick={() => setActive("全局配置")}
                className="underline text-amber-600 dark:text-amber-400"
              >
                前往全局配置编辑轮播标题/副标题
              </button>
              <span className="mx-2 text-stone-400">·</span>
              <button onClick={resetToDefault} className="underline text-amber-600 dark:text-amber-400">重置默认</button>
            </div>
          )}

          <section className="content-grid mt-8 grid gap-6 lg:grid-cols-2">
            {showAnalytics ? (
              <AnalyticsPanel
                title={isAdmin ? "事故案例分析" : "我的隐患状态"}
                items={isAdmin ? incidentBars : hazardAnalytics.by_status}
                onExport={exportAnalytics}
              />
            ) : null}

            {showAnalytics && isAdmin && regulationBars.length > 0 ? (
              <AnalyticsPanel
                title="法规统计"
                items={regulationBars}
                onExport={exportAnalytics}
              />
            ) : null}

            {showTrainings ? (
              <TrainingHighlight
                stats={stats}
                isAdmin={isAdmin}
                onCreate={() =>
                  document
                    .querySelector('[data-action="training"]')
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                onRegister={() =>
                  withAction("登记考核通过", async () => {
                    const ids = await ensureTrainingAndUser();
                    return api.createExamResult(ids.trainingId, ids.userId);
                  })
                }
              />
            ) : null}

            {showRegulations ? (
              <DataTable
                title="法规条例上传"
                rows={regulationRows}
                onViewAll={() => setActive("法规条例")}
              />
            ) : null}
            {showIncidents ? (
              <DataTable
                title="事故案例库"
                rows={incidentRows}
                onViewAll={() => setActive("事故案例")}
              />
            ) : null}
            {showHazards ? (
              <DataTable
                title={isAdmin ? "安全隐患闭环" : "我的安全隐患"}
                rows={hazardRows}
                onViewAll={() => setActive("隐患管理")}
              />
            ) : null}
            {showTrainings ? (
              <DataTable
                title="培训项目"
                rows={trainingRows}
                onViewAll={() => setActive("培训考核")}
              />
            ) : null}
            {showEquipment ? (
              <DataTable
                title="设备台账"
                rows={equipmentRows}
                onViewAll={() => setActive("设备预约")}
              />
            ) : null}
            {showEquipment ? (
              <DataTable
                title="设备预约排程"
                rows={bookingRows}
                onViewAll={() => setActive("设备预约")}
              />
            ) : null}
            {isAdmin && showRepairs ? (
              <DataTable
                title="报修工单"
                rows={repairRows}
                onViewAll={() => setActive("报修工单")}
              />
            ) : null}
            {isAdmin && showUsers ? (
              <DataTable
                title="用户与登录方式"
                rows={userRows}
                onViewAll={() => setActive("用户管理")}
              />
            ) : null}
          </section>

          {/* Global login carousel editor - only for system_admin via 全局配置 tab */}
          {showSystemConfig && isSystemAdmin && (
            <section className="mt-6 rounded-2xl border border-stone-200 bg-white/80 p-5 dark:border-stone-700 dark:bg-stone-900/60">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">登录页轮播文案</h3>
                  <p className="text-xs text-stone-500">保存到后端，仅 system_admin 可修改，登录页实时拉取。</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => syncLanguages("zh", "en")}
                    disabled={carouselSaving || !loginCarousel}
                    className="rounded-lg border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-600 dark:hover:bg-stone-800"
                  >
                    中文 → 英文
                  </button>
                  <button
                    onClick={() => syncLanguages("en", "zh")}
                    disabled={carouselSaving || !loginCarousel}
                    className="rounded-lg border border-stone-300 px-2 py-1 hover:bg-stone-100 dark:border-stone-600 dark:hover:bg-stone-800"
                  >
                    英文 → 中文
                  </button>
                  <button
                    onClick={resetToDefault}
                    disabled={carouselSaving}
                    className="rounded-lg border border-amber-300 px-2 py-1 text-amber-700 hover:bg-amber-50 dark:text-amber-400"
                  >
                    重置为默认
                  </button>
                  <button
                    onClick={async () => {
                      if (!loginCarousel) return;
                      await saveLoginCarousel(loginCarousel);
                    }}
                    disabled={carouselSaving || !loginCarousel}
                    className="rounded-lg bg-stone-900 px-3 py-1 text-white disabled:opacity-50"
                  >
                    {carouselSaving ? "保存中..." : "保存到后端"}
                  </button>
                </div>
              </div>

              {loginCarousel ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {(["zh", "en"] as const).map((lang) => {
                    const slides = loginCarousel[lang] || [];
                    return (
                      <div key={lang} className="space-y-3">
                        <div className="text-xs font-medium uppercase tracking-widest text-stone-500">
                          {lang === "zh" ? "中文" : "English"}
                        </div>
                        {(slides.length ? slides : [{stat:"", title:"", body:""}, {stat:"", title:"", body:""}, {stat:"", title:"", body:""}]).map((slide, idx) => (
                          <div key={idx} className="rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700">
                            <div className="mb-1 text-[10px] text-stone-500">Slide {idx + 1}</div>
                            <input
                              className="mb-1 w-full rounded border border-stone-200 bg-white px-2 py-1 dark:bg-stone-950"
                              placeholder="标签 (stat)"
                              value={slide.stat}
                              onChange={(e) => {
                                const next = { ...loginCarousel };
                                const arr = [...(next[lang] || [])];
                                arr[idx] = { ...(arr[idx] || {stat:'',title:'',body:''}), stat: e.target.value };
                                next[lang] = arr;
                                setLoginCarousel(next);
                              }}
                            />
                            <input
                              className="mb-1 w-full rounded border border-stone-200 bg-white px-2 py-1 font-medium dark:bg-stone-950"
                              placeholder="主标题"
                              value={slide.title}
                              onChange={(e) => {
                                const next = { ...loginCarousel };
                                const arr = [...(next[lang] || [])];
                                arr[idx] = { ...(arr[idx] || {stat:'',title:'',body:''}), title: e.target.value };
                                next[lang] = arr;
                                setLoginCarousel(next);
                              }}
                            />
                            <textarea
                              className="w-full rounded border border-stone-200 bg-white px-2 py-1 text-xs dark:bg-stone-950"
                              rows={2}
                              placeholder="副标题 / 说明"
                              value={slide.body}
                              onChange={(e) => {
                                const next = { ...loginCarousel };
                                const arr = [...(next[lang] || [])];
                                arr[idx] = { ...(arr[idx] || {stat:'',title:'',body:''}), body: e.target.value };
                                next[lang] = arr;
                                setLoginCarousel(next);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-stone-500">加载中...</div>
              )}
            </section>
          )}

          <section className="quick-actions mt-8 grid gap-4 pb-8 md:grid-cols-2 xl:grid-cols-3">
            {isAdmin && showRegulations ? (
              <ActionForm
                title="创建法规"
                onSubmit={(form) =>
                  submitAction("创建法规", () =>
                    api.createRegulation({
                      title: value(form, "title"),
                      regulation_type: value(form, "regulation_type"),
                      issuing_authority: value(form, "issuing_authority"),
                      effective_date: optionalValue(form, "effective_date"),
                      summary: value(form, "summary"),
                      file_url: null,
                    }),
                  )
                }
              >
                <FormInput name="title" placeholder="法规标题" />
                <FormInput
                  name="regulation_type"
                  placeholder="类型"
                  defaultValue="regulation"
                />
                <FormInput
                  name="issuing_authority"
                  placeholder="发布单位"
                  defaultValue="安全办公室"
                />
                <FormInput name="effective_date" type="date" />
                <FormInput name="summary" placeholder="摘要" className="sm:col-span-2" />
              </ActionForm>
            ) : null}

            {isAdmin && showIncidents ? (
              <ActionForm
                title="录入事故案例"
                onSubmit={(form) =>
                  submitAction("录入事故案例", () =>
                    api.createIncident({
                      title: value(form, "title"),
                      lab_name: value(form, "lab_name"),
                      occurred_on: value(form, "occurred_on"),
                      severity: value(form, "severity"),
                      category: value(form, "category"),
                      root_cause: value(form, "root_cause"),
                      corrective_actions: value(form, "corrective_actions"),
                      file_url: optionalValue(form, "file_url"),
                    }),
                  )
                }
              >
                <FormInput name="title" placeholder="案例标题" />
                <FormInput name="lab_name" placeholder="实验室" />
                <FormInput
                  name="occurred_on"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
                <FormInput
                  name="severity"
                  placeholder="严重程度"
                  defaultValue="medium"
                />
                <FormInput name="category" placeholder="分类" />
                <FormInput name="root_cause" placeholder="根因" />
                <FormInput name="corrective_actions" placeholder="整改措施" />
                <FormInput name="file_url" placeholder="附件URL (可选，先用上传按钮)" />
              </ActionForm>
            ) : null}

            {showHazards ? (
              <ActionForm
                title="上报隐患"
                actionKey="hazard-report"
                onSubmit={(form) =>
                  submitAction("上报隐患", async () => {
                    const user = await ensureUser();
                    const labId = Number(value(form, "lab_id"));
                    return api.createHazard({
                      lab_id: labId,
                      title: value(form, "title"),
                      category: value(form, "category"),
                      description: value(form, "description"),
                      reported_by: user.id,
                      issue_photo_url: null,
                    });
                  })
                }
              >
                <FormSelect name="lab_id" defaultValue={selectedLabId ? String(selectedLabId) : ""}>
                  <option value="" disabled>选择实验室</option>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </FormSelect>
                <FormInput name="title" placeholder="隐患标题" />
                <FormInput name="category" placeholder="分类" />
                <FormInput name="description" placeholder="问题描述" />
              </ActionForm>
            ) : null}

            {isAdmin && showTrainings ? (
              <ActionForm
                title="创建培训"
                actionKey="training"
                onSubmit={(form) =>
                  submitAction("创建培训", () =>
                    api.createTraining({
                      title: value(form, "title"),
                      target_role: value(form, "target_role"),
                      status: value(form, "status"),
                      starts_on: optionalValue(form, "starts_on"),
                      exam_required_score: numberValue(
                        form,
                        "exam_required_score",
                      ),
                    }),
                  )
                }
              >
                <FormInput name="title" placeholder="培训标题" />
                <FormInput
                  name="target_role"
                  placeholder="目标角色"
                  defaultValue="researcher"
                />
                <FormInput name="status" placeholder="状态" defaultValue="active" />
                <FormInput name="starts_on" type="date" />
                <FormInput
                  name="exam_required_score"
                  type="number"
                  defaultValue="80"
                />
              </ActionForm>
            ) : null}

            {isAdmin && showEquipment ? (
              <ActionForm
                title="登记设备"
                onSubmit={(form) =>
                  submitAction("登记设备", () =>
                    api.createEquipment({
                      asset_code: value(form, "asset_code"),
                      name: value(form, "name"),
                      lab_name: value(form, "lab_name"),
                      status: value(form, "status"),
                      owner: optionalValue(form, "owner"),
                    }),
                  )
                }
              >
                <FormInput name="asset_code" placeholder="资产编号" />
                <FormInput name="name" placeholder="设备名称" />
                <FormInput name="lab_name" placeholder="实验室" />
                <FormInput
                  name="status"
                  placeholder="状态"
                  defaultValue="available"
                />
                <FormInput name="owner" placeholder="负责人" />
              </ActionForm>
            ) : null}

            {showEquipment ? (
              <ActionForm
                title="预约设备"
                onSubmit={(form) =>
                  submitAction("创建设备预约", () =>
                    api.createBooking({
                      equipment_id: numberValue(form, "equipment_id"),
                      user_id: session.user.id,
                      starts_at: datetimeValue(form, "starts_at"),
                      ends_at: datetimeValue(form, "ends_at"),
                      purpose: value(form, "purpose"),
                    }),
                  )
                }
              >
                <FormSelect
                  name="equipment_id"
                  defaultValue={equipment[0]?.id ? String(equipment[0].id) : ""}
                >
                  <option value="" disabled>
                    选择设备
                  </option>
                  {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </FormSelect>
                <FormInput name="starts_at" type="datetime-local" />
                <FormInput name="ends_at" type="datetime-local" />
                <FormInput name="purpose" placeholder="用途" />
              </ActionForm>
            ) : null}

            {showRepairs ? (
              <ActionForm
                title="提交报修"
                onSubmit={(form) =>
                  submitAction("提交报修", () =>
                    api.createRepair({
                      equipment_id: numberValue(form, "equipment_id"),
                      reported_by: session.user.id,
                      description: value(form, "description"),
                      status: "open",
                    }),
                  )
                }
              >
                <FormSelect
                  name="equipment_id"
                  defaultValue={equipment[0]?.id ? String(equipment[0].id) : ""}
                >
                  <option value="" disabled>
                    选择设备
                  </option>
                  {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </FormSelect>
                <FormInput name="description" placeholder="故障描述" />
              </ActionForm>
            ) : null}

            {showTrainings ? (
              <ActionForm
                title="登记考核"
                onSubmit={(form) =>
                  submitAction("登记考核", () =>
                    api.createExamResult(
                      numberValue(form, "training_id"),
                      session.user.id,
                      numberValue(form, "score"),
                    ),
                  )
                }
              >
                <FormSelect
                  name="training_id"
                  defaultValue={trainings[0]?.id ? String(trainings[0].id) : ""}
                >
                  <option value="" disabled>
                    选择培训
                  </option>
                  {trainings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </FormSelect>
                <FormInput
                  name="score"
                  type="number"
                  defaultValue="90"
                  min="0"
                  max="100"
                />
              </ActionForm>
            ) : null}

            {isAdmin && showUsers ? (
              <ActionForm
                title="创建用户"
                onSubmit={(form) =>
                  submitAction("创建用户", () =>
                    api.createUser(userCreateValue(form)),
                  )
                }
              >
                <FormInput name="username" placeholder="用户名" />
                <FormInput name="display_name" placeholder="显示名" />
                <FormInput name="email" type="email" placeholder="邮箱" />
                <FormSelect name="role" defaultValue="researcher">
                  <option value="researcher">普通用户</option>
                  <option value="admin">管理员</option>
                </FormSelect>
                <FormSelect name="auth_provider" defaultValue="password">
                  <option value="password">账号密码</option>
                  <option value="sso">SSO</option>
                  <option value="oauth">OAuth</option>
                </FormSelect>
                <FormInput name="department" placeholder="部门/实验室" />
                <FormInput
                  name="password"
                  type="password"
                  placeholder="强密码，密码登录必填"
                  autoComplete="new-password"
                />
              </ActionForm>
            ) : null}

            {showHazards ? (
              <button
                type="button"
                onClick={() => withAction("责任认领", claimFirstHazard)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-4 py-4 text-sm font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200 dark:hover:border-stone-600"
              >
                <FlaskConical size={16} />
                责任认领
              </button>
            ) : null}

            {isAdmin && showRegulations ? (
              <UploadButton
                label="上传法规文件"
                icon={<ClipboardList size={16} />}
                onFile={(file) =>
                  void withAction("上传法规文件", () => api.uploadRegulation(file))
                }
              />
            ) : null}
            {isAdmin && showIncidents ? (
              <UploadButton
                label="上传案例附件"
                icon={<AlertTriangle size={16} />}
                onFile={(file) =>
                  void withAction("上传案例附件", () => api.uploadIncident(file))
                }
              />
            ) : null}
            {showHazards ? (
              <UploadButton
                label="上传问题照片"
                icon={<ShieldCheck size={16} />}
                accept="image/*"
                onFile={(file) =>
                  void withAction("上传问题照片并上报隐患", () =>
                    createHazardWithOptionalPhoto(file),
                  )
                }
              />
            ) : null}
            {showHazards ? (
              <UploadButton
                label="上传整改照片"
                icon={<Wrench size={16} />}
                accept="image/*"
                onFile={(file) =>
                  void withAction("上传整改照片", () => remediateFirstHazard(file))
                }
              />
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}