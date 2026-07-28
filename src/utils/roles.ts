import type { User, UserRole } from "../types/types";

type UserWithRole = Pick<User, "role">;

export function getPrimaryRole(user: UserWithRole | null | undefined): UserRole | undefined {
  return user?.role;
}

export function hasAnyRole(user: UserWithRole | null | undefined, roles: UserRole[]) {
  return Boolean(user?.role && roles.includes(user.role));
}

export function getDefaultRouteForRole(user: UserWithRole | null | undefined) {
  const primaryRole = getPrimaryRole(user);
  if (primaryRole === "admin") return "/admin";
  if (primaryRole === "owner") return "/owner/dashboard";
  if (primaryRole === "courier") return "/profile";
  if (primaryRole === "customer") return "/profile";
  return "/";
}

export function getPostLoginRoute(user: UserWithRole | null | undefined) {
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

export function getUserRoleLabel(user: UserWithRole | null | undefined) {
  return getRoleLabel(user?.role);
}
