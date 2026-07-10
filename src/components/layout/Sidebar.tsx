import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { nav } from "../../lib/constants";
import { cn } from "../../lib/cn";
import { navDisplayLabel } from "../../lib/navigation";
import type { Language } from "../../lib/types";

export function Sidebar({
  active,
  visibleNav,
  language,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  active: string;
  visibleNav: typeof nav;
  language: Language;
  onNavigate: (label: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <aside
      className={cn(
        "sidebar sticky top-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#171513] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_24px_70px_-36px_rgba(0,0,0,0.8)] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "brand flex items-center gap-3 py-6",
          collapsed ? "flex-col px-2" : "px-5",
        )}
      >
        <div className="brand-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-amber-400/12 text-amber-300 ring-1 ring-amber-300/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <ShieldCheck size={20} strokeWidth={1.6} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <strong className="block text-sm font-semibold tracking-wide">LabSafe</strong>
            <span className="text-[11px] text-stone-400">
              {language === "en" ? "Laboratory Safety" : "实验室安全管理"}
            </span>
          </div>
        )}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8 hover:text-white active:scale-95",
              collapsed && "mt-1",
            )}
            aria-label={
              collapsed
                ? language === "en"
                  ? "Expand sidebar"
                  : "展开侧边栏"
                : language === "en"
                  ? "Collapse sidebar"
                  : "收起侧边栏"
            }
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1.5 px-3 pb-6">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          const displayLabel = navDisplayLabel(item.label, language);
          return (
            <button
              type="button"
              className={cn(
                "relative flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-[0.95rem] px-3.5 py-2.5 text-sm font-medium transition-[transform,background-color,color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985]",
                isActive
                  ? "active bg-white/9 text-white ring-1 ring-white/10"
                  : "text-stone-400 hover:translate-x-0.5 hover:bg-white/5 hover:text-stone-200",
              )}
              key={item.label}
              onClick={() => onNavigate(item.label)}
              title={collapsed ? displayLabel : undefined}
            >
              {isActive ? (
                <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
              ) : null}
              <Icon size={17} strokeWidth={1.55} />
              {!collapsed && <span className="truncate">{displayLabel}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/8 px-5 py-4">
        {!collapsed && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-stone-500">
              Safety OS
            </p>
          <p className="mt-1 font-mono text-xs text-stone-400">
            v0.1.0 · {language === "en" ? "Safety management" : "安全管理"}
          </p>
          </>
        )}
      </div>
    </aside>
  );
}
