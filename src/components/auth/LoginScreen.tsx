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
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { api, AuthMethods, AuthSession, getApiBase, setApiBase, type LoginCarouselSettings } from "../../api";
import {
  creationOptionsFromServer,
  publicKeyCredentialToJson,
  requestOptionsFromServer,
} from "../../lib/auth";
import { loginCopy, SESSION_KEY, SOURCE_REPO } from "../../lib/constants";
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

  // Advanced config collapsed by default
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Backend-driven carousel settings (persisted, public GET)
  const [carouselSettings, setCarouselSettings] = useState<LoginCarouselSettings | null>(null);

  // Mobile layout drawer controls
  const [showLoginMobile, setShowLoginMobile] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(max-width: 1023px)").matches,
  );
  const mobileLoginCtaRef = useRef<HTMLButtonElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const openMobileLogin = () => setShowLoginMobile(true);
  const closeMobileLogin = () => {
    setShowLoginMobile(false);
    window.requestAnimationFrame(() => mobileLoginCtaRef.current?.focus());
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - startY;
    if (deltaY < -40) {
      openMobileLogin();
    } else if (deltaY > 40) {
      closeMobileLogin();
    }
  };

  const isDark = theme === "dark";

  useEffect(() => {
    setNotice(text.notice);
  }, [text.notice]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const updateLayout = (event: MediaQueryListEvent) => setIsMobileLayout(event.matches);
    setIsMobileLayout(media.matches);
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (!isMobileLayout || !showLoginMobile) return;
    const frame = window.requestAnimationFrame(() => usernameInputRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileLogin();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileLayout, showLoginMobile]);

  // Fetch custom carousel from backend (works unauthenticated)
  useEffect(() => {
    let mounted = true;
    api.loginCarousel()
      .then((settings) => {
        if (mounted) setCarouselSettings(settings);
      })
      .catch(() => {
        // fallback to built-in (already handled in carousel)
      });
    return () => { mounted = false; };
  }, []);

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

  // Full-screen subtle flame background.
  // Visual meaning (see AsciiBurn.tsx): decorative safety posture heat pattern, not sensor data.
  // Dynamic fill ensures no blank/empty on the right. Very low opacity so it doesn't affect readability or UI.
  const FlameBackground = (
    <AsciiBurn
      bare
      cols={220}
      rows={60}
      opacity={0.07}
      isDark={isDark}
    />
  );

  const toggleClass = isDark
    ? "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-black/65 hover:text-white active:scale-[0.985]"
    : "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-stone-300/80 bg-white/85 px-4 py-2 text-xs font-medium text-stone-700 backdrop-blur-md transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-stone-900 active:scale-[0.985]";

  return (
    <main
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative min-h-[100dvh] overflow-hidden ${isDark ? 'bg-[#0a0908] text-white' : 'bg-[#f1eee7] text-stone-900'}`}
    >
      {/* The flame as the entire background — subtle, warm, doesn't affect reading */}
      {isDark && FlameBackground}

      {/* Veil to keep text highly legible over the flame */}
      <div className={`pointer-events-none absolute inset-0 z-0 ${isDark ? 'bg-[#0a0908]/75' : 'bg-stone-100/40'}`} />

      {/* Top-right functional toggles */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-5">
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

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[1240px] grid-cols-1 gap-x-10 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:px-10">
        {/* LEFT: Clean, narrative hero with the rotating intro (人文故事感) */}
        <div className={`flex flex-col justify-center pb-10 pt-24 lg:col-span-7 lg:py-16 ${isDark ? 'text-white' : 'text-stone-900'}`}>
          {/* Single top logo - only once */}
          <div className="mb-8 flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-[1rem] ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${isDark ? 'bg-white/8 text-amber-300 ring-white/12' : 'bg-stone-900 text-amber-300 ring-stone-700'}`}>
              <ShieldCheck size={19} strokeWidth={1.55} />
            </div>
            <div>
              <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-amber-300/70' : 'text-amber-700'}`}>
                Safety operations
              </div>
              <div className={`mt-0.5 text-sm font-medium tracking-tight ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                LabSafe <span className={isDark ? 'text-white/40' : 'text-stone-500'}>· {text.brandSub}</span>
              </div>
            </div>
          </div>

          {/* The carousel now renders cleanly as one elegant rotating story block */}
          <div className="max-w-[570px]">
            <LoginCarousel
              language={language}
              isDark={isDark}
              slidesOverride={carouselSettings ? carouselSettings[language] : undefined}
            />
          </div>

          {/* Mobile Swipe/Click to Login Hint */}
          <div className="mt-10 flex flex-col items-center justify-center lg:hidden">
            <button
              ref={mobileLoginCtaRef}
              type="button"
              onClick={openMobileLogin}
              className={`flex min-h-12 items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold tracking-wide ring-1 transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ${isDark ? 'bg-white/8 text-white/80 ring-white/12 hover:bg-white/12 hover:text-amber-300' : 'bg-white/75 text-stone-700 ring-stone-300/70 hover:bg-white hover:text-amber-700'}`}
            >
              <ChevronUp size={18} strokeWidth={1.55} />
              <span>{text.mobileLoginCta}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dim Backdrop when drawer is open */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            showLoginMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMobileLogin}
        />

        {/* RIGHT: The login form card — keep it refined */}
        <div className={`
          flex items-center justify-center py-8 lg:col-span-5 lg:justify-end lg:py-0
          max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:w-full max-lg:max-w-none max-lg:p-0
          max-lg:transition-transform max-lg:duration-500 max-lg:ease-[cubic-bezier(0.22,1,0.36,1)]
          ${showLoginMobile ? 'max-lg:translate-y-0' : 'max-lg:translate-y-full'}
        `}
          ref={(node) => {
            if (node) node.inert = isMobileLayout && !showLoginMobile;
          }}
          role={isMobileLayout && showLoginMobile ? "dialog" : undefined}
          aria-modal={isMobileLayout && showLoginMobile ? true : undefined}
          aria-label={isMobileLayout && showLoginMobile ? text.title : undefined}
          aria-hidden={isMobileLayout && !showLoginMobile ? true : undefined}
        >
          {/* White "sunken window" card with strong 3D / inset depth */}
          <div className="w-full max-w-[390px] rounded-[2rem] border border-[#d8d2c8] bg-[#e9e4db] p-1.5 shadow-[0_26px_80px_-34px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.85)]
            max-lg:max-w-full max-lg:rounded-b-none max-lg:rounded-t-[2rem] max-lg:border-x-0 max-lg:border-b-0 max-lg:p-1.5 max-lg:pb-0 max-lg:shadow-[0_-20px_70px_-30px_rgba(0,0,0,0.5)]
          ">
            <div className="rounded-[calc(2rem-0.375rem)] border border-white/80 bg-[#fbf8f2] p-7 text-stone-900 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(41,37,36,0.06)] max-lg:rounded-b-none max-lg:pb-12 sm:p-8">
            {/* Close handle/indicator on mobile */}
            <div className="flex justify-center pb-4 -mt-2 lg:hidden">
              <button
                type="button"
                onClick={closeMobileLogin}
                className="flex min-h-11 flex-col items-center justify-center gap-1 text-stone-400 transition-colors hover:text-stone-600"
                aria-label={text.closeLoginPanel}
              >
                <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600 mb-1" />
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 text-amber-500">
                <KeyRound size={17} strokeWidth={1.55} />
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-500">Secure Access</span>
              </div>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-stone-900">{text.title}</h1>
              <p className="mt-2 text-sm text-stone-600">{notice}</p>
            </div>

            {/* Advanced deployment config - collapsed by default */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-xs text-stone-500 transition-colors duration-300 hover:bg-stone-100/70 hover:text-stone-700"
              >
                <span>{text.advancedConfig}</span>
                <span>{showAdvanced ? `${text.collapse} ▲` : `${text.expand} ▼`}</span>
              </button>

              {showAdvanced && (
                <div className="mt-2 rounded-[1rem] border border-stone-200/80 bg-stone-100/60 p-3 text-xs shadow-[inset_0_1px_2px_rgba(41,37,36,0.04)]">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-stone-500 mb-0.5">{text.backendAddress}</label>
                      <input
                        value={apiBaseInput}
                        onChange={(e) => {
                          setApiBaseInput(e.target.value);
                          setApiBase(e.target.value);
                        }}
                        placeholder={text.backendAddressPlaceholder}
                        className="min-h-10 w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs outline-none transition-[border-color,box-shadow] duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
<span>{text.backendAddressHint}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setApiBaseInput('/api/v1');
                          setApiBase('/api/v1');
                        }}
                        className="text-amber-600 hover:underline"
                      >
                        {text.resetDefault}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-amber-600 hover:underline"
                      >
                        {text.applyAndReload}
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
                    ref={usernameInputRef}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                    className="min-h-12 w-full rounded-[1rem] border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/12 placeholder:text-stone-400"
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
                      className="min-h-12 w-full rounded-[1rem] border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/12 placeholder:text-stone-400"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={passkeyLogin}
                    disabled={submitting || !username.trim()}
                    className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-[1rem] border border-stone-200 bg-white px-3.5 text-xs font-medium text-stone-600 transition-[transform,background-color,color] duration-300 hover:bg-stone-50 hover:text-stone-900 active:scale-[0.98] disabled:opacity-40"
                  >
                    <Fingerprint size={14} />
                    {text.passkey}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !authMethods.password}
                className="group mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-stone-800 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
                  <LogIn size={15} strokeWidth={1.55} />
                </span>
                {submitting ? text.loggingIn : text.passwordLogin}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-[10px] uppercase tracking-widest text-stone-400">{text.otherEntries}</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!authMethods.sso || !authMethods.sso_login_url}
                onClick={() => authMethods.sso_login_url && window.location.assign(authMethods.sso_login_url)}
                className="min-h-11 rounded-[0.95rem] border border-stone-200 py-2 text-xs font-medium text-stone-500 transition-[transform,background-color,color] duration-300 hover:bg-stone-50 hover:text-stone-700 active:scale-[0.98] disabled:opacity-40"
              >
                {authMethods.sso ? text.sso : text.ssoDisabled}
              </button>
              <button
                type="button"
                disabled={!authMethods.oauth || !authMethods.oauth_login_url}
                onClick={() => authMethods.oauth_login_url && window.location.assign(authMethods.oauth_login_url)}
                className="min-h-11 rounded-[0.95rem] border border-stone-200 py-2 text-xs font-medium text-stone-500 transition-[transform,background-color,color] duration-300 hover:bg-stone-50 hover:text-stone-700 active:scale-[0.98] disabled:opacity-40"
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
      </div>
    </main>
  );
}
