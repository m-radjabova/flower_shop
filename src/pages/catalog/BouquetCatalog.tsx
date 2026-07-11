import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaInstagram, FaTelegramPlane, FaCheckCircle, FaTag, FaFilter, FaLeaf } from "react-icons/fa";
import { toast } from "react-toastify";
import { CART_AUTH_REQUIRED_MESSAGE, CART_SINGLE_BOUQUET_MESSAGE, addToCart } from "../../utils/cart";
import {
  HiArrowRight,
  HiHeart,
  HiOutlineBars3BottomLeft,
  HiOutlineHeart,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiXMark,
  HiStar,
  HiFire,
  HiOutlineAdjustmentsHorizontal,
  HiMiniGlobeAlt,
  HiOutlineCheckBadge,
  HiMiniGift,
  HiOutlineEye,
} from "react-icons/hi2";
import { useCategories, useInfiniteBouquets } from "../../hooks/useCatalog";
import { useDebounce } from "../../hooks/useDebounce";
import { useFavoriteIds } from "../../hooks/useFavorites";
import BouquetAvailabilityBadge from "../../components/catalog/BouquetAvailabilityBadge";
import {
  formatPrice,
  getBouquetImages,
  getComputedDiscountPercent,
  getComputedOldPrice,
  isBouquetAvailable,
  isNewBouquet,
} from "../../utils/catalog";
import { FAVORITES_AUTH_REQUIRED_MESSAGE, toggleFavoriteBouquet } from "../../utils/favorites";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";
import { getBouquetPath } from "../../utils/routes";
import { BouquetGridSkeleton } from "../../components/PageSkeletons";
import type { Bouquet } from "../../types/catalog";
import bouquetsPageBackground from "../../assets/bouquets_page_bg.png";


const RatingStars = ({ rating }: { rating: number | string }) => {
  const numericRating = Number(rating) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <HiStar
          key={i}
          className={`text-xs transition-colors duration-200 ${
            i < Math.floor(numericRating)
              ? "text-amber-400"
              : "text-gray-600"
          }`}
        />
      ))}
    </div>
  );
};

const DiscountBadge = ({ price }: { price: string }) => {
  const discountPercent = getComputedDiscountPercent(price);
  if (discountPercent <= 0) return null;
  return (
    <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
      -{discountPercent}%
    </span>
  );
};

const FloatingPetals = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute animate-float-petal"
        style={{
          left: `${8 + (i * 12) % 88}%`,
          top: `${-10 + (i * 5) % 20}%`,
          animationDelay: `${i * 2.2}s`,
          animationDuration: `${16 + (i % 4) * 5}s`,
          fontSize: `${0.55 + (i % 3) * 0.25}rem`,
          transform: `rotate(${i * 45}deg)`,
          opacity: 0.1 + (i % 3) * 0.07,
          color: i % 2 === 0 ? "#cb5c57" : "#ff9b88",
        }}
      >
        <FaLeaf />
      </div>
    ))}
  </div>
);

function resolveCategoryFromParam(
  value: string | null,
  categories: { id: string; slug: string; name: string }[],
) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return (
    categories.find((category) => {
      const candidates = [category.id, category.slug, category.name]
        .filter(Boolean)
        .map((candidate) => String(candidate).trim().toLowerCase());
      return candidates.includes(normalized);
    }) ?? null
  );
}

function BouquetCatalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromParams = searchParams.get("search") ?? "";
  const categoryFromParams = searchParams.get("category");
  const { register, watch, setValue } = useForm<{ search: string }>({
    defaultValues: { search: searchFromParams },
  });
  const search = watch("search");
  const [view, setView] = useState<"grid" | "list">("grid");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const trimmedSearch = search.trim();
  const debouncedSearch = useDebounce(trimmedSearch, 450);
  const favoriteIds = useFavoriteIds();
  const effectiveSearch = trimmedSearch ? debouncedSearch : "";
  const categoriesQuery = useCategories();
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const activeCategory = useMemo(
    () => resolveCategoryFromParam(categoryFromParams, categories),
    [categoryFromParams, categories],
  );
  const bouquetsQuery = useInfiniteBouquets({
    categoryId: activeCategory?.id ?? undefined,
    search: effectiveSearch || undefined,
    limit: 9,
  });
  const bouquets = useMemo(
    () => bouquetsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bouquetsQuery.data],
  );
  const total = bouquetsQuery.data?.pages[0]?.total ?? 0;
  const hasActiveFilters = Boolean(activeCategory || effectiveSearch);

  const getLocalizedCategoryName = (category?: { name?: string | null; slug?: string | null }) =>
    category?.name ?? "";

  useEffect(() => {
    if (categoriesQuery.isLoading || !categoryFromParams || activeCategory) return;
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    setSearchParams(next, { replace: true });
  }, [activeCategory, categoryFromParams, categoriesQuery.isLoading, searchParams, setSearchParams]);

  useEffect(() => {
    setValue("search", searchFromParams);
  }, [searchFromParams, setValue]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let shouldUpdate = false;
    if (activeCategory) {
      if (next.get("category") !== activeCategory.slug) {
        next.set("category", activeCategory.slug);
        shouldUpdate = true;
      }
    } else if (next.has("category")) {
      next.delete("category");
      shouldUpdate = true;
    }
    if (effectiveSearch) {
      if (next.get("search") !== effectiveSearch) {
        next.set("search", effectiveSearch);
        shouldUpdate = true;
      }
    } else if (next.has("search")) {
      next.delete("search");
      shouldUpdate = true;
    }
    if (shouldUpdate) setSearchParams(next, { replace: true });
  }, [activeCategory, effectiveSearch, searchParams, setSearchParams]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && bouquetsQuery.hasNextPage && !bouquetsQuery.isFetchingNextPage)
          bouquetsQuery.fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [bouquetsQuery]);

  // ─── helpers ──────────────────────────────────

  const clearAllFilters = () => {
    setValue("search", "");
    setSearchParams((cur) => {
      const next = new URLSearchParams(cur);
      next.delete("category");
      next.delete("search");
      next.delete("occasion");
      return next;
    });
  };

  const renderCategoryChips = () => (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      <button
        type="button"
        onClick={() =>
          setSearchParams((cur) => {
            const next = new URLSearchParams(cur);
            next.delete("category");
            return next;
          })
        }
        className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
          activeCategory === null
            ? "border-[#cb5c57] bg-[#cb5c57] text-white"
            : "border-[#5f2825]/50 bg-[#100506]/60 text-[#dfc0b8] hover:border-[#cb5c57]/60 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <HiOutlineSparkles size={11} />
          {t("catalog.allBouquets")}
        </span>
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() =>
            setSearchParams((cur) => {
              const next = new URLSearchParams(cur);
              next.set("category", category.slug);
              return next;
            })
          }
          className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
            activeCategory?.id === category.id
              ? "border-[#cb5c57] bg-[#cb5c57] text-white"
              : "border-[#5f2825]/50 bg-[#100506]/60 text-[#dfc0b8] hover:border-[#cb5c57]/60 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <HiMiniGift size={11} />
            {getLocalizedCategoryName(category)}
          </span>
        </button>
      ))}
    </div>
  );

  const renderBouquetCard = (bouquet: Bouquet, idx: number) => {
    const previewImages = getBouquetImages(bouquet).slice(1, 3);
    const isFavorite = favoriteIds.has(bouquet.id);
    const isNew = isNewBouquet(bouquet.created_at);
    const isPopular = Number(bouquet.rating) >= 4.5 && bouquet.reviews_count >= 20;
    const shopInstagramUrl = bouquet.shop.instagram ? normalizeInstagramLink(bouquet.shop.instagram) : "";
    const shopTelegramUrl = bouquet.shop.telegram ? normalizeTelegramLink(bouquet.shop.telegram) : "";
    const isHovered = hoveredCard === bouquet.id;
    const canAddToCart = isBouquetAvailable(bouquet);
    const bouquetPath = getBouquetPath(bouquet);

    return (
      <article
        key={bouquet.id}
        onMouseEnter={() => setHoveredCard(bouquet.id)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => navigate(bouquetPath)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(bouquetPath);
          }
        }}
        role="button"
        tabIndex={0}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-[#3a1214]/60 bg-[#120708] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#cb5c57]/40 hover:shadow-xl hover:shadow-[#cb5c57]/10 animate-fade-in-up ${
          view === "list" ? "lg:grid lg:grid-cols-[280px_1fr]" : ""
        }`}
        style={{ animationDelay: `${idx * 50}ms` }}
      >
        {/* Image */}
        <div className={`relative overflow-hidden bg-[#1a0809] ${view === "list" ? "lg:h-full" : ""}`}>
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#120708]/80 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1">
              {isNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#dd3045] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  <HiOutlineSparkles size={8} />
                  {t("catalog.new")}
                </span>
              )}
              {isPopular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  <HiFire size={8} />
                  {t("catalog.popular")}
                </span>
              )}
            </div>
            <BouquetAvailabilityBadge bouquet={bouquet} compact />
          </div>

          <DiscountBadge price={bouquet.price} />

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const result = toggleFavoriteBouquet(bouquet);
              if (!result.ok) {
                toast.info(FAVORITES_AUTH_REQUIRED_MESSAGE, { position: "bottom-right", autoClose: 2200, hideProgressBar: true });
                return;
              }
              toast.success(
                result.added
                  ? `${bouquet.name} ${t("catalog.addedToFavorites")}`
                  : `${bouquet.name} ${t("catalog.removedFromFavorites")}`,
                { position: "bottom-right", autoClose: 1600, hideProgressBar: true }
              );
            }}
            className={`absolute left-2.5 bottom-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
              isFavorite
                ? "border-[#ff5b72]/60 bg-[#ff5b72]/20 text-[#ff5b72]"
                : "border-[#8c6158]/40 bg-[#19090a]/60 text-[#f6dacf] hover:border-[#ff5b72]/60 hover:text-[#ff5b72]"
            }`}
            aria-label={isFavorite ? t("catalog.removeFromFavorites") : t("catalog.addToFavorites")}
          >
            {isFavorite ? <HiHeart size={14} /> : <HiOutlineHeart size={14} />}
          </button>

          <img
            src={bouquet.image}
            alt={bouquet.name}
            loading="lazy"
            className={`w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
              view === "list" ? "lg:h-full lg:min-h-[280px] h-[220px]" : "h-[240px] sm:h-[280px]"
            }`}
          />

          {/* Preview thumbnails */}
          {previewImages.length > 0 && view === "grid" && (
            <div className="absolute bottom-2.5 right-2.5 z-10 flex gap-1">
              {previewImages.map((image: string, index: number) => (
                <div
                  key={image}
                  className="overflow-hidden rounded-lg border border-white/15 shadow-md transition-transform duration-200 hover:scale-110"
                >
                  <img
                    loading="lazy"
                    src={image}
                    alt={`${bouquet.name} ${index + 2}`}
                    className="h-9 w-9 object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Quick view overlay */}
          <div
            className={`absolute inset-x-0 bottom-0 z-10 p-3 pt-10 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(bouquetPath);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#cb5c57]/90 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-[#cb5c57]"
            >
              <HiOutlineEye size={13} />
              {t("catalog.quickView")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {bouquet.category && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#5f2825]/40 bg-[#210b0d] px-2 py-0.5 text-[10px] font-medium text-[#f1c5ba]">
                  <FaTag size={7} />
                  {getLocalizedCategoryName(bouquet.category)}
                </span>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <RatingStars rating={bouquet.rating} />
                <span className="text-xs font-semibold text-white">{bouquet.rating}</span>
                <span className="text-[10px] text-[#8b6b64]">({bouquet.reviews_count})</span>
              </div>
            </div>

            <Link
              to={bouquetPath}
              onClick={(e) => e.stopPropagation()}
              className="block font-great-vibes text-[2rem] sm:text-[2.2rem] leading-tight text-[#fff3ee] transition-colors duration-200 hover:text-[#ff9b88]"
            >
              {bouquet.name}
            </Link>

            <Link
              to={`/shops/${bouquet.shop.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-[#bfa09a] transition-colors hover:text-[#ffe1d8]"
            >
              <HiMiniGlobeAlt size={11} />
              {bouquet.shop.name}
            </Link>

            {(shopInstagramUrl || shopTelegramUrl) && (
              <div className="flex gap-1.5">
                {shopInstagramUrl && (
                  <a
                    href={shopInstagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full border border-[#5f2825]/40 bg-[#120607] px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[#efc2b8] transition-colors hover:border-[#cb5c57]/60 hover:text-white"
                  >
                    <FaInstagram size={9} />
                    IG
                  </a>
                )}
                {shopTelegramUrl && (
                  <a
                    href={shopTelegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full border border-[#5f2825]/40 bg-[#120607] px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[#efc2b8] transition-colors hover:border-[#cb5c57]/60 hover:text-white"
                  >
                    <FaTelegramPlane size={9} />
                    TG
                  </a>
                )}
              </div>
            )}

            {view === "list" && bouquet.description && (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#d4b8b0]">
                {bouquet.description}
              </p>
            )}
          </div>

          {/* Price + Cart */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#3a1214]/60 pt-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">{formatPrice(bouquet.price)}</span>
                <span className="text-sm text-[#7a5a52] line-through">{formatPrice(getComputedOldPrice(bouquet.price))}</span>
              </div>
              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <HiOutlineCheckBadge size={9} />
                {t("catalog.greatDeal")}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!canAddToCart) {
                  toast.error(`${bouquet.name} ${t("availability.outOfStockMessage")}`, {
                    position: "bottom-right",
                    autoClose: 1600,
                    hideProgressBar: true,
                  });
                  return;
                }
                const result = addToCart(bouquet);
                if (!result.ok) {
                  toast.info(result.reason === "auth_required" ? CART_AUTH_REQUIRED_MESSAGE : CART_SINGLE_BOUQUET_MESSAGE, {
                    position: "bottom-right",
                    autoClose: 2600,
                    hideProgressBar: true,
                  });
                  return;
                }
                toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`, {
                  position: "bottom-right",
                  autoClose: 1600,
                  hideProgressBar: true,
                });
              }}
              disabled={!canAddToCart}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 ${
                canAddToCart
                  ? "bg-[#aa1828] text-white hover:bg-[#c01f30] active:scale-95"
                  : "cursor-not-allowed border border-[#5b2b31]/40 bg-[#1a0b0d] text-[#8a6860] opacity-70"
              }`}
            >
              <HiOutlineShoppingBag size={14} />
              {canAddToCart ? t("catalog.add") : t("availability.outOfStock")}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderEmptyState = () => (
    <div className="mt-10 rounded-2xl border border-dashed border-[#5f2825]/40 bg-[#0f0506]/60 px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#1a0c0c] border border-[#5f2825]/30">
        <HiOutlineMagnifyingGlass className="text-3xl text-[#cb5c57]" />
      </div>
      <h2 className="font-great-vibes text-5xl leading-tight text-[#fff0ea]">{t("catalog.noBouquetsFound")}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#c9aba4]">
        {t("catalog.noBouquetsDesc")}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={clearAllFilters}
          className="inline-flex items-center gap-2 rounded-full bg-[#cb5c57] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#bb4a45] active:scale-[0.98]"
        >
          {t("catalog.browseAll")}
          <HiArrowRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-2 rounded-full border border-[#5f2825]/50 bg-[#1b0b0c] px-6 py-2.5 text-sm font-medium text-[#f5ddd6] transition-colors hover:border-[#cb5c57]/50 hover:text-white"
        >
          <HiOutlineAdjustmentsHorizontal size={13} />
          {t("catalog.adjustFilters")}
        </button>
      </div>
    </div>
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden text-[#fff6f4]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <img
          src={bouquetsPageBackground}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-80"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-15 bg-gradient-to-b from-[#0a0203]/75 via-[#0a0203]/55 to-[#0a0203]/80" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#cb5c57]/8 blur-3xl" />
        <div className="absolute -right-20 top-48 h-80 w-80 rounded-full bg-[#ff7e8d]/6 blur-3xl" />
      </div>
      <FloatingPetals />

      <section className="relative z-10 px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pt-36">
        <div className="mx-auto max-w-7xl">

          {/* ── Hero ── */}
          <div className="mb-8 text-center">
            <h1 className="font-great-vibes text-[clamp(3.2rem,7vw,6rem)] leading-[0.9] text-[#fff6f1] [text-shadow:0_8px_28px_rgba(0,0,0,0.5)]">
              {activeCategory ? getLocalizedCategoryName(activeCategory) : t("catalog.findYour")}
              <span className="block text-[#ff9b88]">
                {activeCategory ? t("catalog.bouquetsCollection") : t("catalog.perfectBouquet")}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#f0d8d0]/80">
              {activeCategory
                ? t("catalog.categoryHeroDescription", { category: getLocalizedCategoryName(activeCategory) })
                : t("catalog.defaultHeroDescription")}
            </p>

            {/* Stats row */}
            <div className="mt-6 inline-flex items-center gap-6 rounded-2xl border border-[#5f2825]/30 bg-[#100506]/70 px-6 py-3 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{total.toLocaleString()}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#c9a09a]">{t("catalog.totalBouquets")}</p>
              </div>
              <div className="h-8 w-px bg-[#5f2825]/40" />
              <div className="text-center">
                <p className="text-lg font-bold text-[#ff9b88]">{bouquets.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#c9a09a]">{t("catalog.currentlyShowing")}</p>
              </div>
              <div className="h-8 w-px bg-[#5f2825]/40" />
              <div className="text-center">
                <p className={`text-lg font-bold ${activeCategory ? "text-amber-400" : "text-white"}`}>
                  {activeCategory ? getLocalizedCategoryName(activeCategory) : t("bouquetSection.all")}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#c9a09a]">{t("catalog.allCategories")}</p>
              </div>
            </div>
          </div>

          {/* ── Sticky Filters Bar ── */}
          <div
            className={`sticky top-14 sm:top-16 z-20 mb-6 rounded-2xl border border-[#3a1214]/60 bg-[#0d0405]/90 p-3 backdrop-blur-xl transition-shadow duration-300 ${
              scrolled ? "shadow-xl shadow-black/40" : ""
            }`}
          >
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="group relative flex-1">
                  <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c88f88] transition-colors group-focus-within:text-[#ff9b88]" />
                  <input
                    {...register("search")}
                    placeholder={t("catalog.searchPlaceholder")}
                    className="h-11 w-full rounded-xl border border-[#5f2825]/50 bg-[#090304]/80 pl-10 pr-9 text-sm text-[#fffaf8] outline-none transition-all duration-200 placeholder:text-[#9c7269] focus:border-[#cb5c57]/70 focus:bg-[#090304]"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue("search", "");
                        setSearchParams((cur) => {
                          const next = new URLSearchParams(cur);
                          next.delete("search");
                          return next;
                        });
                      }}
                      className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#c9aaa2] transition hover:bg-[#2b1012] hover:text-white"
                    >
                      <HiXMark size={13} />
                    </button>
                  )}
                </div>

                {/* View toggle */}
                <div className="inline-flex self-start sm:self-auto rounded-xl border border-[#5f2825]/50 bg-[#090304]/80 p-1">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 ${
                      view === "grid"
                        ? "bg-[#cb5c57] text-white"
                        : "text-[#ad8d85] hover:bg-[#2b1012] hover:text-white"
                    }`}
                    title={t("catalog.gridView")}
                    aria-label={t("catalog.gridView")}
                  >
                    <HiOutlineSquares2X2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 ${
                      view === "list"
                        ? "bg-[#cb5c57] text-white"
                        : "text-[#ad8d85] hover:bg-[#2b1012] hover:text-white"
                    }`}
                    title={t("catalog.listView")}
                    aria-label={t("catalog.listView")}
                  >
                    <HiOutlineBars3BottomLeft size={15} />
                  </button>
                </div>

                {/* Result count pill */}
                <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-[#5f2825]/40 bg-[#090304]/80 px-4 py-2.5">
                  <FaCheckCircle size={10} className="text-emerald-400 shrink-0" />
                  <span className="text-xs text-[#c9a09a]">{t("catalog.results")}</span>
                  <span className="text-sm font-bold text-white">
                    <span className="text-[#ff9b88]">{bouquets.length}</span>
                    <span className="text-[#5a3a36] mx-1">/</span>
                    {total}
                  </span>
                </div>
              </div>

              {/* Category chips */}
              {renderCategoryChips()}
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b88d84]">
                <FaFilter size={8} className="inline mr-1" />
                {t("catalog.activeFilters")}
              </span>
              {effectiveSearch && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cb5c57]/30 bg-[#cb5c57]/10 px-3 py-1 text-[11px] text-[#ffcfc8]">
                  "{effectiveSearch}"
                  <button
                    type="button"
                    onClick={() => {
                      setValue("search", "");
                      setSearchParams((cur) => {
                        const next = new URLSearchParams(cur);
                        next.delete("search");
                        return next;
                      });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    <HiXMark size={11} />
                  </button>
                </span>
              )}
              {activeCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cb5c57]/30 bg-[#cb5c57]/10 px-3 py-1 text-[11px] text-[#ffcfc8]">
                  {getLocalizedCategoryName(activeCategory)}
                  <button
                    type="button"
                    onClick={() =>
                      setSearchParams((cur) => {
                        const next = new URLSearchParams(cur);
                        next.delete("category");
                        return next;
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    <HiXMark size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] text-[#c9a09a] transition-colors hover:text-white"
              >
                <HiXMark size={11} />
                {t("catalog.clearFilters")}
              </button>
            </div>
          )}

          {/* ── Grid ── */}
          {bouquetsQuery.isLoading ? (
            <BouquetGridSkeleton
              count={6}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              imageClassName="h-[240px] w-full rounded-t-2xl"
            />
          ) : bouquets.length ? (
            <div
              className={`grid gap-5 ${
                view === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              }`}
            >
              {bouquets.map((bouquet, idx) => renderBouquetCard(bouquet, idx))}
            </div>
          ) : (
            renderEmptyState()
          )}

          <div ref={loadMoreRef} className="h-4" />

          {/* Loading more */}
          {bouquetsQuery.isFetchingNextPage && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#5f2825]/40 bg-[#0f0506]/80 px-5 py-2.5 backdrop-blur-sm">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ff9b88]"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#f1d0c8]">{t("catalog.loadingMore")}</span>
              </div>
            </div>
          )}

          {/* End of results */}
          {!bouquetsQuery.hasNextPage && bouquets.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#5f2825]/30 bg-[#0f0506]/50 px-5 py-2.5 backdrop-blur-sm">
                <HiMiniGift size={14} className="text-[#ff9b88]" />
                <span className="text-sm text-[#f1d0c8]">{t("catalog.seenAll")}</span>
                <span className="text-xs text-[#7a5a52]">
                  {total} {t("catalog.bouquetsLoaded")}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatPetals {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          8%   { opacity: 0.5; }
          92%  { opacity: 0.5; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out both;
        }
        .animate-float-petal {
          animation: floatPetals linear infinite;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}

export default BouquetCatalog;
