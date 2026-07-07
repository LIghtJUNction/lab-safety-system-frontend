import { Fingerprint, LogOut, Moon, Search, Sun } from "lucide-react";
import { AuthSession } from "../../api";
import { cn } from "../../lib/cn";
import { Language, ThemeMode } from "../../lib/types";

export function TopBar({
  pageTitle,
  pageCopy,
  notice,
  loading,
  session,
  isAdmin,
  language,
  query,
  theme,
  onQueryChange,
  onBindPasskey,
  onToggleTheme,
  onLogout,
  onRetry,
}: {
  pageTitle: string;
  pageCopy: string;
  notice: string;
  loading: boolean;
  session: AuthSession;
  isAdmin: boolean;
  language: Language;
  query: string;
  theme: ThemeMode;
  onQueryChange: (value: string) => void;
  onBindPasskey: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onRetry?: () => void;
}) {
  const roleLabel =
    session.user.role === "super_admin"
      ? language === "en" ? "Super admin" : "超级管理员"
      : isAdmin
        ? language === "en" ? "Admin" : "管理员"
        : language === "en" ? "User" : "普通用户";
  const failed = notice.includes("失败") || notice.toLowerCase().includes("failed");

  return (
    <header className="topbar space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 lg:text-2xl">
            {pageTitle}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
            {pageCopy}
          </p>
          <p
            className={cn(
              "status mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
              loading
                ? "loading bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30"
                : failed
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
            )}
          >
            {notice}
            {failed && onRetry && (
              <button
                onClick={onRetry}
                className="ml-2 text-[10px] underline hover:no-underline"
              >
                {language === "en" ? "Retry" : "重试"}
              </button>
            )}
          </p>
        </div>

        <div className="user-menu flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-sm transition-all dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 whitespace-nowrap">
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {session.user.display_name}
            </span>
            <span className="text-stone-400 dark:text-stone-500">·</span>
            <span className="text-stone-500 dark:text-stone-400">
              {roleLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            {theme === "light"
              ? language === "en" ? "Dark" : "暗色"
              : language === "en" ? "Light" : "亮色"}
          </button>
          <button
            type="button"
            onClick={onBindPasskey}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          >
            <Fingerprint size={15} />
            Passkey
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            <LogOut size={15} />
            {language === "en" ? "Sign out" : "退出"}
          </button>
        </div>
      </div>

      <label className="search relative block max-w-md">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={language === "en" ? "Search regulations, cases, equipment" : "搜索法规、案例、设备"}
          className="w-full rounded-xl border border-stone-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-stone-800 shadow-sm outline-none backdrop-blur-md transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-100 dark:focus:border-stone-500 dark:focus:ring-stone-700/40"
        />
      </label>
    </header>
  );
}
