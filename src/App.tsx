import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShieldCheck,
  UserCog,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, Booking, DashboardStats, Equipment, IncidentAnalytics, Regulation, RepairTicket, Training, User } from "./api";

const nav = [
  { label: "总览", icon: LayoutDashboard },
  { label: "法规条例", icon: ClipboardList },
  { label: "事故案例", icon: AlertTriangle },
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

export function App() {
  const [active, setActive] = useState("总览");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("正在连接后端 API");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<IncidentAnalytics>({ by_category: [], by_severity: [] });
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  async function refresh(search = query) {
    setLoading(true);
    try {
      const [nextStats, nextAnalytics, nextRegulations, nextTrainings, nextEquipment, nextBookings, nextRepairs, nextUsers] =
        await Promise.all([
          api.dashboard(),
          api.incidentAnalytics(),
          api.regulations(search),
          api.trainings(),
          api.equipment(search),
          api.bookings(),
          api.repairs(),
          api.users(),
        ]);
      setStats(nextStats);
      setAnalytics(nextAnalytics);
      setRegulations(nextRegulations);
      setTrainings(nextTrainings);
      setEquipment(nextEquipment);
      setBookings(nextBookings);
      setRepairs(nextRepairs);
      setUsers(nextUsers);
      setNotice("已连接后端 API，数据来自 PostgreSQL");
    } catch (error) {
      setNotice(error instanceof Error ? `后端连接失败：${error.message}` : "后端连接失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh("");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

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
    const user = users[0] ?? (await api.createUser());
    const device = equipment[0] ?? (await api.createEquipment());
    return { userId: user.id, equipmentId: device.id };
  }

  async function ensureTrainingAndUser() {
    const user = users[0] ?? (await api.createUser());
    const training = trainings[0] ?? (await api.createTraining());
    return { userId: user.id, trainingId: training.id };
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
          {nav.map((item) => {
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
            <h1>实验室安全运营总览</h1>
            <p>统一管理法规条例、事故案例、培训考核、设备预约、报修工单和用户权限。</p>
            <p className={loading ? "status loading" : "status"}>{notice}</p>
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
          <Metric label="待处理工单" value={`${stats?.open_repair_count ?? 0}`} trend="按状态跟踪闭环" />
        </section>

        <section className="content-grid">
          <section className="panel analysis">
            <div className="panel-title">
              <h2>事故案例分析</h2>
              <button>导出</button>
            </div>
            <div className="bars">
              {incidentBars.map((item, index) => (
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
            <button onClick={() => withAction("创建培训", api.createTraining)}>创建培训</button>
          </section>

          <DataTable title="法规条例上传" rows={regulationRows} />
          <DataTable title="设备预约排程" rows={bookingRows} />
          <DataTable title="报修工单" rows={repairRows} />
          <DataTable title="用户与登录方式" rows={userRows} />
        </section>

        <section className="quick-actions">
          <button onClick={() => withAction("创建法规", api.createRegulation)}><FlaskConical size={16} />创建法规</button>
          <button onClick={() => withAction("录入事故案例", api.createIncident)}><FlaskConical size={16} />录入事故案例</button>
          <button onClick={() => withAction("登记考核通过", async () => { const ids = await ensureTrainingAndUser(); return api.createExamResult(ids.trainingId, ids.userId); })}><FlaskConical size={16} />登记考核通过</button>
          <button onClick={() => withAction("登记设备", api.createEquipment)}><FlaskConical size={16} />登记设备</button>
          <button onClick={() => withAction("创建设备预约", async () => { const ids = await ensureUserAndEquipment(); return api.createBooking(ids.equipmentId, ids.userId); })}><FlaskConical size={16} />预约设备</button>
          <button onClick={() => withAction("提交报修", async () => { const ids = await ensureUserAndEquipment(); return api.createRepair(ids.equipmentId, ids.userId); })}><FlaskConical size={16} />提交报修</button>
          <label className="upload-button">
            <ClipboardList size={16} />
            上传法规文件
            <input type="file" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void withAction("上传法规文件", () => api.uploadRegulation(file));
            }} />
          </label>
        </section>
      </section>
    </main>
  );
}
