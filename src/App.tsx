import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  ShieldCheck,
  Wrench,
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
} from "./api";
import { LoginScreen } from "./components/auth/LoginScreen";
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
} from "./lib/constants";
import { Language, ThemeMode } from "./lib/types";

const actionBtnClass =
  "inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600";

export function App() {
  const [language, setLanguageState] = useState<Language>(
    () => (window.localStorage.getItem(LANGUAGE_KEY) as Language) || "zh",
  );
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (window.localStorage.getItem(THEME_KEY) as ThemeMode) || "light",
  );
  const [active, setActive] = useState("总览");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
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
  const [authMethods, setAuthMethods] = useState<AuthMethods>({
    password: true,
    sso: false,
    oauth: false,
    sso_login_url: null,
    oauth_login_url: null,
  });
  const lastActionAt = useRef(0);
  const isAdmin =
    session?.user.role === "admin" || session?.user.role === "super_admin";

  const sensors = useTelemetry(hazards, repairs);

  function setLanguage(language: Language) {
    setLanguageState(language);
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }

  function setTheme(theme: ThemeMode) {
    setThemeState(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [theme, language]);

  async function refresh(search = query, options?: { silent?: boolean }) {
    setLoading(true);
    try {
      const canManageUsers = isAdmin;
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
        api.hazards(search),
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
      if (!options?.silent && Date.now() - lastActionAt.current > 4000) {
        setNotice("已连接后端 API，数据来自 PostgreSQL");
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `后端连接失败：${error.message}`
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
      .then((user) => {
        const nextSession = { ...session, user };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
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
      lab: h.lab_name,
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
    return api.createHazard({
      title: "消防通道堆放杂物",
      lab_name: "材料实验室",
      category: "消防通道",
      description: "安全出口附近堆放纸箱，影响应急疏散。",
      reported_by: user.id,
      issue_photo_url: upload?.url ?? null,
    });
  }

  async function claimFirstHazard() {
    const user = await ensureUser();
    const hazard =
      hazards.find((item) => !item.responsible_user_id) ??
      (await api.createHazard({
        title: "待认领隐患",
        lab_name: "公共实验平台",
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
      hazard = await api.createHazard({
        title: "待整改隐患",
        lab_name: "公共实验平台",
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

  const visibleNav = isAdmin
    ? nav
    : nav.filter(
        (item) => item.label !== "用户管理" && item.label !== "统计分析",
      );
  const pageTitle = isAdmin ? "实验室安全运营总览" : "我的实验室安全任务";
  const pageCopy = isAdmin
    ? "统一管理法规条例、事故案例、隐患闭环、培训考核、设备预约、报修工单和用户权限。"
    : "提交安全隐患、认领责任、上传整改照片，并跟踪自己负责的安全任务。";
  const showOverview = active === "总览";
  const showRegulations = showOverview || active === "法规条例";
  const showIncidents = showOverview || active === "事故案例";
  const showHazards = showOverview || active === "隐患管理";
  const showTrainings = showOverview || active === "培训考核";
  const showEquipment = showOverview || active === "设备预约";
  const showRepairs = showOverview || active === "报修工单";
  const showUsers = showOverview || active === "用户管理";
  const showAnalytics = showOverview || active === "统计分析";

  if (!session) {
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

          <section className="metrics mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="法规条例"
              value={`${stats?.regulation_count ?? 0}`}
              hint="支持上传、查询和分类管理"
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
                    return api.createHazard({
                      title: value(form, "title"),
                      lab_name: value(form, "lab_name"),
                      category: value(form, "category"),
                      description: value(form, "description"),
                      reported_by: user.id,
                      issue_photo_url: null,
                    });
                  })
                }
              >
                <FormInput name="title" placeholder="隐患标题" />
                <FormInput name="lab_name" placeholder="实验室" />
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
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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