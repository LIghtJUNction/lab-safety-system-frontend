import {
  Link2,
  Trash2,
  Users,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  PlusCircle,
  Clock,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, Invitation, InvitedUser, Lab } from "../../api";
import { copyTextToClipboard } from "../../lib/clipboard";
import { invitationCopy } from "../../lib/constants";
import { Language } from "../../lib/types";

export function InvitationsManager({
  labId,
  isSystemAdmin,
  labs,
  language,
}: {
  labId: number | null;
  isSystemAdmin: boolean;
  labs: Lab[];
  language: Language;
}) {
  const copy = invitationCopy[language];
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Creation form state
  const [selectedLabId, setSelectedLabId] = useState<number>(() => {
    if (labId) return labId;
    if (labs.length > 0) return labs[0].id;
    return 0;
  });
  const [targetRole, setTargetRole] = useState<string>("lab_member");
  const [maxUses, setMaxUses] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [expiresDays, setExpiresDays] = useState<string>("7"); // default 7 days, or empty for never
  const [creating, setCreating] = useState(false);

  // Detail view state: which invite's registered users are we viewing
  const [viewingInviteUsers, setViewingInviteUsers] = useState<Invitation | null>(null);
  const [invitedUsersList, setInvitedUsersList] = useState<InvitedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Copy success indicator
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function loadInvitations() {
    setLoading(true);
    try {
      const data = await api.listInvitations(labId || undefined);
      setInvitations(data);
    } catch (err: any) {
      setError(err?.message || copy.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvitations();
  }, [labId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLabId) return;
    setCreating(true);
    setError(null);
    try {
      let expires_at: string | null = null;
      if (expiresDays) {
        const days = parseInt(expiresDays, 10);
        if (!isNaN(days) && days > 0) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          expires_at = d.toISOString();
        }
      }
      await api.createInvitation({
        lab_id: selectedLabId,
        target_role: targetRole,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        memo: memo.trim() || null,
        expires_at,
      });
      setMemo("");
      setMaxUses("");
      loadInvitations();
    } catch (err: any) {
      setError(err?.message || copy.createError);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm(copy.deleteConfirm)) {
      return;
    }
    try {
      await api.deleteInvitation(id);
      loadInvitations();
      if (viewingInviteUsers?.id === id) {
        setViewingInviteUsers(null);
      }
    } catch (err: any) {
      setError(err?.message || copy.deleteError);
    }
  }

  async function handleViewUsers(invite: Invitation) {
    setViewingInviteUsers(invite);
    setLoadingUsers(true);
    setError(null);
    try {
      const list = await api.getInvitationUsers(invite.id);
      setInvitedUsersList(list);
    } catch (err: any) {
      setInvitedUsersList([]);
      setError(`${copy.loadUsersError}: ${err?.message || String(err)}`);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleCopyLink(code: string) {
    const link = `${window.location.origin}/join/${code}`;
    try {
      await copyTextToClipboard(link);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setError(copy.copyFailed.replace("{link}", link));
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Creation form Card */}
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 dark:border-stone-800/80 dark:bg-stone-900/60 backdrop-blur">
        <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-white mb-6">
          <PlusCircle className="text-amber-500" size={20} />
          <span>{copy.createTitle}</span>
        </h3>

        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-6 md:grid-cols-4 items-end">
          {isSystemAdmin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500">{copy.targetLab}</label>
              <select
                required
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(Number(e.target.value))}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
              >
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">{copy.memberRole}</label>
            <select
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
            >
              <option value="lab_member">{copy.roleMember} (lab_member)</option>
              <option value="visitor">{copy.roleVisitor} (visitor)</option>
              <option value="lab_admin">{copy.roleAdmin} (lab_admin)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">{copy.maxUses}</label>
            <input
              type="number"
              min="1"
              placeholder={copy.maxUsesPlaceholder}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">{copy.expiry}</label>
            <select
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
            >
              <option value="1">{copy.day1}</option>
              <option value="7">{copy.day7}</option>
              <option value="30">{copy.day30}</option>
              <option value="">{copy.neverExpires}</option>
            </select>
          </div>

          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">{copy.memo}</label>
            <input
              type="text"
              placeholder={copy.memoPlaceholder}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={creating || !selectedLabId}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-amber-600 active:scale-[0.985] disabled:opacity-60"
            >
              {creating ? copy.creating : copy.createButton}
            </button>
          </div>
        </form>
      </div>

      {/* Invitations Table Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-stone-200/80 bg-white dark:border-stone-800/80 dark:bg-stone-900/60 backdrop-blur lg:col-span-2">
          <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-white">
              <Link2 className="text-amber-500" size={18} />
              <span>{copy.listTitle}</span>
            </h3>
            <span className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
              {copy.recordCount.replace("{count}", String(invitations.length))}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Link2 size={36} className="text-stone-300 dark:text-stone-700 mb-3" />
              <p className="text-sm text-stone-500 font-medium">{copy.emptyTitle}</p>
              <p className="text-xs text-stone-400 mt-1">{copy.emptyHint}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800 text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50/50 dark:bg-stone-950/20">
                    <th className="px-6 py-3.5">{copy.codeColumn}</th>
                    <th className="px-4 py-3.5">{copy.roleColumn}</th>
                    <th className="px-4 py-3.5">{copy.usageColumn}</th>
                    <th className="px-4 py-3.5">{copy.expiryColumn}</th>
                    <th className="px-6 py-3.5 text-right">{copy.actionsColumn}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
                  {invitations.map((invite) => {
                    const labName = labs.find((l) => l.id === invite.lab_id)?.name || copy.labFallback.replace("{id}", String(invite.lab_id));
                    const isCopied = copiedCode === invite.code;
                    const isExpired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
                    const isLimitReached = invite.max_uses ? invite.used_count >= invite.max_uses : false;

                    return (
                      <tr
                        key={invite.id}
                        className={`transition-colors hover:bg-stone-50/50 dark:hover:bg-stone-950/10 ${
                          viewingInviteUsers?.id === invite.id ? "bg-amber-500/5 dark:bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="px-6 py-4.5">
                          <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                            <span className="truncate max-w-[150px] font-mono" title={invite.code}>
                              {invite.code.slice(0, 8)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(invite.code)}
                              className="text-stone-400 hover:text-amber-500 transition-colors p-1"
                              title={copy.copyTitle}
                            >
                              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                          {isSystemAdmin && (
                            <div className="text-[11px] text-amber-500 font-semibold mt-0.5">
                              {labName}
                            </div>
                          )}
                          {invite.memo && (
                            <div className="text-xs text-stone-500 mt-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg inline-block">
                              {invite.memo}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4.5">
                          <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${
                            invite.target_role === "lab_admin"
                              ? "bg-rose-500/10 text-rose-500"
                              : invite.target_role === "lab_member"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-stone-500/10 text-stone-400"
                          }`}>
                            {invite.target_role}
                          </span>
                        </td>
                        <td className="px-4 py-4.5">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-stone-800 dark:text-stone-200">
                              {invite.used_count}
                            </span>
                            <span className="text-stone-400">/</span>
                            <span className="text-stone-500">
                              {invite.max_uses !== null ? invite.max_uses : "∞"}
                            </span>
                            {isLimitReached && (
                              <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-full font-semibold">
                                {copy.full}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4.5 text-xs text-stone-500">
                          {invite.expires_at ? (
                            <div className="flex items-center gap-1">
                              <Clock size={12} className={isExpired ? "text-rose-500" : "text-stone-400"} />
                              <span className={isExpired ? "text-rose-500 line-through" : ""}>
                                {new Date(invite.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400">{copy.neverExpires}</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewUsers(invite)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                            title={copy.viewUsersTitle}
                          >
                            <Users size={13} />
                            <span>{copy.viewUsers} ({invite.used_count})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(invite.id)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/20"
                            title={copy.deleteTitle}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invited Users Details Sidebar / Column */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 dark:border-stone-800/80 dark:bg-stone-900/60 backdrop-blur">
          {viewingInviteUsers ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-white">
                    {copy.detailTitle}
                  </h4>
                  <p className="text-xs font-mono text-stone-400 mt-1">
                    {copy.codePrefix}: {viewingInviteUsers.code.slice(0, 16)}...
                  </p>
                </div>
                <button
                  onClick={() => setViewingInviteUsers(null)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-semibold"
                >
                  {copy.close}
                </button>
              </div>

              {viewingInviteUsers.memo && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-xs text-amber-600 dark:text-amber-400">
                  <span className="font-semibold block mb-0.5">{copy.memoLabel}</span>
                  {viewingInviteUsers.memo}
                </div>
              )}

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <UserPlus size={13} />
                  <span>{copy.boundUsers.replace("{count}", String(invitedUsersList.length))}</span>
                </h5>

                {loadingUsers ? (
                  <div className="flex justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                  </div>
                ) : invitedUsersList.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-8">
                    {copy.noUsers}
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-[350px] overflow-y-auto pr-1">
                    {invitedUsersList.map((user) => (
                      <div key={user.id} className="py-3 flex flex-col gap-0.5 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
                            {user.display_name}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            ID #{user.id}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500">
                          {copy.username}: @{user.username}
                        </div>
                        <div className="text-xs text-stone-400 flex justify-between items-center mt-1">
                          <span>{user.email}</span>
                          <span className="text-[10px] flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center h-full">
              <Users size={32} className="text-stone-300 dark:text-stone-700 mb-3" />
              <p className="text-sm font-semibold text-stone-500">{copy.detailsEmptyTitle}</p>
              <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
                {copy.detailsEmptyHint}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
