import { useTranslation } from "react-i18next";
import type { Shop, ShopSummary } from "../../types/catalog";
import { getShopPopularityBadge, isShopPremium } from "../../utils/shopBadges";

type ShopBadgeData = Pick<Shop | ShopSummary, "is_premium" | "premium_until" | "popularity_badge" | "rating" | "reviews_count" | "completed_orders_count">;

interface ShopFeatureBadgesProps {
  shop: ShopBadgeData;
  className?: string;
}

const badgeBaseClassName =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] shadow-[0_10px_25px_rgba(0,0,0,0.18)] backdrop-blur-md";

function ShopFeatureBadges({ shop, className = "" }: ShopFeatureBadgesProps) {
  const { t } = useTranslation();
  const popularityBadge = getShopPopularityBadge(shop);
  const premium = isShopPremium(shop);

  if (!premium && !popularityBadge) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {premium ? (
        <span className={`${badgeBaseClassName} border-[#9fe5ff]/35 bg-[#081822]/78 text-[#d3f4ff]`}>
          <span aria-hidden="true">💎</span>
          {t("shopsPage.premiumBoutique")}
        </span>
      ) : null}
      {popularityBadge ? (
        <span
          className={`${badgeBaseClassName} ${
            popularityBadge === "best_seller"
              ? "border-[#ffbe7a]/35 bg-[#231106]/78 text-[#ffe0b3]"
              : "border-[#f6dca0]/35 bg-[#211b0a]/78 text-[#fff0c7]"
          }`}
        >
          <span aria-hidden="true">{popularityBadge === "best_seller" ? "🔥" : "⭐"}</span>
          {popularityBadge === "best_seller" ? t("shopsPage.bestSeller") : t("shopsPage.mostPopular")}
        </span>
      ) : null}
    </div>
  );
}

export default ShopFeatureBadges;
