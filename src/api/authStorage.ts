import type { LoginResponse } from "../types/types";

export const ACCESS_TOKEN_KEY = "flower-shop-access-token";
export const REFRESH_TOKEN_KEY = "flower-shop-refresh-token";
export const CURRENT_USER_ID_KEY = "flower-shop-current-user-id";

export function persistTokens(tokens: LoginResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_ID_KEY);
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredCurrentUserId(userId: string | null) {
  if (!userId) {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    return;
  }
  localStorage.setItem(CURRENT_USER_ID_KEY, userId);
}

export function getStoredCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_ID_KEY);
}
