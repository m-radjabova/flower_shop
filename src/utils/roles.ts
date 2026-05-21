import type { User, UserRole } from "../types/types";

export function getPrimaryRole(user: Pick<User, "role"> | null | undefined): UserRole | undefined {
  return user?.role;
}

export function hasAnyRole(user: Pick<User, "role"> | null | undefined, roles: UserRole[]) {
  if (!user?.role) return false;
  return roles.includes(user.role);
}

export function getUserRoles(user: Pick<User, "role"> | null | undefined): UserRole[] {
  return user?.role ? [user.role] : [];
}

export function getDefaultRouteForRole(user: Pick<User, "role"> | null | undefined) {
  return getPrimaryRole(user) ? "/" : "/login";
}

export function getPostLoginRoute(user: Pick<User, "role"> | null | undefined) {
  return getDefaultRouteForRole(user);
}

export function getRoleLabel(role: UserRole | undefined) {
  switch (role) {
    case "admin":
      return "Admin";
    case "owner":
      return "Owner";
    case "customer":
      return "Customer";
    default:
      return "Customer";
  }
}

export function getUserRoleLabel(user: Pick<User, "role"> | null | undefined) {
  const roles = getUserRoles(user);
  if (roles.length === 0) return "Customer";
  return roles.map((role) => getRoleLabel(role)).join(", ");
}
