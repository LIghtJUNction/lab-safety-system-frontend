import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UserCog,
  Wrench,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, AuthMethods, AuthSession, Booking, DashboardStats, Equipment, HazardAnalytics, IncidentAnalytics, Regulation, RepairTicket, SafetyHazard, Training, User } from "./api";

const nav = [
  { label: "总览", icon: LayoutDashboard },
  { label: "法规条例", icon: ClipboardList },
  { label: "事故案例", icon: AlertTriangle },
  { label: "隐患管理", icon: ShieldCheck },
  { label: "培训考核", icon: GraduationCap },
  { label: "设备预约", icon: CalendarClock },
  { label: "报修工单", icon: Wrench },
  { label: "用户管理", icon: UserCog },
  { label: "统计分析", icon: BarChart3 },
];

function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{trend}</em>
    </div>
  );
}

function DataTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{title}</h2>
        <button>查看全部</button>
      </div>
      <div className="table">
        {rows.length === 0 ? <p className="empty">暂无数据，使用下方操作台创建记录。</p> : rows.map((row) => (
          <div className="table-row" key={row.join("-")}>
            {row.map((cell) => (
              <span key={cell}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

const SESSION_KEY = "lab-safety-session";

function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as AuthSession) : null;
    api.setAccessToken(session?.access_token ?? null);
    return session;
  } catch {
    api.setAccessToken(null);
    return null;
  }
}

function LoginScreen({
  authMethods,
  onLogin,
}: {
  authMethods: AuthMethods;
  onLogin: (session: AuthSession) => void;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("请使用账号密码登录，或选择已配置的统一身份入口。");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("正在登录");
    try {
      const session = await api.passwordLogin(username, password);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      api.setAccessToken(session.access_token);
      onLogin(session);
      setNotice("登录成功");
    } catch (error) {
      setNotice(error instanceof Error ? `登录失败：${error.message}` : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <strong>LabSafe</strong>
            <span>实验室安全管理</span>
          </div>
        </div>
        <h1>实验室安全隐患闭环平台</h1>
        <p>统一处理隐患上报、责任认领、整改照片、培训考核、设备预约和报修工单。</p>
      </section>

      <section className="login-panel">
        <div className="login-title">
          <KeyRound size={26} />
          <div>
            <h2>登录系统</h2>
            <p>{notice}</p>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>
            用户名
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            密码
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          <button disabled={submitting || !authMethods.password}>
            <LogIn size={17} />
            {submitting ? "登录中" : "账号密码登录"}
          </button>
        </form>

        <div className="federated-login">
          <button type="button" disabled={!authMethods.sso || !authMethods.sso_login_url} onClick={() => authMethods.sso_login_url && window.location.assign(authMethods.sso_login_url)}>
            {authMethods.sso ? "SSO 单点登录" : "SSO 未配置"}
          </button>
          <button type="button" disabled={!authMethods.oauth || !authMethods.oauth_login_url} onClick={() => authMethods.oauth_login_url && window.location.assign(authMethods.oauth_login_url)}>
            {authMethods.oauth ? "OAuth 授权登录" : "OAuth 未配置"}
          </button>
        </div>

        <p className="login-help">首次部署请使用命令行工具创建超级管理员账号。命令行用户管理只允许超级管理员执行。</p>
      </section>
    </main>
  );
}

export function App() {
  const [active, setActive] = useState("总览");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("正在连接后端 API");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<IncidentAnalytics>({ by_category: [], by_severity: [] });
  const [hazardAnalytics, setHazardAnalytics] = useState<HazardAnalytics>({ by_status: [], by_category: [] });
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hazards, setHazards] = useState<SafetyHazard[]>([]);
  const [session, setSession] = useState<AuthSession | null>(() => readSession());
  const [authMethods, setAuthMethods] = useState<AuthMethods>({ password: true, sso: false, oauth: false, sso_login_url: null, oauth_login_url: null });

  async function refresh(search = query) {
    setLoading(true);
    try {
      const canManageUsers = session?.user.role === "admin" || session?.user.role === "super_admin";
      const [nextStats, nextAnalytics, nextHazardAnalytics, nextRegulations, nextTrainings, nextEquipment, nextBookings, nextRepairs, nextUsers, nextHazards] =
        await Promise.all([
          api.dashboard(),
          api.incidentAnalytics(),
          api.hazardAnalytics(),
          api.regulations(search),
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
      setRegulations(nextRegulations);
      setTrainings(nextTrainings);
      setEquipment(nextEquipment);
      setBookings(nextBookings);
      setRepairs(nextRepairs);
      setUsers(nextUsers);
      setHazards(nextHazards);
      setNotice("已连接后端 API，数据来自 PostgreSQL");
    } catch (error) {
      setNotice(error instanceof Error ? `后端连接失败：${error.message}` : "后端连接失败");
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
    void api.me()
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
    () => regulations.map((item) => [item.title, item.regulation_type, item.issuing_authority, item.effective_date ?? "-"]),
    [regulations],
  );
  const bookingRows = useMemo(
    () => bookings.map((item) => [new Date(item.starts_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), `设备 #${item.equipment_id}`, item.purpose, "已预约"]),
    [bookings],
  );
  const repairRows = useMemo(
    () => repairs.map((item) => [`#${item.id}`, `设备 #${item.equipment_id}`, item.description, item.status]),
    [repairs],
  );
  const userRows = useMemo(
    () => users.map((item) => [item.display_name, item.role, item.auth_provider, item.is_active ? "启用" : "停用"]),
    [users],
  );
  const hazardRows = useMemo(
    () => hazards.map((item) => [item.title, item.category, item.status, item.responsible_user_id ? `责任人 #${item.responsible_user_id}` : "待认领"]),
    [hazards],
  );
  const incidentBars = analytics.by_category.length
    ? analytics.by_category
    : [
        { name: "危化品", count: 0 },
        { name: "用电隐患", count: 0 },
        { name: "设备故障", count: 0 },
        { name: "违规操作", count: 0 },
      ];

  async function withAction(label: string, action: () => Promise<unknown>) {
    setNotice(`${label}处理中`);
    try {
      await action();
      await refresh();
      setNotice(`${label}成功`);
    } catch (error) {
      setNotice(error instanceof Error ? `${label}失败：${error.message}` : `${label}失败`);
    }
  }

  async function ensureUserAndEquipment() {
    const device = equipment[0] ?? (isAdmin ? await api.createEquipment() : null);
    if (!device) {
      throw new Error("当前没有可预约或报修的设备，请联系管理员先登记设备");
    }
    return { userId: session!.user.id, equipmentId: device.id };
  }

  async function ensureTrainingAndUser() {
    const training = trainings[0] ?? (isAdmin ? await api.createTraining() : null);
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
    return users[0] ?? api.createUser();
  }

  async function createHazardWithOptionalPhoto(file?: File) {
    const user = await ensureUser();
    const upload = file ? await api.uploadHazardIssuePhoto(file) : undefined;
    return api.createHazard(user.id, upload?.url);
  }

  async function claimFirstHazard() {
    const user = await ensureUser();
    const hazard = hazards.find((item) => !item.responsible_user_id) ?? (await api.createHazard(user.id));
    return api.claimHazard(hazard.id, user.id);
  }

  async function remediateFirstHazard(file: File) {
    const user = await ensureUser();
    let hazard = hazards.find((item) => item.responsible_user_id === user.id) ?? hazards[0];
    if (!hazard) {
      hazard = await api.createHazard(user.id);
    }
    if (!hazard.responsible_user_id) {
      hazard = await api.claimHazard(hazard.id, user.id);
    }
    const upload = await api.uploadHazardRemediationPhoto(file);
    return api.submitHazardRemediation(hazard.id, upload.url);
  }

  const isAdmin = session?.user.role === "admin" || session?.user.role === "super_admin";
  const visibleNav = isAdmin ? nav : nav.filter((item) => item.label !== "用户管理" && item.label !== "统计分析");
  const pageTitle = isAdmin ? "实验室安全运营总览" : "我的实验室安全任务";
  const pageCopy = isAdmin
    ? "统一管理法规条例、事故案例、隐患闭环、培训考核、设备预约、报修工单和用户权限。"
    : "提交安全隐患、认领责任、上传整改照片，并跟踪自己负责的安全任务。";

  if (!session) {
    return <LoginScreen authMethods={authMethods} onLogin={setSession} />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <strong>LabSafe</strong>
            <span>实验室安全管理</span>
          </div>
        </div>
        <nav>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <button className={active === item.label ? "active" : ""} key={item.label} onClick={() => setActive(item.label)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageCopy}</p>
            <p className={loading ? "status loading" : "status"}>{notice}</p>
          </div>
          <div className="user-menu">
            <span>{session.user.display_name}</span>
            <strong>{session.user.role === "super_admin" ? "超级管理员" : isAdmin ? "管理员" : "普通用户"}</strong>
            <button onClick={() => {
              api.setAccessToken(null);
              window.localStorage.removeItem(SESSION_KEY);
              setSession(null);
            }}>
              <LogOut size={16} />
              退出
            </button>
          </div>
          <label className="search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索法规、案例、设备" />
          </label>
        </header>

        <section className="metrics">
          <Metric label="法规条例" value={`${stats?.regulation_count ?? 0}`} trend="支持上传、查询和分类管理" />
          <Metric label="培训通过率" value={`${Math.round((stats?.exam_pass_rate ?? 0) * 100)}%`} trend={`${stats?.training_count ?? 0} 个培训项目`} />
          <Metric label="设备数量" value={`${stats?.equipment_count ?? 0}`} trend="支持查询、预约和报修" />
          <Metric label={isAdmin ? "隐患闭环" : "我的隐患"} value={`${hazards.length}`} trend={isAdmin ? "问题照片、认领、整改照片" : "上报和整改任务"} />
        </section>

        <section className="content-grid">
          <section className="panel analysis">
            <div className="panel-title">
              <h2>{isAdmin ? "事故案例分析" : "我的隐患状态"}</h2>
              <button>导出</button>
            </div>
            <div className="bars">
              {(isAdmin ? incidentBars : hazardAnalytics.by_status).map((item, index) => (
                <div className="bar-line" key={item.name}>
                  <span>{item.name}</span>
                  <div>
                    <i style={{ width: `${Math.max(item.count * 18, item.count ? 16 : 4)}%`, background: ["#d97706", "#0f766e", "#475569", "#dc2626"][index % 4] }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel training">
            <BookOpenCheck size={28} />
            <h2>培训与考核</h2>
            <strong>{Math.round((stats?.exam_pass_rate ?? 0) * 100)}%</strong>
            <p>当前已创建 {stats?.training_count ?? 0} 个培训项目，考试结果会实时进入统计。</p>
            {isAdmin ? (
              <button onClick={() => withAction("创建培训", api.createTraining)}>创建培训</button>
            ) : (
              <button onClick={() => withAction("登记考核通过", async () => {
                const ids = await ensureTrainingAndUser();
                return api.createExamResult(ids.trainingId, ids.userId);
              })}>登记考核通过</button>
            )}
          </section>

          <DataTable title="法规条例上传" rows={regulationRows} />
          <DataTable title={isAdmin ? "安全隐患闭环" : "我的安全隐患"} rows={hazardRows} />
          <DataTable title="设备预约排程" rows={bookingRows} />
          {isAdmin ? <DataTable title="报修工单" rows={repairRows} /> : null}
          {isAdmin ? <DataTable title="用户与登录方式" rows={userRows} /> : null}
        </section>

        <section className="quick-actions">
          {isAdmin ? <button onClick={() => withAction("创建法规", api.createRegulation)}><FlaskConical size={16} />创建法规</button> : null}
          {isAdmin ? <button onClick={() => withAction("录入事故案例", api.createIncident)}><FlaskConical size={16} />录入事故案例</button> : null}
          <button onClick={() => withAction("上报隐患", () => createHazardWithOptionalPhoto())}><FlaskConical size={16} />上报隐患</button>
          <button onClick={() => withAction("责任认领", claimFirstHazard)}><FlaskConical size={16} />责任认领</button>
          <button onClick={() => withAction("登记考核通过", async () => { const ids = await ensureTrainingAndUser(); return api.createExamResult(ids.trainingId, ids.userId); })}><FlaskConical size={16} />登记考核通过</button>
          {isAdmin ? <button onClick={() => withAction("登记设备", api.createEquipment)}><FlaskConical size={16} />登记设备</button> : null}
          <button onClick={() => withAction("创建设备预约", async () => { const ids = await ensureUserAndEquipment(); return api.createBooking(ids.equipmentId, ids.userId); })}><FlaskConical size={16} />预约设备</button>
          <button onClick={() => withAction("提交报修", async () => { const ids = await ensureUserAndEquipment(); return api.createRepair(ids.equipmentId, ids.userId); })}><FlaskConical size={16} />提交报修</button>
          {isAdmin ? <label className="upload-button">
            <ClipboardList size={16} />
            上传法规文件
            <input type="file" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void withAction("上传法规文件", () => api.uploadRegulation(file));
            }} />
          </label> : null}
          {isAdmin ? <label className="upload-button">
            <AlertTriangle size={16} />
            上传案例附件
            <input type="file" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void withAction("上传案例附件", () => api.uploadIncident(file));
            }} />
          </label> : null}
          <label className="upload-button">
            <ShieldCheck size={16} />
            上传问题照片
            <input type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void withAction("上传问题照片并上报隐患", () => createHazardWithOptionalPhoto(file));
            }} />
          </label>
          <label className="upload-button">
            <Wrench size={16} />
            上传整改照片
            <input type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void withAction("上传整改照片", () => remediateFirstHazard(file));
            }} />
          </label>
        </section>
      </section>
    </main>
  );
}
