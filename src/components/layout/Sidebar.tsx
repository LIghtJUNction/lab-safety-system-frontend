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
        "sidebar hidden shrink-0 flex-col border-r border-stone-200/80 bg-stone-900 text-white lg:flex transition-all duration-300",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      <div
        className={cn(
          "brand flex items-center gap-3 py-6",
          collapsed ? "flex-col px-2" : "px-5",
        )}
      >
        <div className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20">
          <ShieldCheck size={20} strokeWidth={2} />
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
              "rounded-lg p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-white",
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

      <nav className="flex-1 space-y-1 px-3 pb-6">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          const displayLabel = navDisplayLabel(item.label, language);
          return (
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "active bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                  : "text-stone-400 hover:bg-white/5 hover:text-stone-200",
              )}
              key={item.label}
              onClick={() => onNavigate(item.label)}
              title={collapsed ? displayLabel : undefined}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.75} />
              {!collapsed && <span className="truncate">{displayLabel}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 mt-auto px-5 py-4">
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
