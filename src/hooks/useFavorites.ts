import { useEffect, useMemo, useState } from "react";
import {
  FAVORITES_UPDATED_EVENT,
  type FavoriteBouquetItem,
  getFavoriteItems,
} from "../utils/favorites";

export function useFavoriteItems() {
  const [items, setItems] = useState<FavoriteBouquetItem[]>(() => getFavoriteItems());

  useEffect(() => {
    const sync = () => setItems(getFavoriteItems());
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITES_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, sync);
    };
  }, []);

  return items;
}

export function useFavoriteIds() {
  const items = useFavoriteItems();
  return useMemo(() => getFavoriteIdsFromItems(items), [items]);
}

export function useFavoritesCount() {
  const items = useFavoriteItems();
  return items.length;
}

function getFavoriteIdsFromItems(items: FavoriteBouquetItem[]) {
  return new Set(items.map((item) => item.id));
}
