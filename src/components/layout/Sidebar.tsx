import { ShieldCheck } from "lucide-react";
import { nav } from "../../lib/constants";
import { cn } from "../../lib/cn";

export function Sidebar({
  active,
  visibleNav,
  onNavigate,
}: {
  active: string;
  visibleNav: typeof nav;
  onNavigate: (label: string) => void;
}) {
  return (
    <aside className="sidebar hidden w-[240px] shrink-0 flex-col border-r border-slate-200/80 bg-slate-900 text-white lg:flex">
      <div className="brand flex items-center gap-3 px-5 py-6">
        <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <ShieldCheck size={20} strokeWidth={2} />
        </div>
        <div>
          <strong className="block text-sm font-semibold tracking-wide">LabSafe</strong>
          <span className="text-[11px] text-slate-400">实验室安全管理</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-6">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          return (
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "active bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
              key={item.label}
              onClick={() => onNavigate(item.label)}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Safety OS
        </p>
        <p className="mt-1 font-mono text-xs text-slate-400">v0.1.0 · 实时监控</p>
      </div>
    </aside>
  );
}