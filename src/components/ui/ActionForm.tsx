import { ReactNode, useState } from "react";
import { Send } from "lucide-react";
import { LANGUAGE_KEY } from "../../lib/constants";

function currentLanguage() {
  return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
}

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
 const [message, setMessage] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
 const language = currentLanguage();
 await onSubmit(new FormData(event.currentTarget));
 event.currentTarget.reset();
 setMessage({
   text: language === "en" ? "Created successfully." : "创建成功！",
   tone: "ok",
 });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
 const language = currentLanguage();
 const errMsg = error instanceof Error ? error.message : language === "en" ? "Submission failed" : "提交失败";
 setMessage({
   text: language === "en" ? `Failed: ${errMsg}` : `失败：${errMsg}`,
   tone: "error",
 });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setBusy(false);
    }
  };

  const language = currentLanguage();
  return (
    <form
      className="action-form rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-stone-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900/80 dark:hover:border-stone-700"
      data-action={actionKey}
      onSubmit={handleSubmit}
    >
      {title ? (
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h3>
      ) : null}
      <div className="form-grid grid gap-3 sm:grid-cols-2">{children}</div>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
      >
        <Send size={15} />
        {busy
          ? language === "en"
            ? "Submitting"
            : "提交中"
          : language === "en"
            ? "Submit"
            : "提交"}
      </button>
      {message ? (
        <p
          className={`mt-2 text-xs ${
            message.tone === "error"
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
