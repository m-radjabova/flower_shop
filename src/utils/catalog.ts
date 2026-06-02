import type { Bouquet } from "../types/catalog";

export function formatPrice(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function getBouquetImages(bouquet: Bouquet) {
  const addonImageSet = new Set((bouquet.addon_options ?? []).map((item) => item.image).filter(Boolean));
  return Array.from(
    new Set([
      bouquet.image,
      ...(bouquet.images ?? []).filter((image) => !addonImageSet.has(image)),
    ].filter(Boolean)),
  );
}

export function isNewBouquet(createdAt: string, days = 3) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) return false;

  return Date.now() - createdTime <= days * 24 * 60 * 60 * 1000;
}
