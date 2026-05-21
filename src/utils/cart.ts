import type { Bouquet } from "../types/catalog";

export const CART_STORAGE_KEY = "flower-shop-cart-v1";
export const CART_UPDATED_EVENT = "cart:updated";

export interface CartItem {
  id: string;
  bouquet: Bouquet;
  quantity: number;
  addedAt: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function emitCartUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function getCartItems(): CartItem[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.id && item?.bouquet && item?.quantity > 0);
  } catch {
    return [];
  }
}

function saveCartItems(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  emitCartUpdated();
}

export function addToCart(bouquet: Bouquet, quantity = 1) {
  const current = getCartItems();
  const idx = current.findIndex((item) => item.id === bouquet.id);

  if (idx >= 0) {
    const next = [...current];
    next[idx] = {
      ...next[idx],
      quantity: next[idx].quantity + Math.max(1, quantity),
    };
    saveCartItems(next);
    return;
  }

  saveCartItems([
    { id: bouquet.id, bouquet, quantity: Math.max(1, quantity), addedAt: new Date().toISOString() },
    ...current,
  ]);
}

export function updateCartItemQuantity(bouquetId: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(bouquetId);
    return;
  }

  const current = getCartItems();
  const next = current.map((item) =>
    item.id === bouquetId ? { ...item, quantity } : item,
  );
  saveCartItems(next);
}

export function removeFromCart(bouquetId: string) {
  const current = getCartItems();
  const next = current.filter((item) => item.id !== bouquetId);
  if (next.length === current.length) return;
  saveCartItems(next);
}

export function removeManyFromCart(bouquetIds: string[]) {
  if (!bouquetIds.length) return;
  const idSet = new Set(bouquetIds);
  const current = getCartItems();
  const next = current.filter((item) => !idSet.has(item.id));
  if (next.length === current.length) return;
  saveCartItems(next);
}

export function clearCart() {
  saveCartItems([]);
}
