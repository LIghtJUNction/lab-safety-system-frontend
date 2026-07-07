import { AlertCircle, RefreshCw, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type Lab, type LabUser, type User } from "../../api";
import type { Language } from "../../lib/types";

type LabRole = "lab_admin" | "lab_member" | "visitor";

const roleOptions: LabRole[] = ["lab_admin", "lab_member", "visitor"];

function roleLabel(role: string, language: Language) {
  const labels: Record<string, { zh: string; en: string }> = {
    lab_admin: { zh: "实验室管理员", en: "Lab admin" },
    lab_member: { zh: "实验室成员", en: "Lab member" },
    visitor: { zh: "访客", en: "Visitor" },
    system_admin: { zh: "系统管理员", en: "System admin" },
  };
  return labels[role]?.[language] ?? role;
}

function activeUsers(users: User[], members: LabUser[]) {
  const memberIds = new Set(members.map((member) => member.user_id));
  return users.filter((user) => user.is_active && !memberIds.has(user.id));
}

export function LabMembersManager({
  labs,
  language,
}: {
  labs: Lab[];
  language: Language;
}) {
  const isEn = language === "en";
  const [selectedLabId, setSelectedLabId] = useState(() => labs[0]?.id ?? 0);
  const [members, setMembers] = useState<LabUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(0);
  const [selectedRole, setSelectedRole] = useState<LabRole>("lab_member");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignableUsers = useMemo(
    () => activeUsers(users, members),
    [users, members],
  );

  useEffect(() => {
    if (!selectedLabId && labs.length > 0) {
      setSelectedLabId(labs[0].id);
    }
  }, [labs, selectedLabId]);

  useEffect(() => {
    if (!selectedLabId) return;
    void loadData();
  }, [selectedLabId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [nextMembers, nextUsers] = await Promise.all([
        api.listLabUsers(selectedLabId),
        api.users(),
      ]);
      setMembers(nextMembers);
      setUsers(nextUsers);
      setSelectedUserId(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEn
            ? "Failed to load lab members"
            : "加载实验室成员失败",
      );
    } finally {
      setLoading(false);
    }
  }

  async function assignMember(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedLabId || !selectedUserId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const assigned = await api.assignLabUser(selectedLabId, {
        user_id: selectedUserId,
        lab_role: selectedRole,
      });
      setMembers((prev) => [
        ...prev.filter((m) => m.user_id !== assigned.user_id),
        assigned,
      ]);
      setSelectedUserId(0);
      setMessage(isEn ? "Member assigned." : "成员已分配。");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEn
            ? "Assign failed"
            : "分配失败",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(member: LabUser) {
    if (
      !window.confirm(
        isEn ? "Remove this lab member?" : "确定移除此实验室成员？",
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.removeLabUser(selectedLabId, member.user_id);
      setMembers((prev) =>
        prev.filter((item) => item.user_id !== member.user_id),
      );
      setMessage(isEn ? "Member removed." : "成员已移除。");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEn
            ? "Remove failed"
            : "移除失败",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900/70">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-100">
            <Users size={18} className="text-amber-500" />
            {isEn ? "Lab members" : "实验室成员"}
          </h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {isEn
              ? "Assign existing users to labs and manage lab roles."
              : "将已有用户分配到实验室并管理实验室角色。"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading || !selectedLabId}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {isEn ? "Refresh" : "刷新"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(180px,260px)_1fr]">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-stone-500">
          {isEn ? "Lab" : "实验室"}
          <select
            value={selectedLabId}
            onChange={(event) => setSelectedLabId(Number(event.target.value))}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          >
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name}
              </option>
            ))}
          </select>
        </label>

        <form
          onSubmit={assignMember}
          className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
        >
          <select
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(Number(event.target.value))}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          >
            <option value={0}>
              {isEn ? "Select active user" : "选择启用用户"}
            </option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.display_name} · {user.email}
              </option>
            ))}
          </select>
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as LabRole)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role, language)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || !selectedUserId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-amber-600 disabled:opacity-50"
          >
            <UserPlus size={15} />
            {isEn ? "Assign" : "分配"}
          </button>
        </form>
      </div>

      {(error || message) && (
        <p
          className={`mt-4 flex items-center gap-2 text-sm ${error ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
        >
          {error ? <AlertCircle size={15} /> : null}
          {error || message}
        </p>
      )}

      <div className="mt-5 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-100 dark:divide-stone-800 dark:border-stone-800">
        {members.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone-400">
            {loading
              ? isEn
                ? "Loading members..."
                : "正在加载成员..."
              : isEn
                ? "No members in this lab."
                : "此实验室暂无成员。"}
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_160px_auto] md:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900 dark:text-stone-100">
                  {member.display_name}
                </p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                  {member.email} · {roleLabel(member.global_role, language)}
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                {roleLabel(member.lab_role, language)}
              </span>
              <button
                type="button"
                onClick={() => void removeMember(member)}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
              >
                <Trash2 size={13} />
                {isEn ? "Remove" : "移除"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
