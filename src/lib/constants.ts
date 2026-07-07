import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Wrench,
} from "lucide-react";
import { Language } from "./types";

export const SESSION_KEY = "lab-safety-session";
export const THEME_KEY = "lab-safety-theme";
export const LANGUAGE_KEY = "lab-safety-language";
export const SOURCE_REPO = "https://github.com/LIghtJUNction/lab-safety-system";

const CUSTOM_SLIDES_KEY = "lab-safety-custom-slides";

export type CarouselSlide = {
  title: string;
  body: string;
  stat: string;
};

export function getCustomSlides(lang: Language): CarouselSlide[] | null {
  try {
    const raw = localStorage.getItem(CUSTOM_SLIDES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const val = parsed?.[lang];
    if (Array.isArray(val) && val.length > 0) {
      return val.map((s: any) => ({
        title: String(s.title || ""),
        body: String(s.body || ""),
        stat: String(s.stat || ""),
      }));
    }
    return null;
  } catch {
    return null;
  }
}

export function setCustomSlides(lang: Language, slides: CarouselSlide[]) {
  try {
    const raw = localStorage.getItem(CUSTOM_SLIDES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[lang] = slides;
    localStorage.setItem(CUSTOM_SLIDES_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function resetCustomSlides(lang?: Language) {
  try {
    if (lang) {
      const raw = localStorage.getItem(CUSTOM_SLIDES_KEY);
      if (raw) {
        const all = JSON.parse(raw);
        delete all[lang];
        localStorage.setItem(CUSTOM_SLIDES_KEY, JSON.stringify(all));
      }
    } else {
      localStorage.removeItem(CUSTOM_SLIDES_KEY);
    }
  } catch {
    // ignore
  }
}

export function getEffectiveSlides(lang: Language): CarouselSlide[] {
  const custom = getCustomSlides(lang);
  if (custom && custom.length) return custom;
  return introSlides[lang];
}

export const nav = [
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

export const loginCopy = {
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
    adminPasswordHint:
      "管理员密码不在页面展示。请到服务器终端执行以下命令生成并重置密码：",
    adminPasswordCommand:
      "lab-safety-system users set-password --actor admin --actor-password '<超级管理员强密码>' --username admin --generate-password true",
    help: "首次部署请使用命令行工具创建超级管理员账号。命令行用户管理只允许超级管理员执行。",
    source: "源代码仓库",
    license:
      "开源许可：AGPL-3.0-only。按现状提供，不附带任何担保；部署者需自行负责数据安全、账号策略和合规要求。",
    title: "登录系统",
    brandSub: "实验室安全管理",
    themeToggle: "切换主题",
    languageToggle: "切换语言",
    mobileLoginCta: "向上滑动或点击登录",
    closeLoginPanel: "关闭登录面板",
    otherEntries: "其他入口",
    advancedConfig: "高级配置（前后端分离部署时使用）",
    collapse: "收起",
    expand: "展开",
    backendAddress: "后端地址（默认 /api/v1）",
    backendAddressPlaceholder: "/api/v1 或 http://backend:8080/api/v1",
    backendAddressHint: "只配置后端 API 地址；数据库连接由后端环境变量管理",
    resetDefault: "重置默认",
    applyAndReload: "应用并刷新",
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
    adminPasswordHint:
      "Admin passwords are not shown in the browser. Run this command in the server terminal to generate and reset the password:",
    adminPasswordCommand:
      "lab-safety-system users set-password --actor admin --actor-password '<super-admin-password>' --username admin --generate-password true",
    help: "Create the first super administrator with the CLI. CLI user management is restricted to super administrators.",
    source: "Source repository",
    license:
      "License: AGPL-3.0-only. Provided as-is, without warranty. Operators are responsible for data security, account policy, and compliance.",
    title: "Sign in",
    brandSub: "Laboratory Safety",
    themeToggle: "Toggle theme",
    languageToggle: "Toggle language",
    mobileLoginCta: "Swipe up or click to login",
    closeLoginPanel: "Close sign-in panel",
    otherEntries: "Other entry points",
    advancedConfig: "Advanced configuration for separated deployment",
    collapse: "Collapse",
    expand: "Expand",
    backendAddress: "Backend API URL (default /api/v1)",
    backendAddressPlaceholder: "/api/v1 or http://backend:8080/api/v1",
    backendAddressHint: "Configure only the backend API URL. Database connectivity is managed by backend environment variables.",
    resetDefault: "Reset default",
    applyAndReload: "Apply and reload",
  },
} satisfies Record<Language, Record<string, string>>;

export const invitationCopy = {
  zh: {
    loadError: "加载邀请链接失败",
    createError: "创建邀请链接失败",
    deleteError: "删除邀请链接失败",
    loadUsersError: "加载已注册成员失败",
    deleteConfirm: "确定要撤销并删除该邀请链接吗？已注册的用户不会受到影响，但该链接将无法再被使用。",
    createTitle: "创建新邀请链接",
    targetLab: "目标实验室",
    memberRole: "成员角色",
    roleMember: "普通成员",
    roleVisitor: "只读访客",
    roleAdmin: "实验室管理员",
    maxUses: "注册人数限制（空表示无限制）",
    maxUsesPlaceholder: "例如 10",
    expiry: "有效期期限",
    day1: "1 天",
    day7: "7 天",
    day30: "30 天",
    neverExpires: "永久有效",
    memo: "备注信息（用途描述）",
    memoPlaceholder: "说明此邀请链接的发放范围，例如：2026届化学研究生入队邀请",
    creating: "正在生成...",
    createButton: "生成邀请链接",
    listTitle: "当前邀请链接列表",
    recordCount: "共 {count} 条记录",
    emptyTitle: "暂无活跃的邀请链接",
    emptyHint: "请使用上方表单创建第一个邀请链接",
    codeColumn: "链接/提取码",
    roleColumn: "角色",
    usageColumn: "使用限制/已用",
    expiryColumn: "过期时间",
    actionsColumn: "操作",
    copyTitle: "复制邀请注册完整链接",
    copyFailed: "复制失败，请手动复制：{link}",
    full: "满员",
    labFallback: "实验室 #{id}",
    viewUsersTitle: "查看已注册的特定用户",
    viewUsers: "查看人员",
    deleteTitle: "撤销并删除该链接",
    detailTitle: "已注册成员详情",
    codePrefix: "代码",
    close: "关闭",
    memoLabel: "链接备注：",
    boundUsers: "已绑定注册名单 ({count} 人)",
    noUsers: "暂无用户通过该邀请链接注册",
    username: "用户名",
    detailsEmptyTitle: "查看注册明细",
    detailsEmptyHint: "点击左侧列表中的“查看人员”按钮，即可在此处查看谁通过该特定的邀请码完成了注册与绑定。",
  },
  en: {
    loadError: "Failed to load invitation links",
    createError: "Failed to create invitation link",
    deleteError: "Failed to delete invitation link",
    loadUsersError: "Failed to load registered members",
    deleteConfirm: "Revoke and delete this invitation link? Registered users will remain, but this link can no longer be used.",
    createTitle: "Create invitation link",
    targetLab: "Target lab",
    memberRole: "Member role",
    roleMember: "Lab member",
    roleVisitor: "Read-only visitor",
    roleAdmin: "Lab administrator",
    maxUses: "Registration limit (blank means unlimited)",
    maxUsesPlaceholder: "e.g. 10",
    expiry: "Expiry",
    day1: "1 day",
    day7: "7 days",
    day30: "30 days",
    neverExpires: "Never expires",
    memo: "Memo",
    memoPlaceholder: "Describe who should receive this link, for example: 2026 chemistry graduate cohort",
    creating: "Generating...",
    createButton: "Generate invitation link",
    listTitle: "Current invitation links",
    recordCount: "{count} records",
    emptyTitle: "No active invitation links",
    emptyHint: "Use the form above to create the first invitation link",
    codeColumn: "Link/code",
    roleColumn: "Role",
    usageColumn: "Used/limit",
    expiryColumn: "Expires",
    actionsColumn: "Actions",
    copyTitle: "Copy full invitation registration link",
    copyFailed: "Copy failed. Copy manually: {link}",
    full: "Full",
    labFallback: "Lab #{id}",
    viewUsersTitle: "View users registered through this link",
    viewUsers: "View users",
    deleteTitle: "Revoke and delete this link",
    detailTitle: "Registered member details",
    codePrefix: "Code",
    close: "Close",
    memoLabel: "Link memo:",
    boundUsers: "Bound registrations ({count})",
    noUsers: "No users have registered through this invitation link",
    username: "Username",
    detailsEmptyTitle: "View registration details",
    detailsEmptyHint: "Select View users in the list to see who registered and joined through that specific invitation code.",
  },
} satisfies Record<Language, Record<string, string>>;

export const introSlides = {
  zh: [
    {
      title: "实验室安全管理平台",
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
