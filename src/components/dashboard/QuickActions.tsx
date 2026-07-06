import { Lock, QrCode, Siren } from "lucide-react";

export function QuickActions({
  onLock,
  onReport,
  onScan,
}: {
  onLock: () => void;
  onReport: () => void;
  onScan: () => void;
}) {
  const actions = [
    {
      label: "一键锁定实验室",
      desc: "紧急封锁所有出入口",
      icon: Lock,
      onClick: onLock,
      style: "bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700",
    },
    {
      label: "一键上报异常",
      desc: "快速创建隐患工单",
      icon: Siren,
      onClick: onReport,
      style: "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
    },
    {
      label: "耗材扫码入库",
      desc: "扫描条码登记库存",
      icon: QrCode,
      onClick: onScan,
      style: "border border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-600",
    },
  ];

  return (
    <section className="rounded-2xl border border-stone-100 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80">
      <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">快捷操作</h2>
      <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">紧急响应与日常登记</p>
      <div className="mt-4 space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${action.style}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 dark:bg-white/10 dark:ring-white/10">
                <Icon size={17} />
              </span>
              <span>
                <span className="block text-sm font-medium">{action.label}</span>
                <span className="block text-[11px] opacity-70">{action.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}