import { useTranslation } from "react-i18next";
import type { Shop, ShopSummary } from "../../types/catalog";
import { getShopPopularityBadge, isShopPremium } from "../../utils/shopBadges";

type ShopBadgeData = Pick<
  Shop | ShopSummary,
  | "is_premium"
  | "premium_until"
  | "popularity_badge"
  | "rating"
  | "reviews_count"
  | "completed_orders_count"
>;

interface ShopFeatureBadgesProps {
  shop: ShopBadgeData;
  className?: string;
}

const badgeBaseClassName =
  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-[0_10px_25px_rgba(0,0,0,0.18)] backdrop-blur-md whitespace-nowrap";

function ShopFeatureBadges({
  shop,
  className = "",
}: ShopFeatureBadgesProps) {
  const { t } = useTranslation();

  const popularityBadge = getShopPopularityBadge(shop);
  const premium = isShopPremium(shop);

  return (
    <div
      className={`flex min-h-10 flex-wrap items-center gap-2 ${className}`.trim()}
    >
      {premium ? (
        <span
          className={`${badgeBaseClassName} border-[#9fe5ff]/35 bg-[#081822]/85 text-[#d3f4ff]`}
        >
          <span aria-hidden="true" className="text-sm">
            💎
          </span>

          {t("shopsPage.premiumBoutique")}
        </span>
      ) : null}

      {popularityBadge ? (
        <span
          className={`${badgeBaseClassName} ${
            popularityBadge === "best_seller"
              ? "border-[#ffbe7a]/35 bg-[#231106]/85 text-[#ffe0b3]"
              : "border-[#f6dca0]/35 bg-[#211b0a]/85 text-[#fff0c7]"
          }`}
        >
          <span aria-hidden="true" className="text-sm">
            {popularityBadge === "best_seller" ? "🔥" : "⭐"}
          </span>

          {popularityBadge === "best_seller"
            ? t("shopsPage.bestSeller")
            : t("shopsPage.mostPopular")}
        </span>
      ) : null}
    </div>
  );
}

export default ShopFeatureBadges;