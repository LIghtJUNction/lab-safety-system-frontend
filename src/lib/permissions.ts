type UserLike = {
  role?: string;
} | null | undefined;

type MembershipLike = {
  lab_id: number;
  role: string;
};

export function canManageSystem(user: UserLike) {
  return user?.role === "system_admin";
}

export function canManageLab(user: UserLike, labId: number | null, memberships: MembershipLike[]) {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some((membership) => membership.lab_id === labId && membership.role === "lab_admin");
}

export function canCreateHazard(user: UserLike, labId: number | null, memberships: MembershipLike[]) {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some(
    (membership) =>
      membership.lab_id === labId &&
      ["lab_admin", "lab_member", "visitor"].includes(membership.role),
  );
}

export function canClaimHazard(user: UserLike, labId: number | null, memberships: MembershipLike[]) {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some(
    (membership) =>
      membership.lab_id === labId && ["lab_admin", "lab_member"].includes(membership.role),
  );
}

export function canViewLab(user: UserLike, labId: number | null, memberships: MembershipLike[]) {
  if (!user) return false;
  if (user.role === "system_admin") return true;
  if (!labId) return false;
  return memberships.some((membership) => membership.lab_id === labId);
}
