import { ReactNode, useState } from "react";
import { Send } from "lucide-react";

export function ActionForm({
  title,
  children,
  onSubmit,
  actionKey,
}: {
  title: string;
  children: ReactNode;
  onSubmit: (form: FormData) => Promise<unknown>;
  actionKey?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await onSubmit(new FormData(event.currentTarget));
      event.currentTarget.reset();
      setMessage("创建成功！");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "提交失败";
      setMessage(`失败：${errMsg}`);
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="action-form rounded-2xl border border-stone-100 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900/80"
      data-action={actionKey}
      onSubmit={handleSubmit}
    >
      <h3 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
      <div className="form-grid grid gap-3 sm:grid-cols-2">
        {children}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
      >
        <Send size={15} />
        {busy ? "提交中" : "提交"}
      </button>
      {message && (
        <p className={`mt-2 text-xs ${message.includes("失败") ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {message}
        </p>
      )}
    </form>
  );
}