import { ChevronDown } from "lucide-react";
import type { Language } from "../../lib/types";

type LoginBannerNoticeProps = {
  expanded: boolean;
  language: Language;
  onToggle: () => void;
  onOpenConfig: () => void;
  onReset: () => void;
};

export function LoginBannerNotice({
  expanded,
  language,
  onToggle,
  onOpenConfig,
  onReset,
}: LoginBannerNoticeProps) {
  const isEn = language === "en";

  return (
    <div className="mt-4 mb-2 rounded-xl border border-stone-200 bg-stone-50/70 dark:border-stone-700 dark:bg-stone-900/50">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
      >
        <span>
          {isEn
            ? "Login page copy is stored in the backend"
            : "登录页自定义文案已接入后端存储"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-stone-200 px-4 py-3 text-sm dark:border-stone-700">
          <span className="mr-2">
            {isEn
              ? "Login page carousel copy now persists in backend storage."
              : "登录页自定义文案已接入后端存储。"}
          </span>
          <button
            onClick={onOpenConfig}
            className="underline text-amber-600 dark:text-amber-400"
          >
            {isEn ? "Edit carousel titles in global settings" : "前往全局配置编辑轮播标题/副标题"}
          </button>
          <span className="mx-2 text-stone-400">·</span>
          <button onClick={onReset} className="underline text-amber-600 dark:text-amber-400">
            {isEn ? "Reset defaults" : "重置默认"}
          </button>
        </div>
      )}
    </div>
  );
}
