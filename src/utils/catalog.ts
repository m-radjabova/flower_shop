import type { Bouquet } from "../types/catalog";

export const LOW_STOCK_THRESHOLD = 3;

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

export function isBouquetAvailable(bouquet: Pick<Bouquet, "stock" | "status">) {
  return bouquet.status !== "sold_out" && bouquet.stock > 0;
}

export function getBouquetAvailability(bouquet: Pick<Bouquet, "stock" | "status">) {
  if (!isBouquetAvailable(bouquet)) {
    return { tone: "out" as const, labelKey: "availability.outOfStock" };
  }

  if (bouquet.stock <= LOW_STOCK_THRESHOLD) {
    return { tone: "low" as const, labelKey: "availability.onlyLeft", count: bouquet.stock };
  }

  return { tone: "in" as const, labelKey: "availability.inStock" };
}
