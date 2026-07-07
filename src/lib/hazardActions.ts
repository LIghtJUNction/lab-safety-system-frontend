import { api, type AuthSession, type SafetyHazard, type User } from "../api";

export function sessionUserOrThrow(session: AuthSession | null): User {
  if (!session?.user) throw new Error("请先登录后再操作");
  return {
    id: session.user.id,
    username: session.user.username,
    display_name: session.user.display_name,
    email: session.user.email,
    role: session.user.role,
    auth_provider: session.user.auth_provider,
    department: null,
    is_active: true,
  };
}

export async function uploadHazardIssuePhotoForReport(
  session: AuthSession | null,
  file: File,
) {
  sessionUserOrThrow(session);
  return api.uploadHazardIssuePhoto(file);
}

export async function claimFirstHazard(
  session: AuthSession | null,
  hazards: SafetyHazard[],
) {
  const user = sessionUserOrThrow(session);
  const hazard = hazards.find((item) => !item.responsible_user_id);
  if (!hazard) {
    throw new Error("当前没有可认领的隐患，请先通过上报表单创建真实隐患记录");
  }
  return api.claimHazard(hazard.id, user.id);
}

export async function remediateFirstHazard(
  session: AuthSession | null,
  hazards: SafetyHazard[],
  file: File,
) {
  const user = sessionUserOrThrow(session);
  const hazard =
    hazards.find((item) => item.responsible_user_id === user.id) ??
    hazards[0];
  if (!hazard) {
    throw new Error("当前没有可整改的隐患，请先创建或认领真实隐患记录");
  }
  if (!hazard.responsible_user_id) {
    throw new Error("请先认领该隐患，再提交整改照片");
  }
  const upload = await api.uploadHazardRemediationPhoto(file);
  return api.submitHazardRemediation(
    hazard.id,
    upload.url,
    "已上传整改照片，等待确认。",
  );
}
