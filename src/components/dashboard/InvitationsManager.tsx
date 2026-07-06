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
      setError(err?.message || "加载邀请链接失败");
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
      setError(err?.message || "创建邀请链接失败");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确定要撤销并删除该邀请链接吗？已注册的用户不会受到影响，但该链接将无法再被使用。")) {
      return;
    }
    try {
      await api.deleteInvitation(id);
      loadInvitations();
      if (viewingInviteUsers?.id === id) {
        setViewingInviteUsers(null);
      }
    } catch (err: any) {
      setError(err?.message || "删除邀请链接失败");
    }
  }

  async function handleViewUsers(invite: Invitation) {
    setViewingInviteUsers(invite);
    setLoadingUsers(true);
    try {
      const list = await api.getInvitationUsers(invite.id);
      setInvitedUsersList(list);
    } catch (err: any) {
      alert("加载已注册成员失败: " + (err?.message || String(err)));
    } finally {
      setLoadingUsers(false);
    }
  }

  function handleCopyLink(code: string) {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
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
          <span>创建新邀请链接</span>
        </h3>

        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-6 md:grid-cols-4 items-end">
          {isSystemAdmin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500">目标实验室</label>
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
            <label className="text-xs font-semibold text-stone-500">成员角色</label>
            <select
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
            >
              <option value="lab_member">普通成员 (lab_member)</option>
              <option value="visitor">只读访客 (visitor)</option>
              <option value="lab_admin">实验室管理员 (lab_admin)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">注册人数限制 (空表示无限制)</label>
            <input
              type="number"
              min="1"
              placeholder="例如 10"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">有效期期限</label>
            <select
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm dark:border-stone-800 dark:bg-stone-950 outline-none focus:border-amber-500"
            >
              <option value="1">1 天 (1 Day)</option>
              <option value="7">7 天 (7 Days)</option>
              <option value="30">30 天 (30 Days)</option>
              <option value="">永久有效 (Never Expires)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-500">备注信息 (Memo / 用途描述)</label>
            <input
              type="text"
              placeholder="说明此邀请链接的发放范围，例如：2026届化学研究生入队邀请"
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
              {creating ? "正在生成..." : "生成邀请链接"}
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
              <span>当前邀请链接列表</span>
            </h3>
            <span className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
              共 {invitations.length} 条记录
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Link2 size={36} className="text-stone-300 dark:text-stone-700 mb-3" />
              <p className="text-sm text-stone-500 font-medium">暂无活跃的邀请链接</p>
              <p className="text-xs text-stone-400 mt-1">请使用上方表单创建第一个邀请链接</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800 text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50/50 dark:bg-stone-950/20">
                    <th className="px-6 py-3.5">链接/提取码</th>
                    <th className="px-4 py-3.5">角色</th>
                    <th className="px-4 py-3.5">使用限制/已用</th>
                    <th className="px-4 py-3.5">过期时间</th>
                    <th className="px-6 py-3.5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
                  {invitations.map((invite) => {
                    const labName = labs.find((l) => l.id === invite.lab_id)?.name || `实验室 #${invite.lab_id}`;
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
                              title="复制邀请注册完整链接"
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
                                满员
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
                            <span className="text-stone-400">永久有效</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewUsers(invite)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                            title="查看已注册的特定用户"
                          >
                            <Users size={13} />
                            <span>查看人员 ({invite.used_count})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(invite.id)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/20"
                            title="撤销并删除该链接"
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
                    已注册成员详情
                  </h4>
                  <p className="text-xs font-mono text-stone-400 mt-1">
                    代码: {viewingInviteUsers.code.slice(0, 16)}...
                  </p>
                </div>
                <button
                  onClick={() => setViewingInviteUsers(null)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-semibold"
                >
                  关闭
                </button>
              </div>

              {viewingInviteUsers.memo && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-xs text-amber-600 dark:text-amber-400">
                  <span className="font-semibold block mb-0.5">链接备注：</span>
                  {viewingInviteUsers.memo}
                </div>
              )}

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <UserPlus size={13} />
                  <span>已绑定注册名单 ({invitedUsersList.length} 人)</span>
                </h5>

                {loadingUsers ? (
                  <div className="flex justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                  </div>
                ) : invitedUsersList.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-8">
                    暂无用户通过该邀请链接注册
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
                          用户名: @{user.username}
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
              <p className="text-sm font-semibold text-stone-500">查看注册明细</p>
              <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
                点击左侧列表中的“查看人员”按钮，即可在此处查看谁通过该特定的邀请码完成了注册与绑定。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
