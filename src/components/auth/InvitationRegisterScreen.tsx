import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Languages,
  Moon,
  Sun,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, InvitationPublicInfo } from "../../api";
import { loginCopy } from "../../lib/constants";
import { Language, ThemeMode } from "../../lib/types";

export function InvitationRegisterScreen({
  code,
  language,
  setLanguage,
  theme,
  setTheme,
  onBackToLogin,
}: {
  code: string;
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  onBackToLogin: () => void;
}) {
  const text = loginCopy[language];
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<InvitationPublicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api.getPublicInvitation(code)
      .then((info) => {
        if (mounted) {
          setInviteInfo(info);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : language === "zh"
                ? "邀请链接已失效或不存在"
                : "Invitation link is invalid or expired",
          );
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [code]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(language === "zh" ? "两次输入的密码不一致" : "Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.registerByInvitation({
        code,
        username,
        display_name: displayName,
        email,
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || (language === "zh" ? "注册失败，请稍后重试" : "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  }

  function roleLabel(role?: string) {
    if (language !== "zh") return role ?? "member";
    if (role === "lab_admin") return "管理员";
    if (role === "lab_member") return "普通成员";
    return "只读访客";
  }

  const toggleClass = isDark
    ? "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-black/60 hover:text-white active:scale-[0.985]"
    : "inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-700 backdrop-blur transition hover:bg-white hover:text-stone-900 active:scale-[0.985]";

  const inputClass = isDark
    ? "w-full rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-2.5 pl-10 text-sm text-white placeholder-stone-500 outline-none ring-1 ring-stone-800 focus:border-amber-500 focus:ring-amber-500"
    : "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 pl-10 text-sm text-stone-900 placeholder-stone-400 outline-none ring-1 ring-stone-200/50 focus:border-amber-500 focus:ring-amber-500";

  return (
    <main className={`relative flex min-h-screen items-center justify-center p-6 ${isDark ? "bg-[#0a0908] text-white" : "bg-stone-50 text-stone-900"}`}>
      {/* Veil to keep text highly legible */}
      <div className={`pointer-events-none absolute inset-0 z-0 ${isDark ? "bg-[#0a0908]/75" : "bg-stone-50/40"}`} />

      {/* Top-right functional toggles */}
      <div className="absolute right-6 top-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={toggleClass}
          aria-label={text.themeToggle}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
          className={toggleClass}
          aria-label={text.languageToggle}
        >
          <Languages size={15} />
          <span className="hidden sm:inline">{language === "zh" ? "EN" : "中文"}</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ${isDark ? "bg-white/10 text-white ring-white/15" : "bg-stone-800 text-white ring-stone-700"}`}>
            <ShieldCheck size={18} />
          </div>
          <div className="text-sm font-semibold tracking-tight">
            LabSafe <span className={isDark ? "text-white/40" : "text-stone-500"}>· {text.brandSub}</span>
          </div>
        </div>

        {/* Card Panel */}
        <div className={`w-full rounded-3xl border p-8 shadow-xl ${
          isDark
            ? "border-stone-800 bg-stone-950/80 backdrop-blur-md"
            : "border-[#e5e1d8] bg-[#f9f6f0]"
        }`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <p className="mt-4 text-sm text-stone-500">
                {language === "zh" ? "正在校验邀请链接..." : "Validating invitation link..."}
              </p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4 animate-scale-up">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {language === "zh" ? "注册成功！" : "Registration Success!"}
              </h2>
              <p className="text-sm text-stone-500 mb-6">
                {language === "zh"
                  ? "您的实验室账号已创建完毕，现在即可登录系统。"
                  : "Your laboratory account has been created successfully. You can log in now."}
              </p>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-600 active:scale-[0.985]"
              >
                {language === "zh" ? "立即登录" : "Log In Now"}
              </button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4">
                <ShieldCheck size={24} className="rotate-180" />
              </div>
              <h2 className="text-lg font-bold mb-2 text-rose-500">
                {language === "zh" ? "链接失效" : "Invalid Link"}
              </h2>
              <p className="text-sm text-stone-500 mb-6">
                {error}
              </p>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-300 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900 active:scale-[0.985]"
              >
                <ArrowLeft size={16} />
                {language === "zh" ? "返回登录" : "Back to Login"}
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-1 text-center">
                {language === "zh" ? "加入实验室" : "Join Laboratory"}
              </h2>
              <p className="text-xs text-stone-500 mb-6 text-center">
                {language === "zh"
                  ? `您被邀请加入「${inviteInfo?.lab_name}」担任「${roleLabel(inviteInfo?.target_role)}」`
                  : `Invited to join "${inviteInfo?.lab_name}" as "${roleLabel(inviteInfo?.target_role)}"`}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={language === "zh" ? "用户名 (用于登录)" : "Username"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={language === "zh" ? "显示姓名 (中文/拼音)" : "Display Name"}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder={language === "zh" ? "电子邮箱" : "Email Address"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder={language === "zh" ? "设置登录密码" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder={language === "zh" ? "确认登录密码" : "Confirm Password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-600 active:scale-[0.985] disabled:opacity-55"
                >
                  {submitting
                    ? (language === "zh" ? "正在提交..." : "Submitting...")
                    : (language === "zh" ? "创建账号并加入" : "Create Account & Join")}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-300 transition-colors"
                  >
                    <ArrowLeft size={12} />
                    {language === "zh" ? "已有账号？返回登录" : "Already have an account? Log In"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
