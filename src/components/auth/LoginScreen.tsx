import {
  Fingerprint,
  Github,
  KeyRound,
  Languages,
  Lock,
  LogIn,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, AuthMethods, AuthSession, getApiBase, setApiBase, getDbUrl, setDbUrl } from "../../api";
import {
  creationOptionsFromServer,
  publicKeyCredentialToJson,
  requestOptionsFromServer,
} from "../../lib/auth";
import { loginCopy, SESSION_KEY, SOURCE_REPO } from "../../lib/constants";
import { btnGhost, linkMuted } from "../../lib/theme";
import { Language, ThemeMode } from "../../lib/types";
import { AsciiBurn } from "../ui/AsciiBurn";
import { LoginCarousel } from "./LoginCarousel";

export function LoginScreen({
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

  // Runtime config support for separated deployment (frontend served separately from backend)
  const [apiBaseInput, setApiBaseInput] = useState(getApiBase());
  const [dbUrlInput, setDbUrlInput] = useState(getDbUrl());

  // Advanced config collapsed by default
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isDark = theme === "dark";

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

  // Flame as entire subtle background.
  // Warm ambient embers, low enough to never hurt reading, but present as requested.
  const FlameBackground = (
    <AsciiBurn
      bare
      cols={180}
      rows={45}
      opacity={0.09}
    />
  );

  const toggleClass = isDark
    ? "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-black/60 hover:text-white active:scale-[0.985]"
    : "inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-700 backdrop-blur transition hover:bg-white hover:text-stone-900 active:scale-[0.985]";

  return (
    <main className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-[#0a0908] text-white' : 'bg-stone-100 text-stone-900'}`}>
      {/* The flame as the entire background — subtle, warm, doesn't affect reading */}
      {isDark && FlameBackground}

      {/* Light veil so everything stays highly legible */}
      <div className={`pointer-events-none absolute inset-0 z-0 ${isDark ? 'bg-[#0a0908]/70' : 'bg-stone-100/30'}`} />

      {/* Top-right functional toggles */}
      <div className="absolute right-6 top-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={toggleClass}
          aria-label="切换主题"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
          className={toggleClass}
          aria-label="切换语言"
        >
          <Languages size={15} />
          <span className="hidden sm:inline">{language === "zh" ? "EN" : "中文"}</span>
        </button>
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1180px] grid-cols-1 gap-x-8 px-8 lg:grid-cols-12 lg:items-center lg:px-10">
        {/* LEFT: Clean, narrative hero with the rotating intro (人文故事感) */}
        <div className={`flex flex-col justify-center py-12 lg:col-span-7 lg:py-16 ${isDark ? 'text-white' : 'text-stone-900'}`}>
          {/* Single top logo - only once */}
          <div className="mb-6 flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ${isDark ? 'bg-white/10 text-white ring-white/15' : 'bg-stone-800 text-white ring-stone-700'}`}>
              <ShieldCheck size={18} />
            </div>
            <div className={`text-sm font-medium tracking-tight ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
              LabSafe <span className={isDark ? 'text-white/40' : 'text-stone-500'}>· 实验室安全管理</span>
            </div>
          </div>

          {/* The carousel now renders cleanly as one elegant rotating story block */}
          <div className="max-w-[520px]">
            <LoginCarousel language={language} isDark={isDark} />
          </div>
        </div>

        {/* RIGHT: The login form card — keep it refined */}
        <div className="flex items-center justify-center py-8 lg:col-span-5 lg:justify-end lg:py-0">
          {/* White "sunken window" card with strong 3D / inset depth */}
          <div className="w-full max-w-[360px] rounded-3xl border border-[#e5e1d8] bg-[#f9f6f0] p-8 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_12px_35px_-8px_rgba(0,0,0,0.14),0_30px_80px_-15px_rgba(0,0,0,0.12),inset_0_1.5px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.07),inset_1px_0_0_rgba(255,255,255,0.6)]">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-amber-500">
                <KeyRound size={17} />
                <span className="text-[10px] font-medium tracking-[2px] uppercase text-stone-500">Secure Access</span>
              </div>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-stone-900">{text.title}</h1>
              <p className="mt-2 text-sm text-stone-600">{notice}</p>
            </div>

            {/* Advanced deployment config - collapsed by default */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center justify-between text-xs text-stone-500 hover:text-stone-700"
              >
                <span>高级配置（前后端分离部署时使用）</span>
                <span>{showAdvanced ? '收起 ▲' : '展开 ▼'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-2 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-stone-500 mb-0.5">后端地址（默认 /api/v1）</label>
                      <input
                        value={apiBaseInput}
                        onChange={(e) => {
                          setApiBaseInput(e.target.value);
                          setApiBase(e.target.value);
                        }}
                        placeholder="/api/v1 或 http://backend:8080/api/v1"
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 mb-0.5">数据库地址（后端使用，可选）</label>
                      <input
                        value={dbUrlInput}
                        onChange={(e) => {
                          setDbUrlInput(e.target.value);
                          setDbUrl(e.target.value);
                        }}
                        placeholder="postgresql://user:pass@db:5432/lab_safety"
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
                    <span>留空使用默认（适合合并部署）</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setApiBaseInput('/api/v1');
                          setApiBase('/api/v1');
                          setDbUrlInput('');
                          setDbUrl('');
                        }}
                        className="text-amber-600 hover:underline"
                      >
                        重置默认
                      </button>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-amber-600 hover:underline"
                      >
                        应用并刷新
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-600">{text.username}</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                    className="w-full rounded-2xl border border-stone-200 bg-white pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-600">{text.password}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-stone-200 bg-white pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={passkeyLogin}
                    disabled={submitting || !username.trim()}
                    className="shrink-0 rounded-2xl border border-stone-200 bg-white px-3.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Fingerprint size={14} />
                    {text.passkey}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !authMethods.password}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 text-[15px] font-medium text-white transition active:scale-[0.985] hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn size={17} />
                {submitting ? text.loggingIn : text.passwordLogin}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-[10px] uppercase tracking-widest text-stone-400">其他入口</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!authMethods.sso || !authMethods.sso_login_url}
                onClick={() => authMethods.sso_login_url && window.location.assign(authMethods.sso_login_url)}
                className="rounded-2xl border border-stone-200 py-2 text-xs font-medium text-stone-500 transition hover:bg-stone-50 hover:text-stone-700 disabled:opacity-40"
              >
                {authMethods.sso ? text.sso : text.ssoDisabled}
              </button>
              <button
                type="button"
                disabled={!authMethods.oauth || !authMethods.oauth_login_url}
                onClick={() => authMethods.oauth_login_url && window.location.assign(authMethods.oauth_login_url)}
                className="rounded-2xl border border-stone-200 py-2 text-xs font-medium text-stone-500 transition hover:bg-stone-50 hover:text-stone-700 disabled:opacity-40"
              >
                {authMethods.oauth ? text.oauth : text.oauthDisabled}
              </button>
            </div>

            <div className="mt-5 text-xs leading-relaxed text-stone-500">
              {text.help}
            </div>

            <div className="mt-3 text-xs text-stone-400">
              <a
                href={SOURCE_REPO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-stone-600 transition"
              >
                <Github size={12} />
                {text.source}
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
