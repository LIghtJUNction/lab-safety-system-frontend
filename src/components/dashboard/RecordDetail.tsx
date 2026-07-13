import { useEffect, useState } from "react";
import { ArrowLeft, Paperclip, Undo2 } from "lucide-react";
import {
  api,
  type HazardStatusEvent,
  type Incident,
  type Regulation,
  type SafetyHazard,
} from "../../api";

type DetailKind = "regulation" | "incident" | "hazard";
type LoadedRecord =
  | { kind: "regulation"; value: Regulation }
  | { kind: "incident"; value: Incident }
  | { kind: "hazard"; value: SafetyHazard; history: HazardStatusEvent[] };

type RecordDetailProps = {
  id: number;
  kind: DetailKind;
  accessToken: string;
  language: "zh" | "en";
  canReopenHazard: boolean;
  onBack: () => void;
  onReopenHazard: (id: number) => Promise<void>;
};

export function RecordDetail({
  id,
  kind,
  accessToken,
  language,
  canReopenHazard,
  onBack,
  onReopenHazard,
}: RecordDetailProps) {
  const [record, setRecord] = useState<LoadedRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    let active = true;
    setRecord(null);
    setError(null);
    api.setAccessToken(accessToken);
    async function loadRecord(): Promise<LoadedRecord> {
      if (kind === "regulation") {
        return { kind, value: await api.getRegulation(id) };
      }
      if (kind === "incident") {
        return { kind, value: await api.getIncident(id) };
      }
      const [value, history] = await Promise.all([
        api.getHazard(id),
        api.hazardHistory(id),
      ]);
      return { kind, value, history };
    }
    void loadRecord()
      .then((value) => {
        if (active) {
          setRecord(value);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      });
    return () => {
      active = false;
    };
  }, [accessToken, id, kind, reloadKey]);

  async function reopenHazard() {
    if (
      !window.confirm(
        language === "en"
          ? "Reopen this closed hazard?"
          : "确认撤回闭环并恢复到待确认状态？",
      )
    ) {
      return;
    }
    setTransitioning(true);
    try {
      await onReopenHazard(id);
      setReloadKey((value) => value + 1);
    } catch {
      // The shared action wrapper surfaces the backend error in the top status.
    } finally {
      setTransitioning(false);
    }
  }

  if (error) {
    return (
      <section className="panel rounded-[1.55rem] p-6">
        <button type="button" className="text-sm underline" onClick={onBack}>
          {language === "en" ? "Back to list" : "返回列表"}
        </button>
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="panel rounded-[1.55rem] p-6" aria-busy="true">
        {language === "en" ? "Loading record…" : "正在加载记录…"}
      </section>
    );
  }

  return (
    <article className="panel rounded-[1.55rem] p-6 sm:p-8">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg text-sm text-stone-600 outline-none hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-stone-400 dark:hover:text-stone-100"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        {language === "en" ? "Back to list" : "返回列表"}
      </button>

      <header className="mt-6 border-b border-stone-200 pb-5 dark:border-stone-800">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
          {record.kind === "regulation"
            ? record.value.regulation_type
            : record.kind === "incident"
              ? record.value.severity
              : record.value.status}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-950 dark:text-stone-50">
          {record.value.title}
        </h1>
      </header>

      {record.kind === "regulation" ? (
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <DetailField
            label={language === "en" ? "Record ID" : "记录 ID"}
            value={record.value.id}
          />
          <DetailField
            label={language === "en" ? "Title" : "标题"}
            value={record.value.title}
          />
          <DetailField
            label={language === "en" ? "Regulation type" : "法规类型"}
            value={record.value.regulation_type}
          />
          <DetailField
            label={language === "en" ? "Issuing authority" : "发布机构"}
            value={record.value.issuing_authority}
          />
          <DetailField
            label={language === "en" ? "Effective date" : "生效日期"}
            value={record.value.effective_date ?? "-"}
          />
          <div className="sm:col-span-2">
            <DetailField
              label={language === "en" ? "Summary" : "摘要"}
              value={record.value.summary || "-"}
            />
          </div>
          <DetailField
            label={language === "en" ? "File URL" : "文件 URL"}
            value={record.value.file_url}
          />
          <DetailField
            label={language === "en" ? "Created at" : "创建时间"}
            value={record.value.created_at}
          />
        </dl>
      ) : record.kind === "incident" ? (
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <DetailField
            label={language === "en" ? "Record ID" : "记录 ID"}
            value={record.value.id}
          />
          <DetailField
            label={language === "en" ? "Lab ID" : "实验室 ID"}
            value={record.value.lab_id}
          />
          <DetailField
            label={language === "en" ? "Title" : "标题"}
            value={record.value.title}
          />
          <DetailField
            label={language === "en" ? "Laboratory" : "实验室"}
            value={record.value.lab_name}
          />
          <DetailField
            label={language === "en" ? "Severity" : "严重程度"}
            value={record.value.severity}
          />
          <DetailField
            label={language === "en" ? "Occurred on" : "发生日期"}
            value={record.value.occurred_on}
          />
          <DetailField
            label={language === "en" ? "Category" : "分类"}
            value={record.value.category}
          />
          <DetailField
            label={language === "en" ? "Root cause" : "根因"}
            value={record.value.root_cause}
          />
          <div className="sm:col-span-2">
            <DetailField
              label={language === "en" ? "Corrective actions" : "整改措施"}
              value={record.value.corrective_actions}
            />
          </div>
          <DetailField
            label={language === "en" ? "File URL" : "文件 URL"}
            value={record.value.file_url}
          />
          <DetailField
            label={language === "en" ? "Created at" : "创建时间"}
            value={record.value.created_at}
          />
        </dl>
      ) : (
        <HazardDetail
          record={record.value}
          history={record.history}
          language={language}
          canReopen={canReopenHazard}
          transitioning={transitioning}
          onReopen={() => void reopenHazard()}
        />
      )}

      {"file_url" in record.value && record.value.file_url ? (
        <a
          href={record.value.file_url}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-900 outline-none hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950/30"
        >
          <Paperclip size={16} />
          {language === "en" ? "Attachment" : "附件"}
        </a>
      ) : null}
    </article>
  );
}

function HazardDetail({
  record,
  history,
  language,
  canReopen,
  transitioning,
  onReopen,
}: {
  record: SafetyHazard;
  history: HazardStatusEvent[];
  language: "zh" | "en";
  canReopen: boolean;
  transitioning: boolean;
  onReopen: () => void;
}) {
  return (
    <>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <DetailField
          label={language === "en" ? "Record ID" : "记录 ID"}
          value={record.id}
        />
        <DetailField
          label={language === "en" ? "Lab ID" : "实验室 ID"}
          value={record.lab_id}
        />
        <DetailField
          label={language === "en" ? "Title" : "标题"}
          value={record.title}
        />
        <DetailField
          label={language === "en" ? "Laboratory" : "实验室"}
          value={record.lab_name}
        />
        <DetailField
          label={language === "en" ? "Category" : "分类"}
          value={record.category}
        />
        <DetailField
          label={language === "en" ? "Status" : "状态"}
          value={record.status}
        />
        <DetailField
          label={language === "en" ? "Reported by" : "上报人 ID"}
          value={record.reported_by}
        />
        <DetailField
          label={language === "en" ? "Responsible user ID" : "责任人 ID"}
          value={record.responsible_user_id}
        />
        <DetailField
          label={language === "en" ? "Created at" : "创建时间"}
          value={record.created_at}
        />
        <div className="sm:col-span-2">
          <DetailField
            label={language === "en" ? "Description" : "问题描述"}
            value={record.description}
          />
        </div>
        <DetailField
          label={language === "en" ? "Issue photo URL" : "问题照片 URL"}
          value={record.issue_photo_url}
        />
        <DetailField
          label={language === "en" ? "Remediation photo URL" : "整改照片 URL"}
          value={record.remediation_photo_url}
        />
        <div className="sm:col-span-2">
          <DetailField
            label={language === "en" ? "Remediation note" : "整改说明"}
            value={record.remediation_note}
          />
        </div>
      </dl>

      {record.issue_photo_url || record.remediation_photo_url ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {record.issue_photo_url ? (
            <EvidencePreview
              href={record.issue_photo_url}
              alt={language === "en" ? "Issue photo" : "问题照片"}
              linkLabel={language === "en" ? "Issue evidence" : "问题证据"}
            />
          ) : null}
          {record.remediation_photo_url ? (
            <EvidencePreview
              href={record.remediation_photo_url}
              alt={language === "en" ? "Remediation photo" : "整改照片"}
              linkLabel={
                language === "en" ? "Remediation evidence" : "整改证据"
              }
            />
          ) : null}
        </div>
      ) : null}

      {canReopen && record.status === "closed" ? (
        <button
          type="button"
          disabled={transitioning}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white outline-none hover:bg-stone-700 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          onClick={onReopen}
        >
          <Undo2 size={16} />
          {transitioning
            ? language === "en"
              ? "Reopening…"
              : "撤回中…"
            : language === "en"
              ? "Reopen hazard"
              : "撤回闭环"}
        </button>
      ) : null}

      <section className="mt-8 border-t border-stone-200 pt-6 dark:border-stone-800">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
          {language === "en" ? "Status history" : "状态历史"}
        </h2>
        <ol className="mt-4 space-y-3">
          {history.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm dark:border-stone-800"
            >
              <p className="history-transition font-medium text-stone-900 dark:text-stone-100">
                <span>{event.from_status ?? (language === "en" ? "Created" : "创建")}</span>{" → "}<span>{event.to_status}</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                <span className="history-actor">
                  {language === "en" ? "Actor" : "操作人"}: {event.actor_user_id != null ? `#${event.actor_user_id}` : "-"}
                </span>
                <time className="history-created-at" dateTime={event.created_at}>
                  {event.created_at}
                </time>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function EvidencePreview({
  href,
  alt,
  linkLabel,
}: {
  href: string;
  alt: string;
  linkLabel: string;
}) {
  return (
    <figure className="space-y-3">
      <img
        src={href}
        alt={alt}
        className="h-52 w-full rounded-2xl border border-stone-200 object-cover dark:border-stone-800"
      />
      <EvidenceLink href={href} label={linkLabel} />
    </figure>
  );
}

function EvidenceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-900 outline-none hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950/30"
    >
      <Paperclip size={16} />
      {label}
    </a>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-stone-900 dark:text-stone-100">
        {value === "" || value == null ? "-" : value}
      </dd>
    </div>
  );
}
