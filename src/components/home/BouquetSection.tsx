import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  HiArrowRight,
  HiEye,
  HiHeart,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiStar,
} from "react-icons/hi2";
import { LuFlower2 } from "react-icons/lu";
import type { Bouquet, Category } from "../../types/catalog";
import { useFavoriteIds } from "../../hooks/useFavorites";
import BouquetAvailabilityBadge from "../catalog/BouquetAvailabilityBadge";
import {
  CART_AUTH_REQUIRED_MESSAGE,
  CART_SINGLE_BOUQUET_MESSAGE,
  addToCart,
} from "../../utils/cart";
import {
  formatPrice,
  getComputedDiscountPercent,
  getComputedOldPrice,
  isBouquetAvailable,
  isNewBouquet,
} from "../../utils/catalog";
import {
  FAVORITES_AUTH_REQUIRED_MESSAGE,
  toggleFavoriteBouquet,
} from "../../utils/favorites";
import { getBouquetPath } from "../../utils/routes";
import { BouquetGridSkeleton } from "../PageSkeletons";
import ShopVerifiedBadge from "../shops/ShopVerifiedBadge";

interface BouquetSectionProps {
  bouquets: Bouquet[];
  categories: Category[];
  isLoading: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function getStaggerOffset(index: number) {
  const column = index % 3;
  if (column === 1) return "sm:mt-8 lg:mt-16 xl:mt-20";
  if (column === 2) return "lg:mt-4 xl:mt-8";
  return "";
}

function BouquetSection({ bouquets, isLoading }: BouquetSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const favoriteIds = useFavoriteIds();
  const shouldReduceMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  const reveal = shouldReduceMotion
    ? { duration: 0.2 }
    : { duration: 0.8, ease: EASE };

  const handleFavoriteClick = (event: React.MouseEvent, bouquet: Bouquet) => {
    event.stopPropagation();
    const result = toggleFavoriteBouquet(bouquet);
    if (!result.ok) {
      toast.info(FAVORITES_AUTH_REQUIRED_MESSAGE, {
        position: "bottom-right",
        autoClose: 2400,
        theme: "colored",
      });
      return;
    }
    toast.success(
      result.added
        ? `${bouquet.name} ${t("bouquetSection.addedToFavorites")}`
        : `${bouquet.name} ${t("bouquetSection.removedFromFavorites")}`,
      { position: "bottom-right", autoClose: 2000, theme: "colored" }
    );
  };

  const handleAddToCart = (event: React.MouseEvent, bouquet: Bouquet) => {
    event.stopPropagation();
    if (!isBouquetAvailable(bouquet)) {
      toast.error(`${bouquet.name} ${t("availability.outOfStockMessage")}`);
      return;
    }
    const result = addToCart(bouquet);
    if (!result.ok) {
      toast.info(
        result.reason === "auth_required"
          ? CART_AUTH_REQUIRED_MESSAGE
          : CART_SINGLE_BOUQUET_MESSAGE,
        { position: "bottom-right", autoClose: 2600, theme: "colored" }
      );
      return;
    }
    toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`, {
      position: "bottom-right",
      autoClose: 2000,
      theme: "colored",
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      id="bouquets"
      className="relative mx-auto max-w-7xl scroll-mt-28 px-4 pb-24 pt-4 sm:px-6 sm:pb-32 lg:px-10"
    >
      {/* ── Ambient glow field ── */}
      {/* <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full bg-[#cb5c57]/10 blur-[120px]" />
        <div className="absolute -left-44 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#7a1e33]/10 blur-[140px]" />
        <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[#ff9b88]/5 blur-[100px]" />
      </div> */}

      <div className="relative">
        {/* ── Editorial header ── */}
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: 32 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={reveal}
          className="relative mb-14 text-center sm:mb-20"
        >
          

          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="relative inline-flex items-center gap-2 rounded-full border border-[#ff8fa0]/20 bg-white/[0.04] px-4 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.32em] text-[#ffb3a3] backdrop-blur-md"
          >
            <HiOutlineSparkles className="text-[#ff8fa0]" size={13} />
            {t("bouquetSection.eyebrow")}
            <HiOutlineSparkles className="text-[#ff8fa0]" size={13} />
          </motion.span>

          <h2 className="relative mt-4 font-great-vibes text-[clamp(3rem,7vw,5.5rem)] leading-none text-[#fdf1e9] [text-shadow:0_8px_30px_rgba(0,0,0,0.35),0_0_60px_rgba(203,92,87,0.18)]">
            {t("bouquetSection.newFlowers")}
          </h2>

          <p className="relative mx-auto mt-3 max-w-xl px-2 text-sm leading-relaxed text-[#c9aaa1] sm:text-base">
            {t("bouquetSection.subtitle")}
          </p>

          <div className="relative mt-6 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#ff8fa0]/60 sm:w-24" />
            <span className="flex h-8 w-8 rotate-45 items-center justify-center rounded-[0.7rem] border border-[#ff8fa0]/25 bg-[#1a0a10]/60">
              <LuFlower2 className="-rotate-45 text-[#ff9b88]" size={14} />
            </span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#ff8fa0]/60 sm:w-24" />
          </div>
        </motion.header>

        {/* ── Bouquet grid ── */}
        {isLoading ? (
          <BouquetGridSkeleton
            count={9}
            className="grid items-start gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8 xl:gap-y-14"
            imageClassName="h-[300px] w-full sm:h-[380px] lg:h-[420px]"
          />
        ) : bouquets.length ? (
          <div className="grid items-start gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8 xl:gap-y-14">
            {bouquets.map((bouquet, idx) => {
              const bouquetPath = getBouquetPath(bouquet);
              const isFavorite = favoriteIds.has(bouquet.id);
              const showNewBadge = isNewBouquet(bouquet.created_at);
              const canAddToCart = isBouquetAvailable(bouquet);
              const imageReady = imageLoaded[`bouquet-${bouquet.id}`] !== false;
              const discountPercent = getComputedDiscountPercent(bouquet.price);

              return (
                <motion.article
                  id={`bouquet-${bouquet.id}`}
                  key={bouquet.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNavigate(bouquetPath)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleNavigate(bouquetPath);
                    }
                  }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 64, scale: 0.95 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: (idx % 3) * 0.12, duration: 0.85, ease: EASE }}
                  whileHover={shouldReduceMotion ? undefined : { y: -12 }}
                  className={`bouquet-card group relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0507] ${getStaggerOffset(idx)}`}
                >
                  {/* hover glow */}
                  <div
                    className="pointer-events-none absolute -inset-1 rounded-[2.6rem] bg-gradient-to-br from-[#cb5c57]/30 via-transparent to-[#ff8fa0]/15 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
                    aria-hidden="true"
                  />

                  <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.07] bg-[linear-gradient(180deg,#221017_0%,#170a0e_55%,#0f0608_100%)] shadow-[0_24px_50px_-18px_rgba(0,0,0,0.75)] transition-[border-color,box-shadow] duration-500 group-hover:border-[#ff8fa0]/35 group-hover:shadow-[0_36px_90px_-24px_rgba(255,84,110,0.25)]">
                    {/* ── Arch image ── */}
                    <div className="relative mx-1 mt-1 overflow-hidden rounded-t-[999px] rounded-b-[1.4rem] sm:mx-2 sm:mt-2">
                      {!imageReady && (
                        <div className="absolute inset-0 z-10 animate-pulse bg-[linear-gradient(180deg,#3a1220_0%,#240b12_60%,#17070b_100%)]" />
                      )}

                      {/* ── Badges ── */}
                      <div className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1">
                        {showNewBadge && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#d32945] to-[#ff5f78] px-3 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#ff5f78]/25">
                            <HiOutlineSparkles className="animate-pulse" size={10} />
                            {t("bouquetSection.new")}
                          </span>
                        )}
                        {discountPercent > 0 && (
                          <span className="rounded-full bg-black/55 px-3 py-1 text-[0.62rem] font-extrabold text-[#ffd9c7] ring-1 ring-white/15 backdrop-blur-md">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* ── Availability Badge ── */}
                      <div className="absolute bottom-2 left-2 z-20 sm:bottom-3 sm:left-3">
                        <BouquetAvailabilityBadge bouquet={bouquet} compact />
                      </div>

                      {/* ── Image ── */}
                      <Link to={bouquetPath} tabIndex={-1} onClick={(event) => event.stopPropagation()} aria-label={bouquet.name}>
                        <img
                          src={bouquet.image}
                          alt={bouquet.name}
                          loading="lazy"
                          onLoad={() =>
                            setImageLoaded((prev) => ({ ...prev, [`bouquet-${bouquet.id}`]: true }))
                          }
                          className={`h-[300px] w-full object-cover object-top transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 sm:h-[380px] lg:h-[420px] ${
                            imageReady ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </Link>

                      {/* ── Image overlay ── */}
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120709]/70 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-30"
                        aria-hidden="true"
                      />

                      {/* ── Favorite Button ── */}
                      <motion.button
                        type="button"
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.8 }}
                        onClick={(event) => handleFavoriteClick(event, bouquet)}
                        aria-label={isFavorite ? t("bouquetSection.removeFromFavorites") : t("bouquetSection.addToFavorites")}
                        className="absolute right-2 top-2 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#100507]/60 text-[#fff0ea] backdrop-blur-md transition-colors duration-300 hover:border-[#ff7d95]/70 hover:bg-[#ff5b72]/20 sm:right-3 sm:top-3"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={isFavorite ? "filled" : "outline"}
                            initial={shouldReduceMotion ? false : { scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={
                              shouldReduceMotion
                                ? undefined
                                : { scale: 1.5, opacity: 0, transition: { duration: 0.15 } }
                            }
                            transition={{ type: "spring", stiffness: 500, damping: 18 }}
                            className="flex"
                          >
                            {isFavorite ? (
                              <HiHeart className="text-[#ff6b85] drop-shadow-[0_0_8px_rgba(255,87,110,0.6)]" size={16} />
                            ) : (
                              <HiOutlineHeart size={16} />
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>

                      {/* ── Quick View Pill ── */}
                      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/90 ring-1 ring-white/15 backdrop-blur-md">
                          <HiEye size={12} />
                          {t("bouquetSection.view")}
                        </span>
                      </div>
                    </div>

                    {/* ── Content ── */}
                    <div className="relative px-2.5 pb-6 pt-5 text-center sm:px-4">
                      {/* ── Shop Info ── */}
                      <Link
                        to={`/shops/${bouquet.shop?.slug ?? "#"}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.24em] text-[#ffab98] transition-colors duration-300 hover:text-white"
                      >
                        {bouquet.shop?.name ?? bouquet.category?.name ?? t("bouquetSection.all")}
                        {bouquet.shop?.is_verified ? (
                          <ShopVerifiedBadge className="h-3.5 w-3.5" iconClassName="h-3 w-3" />
                        ) : null}
                      </Link>

                      {/* ── Bouquet Name ── */}
                      <Link
                        to={bouquetPath}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1.5 block font-cormorant text-[1.55rem] font-bold leading-snug text-[#fdf2ea] transition-colors duration-300 hover:text-[#ffb8a4] sm:text-[1.7rem]"
                      >
                        {bouquet.name.length > 26 ? `${bouquet.name.slice(0, 26)}…` : bouquet.name}
                      </Link>

                      {/* ── Rating ── */}
                      <div className="mt-2 flex items-center justify-center gap-1.5">
                        <span className="flex items-center gap-0.5" aria-label={`${bouquet.rating} / 5`}>
                          {[...Array(5)].map((_, i) => {
                            const starValue = Number(bouquet.rating) || 0;
                            const filled = i < Math.floor(starValue);
                            const half = !filled && i < Math.ceil(starValue) && starValue % 1 >= 0.3;
                            return (
                              <HiStar
                                key={i}
                                className={
                                  filled
                                    ? "text-[#ffc86b] drop-shadow-[0_0_6px_rgba(255,190,90,0.35)]"
                                    : half
                                      ? "text-[#ffc86b]/50"
                                      : "text-white/15"
                                }
                                size={13}
                              />
                            );
                          })}
                        </span>
                        <span className="text-xs font-bold text-[#ffe9df]">{Number(bouquet.rating).toFixed(1)}</span>
                        <span className="text-[0.65rem] text-[#9e7d74]">
                          ({bouquet.reviews_count} {t("bouquetSection.reviews")})
                        </span>
                      </div>

                      {/* ── Ornament Divider ── */}
                      <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden="true">
                        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#ff8fa0]/40" />
                        <LuFlower2 className="text-[#ff9b8a]/70" size={12} />
                        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#ff8fa0]/40" />
                      </div>

                      {/* ── Price ── */}
                      <div className="mt-4 flex items-center justify-center gap-2.5">
                        <p className="text-[1.35rem] font-extrabold tracking-tight text-[#ffe6da]">
                          {formatPrice(bouquet.price)}
                        </p>
                        <p className="text-xs font-medium text-[#a1847c] line-through">
                          {formatPrice(getComputedOldPrice(bouquet.price))}
                        </p>
                      </div>

                      {/* ── Add to Cart Button ── */}
                      <button
                        type="button"
                        onClick={(event) => handleAddToCart(event, bouquet)}
                        disabled={!canAddToCart}
                        className={`group/btn mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.7rem] font-extrabold uppercase tracking-[0.22em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#100708] ${
                          canAddToCart
                            ? "bg-[linear-gradient(110deg,#74202f_0%,#a52a3c_45%,#c73a4e_100%)] text-white shadow-[0_12px_30px_-8px_rgba(207,60,84,0.45)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-8px_rgba(207,60,84,0.6)] active:scale-[0.97]"
                            : "cursor-not-allowed border border-white/10 bg-white/[0.04] text-[#c9aca4]/70"
                        }`}
                      >
                        <HiOutlineShoppingBag
                          className="transition-transform duration-300 group-hover/btn:-translate-x-0.5 group-hover/btn:scale-110"
                          size={15}
                        />
                        {canAddToCart ? t("bouquetSection.addToCart") : t("availability.outOfStock")}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="relative mx-auto max-w-xl rounded-[2rem] border border-dashed border-[#7a3a3a]/60 bg-[#160a0d]/60 px-6 py-14 text-center backdrop-blur-sm sm:px-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#ff8fa0]/25 bg-gradient-to-br from-[#26101a] to-[#140709]">
              <LuFlower2 className="text-[#ff9b8a]" size={26} />
            </div>
            <h3 className="font-cormorant text-3xl font-semibold text-[#fff2eb]">
              {t("bouquetSection.noFlowersTitle")}
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#c6a79d]">
              {t("bouquetSection.noFlowersDesc")}
            </p>
            <Link
              to="/bouquets"
              className="group mt-7 inline-flex items-center gap-2 rounded-full border border-[#ff8fa0]/40 bg-[#2b0f18]/80 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#ffd9cd] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff8fa0] hover:bg-[#ff5b72]/15 hover:text-white hover:shadow-lg hover:shadow-[#ff5b72]/20"
            >
              {t("bouquetSection.browseAllFlowers")}
              <HiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        )}

        {/* ── Bottom CTA ── */}
        {bouquets.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
            className="relative mt-14 flex flex-col items-center gap-4 sm:mt-20"
          >
            <span className="h-px w-40 bg-gradient-to-r from-transparent via-[#ff8fa0]/50 to-transparent" aria-hidden="true" />
            <Link
              to="/bouquets"
              className="group inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[#ff8fa0]/35 bg-white/[0.03] px-8 text-[0.72rem] font-extrabold uppercase tracking-[0.26em] text-[#ffd7ca] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff8fa0]/80 hover:bg-[#ff5b72]/15 hover:text-white hover:shadow-[0_16px_44px_-12px_rgba(255,91,114,0.5)]"
            >
              {t("bouquetSection.browseAllFlowers")}
              <HiArrowRight className="text-[#ff8fa0] transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default BouquetSection;