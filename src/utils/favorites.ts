import type { Bouquet } from "../types/catalog";
import { CURRENT_USER_ID_KEY, getStoredAccessToken } from "../api/authStorage";

export const FAVORITES_STORAGE_KEY = "flower-shop-favorites-v1";
export const FAVORITES_UPDATED_EVENT = "favorites:updated";
export const FAVORITES_AUTH_REQUIRED_MESSAGE = "Favoritesga qo'shish uchun avval tizimga kiring.";

export interface FavoriteBouquetItem {
  id: string;
  bouquet: Bouquet;
  addedAt: string;
}

export type ToggleFavoriteResult =
  | { ok: true; added: boolean }
  | { ok: false; reason: "auth_required" };

function isBrowser() {
  return typeof window !== "undefined";
}

function emitFavoritesUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
}

function getFavoritesStorageKey() {
  if (!isBrowser()) return FAVORITES_STORAGE_KEY;
  const currentUserId = window.localStorage.getItem(CURRENT_USER_ID_KEY);
  return currentUserId ? `${FAVORITES_STORAGE_KEY}:${currentUserId}` : `${FAVORITES_STORAGE_KEY}:guest`;
}

export function getFavoriteItems(): FavoriteBouquetItem[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(getFavoritesStorageKey());
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as FavoriteBouquetItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.id && item?.bouquet);
  } catch {
    return [];
  }
}

function saveFavoriteItems(items: FavoriteBouquetItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(items));
  emitFavoritesUpdated();
}

export function getFavoriteIds() {
  return new Set(getFavoriteItems().map((item) => item.id));
}

export function isFavoriteBouquet(bouquetId: string) {
  return getFavoriteIds().has(bouquetId);
}

export function addFavoriteBouquet(bouquet: Bouquet): ToggleFavoriteResult {
  if (!getStoredAccessToken()) {
    return { ok: false, reason: "auth_required" };
  }

  const current = getFavoriteItems();
  if (current.some((item) => item.id === bouquet.id)) {
    return { ok: true, added: true };
  }
  saveFavoriteItems([
    { id: bouquet.id, bouquet, addedAt: new Date().toISOString() },
    ...current,
  ]);
  return { ok: true, added: true };
}

export function removeFavoriteBouquet(bouquetId: string) {
  const current = getFavoriteItems();
  const next = current.filter((item) => item.id !== bouquetId);
  if (next.length === current.length) return;
  saveFavoriteItems(next);
}

export function clearFavorites() {
  saveFavoriteItems([]);
}

export function toggleFavoriteBouquet(bouquet: Bouquet): ToggleFavoriteResult {
  if (!getStoredAccessToken()) {
    return { ok: false, reason: "auth_required" };
  }

  if (isFavoriteBouquet(bouquet.id)) {
    removeFavoriteBouquet(bouquet.id);
    return { ok: true, added: false };
  }
  return addFavoriteBouquet(bouquet);
}
