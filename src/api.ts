const API_BASE = "/api/v1";

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
};

export type CountBucket = { name: string; count: number };
export type IncidentAnalytics = { by_category: CountBucket[]; by_severity: CountBucket[] };
export type Training = { id: number; title: string; target_role: string; status: string; exam_required_score: number };
export type Equipment = { id: number; asset_code: string; name: string; lab_name: string; status: string; owner: string | null };
export type Booking = { id: number; equipment_id: number; user_id: number; starts_at: string; ends_at: string; purpose: string };
export type RepairTicket = { id: number; equipment_id: number; reported_by: number; description: string; status: string };
export type User = { id: number; username: string; display_name: string; email: string; role: string; auth_provider: string; department: string | null; is_active: boolean };
export type ExamResult = { id: number; training_id: number; user_id: number; score: number; status: string };
export type SafetyHazard = {
  id: number;
  title: string;
  lab_name: string;
  category: string;
  description: string;
  status: string;
  reported_by: number;
  responsible_user_id: number | null;
  issue_photo_url: string | null;
  remediation_photo_url: string | null;
  remediation_note: string | null;
};
export type HazardAnalytics = { by_status: CountBucket[]; by_category: CountBucket[] };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardStats>("/analytics/dashboard"),
  incidentAnalytics: () => request<IncidentAnalytics>("/analytics/incidents"),
  hazardAnalytics: () => request<HazardAnalytics>("/analytics/hazards"),
  regulations: (q = "") => request<Regulation[]>(`/regulations${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  incidents: () => request<Incident[]>("/incidents"),
  trainings: () => request<Training[]>("/trainings"),
  equipment: (q = "") => request<Equipment[]>(`/equipment${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  bookings: () => request<Booking[]>("/equipment-bookings"),
  repairs: () => request<RepairTicket[]>("/repair-tickets"),
  users: () => request<User[]>("/users"),
  hazards: (q = "") => request<SafetyHazard[]>(`/hazards${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createRegulation: () =>
    request<Regulation>("/regulations", {
      method: "POST",
      body: JSON.stringify({
        title: "实验室安全准入管理办法",
        regulation_type: "regulation",
        issuing_authority: "安全办公室",
        effective_date: new Date().toISOString().slice(0, 10),
        summary: "规范实验室准入、风险评估、培训考核和应急处置流程。",
      }),
    }),
  createIncident: () =>
    request<Incident>("/incidents", {
      method: "POST",
      body: JSON.stringify({
        title: "危化品泄漏案例",
        lab_name: "化学实验室 A",
        occurred_on: new Date().toISOString().slice(0, 10),
        severity: "high",
        category: "危化品",
        root_cause: "试剂瓶标识不清且存放不当。",
        corrective_actions: "完善标签、分区存储并补充专项培训。",
      }),
    }),
  createTraining: () =>
    request<Training>("/trainings", {
      method: "POST",
      body: JSON.stringify({
        title: "危化品安全操作培训",
        target_role: "researcher",
        status: "active",
        starts_on: new Date().toISOString().slice(0, 10),
        exam_required_score: 80,
      }),
    }),
  createExamResult: (trainingId: number, userId: number) =>
    request<ExamResult>("/exam-results", {
      method: "POST",
      body: JSON.stringify({
        training_id: trainingId,
        user_id: userId,
        score: 92,
        status: "passed",
      }),
    }),
  createUser: () =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify({
        username: `user_${Date.now()}`,
        display_name: "新实验员",
        email: `user_${Date.now()}@example.com`,
        role: "researcher",
        auth_provider: "password",
        department: "公共实验平台",
        password: "ChangeMe123!",
      }),
    }),
  createEquipment: () =>
    request<Equipment>("/equipment", {
      method: "POST",
      body: JSON.stringify({
        asset_code: `EQ-${Date.now().toString().slice(-6)}`,
        name: "气相色谱仪",
        lab_name: "分析测试中心",
        status: "available",
        owner: "设备管理员",
      }),
    }),
  createBooking: (equipmentId: number, userId: number) => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return request<Booking>("/equipment-bookings", {
      method: "POST",
      body: JSON.stringify({
        equipment_id: equipmentId,
        user_id: userId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        purpose: "安全检测样品分析",
      }),
    });
  },
  createRepair: (equipmentId: number, userId: number) =>
    request<RepairTicket>("/repair-tickets", {
      method: "POST",
      body: JSON.stringify({
        equipment_id: equipmentId,
        reported_by: userId,
        description: "设备运行状态异常，请安排检修。",
        status: "open",
      }),
    }),
  uploadRegulation: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>("/regulations/upload", {
      method: "POST",
      body: form,
    });
  },
  uploadIncident: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>("/incidents/upload", {
      method: "POST",
      body: form,
    });
  },
  createHazard: (reportedBy: number, issuePhotoUrl?: string) =>
    request<SafetyHazard>("/hazards", {
      method: "POST",
      body: JSON.stringify({
        title: "消防通道堆放杂物",
        lab_name: "材料实验室",
        category: "消防通道",
        description: "安全出口附近堆放纸箱，影响应急疏散。",
        reported_by: reportedBy,
        issue_photo_url: issuePhotoUrl,
      }),
    }),
  claimHazard: (hazardId: number, responsibleUserId: number) =>
    request<SafetyHazard>(`/hazards/${hazardId}/claim`, {
      method: "POST",
      body: JSON.stringify({ responsible_user_id: responsibleUserId }),
    }),
  submitHazardRemediation: (hazardId: number, remediationPhotoUrl: string) =>
    request<SafetyHazard>(`/hazards/${hazardId}/remediation`, {
      method: "POST",
      body: JSON.stringify({
        remediation_photo_url: remediationPhotoUrl,
        remediation_note: "已完成整改并上传整改照片。",
      }),
    }),
  uploadHazardIssuePhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>("/hazards/upload/issue-photo", {
      method: "POST",
      body: form,
    });
  },
  uploadHazardRemediationPhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; filename: string; size: number }>("/hazards/upload/remediation-photo", {
      method: "POST",
      body: form,
    });
  },
};
