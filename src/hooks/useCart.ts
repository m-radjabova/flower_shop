import { useEffect, useMemo, useState } from "react";
import { CART_UPDATED_EVENT, type CartItem, getCartItems } from "../utils/cart";

export function useCartItems() {
  const [items, setItems] = useState<CartItem[]>(() => getCartItems());

  useEffect(() => {
    const sync = () => setItems(getCartItems());
    window.addEventListener("storage", sync);
    window.addEventListener(CART_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CART_UPDATED_EVENT, sync);
    };
  }, []);

  return items;
}

export function useCartCount() {
  const items = useCartItems();
  return useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
}
