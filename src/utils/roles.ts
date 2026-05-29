import type { User, UserRole } from "../types/types";

const rolePriority: UserRole[] = ["admin", "owner", "courier", "customer"];

type UserWithRoles = Pick<User, "roles"> & Partial<Pick<User, "role">>;

export function getUserRoles(user: UserWithRoles | null | undefined): UserRole[] {
  if (!user) return [];

  const roles = user.roles?.length ? user.roles : user.role ? [user.role] : [];
  return rolePriority.filter((role) => roles.includes(role));
}

export function getPrimaryRole(user: UserWithRoles | null | undefined): UserRole | undefined {
  return getUserRoles(user)[0];
}

export function hasAnyRole(user: UserWithRoles | null | undefined, roles: UserRole[]) {
  const userRoles = getUserRoles(user);
  return roles.some((role) => userRoles.includes(role));
}

export function getDefaultRouteForRole(user: UserWithRoles | null | undefined) {
  const primaryRole = getPrimaryRole(user);
  if (primaryRole === "admin") return "/admin";
  if (primaryRole === "owner") return "/owner/orders";
  if (primaryRole === "courier") return "/profile";
  if (primaryRole === "customer") return "/profile";
  return "/login";
}

export function getPostLoginRoute(user: UserWithRoles | null | undefined) {
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
    case "courier":
      return "Courier";
    default:
      return "Customer";
  }
}

export function getUserRoleLabel(user: UserWithRoles | null | undefined) {
  const roles = getUserRoles(user);
  if (roles.length === 0) return "Customer";
  return roles.map((role) => getRoleLabel(role)).join(", ");
}
