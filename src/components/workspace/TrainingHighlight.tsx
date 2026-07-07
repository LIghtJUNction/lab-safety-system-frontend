import { BookOpenCheck } from "lucide-react";
import { DashboardStats } from "../../api";
import type { Language } from "../../lib/types";

export function TrainingHighlight({
  stats,
  isAdmin,
  onCreate,
  onRegister,
  language,
}: {
  stats: DashboardStats | null;
  isAdmin: boolean;
  onCreate: () => void;
  onRegister: () => void;
  language: Language;
}) {
  const passRate = Math.round((stats?.exam_pass_rate ?? 0) * 100);
  const isEn = language === "en";
  const trainingCount = stats?.training_count ?? 0;

  return (
    <section className="panel training relative overflow-hidden rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white shadow-sm">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-600/10 blur-2xl" />
      <BookOpenCheck size={28} className="text-stone-400" />
      <h2 className="mt-4 text-sm font-semibold text-stone-200">
        {isEn ? "Training and exams" : "培训与考核"}
      </h2>
      <strong className="mt-2 block font-mono text-4xl font-semibold tracking-tight">
        {passRate}%
      </strong>
      <p className="mt-2 text-sm text-stone-400">
        {isEn
          ? `${trainingCount} training programs are active, and exam results update analytics in real time.`
          : `当前已创建 ${trainingCount} 个培训项目，考试结果会实时进入统计。`}
      </p>
      {isAdmin ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-md"
        >
          {isEn ? "Create training" : "创建培训"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onRegister}
          className="mt-5 rounded-xl bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
        >
          {isEn ? "Record exam result" : "登记考核"}
        </button>
      )}
    </section>
  );
}
