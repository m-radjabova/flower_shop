import type { Bouquet } from "../types/catalog";

export function getBouquetPath(bouquet: Pick<Bouquet, "id" | "slug">) {
  return `/bouquets/${encodeURIComponent(bouquet.slug || bouquet.id)}`;
}

export function getBouquetReviewsPath(bouquet: Pick<Bouquet, "id" | "slug">) {
  return `${getBouquetPath(bouquet)}/reviews`;
}
