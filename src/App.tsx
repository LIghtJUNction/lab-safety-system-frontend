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
import { useMemo, useState } from "react";

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

const regulations = [
  ["实验室安全准入管理办法", "制度", "安全办公室", "2026-07-01"],
  ["危化品储存规范", "标准", "资产与实验室处", "2026-06-18"],
  ["压力容器操作规程", "规程", "工程训练中心", "2026-06-02"],
];

const incidents = [
  { name: "危化品泄漏", count: 18, color: "#d97706" },
  { name: "用电隐患", count: 13, color: "#0f766e" },
  { name: "设备故障", count: 9, color: "#475569" },
  { name: "违规操作", count: 6, color: "#dc2626" },
];

const bookings = [
  ["09:00", "高压灭菌锅", "生物实验室 B", "已确认"],
  ["10:30", "气相色谱仪", "分析测试中心", "待审核"],
  ["14:00", "激光切割机", "工程实验室", "已确认"],
];

const repairs = [
  ["EQ-2048", "通风橱风速异常", "处理中"],
  ["EQ-1182", "离心机震动报警", "待派单"],
  ["EQ-3021", "纯水机水压不足", "已响应"],
];

const users = [
  ["林一", "安全管理员", "SSO", "在线"],
  ["陈老师", "实验室负责人", "OAuth", "在线"],
  ["赵同学", "研究人员", "账号密码", "待培训"],
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
        {rows.map((row) => (
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
  const visibleRegulations = useMemo(
    () => regulations.filter((item) => item.join("").includes(query.trim())),
    [query],
  );

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
          </div>
          <label className="search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索法规、案例、设备" />
          </label>
        </header>

        <section className="metrics">
          <Metric label="法规条例" value="128" trend="本月新增 12 条" />
          <Metric label="培训通过率" value="92%" trend="较上月 +4.8%" />
          <Metric label="设备可用率" value="86%" trend="17 台待维护" />
          <Metric label="风险闭环率" value="94%" trend="6 个工单待处理" />
        </section>

        <section className="content-grid">
          <section className="panel analysis">
            <div className="panel-title">
              <h2>事故案例分析</h2>
              <button>导出</button>
            </div>
            <div className="bars">
              {incidents.map((item) => (
                <div className="bar-line" key={item.name}>
                  <span>{item.name}</span>
                  <div>
                    <i style={{ width: `${item.count * 4}%`, background: item.color }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel training">
            <BookOpenCheck size={28} />
            <h2>培训与考核</h2>
            <strong>326 / 354</strong>
            <p>本周期已完成安全培训和考核，28 人待补考。</p>
            <button>安排补考</button>
          </section>

          <DataTable title="法规条例上传" rows={visibleRegulations} />
          <DataTable title="设备预约排程" rows={bookings} />
          <DataTable title="报修工单" rows={repairs} />
          <DataTable title="用户与登录方式" rows={users} />
        </section>

        <section className="quick-actions">
          {["上传法规", "录入事故案例", "创建培训", "预约设备", "提交报修"].map((item) => (
            <button key={item}>
              <FlaskConical size={16} />
              {item}
            </button>
          ))}
        </section>
      </section>
    </main>
  );
}
