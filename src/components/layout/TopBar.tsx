import { Fingerprint, LogOut, Moon, Search, Sun } from "lucide-react";
import type { AuthSession, Lab } from "../../api";
import { cn } from "../../lib/cn";
import type { Language, ThemeMode } from "../../lib/types";
import { LabSwitcher } from "./LabSwitcher";

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
  labs,
  selectedLabId,
  currentLabRole,
  onQueryChange,
  onLabChange,
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
  labs: Lab[];
  selectedLabId: number | null;
  currentLabRole: string | null;
  onQueryChange: (value: string) => void;
  onLabChange: (labId: number) => void;
  onBindPasskey: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onRetry?: () => void;
}) {
  const isEn = language === "en";
  const roleLabel =
    session.user.role === "system_admin" || session.user.role === "super_admin"
      ? isEn
        ? "System admin"
        : "系统管理员"
      : currentLabRole === "lab_admin"
        ? isEn
          ? "Lab admin"
          : "实验室管理员"
        : currentLabRole === "lab_member"
          ? isEn
            ? "Lab member"
            : "实验室成员"
          : currentLabRole === "visitor"
            ? isEn
              ? "Visitor"
              : "访客"
            : isAdmin
              ? isEn
                ? "Admin"
                : "管理员"
              : isEn
                ? "User"
                : "普通用户";
  const failed = notice.includes("失败") || notice.toLowerCase().includes("failed");

  return (
    <header className="topbar space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
            {isEn ? "Operational workspace" : "运行控制台"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-stone-950 dark:text-stone-50 lg:text-[2rem] lg:leading-none">
              {pageTitle}
            </h1>
            {selectedLabId ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25">
                {labs.find((l) => l.id === selectedLabId)?.name ??
                  (isEn ? "Lab" : "实验室")}
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {pageCopy}
          </p>
          <p
            className={cn(
              "status mt-2.5 inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-medium",
              loading
                ? "loading bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30"
                : failed
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
            )}
          >
            <span className="truncate">{notice}</span>
            {failed && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="ml-2 shrink-0 text-[10px] underline hover:no-underline"
              >
                {isEn ? "Retry" : "重试"}
              </button>
            ) : null}
          </p>
        </div>

        <div className="user-menu surface-bezel flex max-w-full flex-wrap items-center gap-1.5 rounded-[1.25rem] p-1.5">
          <LabSwitcher
            labs={labs}
            selectedLabId={selectedLabId}
            language={language}
            onChange={onLabChange}
          />
          <div className="inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-[0.9rem] bg-white px-3 py-2 text-xs font-medium text-stone-700 ring-1 ring-stone-200/80 dark:bg-stone-800 dark:text-stone-300 dark:ring-white/8">
            <span className="truncate font-medium text-stone-800 dark:text-stone-200">
              {session.user.display_name}
            </span>
            <span className="text-stone-300 dark:text-stone-600">·</span>
            <span className="shrink-0 text-stone-500 dark:text-stone-400">{roleLabel}</span>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="surface-interactive inline-flex min-h-10 items-center gap-1.5 rounded-[0.9rem] bg-white px-3 py-2 text-xs font-medium text-stone-700 ring-1 ring-stone-200/80 dark:bg-stone-800 dark:text-stone-300 dark:ring-white/8"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            {theme === "light" ? (isEn ? "Dark" : "暗色") : isEn ? "Light" : "亮色"}
          </button>
          <button
            type="button"
            onClick={onBindPasskey}
            className="surface-interactive inline-flex min-h-10 items-center gap-1.5 rounded-[0.9rem] bg-white px-3 py-2 text-xs font-medium text-stone-700 ring-1 ring-stone-200/80 dark:bg-stone-800 dark:text-stone-300 dark:ring-white/8"
          >
            <Fingerprint size={15} />
            Passkey
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="surface-interactive inline-flex min-h-10 items-center gap-1.5 rounded-[0.9rem] bg-stone-900 px-3 py-2 text-xs font-medium text-white dark:bg-stone-100 dark:text-stone-900"
          >
            <LogOut size={15} />
            {isEn ? "Sign out" : "退出"}
          </button>
        </div>
      </div>

      <label className="search surface-bezel relative block max-w-xl rounded-[1.15rem] p-1">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={
            isEn
              ? "Search regulations, cases, equipment, hazards"
              : "搜索法规、案例、设备、隐患"
          }
          className="surface-core min-h-11 w-full rounded-[0.9rem] py-2.5 pl-10 pr-4 text-sm text-stone-800 outline-none transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-stone-400 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/12 dark:text-stone-100"
        />
      </label>
    </header>
  );
}
