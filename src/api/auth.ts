import apiClient from "../apiClient/apiClient";
import type { LoginPayload, LoginResponse, RegisterPayload, User } from "../types/types";

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

export async function updateMe(payload: UpdateMePayload) {
  const { data } = await apiClient.patch<User>("/users/me", payload);
  return data;
}

export async function changeMyPassword(payload: ChangePasswordPayload) {
  const { data } = await apiClient.patch<User>("/users/me/password", payload);
  return data;
}

export function normalizeUser(user: User): User {
  return user;
}

export function getErrorMessage(error: unknown, fallback = "Xatolik yuz berdi") {
  const maybeError = error as {
    response?: { data?: { detail?: string; message?: string } };
    message?: string;
  };

  return (
    maybeError?.response?.data?.detail ||
    maybeError?.response?.data?.message ||
    maybeError?.message ||
    fallback
  );
}
