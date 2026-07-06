import { nav } from "../../lib/constants";
import { cn } from "../../lib/cn";

export function MobileNav({
  active,
  visibleNav,
  onNavigate,
}: {
  active: string;
  visibleNav: typeof nav;
  onNavigate: (label: string) => void;
}) {
  return (
    <nav className="sidebar-mobile -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.label;
        return (
          <button
            type="button"
            key={item.label}
            onClick={() => onNavigate(item.label)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-300",
              isActive
                ? "active bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700",
            )}
          >
            <Icon size={14} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}