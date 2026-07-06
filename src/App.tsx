import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  Fingerprint,
  FlaskConical,
  Github,
  GraduationCap,
  KeyRound,
  Languages,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserCog,
  Wrench,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  RepairTicket,
  SafetyHazard,
  Training,
  User,
  UserCreate,
} from "./api";

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

type TableRow = string[] | { cells: string[]; actions?: ReactNode };

function Metric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{trend}</em>
    </div>
  );
}

function DataTable({
  title,
  rows,
  onViewAll,
}: {
  title: string;
  rows: TableRow[];
  onViewAll?: () => void;
}) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{title}</h2>
        {onViewAll ? <button onClick={onViewAll}>查看全部</button> : null}
      </div>
      <div className="table">
        {rows.length === 0 ? (
          <p className="empty">暂无数据，使用下方操作台创建记录。</p>
        ) : (
          rows.map((row, index) => {
            const cells = Array.isArray(row) ? row : row.cells;
            const actions = Array.isArray(row) ? null : row.actions;
            return (
              <div
                className={actions ? "table-row with-actions" : "table-row"}
                key={`${title}-${index}-${cells.join("-")}`}
              >
                {cells.map((cell, cellIndex) => (
                  <span key={`${cellIndex}-${cell}`}>{cell}</span>
                ))}
                {actions ? (
                  <span className="row-actions">{actions}</span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function ActionForm({
  title,
  children,
  onSubmit,
  actionKey,
}: {
  title: string;
  children: ReactNode;
  onSubmit: (form: FormData) => Promise<unknown>;
  actionKey?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="action-form"
      data-action={actionKey}
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await onSubmit(new FormData(event.currentTarget));
          event.currentTarget.reset();
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>{title}</h3>
      <div className="form-grid">{children}</div>
      <button disabled={busy}>{busy ? "提交中" : "提交"}</button>
    </form>
  );
}

const SESSION_KEY = "lab-safety-session";
const THEME_KEY = "lab-safety-theme";
const LANGUAGE_KEY = "lab-safety-language";
const SOURCE_REPO = "https://github.com/LIghtJUNction/lab-safety-system";
type Language = "zh" | "en";
type ThemeMode = "light" | "dark";

const loginCopy = {
  zh: {
    notice: "请使用账号密码登录，或选择已配置的统一身份入口。",
    loggingIn: "正在登录",
    loginOk: "登录成功",
    loginFail: "登录失败",
    passkeyStart: "正在请求 Passkey",
    passkeyUnavailable: "当前浏览器不支持 Passkey",
    username: "用户名",
    password: "密码",
    passwordLogin: "账号密码登录",
    passkey: "使用 Passkey",
    sso: "SSO 单点登录",
    oauth: "OAuth 授权登录",
    ssoDisabled: "SSO 未配置",
    oauthDisabled: "OAuth 未配置",
    help: "首次部署请使用命令行工具创建超级管理员账号。命令行用户管理只允许超级管理员执行。",
    source: "源代码仓库",
    license:
      "开源许可：GPL-3.0-only。按现状提供，不附带任何担保；部署者需自行负责数据安全、账号策略和合规要求。",
    title: "登录系统",
    brandSub: "实验室安全管理",
  },
  en: {
    notice: "Sign in with password or a configured identity provider.",
    loggingIn: "Signing in",
    loginOk: "Signed in",
    loginFail: "Sign-in failed",
    passkeyStart: "Requesting passkey",
    passkeyUnavailable: "Passkey is not supported by this browser",
    username: "Username",
    password: "Password",
    passwordLogin: "Password sign in",
    passkey: "Use Passkey",
    sso: "SSO sign in",
    oauth: "OAuth sign in",
    ssoDisabled: "SSO not configured",
    oauthDisabled: "OAuth not configured",
    help: "Create the first super administrator with the CLI. CLI user management is restricted to super administrators.",
    source: "Source repository",
    license:
      "License: GPL-3.0-only. Provided as-is, without warranty. Operators are responsible for data security, account policy, and compliance.",
    title: "Sign in",
    brandSub: "Laboratory Safety",
  },
} satisfies Record<Language, Record<string, string>>;

const introSlides = {
  zh: [
    {
      title: "实验室安全隐患闭环平台",
      body: "统一处理隐患上报、责任认领、整改照片、培训考核、设备预约和报修工单。",
      stat: "隐患闭环",
    },
    {
      title: "管理端与普通用户分离",
      body: "管理员聚合统计、用户和台账；普通用户只处理自己的上报、认领与整改任务。",
      stat: "分角色视图",
    },
    {
      title: "支持多种身份入口",
      body: "账号密码、Passkey、SSO 和 OAuth 可按部署环境组合使用，超级管理员仍由 CLI 控制。",
      stat: "安全登录",
    },
  ],
  en: [
    {
      title: "Closed-loop lab safety platform",
      body: "Track hazards, ownership, remediation photos, training, bookings, and repair tickets in one workflow.",
      stat: "Hazard closure",
    },
    {
      title: "Separate admin and user views",
      body: "Administrators manage analytics and registries; normal users focus on their own reports and remediation tasks.",
      stat: "Role-based UI",
    },
    {
      title: "Multiple identity options",
      body: "Password, Passkey, SSO, and OAuth can be combined per deployment while super admins stay CLI-governed.",
      stat: "Secure sign-in",
    },
  ],
} satisfies Record<
  Language,
  Array<{ title: string; body: string; stat: string }>
>;

function readFederatedSession() {
  const marker = "#session=";
  if (!window.location.hash.startsWith(marker)) return null;
  try {
    const encoded = window.location.hash.slice(marker.length);
    const padded = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const bytes = Uint8Array.from(window.atob(padded), (char) =>
      char.charCodeAt(0),
    );
    const session = JSON.parse(new TextDecoder().decode(bytes)) as AuthSession;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    return session;
  } catch {
    return null;
  }
}

function readSession() {
  try {
    const federated = readFederatedSession();
    if (federated) {
      api.setAccessToken(federated.access_token);
      return federated;
    }
    const raw = window.localStorage.getItem(SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as AuthSession) : null;
    api.setAccessToken(session?.access_token ?? null);
    return session;
  } catch {
    api.setAccessToken(null);
    return null;
  }
}

function validateStrongPassword(password: string) {
  if (password.length < 12) return false;
  return (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function base64UrlToBuffer(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(window.atob(padded), (char) => char.charCodeAt(0))
    .buffer;
}

function bufferToBase64Url(value: ArrayBuffer) {
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function credentialToJson(value: unknown): unknown {
  if (value instanceof ArrayBuffer) return bufferToBase64Url(value);
  if (ArrayBuffer.isView(value)) {
    return bufferToBase64Url(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice()
        .buffer,
    );
  }
  if (Array.isArray(value)) return value.map(credentialToJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        credentialToJson(entry),
      ]),
    );
  }
  return value;
}

function publicKeyCredentialToJson(credential: Credential) {
  const publicKey = credential as PublicKeyCredential;
  return credentialToJson({
    id: publicKey.id,
    rawId: publicKey.rawId,
    type: publicKey.type,
    response: publicKey.response,
  });
}

function creationOptionsFromServer(
  options: PublicKeyCredentialCreationOptions,
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64UrlToBuffer(options.challenge as unknown as string),
    user: {
      ...options.user,
      id: base64UrlToBuffer(options.user.id as unknown as string),
    },
    excludeCredentials: options.excludeCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToBuffer(credential.id as unknown as string),
    })),
  };
}

function requestOptionsFromServer(
  options: PublicKeyCredentialRequestOptions,
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToBuffer(options.challenge as unknown as string),
    allowCredentials: options.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToBuffer(credential.id as unknown as string),
    })),
  };
}

function LoginScreen({
  authMethods,
  language,
  setLanguage,
  theme,
  setTheme,
  onLogin,
}: {
  authMethods: AuthMethods;
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  onLogin: (session: AuthSession) => void;
}) {
  const text = loginCopy[language];
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(text.notice);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNotice(text.notice);
  }, [text.notice]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setNotice(text.loggingIn);
    try {
      const session = await api.passwordLogin(username, password);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      api.setAccessToken(session.access_token);
      onLogin(session);
      setNotice(text.loginOk);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `${text.loginFail}: ${error.message}`
          : text.loginFail,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function passkeyLogin() {
    if (!window.PublicKeyCredential) {
      setNotice(text.passkeyUnavailable);
      return;
    }
    setSubmitting(true);
    setNotice(text.passkeyStart);
    try {
      const challenge = await api.passkeyLoginStart(username);
      const credential = await navigator.credentials.get({
        publicKey: requestOptionsFromServer(challenge.options),
      });
      if (!credential) throw new Error("Passkey cancelled");
      const session = await api.passkeyLoginFinish(
        challenge.challenge_id,
        publicKeyCredentialToJson(credential),
      );
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      api.setAccessToken(session.access_token);
      onLogin(session);
      setNotice(text.loginOk);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `${text.loginFail}: ${error.message}`
          : text.loginFail,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-carousel">
          {introSlides[language].map((slide) => (
            <article className="intro-slide" key={slide.title}>
              <div className="brand">
                <div className="brand-mark">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong>LabSafe</strong>
                  <span>{text.brandSub}</span>
                </div>
              </div>
              <span className="intro-stat">{slide.stat}</span>
              <h1>{slide.title}</h1>
              <p>{slide.body}</p>
            </article>
          ))}
          {introSlides[language].map((slide) => (
            <article className="intro-slide" key={`${slide.title}-copy`}>
              <div className="brand">
                <div className="brand-mark">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong>LabSafe</strong>
                  <span>{text.brandSub}</span>
                </div>
              </div>
              <span className="intro-stat">{slide.stat}</span>
              <h1>{slide.title}</h1>
              <p>{slide.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <div className="login-tools">
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
          >
            <Languages size={15} />
            {language === "zh" ? "English" : "中文"}
          </button>
        </div>
        <div className="login-title">
          <KeyRound size={26} />
          <div>
            <h2>{text.title}</h2>
            <p>{notice}</p>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>
            {text.username}
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            {text.password}
            <span className="password-line">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="passkey-inline"
                disabled={submitting || !username.trim()}
                onClick={passkeyLogin}
              >
                <Fingerprint size={15} />
                {text.passkey}
              </button>
            </span>
          </label>
          <button disabled={submitting || !authMethods.password}>
            <LogIn size={17} />
            {submitting ? text.loggingIn : text.passwordLogin}
          </button>
        </form>

        <div className="federated-login">
          <button
            type="button"
            disabled={!authMethods.sso || !authMethods.sso_login_url}
            onClick={() =>
              authMethods.sso_login_url &&
              window.location.assign(authMethods.sso_login_url)
            }
          >
            {authMethods.sso ? text.sso : text.ssoDisabled}
          </button>
          <button
            type="button"
            disabled={!authMethods.oauth || !authMethods.oauth_login_url}
            onClick={() =>
              authMethods.oauth_login_url &&
              window.location.assign(authMethods.oauth_login_url)
            }
          >
            {authMethods.oauth ? text.oauth : text.oauthDisabled}
          </button>
        </div>

        <p className="login-help">{text.help}</p>
        <div className="login-legal">
          <a href={SOURCE_REPO} target="_blank" rel="noreferrer">
            <Github size={15} />
            {text.source}
          </a>
          <span>{text.license}</span>
        </div>
      </section>
    </main>
  );
}

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
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hazards, setHazards] = useState<SafetyHazard[]>([]);
  const [session, setSession] = useState<AuthSession | null>(() =>
    readSession(),
  );
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
      const canManageUsers =
        session?.user.role === "admin" || session?.user.role === "super_admin";
      const [
        nextStats,
        nextAnalytics,
        nextHazardAnalytics,
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
    void api
      .authMethods()
      .then(setAuthMethods)
      .catch(() => undefined);
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
      if (!password) {
        throw new Error("password 不能为空");
      }
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

  async function ensureUserAndEquipment() {
    const device =
      equipment[0] ??
      (isAdmin
        ? await api.createEquipment({
            asset_code: `EQ-${Date.now().toString().slice(-6)}`,
            name: "临时设备",
            lab_name: "公共实验平台",
            status: "available",
            owner: session?.user.display_name ?? null,
          })
        : null);
    if (!device) {
      throw new Error("当前没有可预约或报修的设备，请联系管理员先登记设备");
    }
    return { userId: session!.user.id, equipmentId: device.id };
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
    return users[0] ?? api.createUser();
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
              <button
                className={active === item.label ? "active" : ""}
                key={item.label}
                onClick={() => setActive(item.label)}
              >
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
            <strong>
              {session.user.role === "super_admin"
                ? "超级管理员"
                : isAdmin
                  ? "管理员"
                  : "普通用户"}
            </strong>
            <button onClick={() => withAction("绑定 Passkey", bindPasskey)}>
              <Fingerprint size={16} />
              Passkey
            </button>
            <button
              onClick={() => {
                api.setAccessToken(null);
                window.localStorage.removeItem(SESSION_KEY);
                setSession(null);
              }}
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
          <label className="search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索法规、案例、设备"
            />
          </label>
        </header>

        <section className="metrics">
          <Metric
            label="法规条例"
            value={`${stats?.regulation_count ?? 0}`}
            trend="支持上传、查询和分类管理"
          />
          <Metric
            label="培训通过率"
            value={`${Math.round((stats?.exam_pass_rate ?? 0) * 100)}%`}
            trend={`${stats?.training_count ?? 0} 个培训项目`}
          />
          <Metric
            label="设备数量"
            value={`${stats?.equipment_count ?? 0}`}
            trend="支持查询、预约和报修"
          />
          <Metric
            label={isAdmin ? "隐患闭环" : "我的隐患"}
            value={`${hazards.length}`}
            trend={isAdmin ? "问题照片、认领、整改照片" : "上报和整改任务"}
          />
        </section>

        <section className="content-grid">
          {showAnalytics ? (
            <section className="panel analysis">
              <div className="panel-title">
                <h2>{isAdmin ? "事故案例分析" : "我的隐患状态"}</h2>
                <button onClick={exportAnalytics}>
                  <Download size={15} />
                  导出
                </button>
              </div>
              <div className="bars">
                {(isAdmin ? incidentBars : hazardAnalytics.by_status).map(
                  (item, index) => (
                    <div className="bar-line" key={item.name}>
                      <span>{item.name}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.max(item.count * 18, item.count ? 16 : 4)}%`,
                            background: [
                              "#d97706",
                              "#0f766e",
                              "#475569",
                              "#dc2626",
                            ][index % 4],
                          }}
                        />
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {showTrainings ? (
            <section className="panel training">
              <BookOpenCheck size={28} />
              <h2>培训与考核</h2>
              <strong>{Math.round((stats?.exam_pass_rate ?? 0) * 100)}%</strong>
              <p>
                当前已创建 {stats?.training_count ?? 0}{" "}
                个培训项目，考试结果会实时进入统计。
              </p>
              {isAdmin ? (
                <button
                  onClick={() =>
                    document
                      .querySelector('[data-action="training"]')
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  创建培训
                </button>
              ) : (
                <button
                  onClick={() =>
                    withAction("登记考核通过", async () => {
                      const ids = await ensureTrainingAndUser();
                      return api.createExamResult(ids.trainingId, ids.userId);
                    })
                  }
                >
                  登记考核通过
                </button>
              )}
            </section>
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

        <section className="quick-actions">
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
              <input name="title" placeholder="法规标题" />
              <input
                name="regulation_type"
                placeholder="类型"
                defaultValue="regulation"
              />
              <input
                name="issuing_authority"
                placeholder="发布单位"
                defaultValue="安全办公室"
              />
              <input name="effective_date" type="date" />
              <input name="summary" placeholder="摘要" />
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
                  }),
                )
              }
            >
              <input name="title" placeholder="案例标题" />
              <input name="lab_name" placeholder="实验室" />
              <input
                name="occurred_on"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
              <input
                name="severity"
                placeholder="严重程度"
                defaultValue="medium"
              />
              <input name="category" placeholder="分类" />
              <input name="root_cause" placeholder="根因" />
              <input name="corrective_actions" placeholder="整改措施" />
            </ActionForm>
          ) : null}
          {showHazards ? (
            <ActionForm
              title="上报隐患"
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
              <input name="title" placeholder="隐患标题" />
              <input name="lab_name" placeholder="实验室" />
              <input name="category" placeholder="分类" />
              <input name="description" placeholder="问题描述" />
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
              <input name="title" placeholder="培训标题" />
              <input
                name="target_role"
                placeholder="目标角色"
                defaultValue="researcher"
              />
              <input name="status" placeholder="状态" defaultValue="active" />
              <input name="starts_on" type="date" />
              <input
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
              <input name="asset_code" placeholder="资产编号" />
              <input name="name" placeholder="设备名称" />
              <input name="lab_name" placeholder="实验室" />
              <input
                name="status"
                placeholder="状态"
                defaultValue="available"
              />
              <input name="owner" placeholder="负责人" />
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
              <select name="equipment_id" defaultValue={equipment[0]?.id ?? ""}>
                <option value="" disabled>
                  选择设备
                </option>
                {equipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input name="starts_at" type="datetime-local" />
              <input name="ends_at" type="datetime-local" />
              <input name="purpose" placeholder="用途" />
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
              <select name="equipment_id" defaultValue={equipment[0]?.id ?? ""}>
                <option value="" disabled>
                  选择设备
                </option>
                {equipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input name="description" placeholder="故障描述" />
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
              <select name="training_id" defaultValue={trainings[0]?.id ?? ""}>
                <option value="" disabled>
                  选择培训
                </option>
                {trainings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <input
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
              <input name="username" placeholder="用户名" />
              <input name="display_name" placeholder="显示名" />
              <input name="email" type="email" placeholder="邮箱" />
              <select name="role" defaultValue="researcher">
                <option value="researcher">普通用户</option>
                <option value="admin">管理员</option>
              </select>
              <select name="auth_provider" defaultValue="password">
                <option value="password">账号密码</option>
                <option value="sso">SSO</option>
                <option value="oauth">OAuth</option>
              </select>
              <input name="department" placeholder="部门/实验室" />
              <input
                name="password"
                type="password"
                placeholder="强密码，密码登录必填"
                autoComplete="new-password"
              />
            </ActionForm>
          ) : null}
          {showHazards ? (
            <button onClick={() => withAction("责任认领", claimFirstHazard)}>
              <FlaskConical size={16} />
              责任认领
            </button>
          ) : null}
          {isAdmin && showRegulations ? (
            <label className="upload-button">
              <ClipboardList size={16} />
              上传法规文件
              <input
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    void withAction("上传法规文件", () =>
                      api.uploadRegulation(file),
                    );
                }}
              />
            </label>
          ) : null}
          {isAdmin && showIncidents ? (
            <label className="upload-button">
              <AlertTriangle size={16} />
              上传案例附件
              <input
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    void withAction("上传案例附件", () =>
                      api.uploadIncident(file),
                    );
                }}
              />
            </label>
          ) : null}
          {showHazards ? (
            <label className="upload-button">
              <ShieldCheck size={16} />
              上传问题照片
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    void withAction("上传问题照片并上报隐患", () =>
                      createHazardWithOptionalPhoto(file),
                    );
                }}
              />
            </label>
          ) : null}
          {showHazards ? (
            <label className="upload-button">
              <Wrench size={16} />
              上传整改照片
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    void withAction("上传整改照片", () =>
                      remediateFirstHazard(file),
                    );
                }}
              />
            </label>
          ) : null}
        </section>
      </section>
    </main>
  );
}
