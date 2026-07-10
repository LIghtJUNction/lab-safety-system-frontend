import { nav } from "../../lib/constants";
import { cn } from "../../lib/cn";
import { navDisplayLabel } from "../../lib/navigation";
import type { Language } from "../../lib/types";

export function MobileNav({
  active,
  visibleNav,
  language,
  onNavigate,
}: {
  active: string;
  visibleNav: typeof nav;
  language: Language;
  onNavigate: (label: string) => void;
}) {
  return (
    <nav className="sidebar-mobile -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:hidden">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.label;
        const displayLabel = navDisplayLabel(item.label, language);
        return (
          <button
            type="button"
            key={item.label}
            onClick={() => onNavigate(item.label)}
            className={cn(
              "relative flex min-h-11 shrink-0 items-center gap-2 rounded-[0.95rem] px-4 py-2 text-xs font-medium transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97]",
              isActive
                ? "active bg-stone-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:bg-stone-100 dark:text-stone-900"
                : "bg-white/80 text-stone-600 ring-1 ring-stone-200/80 dark:bg-stone-900/80 dark:text-stone-400 dark:ring-white/10",
            )}
          >
            {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}
            <Icon size={15} strokeWidth={1.55} />
            {displayLabel}
          </button>
        );
      })}
    </nav>
  );
}
