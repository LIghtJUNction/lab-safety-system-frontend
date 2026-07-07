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
    <nav className="sidebar-mobile -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
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
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-300",
              isActive
                ? "active bg-stone-900 text-white shadow-md"
                : "bg-white text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:ring-stone-700",
            )}
          >
            <Icon size={14} />
            {displayLabel}
          </button>
        );
      })}
    </nav>
  );
}
