// Support runtime configuration for separated deployment (frontend and backend on different origins/ports)
// These can be set from the login page UI and persist in localStorage
let apiBase = localStorage.getItem('apiBase') || import.meta.env.VITE_API_BASE_URL || '/api/v1';
let dbUrl = localStorage.getItem('dbUrl') || import.meta.env.VITE_DB_URL || '';

export function getApiBase() {
  const base = apiBase || '/api/v1';
  return base.replace(/\/$/, ''); // clean trailing slash
}

export function setApiBase(url: string) {
  let normalized = url.trim().replace(/\/$/, '');
  if (normalized && !normalized.endsWith('/api/v1') && !normalized.match(/\/api(\/|$)/)) {
    normalized = normalized + '/api/v1';
  }
  apiBase = normalized;
  if (apiBase) {
    localStorage.setItem('apiBase', apiBase);
  } else {
    localStorage.removeItem('apiBase');
  }
}

export function getDbUrl() {
  return dbUrl;
}

export function setDbUrl(url: string) {
  dbUrl = url.trim();
  if (dbUrl) {
    localStorage.setItem('dbUrl', dbUrl);
  } else {
    localStorage.removeItem('dbUrl');
  }
}

let accessToken: string | null = null;

export type DashboardStats = {
  regulation_count: number;
  incident_count: number;
  training_count: number;
  equipment_count: number;
  open_repair_count: number;
  exam_pass_rate: number;
};

export type Regulation = {
  id: number;
  title: string;
  regulation_type: string;
  issuing_authority: string;
  effective_date: string | null;
  summary: string;
  file_url: string | null;
};

export type Incident = {
  id: number;
  title: string;
  lab_name: string;
  occurred_on: string;
  severity: string;
  category: string;
  root_cause: string;
  corrective_actions: string;
  file_url: string | null;
};

export type CountBucket = { name: string; count: number };
export type IncidentAnalytics = {
  by_category: CountBucket[];
  by_severity: CountBucket[];
};
export type Training = {
  id: number;
  title: string;
  target_role: string;
  status: string;
  exam_required_score: number;
};
export type Equipment = {
  id: number;
  asset_code: string;
  name: string;
  lab_name: string;
  status: string;
  owner: string | null;
};
export type Booking = {
  id: number;
  equipment_id: number;
  user_id: number;
  starts_at: string;
  ends_at: string;
  purpose: string;
};
export type RepairTicket = {
  id: number;
  equipment_id: number;
  reported_by: number;
  description: string;
  status: string;
};
export type User = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: string;
  auth_provider: string;
  department: string | null;
  is_active: boolean;
};
export type AuthUser = Pick<
  User,
  "id" | "username" | "display_name" | "email" | "role" | "auth_provider"
>;
export type AuthSession = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
};
export type AuthMethods = {
  password: boolean;
  sso: boolean;
  oauth: boolean;
  sso_login_url: string | null;
  oauth_login_url: string | null;
};

export type Invitation = {
  id: number;
  code: string;
  lab_id: number;
  target_role: string;
  max_uses: number | null;
  used_count: number;
  memo: string | null;
  created_by: number;
  created_at: string;
  expires_at: string | null;
  status: string;
};

export type InvitationCreate = {
  lab_id: number;
  target_role: string;
  max_uses: number | null;
  memo: string | null;
  expires_at: string | null;
};

export type InvitationRegister = {
  code: string;
  username: string;
  display_name: string;
  email: string;
  password: string;
};

export type InvitationPublicInfo = {
  code: string;
  lab_name: string;
  target_role: string;
};

export type InvitedUser = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  created_at: string;
};
export type ExamResult = {
  id: number;
  training_id: number;
  user_id: number;
  score: number;
  status: string;
};
export type SafetyHazard = {
  id: number;
  title: string;
  lab_id: number;
  lab_name?: string; // for display / compatibility
  category: string;
  description: string;
  status: string;
  reported_by: number;
  responsible_user_id: number | null;
  issue_photo_url: string | null;
  remediation_photo_url: string | null;
  remediation_note: string | null;
};
export type HazardAnalytics = {
  by_status: CountBucket[];
  by_category: CountBucket[];
};
export type RegulationAnalytics = {
  by_type: CountBucket[];
  by_authority: CountBucket[];
};
export type RegulationCreate = Omit<Regulation, "id" | "created_at">;
export type IncidentCreate = Omit<Incident, "id">;
export type TrainingCreate = Omit<Training, "id" | "exam_required_score"> & {
  exam_required_score?: number;
  starts_on?: string | null;
};
export type EquipmentCreate = Omit<Equipment, "id" | "owner"> & {
  owner?: string | null;
};
export type BookingCreate = Omit<Booking, "id">;
export type RepairCreate = Omit<RepairTicket, "id">;
export type HazardCreate = {
  lab_id: number;
  title: string;
  category: string;
  description: string;
  reported_by: number;
  issue_photo_url?: string | null;
};
export type UserCreate = {
  username: string;
  display_name: string;
  email: string;
  role: "lab_member" | "visitor";  // global role; lab-specific roles assigned via labs/{id}/users
  auth_provider: "password" | "sso" | "oauth";
  department?: string | null;
  password?: string;
};

// New Lab model for multi-lab support
export type Lab = {
  id: number;
  code: string;
  name: string;
  location: string | null;
  department: string | null;
  manager_user_id: number | null;
  contact: string | null;
  status: string;
  description: string | null;
  created_at: string;
};

export type LabCreate = {
  code: string;
  name: string;
  location?: string | null;
  department?: string | null;
  manager_user_id?: number | null;
  contact?: string | null;
  status?: string;
  description?: string | null;
};

export type LabUpdate = Partial<LabCreate>;

// User's role in a specific lab
export type LabMembership = {
  lab_id: number;
  lab_name: string;
  role: "system_admin" | "lab_admin" | "lab_member" | "visitor";
};

export type LabUser = {
  id: number;
  lab_id: number;
  user_id: number;
  lab_role: "lab_admin" | "lab_member" | "visitor";
  created_at: string;
};

export type LabUserAssign = {
  user_id: number;
  lab_role: "lab_admin" | "lab_member" | "visitor";
};

export type CarouselSlide = {
  stat: string;
  title: string;
  body: string;
};

export type LoginCarouselSettings = {
  zh: CarouselSlide[];
  en: CarouselSlide[];
};
export type PasskeyChallenge<T> = {
  challenge_id: string;
  options: T;
};
export type PasskeySummary = {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
};

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
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  setAccessToken: (token: string | null) => {
    accessToken = token;
  },
  authMethods: () => request<AuthMethods>("/auth/methods"),
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
  dashboard: () => request<DashboardStats>("/analytics/dashboard"),
  incidentAnalytics: () => request<IncidentAnalytics>("/analytics/incidents"),
  hazardAnalytics: () => request<HazardAnalytics>("/analytics/hazards"),
  regulationAnalytics: () => request<RegulationAnalytics>("/analytics/regulations"),
  regulations: (q = "") =>
    request<Regulation[]>(
      `/regulations${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),
  incidents: () => request<Incident[]>("/incidents"),
  trainings: () => request<Training[]>("/trainings"),
  equipment: (q = "") =>
    request<Equipment[]>(`/equipment${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  bookings: () => request<Booking[]>("/equipment-bookings"),
  repairs: () => request<RepairTicket[]>("/repair-tickets"),
  users: () => request<User[]>("/users"),
  hazards: (q = "", labId?: number) => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (labId) params.append("lab_id", String(labId));
    const qs = params.toString();
    return request<SafetyHazard[]>(`/hazards${qs ? `?${qs}` : ""}`);
  },
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
  createExamResult: (trainingId: number, userId: number, score = 92) =>
    request<ExamResult>("/exam-results", {
      method: "POST",
      body: JSON.stringify({
        training_id: trainingId,
        user_id: userId,
        score,
        status: score >= 60 ? "passed" : "failed",
      }),
    }),
  createUser: (payload?: UserCreate) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify(
        payload ?? {
          username: `user_${Date.now()}`,
          display_name: "新实验员",
          email: `user_${Date.now()}@example.com`,
          role: "lab_member",
          auth_provider: "password",
          department: "公共实验平台",
          password: `Strong-${Date.now()}!Aa1`,
        },
      ),
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
    remediationNote = "已完成整改并上传整改照片。",
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

  // Public: fetch custom login carousel (backend persisted, only system_admin can update)
  loginCarousel: () => request<LoginCarouselSettings>("/settings/login-carousel"),
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
