import type { AddressOut } from "../types/catalog";

const CHECKOUT_ADDRESS_KEY = "flower-shop-checkout-address";

export interface StoredCheckoutAddress {
  title?: string;
  address_line?: string;
  city?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function setPreferredCheckoutAddress(address: AddressOut) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CHECKOUT_ADDRESS_KEY,
    JSON.stringify({
      title: address.title,
      address_line: address.address_line,
      city: address.city,
      notes: address.notes,
      latitude: address.latitude,
      longitude: address.longitude,
    } satisfies StoredCheckoutAddress),
  );
}

export function getPreferredCheckoutAddress(): StoredCheckoutAddress | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CHECKOUT_ADDRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCheckoutAddress;
  } catch {
    return null;
  }
}

export function clearPreferredCheckoutAddress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHECKOUT_ADDRESS_KEY);
}

export function formatCheckoutAddress(address: StoredCheckoutAddress | null) {
  if (!address) return "";
  return [address.address_line, address.city].filter(Boolean).join(", ");
}

export function isSameCheckoutAddress(address: AddressOut, selected: StoredCheckoutAddress | null) {
  if (!selected) return false;
  const sameLine = address.address_line === selected.address_line;
  const sameCity = (address.city ?? "") === (selected.city ?? "");
  const sameLat = (address.latitude ?? null) === (selected.latitude ?? null);
  const sameLon = (address.longitude ?? null) === (selected.longitude ?? null);
  return sameLine && sameCity && sameLat && sameLon;
}
