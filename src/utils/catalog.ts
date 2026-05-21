import type { Bouquet } from "../types/catalog";

export function formatPrice(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function getBouquetImages(bouquet: Bouquet) {
  return Array.from(new Set([bouquet.image, ...(bouquet.images ?? [])].filter(Boolean)));
}

export function isNewBouquet(createdAt: string, days = 3) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) return false;

  return Date.now() - createdTime <= days * 24 * 60 * 60 * 1000;
}
