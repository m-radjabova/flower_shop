import type { Bouquet, BouquetAddonOption, BouquetSizeKey, BouquetSizeOption } from "../types/catalog";

export const SIZE_ORDER: BouquetSizeKey[] = ["small", "medium", "large", "premium"];

export const SIZE_LABELS: Record<BouquetSizeKey, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  premium: "Premium",
};

export function getBouquetSizeOptions(bouquet: Bouquet): BouquetSizeOption[] {
  const options = bouquet.size_options?.length
    ? bouquet.size_options
    : [{
        key: "medium" as const,
        label: bouquet.size || "Medium",
        price: bouquet.price,
        image: bouquet.image,
      }];

  return [...options].sort((a, b) => SIZE_ORDER.indexOf(a.key) - SIZE_ORDER.indexOf(b.key));
}

export function getBouquetAddonOptions(bouquet: Bouquet): BouquetAddonOption[] {
  return bouquet.addon_options ?? [];
}

export function getDefaultBouquetSize(bouquet: Bouquet): BouquetSizeOption {
  const options = getBouquetSizeOptions(bouquet);
  return options.find((item) => item.key === "medium") ?? options[0];
}

export function getBouquetImageForSize(bouquet: Bouquet, sizeKey?: BouquetSizeKey | null) {
  if (!sizeKey) return bouquet.image;
  return getBouquetSizeOptions(bouquet).find((item) => item.key === sizeKey)?.image ?? bouquet.image;
}
