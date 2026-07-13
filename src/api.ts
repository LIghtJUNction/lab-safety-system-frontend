import type {
  DashboardStats,
  Regulation,
  Incident,
  CountBucket,
  IncidentAnalytics,
  Training,
  Equipment,
  Booking,
  RepairTicket,
  User,
  AuthUser,
  AuthSession,
  AuthMethods,
  AuthSettings,
  AuthSettingsPatch,
  DeploymentSettings,
  Invitation,
  InvitationCreate,
  InvitationRegister,
  InvitationPublicInfo,
  InvitedUser,
  ExamResult,
  SafetyHazard,
  HazardStatusEvent,
  HazardAnalytics,
  RegulationAnalytics,
  RegulationCreate,
  IncidentCreate,
  TrainingCreate,
  EquipmentCreate,
  BookingCreate,
  RepairCreate,
  HazardCreate,
  UserCreate,
  Lab,
  LabCreate,
  LabUpdate,
  LabMembership,
  LabUser,
  LabUserAssign,
  CarouselSlide,
  LoginCarouselSettings,
  PasskeyChallenge,
  PasskeySummary,
} from "./api-types";
export type {
  DashboardStats,
  Regulation,
  Incident,
  CountBucket,
  IncidentAnalytics,
  Training,
  Equipment,
  Booking,
  RepairTicket,
  User,
  AuthUser,
  AuthSession,
  AuthMethods,
  AuthSettings,
  AuthSettingsPatch,
  DeploymentSettings,
  Invitation,
  InvitationCreate,
  InvitationRegister,
  InvitationPublicInfo,
  InvitedUser,
  ExamResult,
  SafetyHazard,
  HazardStatusEvent,
  HazardAnalytics,
  RegulationAnalytics,
  RegulationCreate,
  IncidentCreate,
  TrainingCreate,
  EquipmentCreate,
  BookingCreate,
  RepairCreate,
  HazardCreate,
  UserCreate,
  Lab,
  LabCreate,
  LabUpdate,
  LabMembership,
  LabUser,
  LabUserAssign,
  CarouselSlide,
  LoginCarouselSettings,
  PasskeyChallenge,
  PasskeySummary,
} from "./api-types";
// Support runtime configuration for separated deployment (frontend and backend on different origins/ports).
// Database connectivity is configured by the backend process, not by the browser client.
let apiBase =
  localStorage.getItem("apiBase") ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api/v1";

export function getApiBase() {
  const base = apiBase || "/api/v1";
  return base.replace(/\/$/, ""); // clean trailing slash
}

export function setApiBase(url: string) {
  let normalized = url.trim().replace(/\/$/, "");
  if (
    normalized &&
    !normalized.endsWith("/api/v1") &&
    !normalized.match(/\/api(\/|$)/)
  ) {
    normalized = normalized + "/api/v1";
  }
  apiBase = normalized;
  if (apiBase) {
    localStorage.setItem("apiBase", apiBase);
  } else {
    localStorage.removeItem("apiBase");
  }
}

let accessToken: string | null = null;

function withLabQuery(path: string, labId?: number, extra?: Record<string, string>) {
  const params = new URLSearchParams(extra);
  if (labId != null && labId > 0) {
    params.set("lab_id", String(labId));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Prefer backend `{ detail: string }` error bodies for UI notices. */
async function errorMessageFromResponse(response: Response): Promise<string> {
  const raw = await response.text();
  if (!raw) {
    return `Request failed: ${response.status}`;
  }
  try {
    const parsed = JSON.parse(raw) as { detail?: unknown };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // not JSON — fall through to raw body
  }
  return raw;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(
    init?.body instanceof FormData
      ? undefined
      : { "Content-Type": "application/json" },
  );
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    throw new Error(await errorMessageFromResponse(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  setAccessToken: (token: string | null) => {
    accessToken = token;
  },
  authMethods: () => request<AuthMethods>("/auth/methods"),
  authSettings: () => request<AuthSettings>("/settings/auth"),
  updateAuthSettings: (payload: AuthSettingsPatch) =>
    request<AuthSettings>("/settings/auth", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deploymentSettings: () =>
    request<DeploymentSettings>("/settings/deployment"),
  passwordLogin: (username: string, password: string) =>
    request<AuthSession>("/auth/password-login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  passkeyLoginStart: (username: string) =>
    request<PasskeyChallenge<PublicKeyCredentialRequestOptions>>(
      "/auth/passkey/login/start",
      {
        method: "POST",
        body: JSON.stringify({ username }),
      },
    ),
  passkeyLoginFinish: (challengeId: string, credential: unknown) =>
    request<AuthSession>("/auth/passkey/login/finish", {
      method: "POST",
      body: JSON.stringify({
        challenge_id: challengeId,
        credential,
      }),
    }),
  passkeyRegisterStart: () =>
    request<PasskeyChallenge<PublicKeyCredentialCreationOptions>>(
      "/auth/passkey/register/start",
      { method: "POST" },
    ),
  passkeyRegisterFinish: (
    challengeId: string,
    credential: unknown,
    name = "Passkey",
  ) =>
    request<PasskeySummary>("/auth/passkey/register/finish", {
      method: "POST",
      body: JSON.stringify({
        challenge_id: challengeId,
        name,
        credential,
      }),
    }),
  passkeys: () => request<PasskeySummary[]>("/auth/passkeys"),
  me: () => request<AuthUser>("/auth/me"),
  dashboard: (labId?: number) =>
    request<DashboardStats>(withLabQuery("/analytics/dashboard", labId)),
  incidentAnalytics: (labId?: number) =>
    request<IncidentAnalytics>(withLabQuery("/analytics/incidents", labId)),
  hazardAnalytics: (labId?: number) =>
    request<HazardAnalytics>(withLabQuery("/analytics/hazards", labId)),
  regulationAnalytics: () =>
    request<RegulationAnalytics>("/analytics/regulations"),
  regulations: (q = "") =>
    request<Regulation[]>(
      `/regulations${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),
  getRegulation: (id: number) => request<Regulation>(`/regulations/${id}`),
  incidents: (q = "", labId?: number) => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    return request<Incident[]>(withLabQuery("/incidents", labId, params));
  },
  getIncident: (id: number) => request<Incident>(`/incidents/${id}`),
  trainings: (labId?: number) =>
    request<Training[]>(withLabQuery("/trainings", labId)),
  equipment: (q = "", labId?: number) => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    return request<Equipment[]>(withLabQuery("/equipment", labId, params));
  },
  bookings: (labId?: number) =>
    request<Booking[]>(withLabQuery("/equipment-bookings", labId)),
  repairs: (labId?: number) =>
    request<RepairTicket[]>(withLabQuery("/repair-tickets", labId)),
  users: () => request<User[]>("/users"),
  hazards: (q = "", labId?: number) => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    return request<SafetyHazard[]>(withLabQuery("/hazards", labId, params));
  },
  getHazard: (id: number) => request<SafetyHazard>(`/hazards/${id}`),
  hazardHistory: (id: number) =>
    request<HazardStatusEvent[]>(`/hazards/${id}/history`),
  createRegulation: (payload: RegulationCreate) =>
    request<Regulation>("/regulations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createIncident: (payload: IncidentCreate) =>
    request<Incident>("/incidents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createTraining: (payload: TrainingCreate) =>
    request<Training>("/trainings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createExamResult: (trainingId: number, userId: number, score: number) =>
    request<ExamResult>("/exam-results", {
      method: "POST",
      body: JSON.stringify({
        training_id: trainingId,
        user_id: userId,
        score,
      }),
    }),
  createUser: (payload: UserCreate) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createEquipment: (payload: EquipmentCreate) =>
    request<Equipment>("/equipment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createBooking: (payload: BookingCreate) =>
    request<Booking>("/equipment-bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createRepair: (payload: RepairCreate) =>
    request<RepairTicket>("/repair-tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadRegulation: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>(
      "/regulations/upload",
      {
        method: "POST",
        body: form,
      },
    );
  },
  uploadIncident: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>(
      "/incidents/upload",
      {
        method: "POST",
        body: form,
      },
    );
  },
  createHazard: (payload: HazardCreate) =>
    request<SafetyHazard>("/hazards", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  claimHazard: (hazardId: number, responsibleUserId: number) =>
    request<SafetyHazard>(`/hazards/${hazardId}/claim`, {
      method: "POST",
      body: JSON.stringify({ responsible_user_id: responsibleUserId }),
    }),
  submitHazardRemediation: (
    hazardId: number,
    remediationPhotoUrl: string,
    remediationNote: string,
  ) =>
    request<SafetyHazard>(`/hazards/${hazardId}/remediation`, {
      method: "POST",
      body: JSON.stringify({
        remediation_photo_url: remediationPhotoUrl,
        remediation_note: remediationNote,
      }),
    }),
  updateHazardStatus: (hazardId: number, status: string) =>
    request<SafetyHazard>(`/hazards/${hazardId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateRepairStatus: (repairId: number, status: string) =>
    request<RepairTicket>(`/repair-tickets/${repairId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  uploadHazardIssuePhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>(
      "/hazards/upload/issue-photo",
      {
        method: "POST",
        body: form,
      },
    );
  },
  uploadHazardRemediationPhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>(
      "/hazards/upload/remediation-photo",
      {
        method: "POST",
        body: form,
      },
    );
  },

  // Labs (new multi-lab master data)
  labs: (q = "", status = "") => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (status) params.append("status", status);
    const qs = params.toString();
    return request<Lab[]>(`/labs${qs ? `?${qs}` : ""}`);
  },
  createLab: (payload: LabCreate) =>
    request<Lab>("/labs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getLab: (id: number) => request<Lab>(`/labs/${id}`),
  updateLab: (id: number, payload: LabUpdate) =>
    request<Lab>(`/labs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // User's lab memberships (for role-based UI)
  myLabMemberships: () => request<LabMembership[]>("/auth/my-labs"),

  // Lab member management
  listLabUsers: (labId: number) => request<LabUser[]>(`/labs/${labId}/users`),
  assignLabUser: (labId: number, payload: LabUserAssign) =>
    request<LabUser>(`/labs/${labId}/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  removeLabUser: (labId: number, userId: number) =>
    request<void>(`/labs/${labId}/users/${userId}`, {
      method: "DELETE",
    }),

  // Public: fetch custom login carousel (backend persisted, only system_admin can update)
  loginCarousel: () =>
    request<LoginCarouselSettings>("/settings/login-carousel"),
  updateLoginCarousel: (payload: LoginCarouselSettings) =>
    request<LoginCarouselSettings>("/settings/login-carousel", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  resetLoginCarousel: () =>
    request<{ reset: boolean }>("/settings/login-carousel", {
      method: "DELETE",
    }),

  // Invitations API
  listInvitations: (labId?: number) => {
    const params = new URLSearchParams();
    if (labId) params.append("lab_id", String(labId));
    const qs = params.toString();
    return request<Invitation[]>(`/invitations${qs ? `?${qs}` : ""}`);
  },
  createInvitation: (payload: InvitationCreate) =>
    request<Invitation>("/invitations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteInvitation: (id: number) =>
    request<void>(`/invitations/${id}`, {
      method: "DELETE",
    }),
  getInvitationUsers: (id: number) =>
    request<InvitedUser[]>(`/invitations/${id}/users`),
  getPublicInvitation: (code: string) =>
    request<InvitationPublicInfo>(`/invitations/public/${code}`),
  registerByInvitation: (payload: InvitationRegister) =>
    request<{ status: string; username: string }>("/invitations/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
