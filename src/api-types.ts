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
  exam_required_score: number;
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
  role: "lab_member" | "visitor"; // global role; lab-specific roles assigned via labs/{id}/users
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
  status: string;
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
  username: string;
  display_name: string;
  email: string;
  global_role: string;
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
