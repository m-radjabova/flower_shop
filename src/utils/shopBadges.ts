import type { Shop, ShopSummary } from "../types/catalog";

export type ShopBadgeShop = Pick<
  Shop,
  | "rating"
  | "reviews_count"
  | "completed_orders_count"
  | "is_premium"
  | "premium_until"
  | "popularity_badge"
  | "is_verified"
  | "created_at"
> &
  Partial<Pick<ShopSummary, "id">>;

export type ShopPopularityBadge = "best_seller" | "most_popular";

const BEST_SELLER_MIN_COMPLETED_ORDERS = 15;
const BEST_SELLER_MIN_RATING = 4.6;
const MOST_POPULAR_MIN_REVIEWS = 6;
const MOST_POPULAR_MIN_RATING = 4.5;

function toRatingNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getShopPopularityBadge(shop: Partial<ShopBadgeShop>): ShopPopularityBadge | null {
  if (shop.popularity_badge) {
    return shop.popularity_badge;
  }

  const rating = toRatingNumber(shop.rating);
  const completedOrders = shop.completed_orders_count ?? 0;
  const reviewsCount = shop.reviews_count ?? 0;

  if (completedOrders >= BEST_SELLER_MIN_COMPLETED_ORDERS && rating >= BEST_SELLER_MIN_RATING) {
    return "best_seller";
  }

  if (reviewsCount >= MOST_POPULAR_MIN_REVIEWS && rating >= MOST_POPULAR_MIN_RATING) {
    return "most_popular";
  }

  return null;
}

export function isShopPremium(shop: Partial<ShopBadgeShop>) {
  if (!shop.is_premium) return false;
  if (!shop.premium_until) return true;

  const premiumUntilTime = Date.parse(shop.premium_until);
  if (Number.isNaN(premiumUntilTime)) return true;

  return premiumUntilTime > Date.now();
}

function getBadgePriority(shop: Partial<ShopBadgeShop>) {
  const badge = getShopPopularityBadge(shop);
  if (badge === "best_seller") return 2;
  if (badge === "most_popular") return 1;
  return 0;
}

export function sortShopsForDisplay<T extends ShopBadgeShop>(shops: T[]) {
  return [...shops].sort((left, right) => {
    const premiumDelta = Number(isShopPremium(right)) - Number(isShopPremium(left));
    if (premiumDelta !== 0) return premiumDelta;

    const badgeDelta = getBadgePriority(right) - getBadgePriority(left);
    if (badgeDelta !== 0) return badgeDelta;

    const verifiedDelta = Number(Boolean(right.is_verified)) - Number(Boolean(left.is_verified));
    if (verifiedDelta !== 0) return verifiedDelta;

    const ratingDelta = toRatingNumber(right.rating) - toRatingNumber(left.rating);
    if (ratingDelta !== 0) return ratingDelta;

    const reviewsDelta = (right.reviews_count ?? 0) - (left.reviews_count ?? 0);
    if (reviewsDelta !== 0) return reviewsDelta;

    return Date.parse(right.created_at ?? "") - Date.parse(left.created_at ?? "");
  });
}
