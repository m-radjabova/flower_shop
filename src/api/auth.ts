import apiClient from "../apiClient/apiClient";
import type {
  ImportantDate,
  ImportantDateCreatePayload,
  ImportantDateUpdatePayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
  UserRole,
} from "../types/types";

export {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredRefreshToken,
  persistTokens,
} from "./authStorage";

export async function loginUser(payload: LoginPayload) {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function registerUser(payload: RegisterPayload) {
  const { data } = await apiClient.post<LoginResponse>("/auth/register", payload);
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}

export async function logoutUser() {
  await apiClient.post("/auth/logout");
}

export interface UpdateMePayload {
  full_name?: string;
  email?: string;
  phone?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface AdminUserUpdatePayload {
  full_name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
  is_active?: boolean;
}

export interface GetUsersParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AdminUsersPageResponse {
  items: User[];
  total: number;
  limit: number;
  offset: number;
}

export async function uploadMyAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<User>("/users/me/avatar", formData);
  return data;
}

export async function deleteMyAvatar() {
  const { data } = await apiClient.delete<User>("/users/me/avatar");
  return data;
}

export async function updateMe(payload: UpdateMePayload) {
  const { data } = await apiClient.patch<User>("/users/me", payload);
  return data;
}

export async function changeMyPassword(payload: ChangePasswordPayload) {
  const { data } = await apiClient.patch<User>("/users/me/password", payload);
  return data;
}

export async function getMyImportantDates() {
  const { data } = await apiClient.get<ImportantDate[]>("/important-dates/me");
  return data;
}

export async function createMyImportantDate(payload: ImportantDateCreatePayload) {
  const { data } = await apiClient.post<ImportantDate>("/important-dates/me", payload);
  return data;
}

export async function updateMyImportantDate(importantDateId: string, payload: ImportantDateUpdatePayload) {
  const { data } = await apiClient.patch<ImportantDate>(`/important-dates/me/${importantDateId}`, payload);
  return data;
}

export async function deleteMyImportantDate(importantDateId: string) {
  await apiClient.delete(`/important-dates/me/${importantDateId}`);
}

export async function getUsers(params: GetUsersParams = {}) {
  const { data } = await apiClient.get<User[] | AdminUsersPageResponse>("/users", {
    params: {
      ...(typeof params.limit === "number" ? { limit: params.limit } : {}),
      ...(typeof params.offset === "number" ? { offset: params.offset } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });

  if (Array.isArray(data)) {
    const normalized = data.map(normalizeUser);
    if (typeof params.limit !== "number") {
      return {
        items: normalized,
        total: normalized.length,
        limit: normalized.length || 1,
        offset: 0,
      };
    }

    const offset = params.offset ?? 0;
    const limit = params.limit;
    return {
      items: normalized.slice(offset, offset + limit),
      total: normalized.length,
      limit,
      offset,
    };
  }

  return {
    ...data,
    items: data.items.map(normalizeUser),
  };
}

export async function updateUser(userId: string, payload: AdminUserUpdatePayload) {
  const { data } = await apiClient.patch<User>(`/users/${userId}`, payload);
  return normalizeUser(data);
}

export function normalizeUser(user: User): User {
  return {
    ...user,
    role: user.role ?? ("customer" as UserRole),
  };
}

export function getErrorMessage(error: unknown, fallback = "Xatolik yuz berdi") {
  const maybeError = error as {
    response?: { data?: { detail?: string | Array<{ msg?: string }>; message?: string } };
    message?: string;
  };

  const detail = maybeError?.response?.data?.detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item.msg).filter(Boolean).join(", ");
  }

  return (
    (typeof detail === "string" ? detail : undefined) ||
    maybeError?.response?.data?.message ||
    maybeError?.message ||
    fallback
  );
}
