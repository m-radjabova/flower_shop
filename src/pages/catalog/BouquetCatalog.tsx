import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaInstagram, FaTelegramPlane, FaCheckCircle, FaTag, FaFilter, FaLeaf } from "react-icons/fa";
import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
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
  HiOutlineRocketLaunch,
  HiOutlineCheckBadge,
  HiOutlineArrowPath,
  HiMiniGift,
  HiOutlineEye,
} from "react-icons/hi2";
import { useCategories, useInfiniteBouquets } from "../../hooks/useCatalog";
import { useDebounce } from "../../hooks/useDebounce";
import { useFavoriteIds } from "../../hooks/useFavorites";
import BouquetAvailabilityBadge from "../../components/catalog/BouquetAvailabilityBadge";
import { formatPrice, getBouquetImages, isBouquetAvailable, isNewBouquet } from "../../utils/catalog";
import { toggleFavoriteBouquet } from "../../utils/favorites";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";
import { BouquetGridSkeleton } from "../../components/PageSkeletons";
import type { Bouquet } from "../../types/catalog";

// ────────────────── Sub‑components ──────────────────

const RatingStars = ({ rating }: { rating: number | string }) => {
  const numericRating = Number(rating) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <HiStar
          key={i}
          className={`text-xs transition-all duration-300 ${
            i < Math.floor(numericRating)
              ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] scale-110"
              : "text-gray-600"
          }`}
        />
      ))}
    </div>
  );
};

const DiscountBadge = ({ oldPrice, price }: { oldPrice?: string | null; price: string }) => {
  if (!oldPrice) return null;
  const discountPercent = Math.round((1 - Number(price) / Number(oldPrice)) * 100);
  if (discountPercent <= 0) return null;
  return (
    <span className="absolute -left-1.5 top-4 z-10 inline-flex items-center gap-1.5 rounded-r-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/40">
      <HiOutlineArrowPath size={10} className="animate-spin-slow" />
      -{discountPercent}%
    </span>
  );
};

const FloatingPetals = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float-petal"
          style={{
            left: `${5 + (i * 8.3) % 95}%`,
            top: `${-15 + (i * 6) % 25}%`,
            animationDelay: `${i * 1.8}s`,
            animationDuration: `${14 + (i % 5) * 4}s`,
            fontSize: `${0.6 + (i % 4) * 0.35}rem`,
            transform: `rotate(${i * 37}deg)`,
            opacity: 0.15 + (i % 3) * 0.12,
            color: i % 2 === 0 ? "#cb5c57" : "#ff9b88",
          }}
        >
          <FaLeaf />
        </div>
      ))}
    </div>
  );
};

// ──────────────────── Main component ────────────────────

const OCCASION_SEARCH_TERMS = {
  birthday: "birthday",
  anniversary: "anniversary",
  wedding: "wedding",
  newBaby: "new baby",
  getWell: "get well",
  romantic: "romantic",
} as const;

type OccasionKey = keyof typeof OCCASION_SEARCH_TERMS;

function isOccasionKey(value: string | null): value is OccasionKey {
  return value !== null && value in OCCASION_SEARCH_TERMS;
}

const CATEGORY_TRANSLATION_KEYS: Record<string, OccasionKey | "roses"> = {
  anniversary: "anniversary",
  birthday: "birthday",
  wedding: "wedding",
  "new-baby": "newBaby",
  "new baby": "newBaby",
  newborn: "newBaby",
  "get-well": "getWell",
  "get-well-soon": "getWell",
  "get well": "getWell",
  romantic: "romantic",
  roses: "roses",
};

function BouquetCatalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromParams = searchParams.get("search") ?? "";
  const occasionFromParams = searchParams.get("occasion");
  const activeOccasion = isOccasionKey(occasionFromParams) ? occasionFromParams : null;
  const activeOccasionSearch = activeOccasion ? OCCASION_SEARCH_TERMS[activeOccasion] : "";
  const activeOccasionTitle = activeOccasion ? t(`occasionSection.items.${activeOccasion}.title`) : "";
  const activeOccasionDescription = activeOccasion ? t(`occasionSection.items.${activeOccasion}.description`) : "";
  const displaySearchFromParams =
    activeOccasion && searchFromParams.trim().toLowerCase() === activeOccasionSearch.toLowerCase()
      ? activeOccasionTitle
      : searchFromParams;
  const { register, watch, setValue } = useForm<{ search: string }>({
    defaultValues: { search: displaySearchFromParams },
  });
  const search = watch("search");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const debouncedSearch = useDebounce(search.trim(), 450);
  const favoriteIds = useFavoriteIds();
  const searchMatchesActiveOccasion = Boolean(
    activeOccasion &&
      [activeOccasionSearch, activeOccasionTitle]
        .filter(Boolean)
        .some((value) => value.toLowerCase() === search.trim().toLowerCase()),
  );
  const effectiveSearch = searchMatchesActiveOccasion ? activeOccasionSearch : debouncedSearch;
  const categoriesQuery = useCategories();
  const bouquetsQuery = useInfiniteBouquets({
    categoryId: selectedCategoryId ?? undefined,
    search: effectiveSearch || undefined,
    limit: 9,
  });

  const bouquets = useMemo(
    () => bouquetsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bouquetsQuery.data],
  );
  const total = bouquetsQuery.data?.pages[0]?.total ?? 0;
  const selectedCategory = categoriesQuery.data?.find(
    (category) => category.id === selectedCategoryId,
  );
  const hasActiveFilters = Boolean(selectedCategoryId || effectiveSearch);
  const shouldShowSearchChip = Boolean(
    effectiveSearch && (!activeOccasion || effectiveSearch.toLowerCase() !== activeOccasionSearch.toLowerCase()),
  );
  const getLocalizedCategoryName = (category?: { name?: string | null; slug?: string | null }) => {
    if (!category) return "";
    const candidates = [category.slug, category.name]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());
    for (const candidate of candidates) {
      const key = CATEGORY_TRANSLATION_KEYS[candidate];
      if (!key) continue;
      if (key === "roses") return t("catalog.categoryLabels.roses");
      return t(`occasionSection.items.${key}.title`);
    }
    return category.name ?? "";
  };

  useEffect(() => {
    if (search !== displaySearchFromParams) {
      setValue("search", displaySearchFromParams);
    }
  }, [displaySearchFromParams, search, setValue]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let shouldUpdate = false;
    if (effectiveSearch) {
      if (next.get("search") !== effectiveSearch) {
        next.set("search", effectiveSearch);
        shouldUpdate = true;
      }
    } else if (next.has("search")) {
      next.delete("search");
      shouldUpdate = true;
    }
    if (!effectiveSearch || (activeOccasion && !searchMatchesActiveOccasion)) {
      if (next.has("occasion")) {
        next.delete("occasion");
        shouldUpdate = true;
      }
    }
    if (shouldUpdate) {
      setSearchParams(next, { replace: true });
    }
  }, [activeOccasion, effectiveSearch, searchMatchesActiveOccasion, searchParams, setSearchParams]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && bouquetsQuery.hasNextPage && !bouquetsQuery.isFetchingNextPage) {
          bouquetsQuery.fetchNextPage();
        }
      },
      { rootMargin: "420px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [bouquetsQuery]);

  // ─── render helpers ──────────────────────────────────

  const renderCategoryChips = () => (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => setSelectedCategoryId(null)}
        className={`group relative shrink-0 rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
          selectedCategoryId === null
            ? "border-transparent bg-gradient-to-r from-[#cb5c57] to-[#ff9b88] text-white shadow-lg shadow-[#cb5c57]/40"
            : "border-[#5f2825]/60 bg-[#100506]/50 text-[#dfc0b8] hover:border-[#cb5c57]/60 hover:bg-[#cb5c57]/8 hover:text-white"
        }`}
      >
        <span className="relative z-10 flex items-center gap-1.5">
          <HiOutlineSparkles size={14} className={selectedCategoryId === null ? "animate-pulse" : ""} />
          {t("catalog.allBouquets")}
        </span>
      </button>
      {(categoriesQuery.data ?? []).map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => setSelectedCategoryId(category.id)}
          className={`group relative shrink-0 rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            selectedCategoryId === category.id
              ? "border-transparent bg-gradient-to-r from-[#cb5c57] to-[#ff9b88] text-white shadow-lg shadow-[#cb5c57]/40"
              : "border-[#5f2825]/60 bg-[#100506]/50 text-[#dfc0b8] hover:border-[#cb5c57]/60 hover:bg-[#cb5c57]/8 hover:text-white"
          }`}
        >
          <span className="relative z-10 flex items-center gap-1.5">
            <HiMiniGift size={14} />
            {getLocalizedCategoryName(category)}
          </span>
        </button>
      ))}
    </div>
  );

  const renderResultCard = () => (
    <div className="rounded-xl border border-[#5f2825]/40 bg-[#090304]/50 p-4 backdrop-blur-sm lg:min-w-[220px]">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-[#b88d84]">
          <FaCheckCircle size={12} className="text-emerald-400" />
          {t("catalog.results")}
        </span>
        <span className="flex items-center gap-1 text-sm font-bold text-white">
          <span className="text-[#ff9b88]">{bouquets.length}</span>
          <span className="text-[#7a5a52]">/</span>
          <span>{total}</span>
        </span>
      </div>
      {!hasActiveFilters ? (
        <div className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#3d1c1b]/50 text-[10px] font-bold uppercase tracking-wider text-[#6b4b43]">
          <FaFilter size={10} />
          {t("catalog.noActiveFilters")}
        </div>
      ) : null}
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

    return (
      <article
        key={bouquet.id}
        onMouseEnter={() => setHoveredCard(bouquet.id)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => navigate(`/bouquets/${bouquet.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/bouquets/${bouquet.id}`);
          }
        }}
        role="button"
        tabIndex={0}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-[#5f2825]/30 bg-gradient-to-br from-[#1a0c0c] to-[#0f0606] shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-[#cb5c57]/50 hover:shadow-2xl hover:shadow-[#cb5c57]/15 ${
          view === "list" ? "lg:grid lg:grid-cols-[340px_1fr]" : ""
        } animate-fade-in-up`}
        style={{ animationDelay: `${idx * 60}ms` }}
      >
        {/* ── Image Section ── */}
        <div className={`relative overflow-hidden ${view === "list" ? "lg:h-full" : ""}`}>
          {/* Gradient overlays */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#0f0606] via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0f0606]/30 via-transparent to-transparent opacity-50" />

          {/* Badges */}
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              {isNew && (
                <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-gradient-to-r from-[#dd3045] to-[#ff5b72] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#ff5b72]/40">
                  <HiOutlineSparkles size={10} />
                  {t("catalog.new")}
                </span>
              )}
              {isPopular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/40">
                  <HiFire size={10} />
                  {t("catalog.popular")}
                </span>
              )}
            </div>
            <BouquetAvailabilityBadge bouquet={bouquet} compact />
          </div>

          <DiscountBadge oldPrice={bouquet.old_price} price={bouquet.price} />

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const added = toggleFavoriteBouquet(bouquet);
              toast.success(
                added
                  ? `${bouquet.name} ${t("catalog.addedToFavorites")}`
                  : `${bouquet.name} ${t("catalog.removedFromFavorites")}`,
                { position: "bottom-right", autoClose: 1800, hideProgressBar: true }
              );
            }}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#8c6158]/50 bg-[#19090a]/60 text-[#f6dacf] shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#ff5b72] hover:bg-[#ff5b72]/20 hover:shadow-[#ff5b72]/30"
            aria-label={isFavorite ? t("catalog.removeFromFavorites") : t("catalog.addToFavorites")}
          >
            {isFavorite ? (
              <HiHeart size={16} className="animate-pulse text-[#ff5b72]" />
            ) : (
              <HiOutlineHeart size={16} />
            )}
          </button>

          {/* Main image */}
          <div className="overflow-hidden bg-gradient-to-br from-[#2b1012] to-[#1a0809]">
            <img
              src={bouquet.image}
              alt={bouquet.name}
              loading="lazy"
              className={`h-[300px] w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
                view === "list" ? "lg:h-full lg:min-h-[360px]" : ""
              }`}
            />
          </div>

          {/* Preview images */}
          {previewImages.length > 0 && view === "grid" && (
            <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
              {previewImages.map((image: string, index: number) => (
                <div
                  key={image}
                  className="overflow-hidden rounded-lg border-2 border-white/10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#ff9b88]/80"
                >
                  <img
                    src={image}
                    alt={`${bouquet.name} preview ${index + 2}`}
                    className="h-10 w-10 object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Hover overlay – Quick View */}
          <div
            className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0f0606]/95 via-[#0f0606]/60 to-transparent p-4 pt-16 transition-all duration-500 ${
              isHovered ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/bouquets/${bouquet.id}`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#cb5c57] to-[#dd3045] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#cb5c57]/30 transition-all duration-300 hover:shadow-xl active:scale-[0.97]"
            >
              <HiOutlineEye size={14} />
              {t("catalog.quickView")}
            </button>
          </div>
        </div>

        {/* ── Content Section ── */}
        <div className="flex flex-col p-5">
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {bouquet.category && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#5f2825]/50 bg-[#210b0d] px-2.5 py-0.5 text-[10px] font-semibold text-[#f1c5ba]">
                  <FaTag size={8} />
                  {getLocalizedCategoryName(bouquet.category)}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <RatingStars rating={bouquet.rating} />
                <span className="text-xs font-bold text-white">{bouquet.rating}</span>
                <span className="text-[10px] text-[#8b6b64]">({bouquet.reviews_count})</span>
              </div>
            </div>

            <Link
              to={`/bouquets/${bouquet.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block font-cormorant text-2xl font-bold leading-tight text-[#fff3ee] transition-all duration-300 hover:text-[#ff9b88] hover:drop-shadow-[0_0_8px_rgba(255,155,136,0.3)]"
            >
              {bouquet.name}
            </Link>

            <Link
              to={`/shops/${bouquet.shop.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#bfa09a] transition hover:text-[#ffe1d8]"
            >
              <HiMiniGlobeAlt size={12} />
              {bouquet.shop.name}
            </Link>

            {(shopInstagramUrl || shopTelegramUrl) && (
              <div className="flex gap-2 pt-0.5">
                {shopInstagramUrl && (
                  <a
                    href={shopInstagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full border border-[#5f2825]/50 bg-[#120607] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[#efc2b8] transition hover:border-[#cb5c57] hover:bg-[#cb5c57]/10 hover:text-white"
                  >
                    <FaInstagram size={10} />
                    IG
                  </a>
                )}
                {shopTelegramUrl && (
                  <a
                    href={shopTelegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full border border-[#5f2825]/50 bg-[#120607] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[#efc2b8] transition hover:border-[#cb5c57] hover:bg-[#cb5c57]/10 hover:text-white"
                  >
                    <FaTelegramPlane size={10} />
                    TG
                  </a>
                )}
              </div>
            )}

            {view === "list" && bouquet.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#d4b8b0]">
                {bouquet.description}
              </p>
            )}
          </div>

          {/* Price + Add to cart */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#5f2825]/20 pt-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]">
                  {formatPrice(bouquet.price)}
                </span>
                {bouquet.old_price && (
                  <span className="text-sm text-[#8b6b64] line-through">
                    {formatPrice(bouquet.old_price)}
                  </span>
                )}
              </div>
              {bouquet.old_price && (
                <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <HiOutlineCheckBadge size={10} />
                  {t("catalog.greatDeal")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!canAddToCart) {
                  toast.error(`${bouquet.name} ${t("availability.outOfStockMessage")}`, {
                    position: "bottom-right",
                    autoClose: 1800,
                    hideProgressBar: true,
                  });
                  return;
                }
                addToCart(bouquet);
                toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`, {
                  position: "bottom-right",
                  autoClose: 1800,
                  hideProgressBar: true,
                });
              }}
              disabled={!canAddToCart}
              className={`group/btn relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-xs font-bold uppercase tracking-wider shadow-lg transition-all duration-300 ${
                canAddToCart
                  ? "bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-white hover:shadow-xl hover:shadow-[#aa1828]/40 active:scale-95"
                  : "cursor-not-allowed border border-[#5b2b31]/50 bg-[#1a0b0d] text-[#c39b94] opacity-80"
              }`}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
              <HiOutlineShoppingBag size={14} className="relative z-10" />
              <span className="relative z-10">{canAddToCart ? t("catalog.add") : t("availability.outOfStock")}</span>
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderEmptyState = () => (
    <div className="mt-12 overflow-hidden rounded-2xl border border-dashed border-[#5f2825]/40 bg-gradient-to-br from-[#130708] to-[#0a0405] px-6 py-20 text-center">
      <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#cb5c57]/15" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1a0c0c] to-[#2b1012] shadow-inner shadow-[#cb5c57]/20">
          <HiOutlineMagnifyingGlass className="text-4xl text-[#cb5c57]" />
        </div>
      </div>
      <h2 className="font-cormorant text-4xl text-[#fff0ea]">{t("catalog.noBouquetsFound")}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#c9aba4]">
        {t("catalog.noBouquetsDesc")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setValue("search", "");
            setSelectedCategoryId(null);
            setSearchParams({});
          }}
          className="group inline-flex items-center gap-2 rounded-full border border-[#cb5c57] bg-gradient-to-r from-[#cb5c57] to-[#ff9b88] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#cb5c57]/20 transition-all duration-300 hover:shadow-xl active:scale-[0.97]"
        >
          {t("catalog.browseAll")}
          <HiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-2 rounded-full border border-[#5f2825]/50 bg-[#1b0b0c] px-6 py-2.5 text-sm font-semibold text-[#f5ddd6] transition-all duration-300 hover:border-[#cb5c57] hover:bg-[#cb5c57]/10 hover:text-white"
        >
          <HiOutlineAdjustmentsHorizontal size={16} />
          {t("catalog.adjustFilters")}
        </button>
      </div>
    </div>
  );

  const renderLoadingMore = () => (
    <div className="mt-6 flex justify-center">
      <div className="inline-flex items-center gap-3 rounded-full border border-[#5f2825]/40 bg-[#120607]/80 px-6 py-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#ff5b72] [animation-delay:0ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#ff5b72] [animation-delay:150ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#ff5b72] [animation-delay:300ms]" />
          </div>
          <span className="text-sm font-semibold text-[#f1d0c8]">{t("catalog.loadingMore")}</span>
        </div>
      </div>
    </div>
  );

  const renderEndOfResults = () => (
    <div className="mt-10 flex justify-center">
      <div className="inline-flex items-center gap-3 rounded-full border border-[#5f2825]/30 bg-[#120607]/50 px-6 py-3 shadow-inner shadow-[#cb5c57]/5 backdrop-blur-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#cb5c57]/20 to-[#ff9b88]/10">
          <HiMiniGift size={14} className="text-[#ff9b88]" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-[#f1d0c8]">{t("catalog.seenAll")}</p>
          <p className="text-[10px] text-[#8b6b64]">{total} {t("catalog.bouquetsLoaded")}</p>
        </div>
      </div>
    </div>
  );

  // ──────────────────── MAIN RENDER ────────────────────

  return (
    <main className="relative min-h-screen overflow-hidden text-[#fff6f4]">
      <FloatingPetals />
      <section className="relative z-10 px-4 pb-28 pt-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* ── Hero / Header ── */}
          <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="relative">
              {/* Decorative gradient orb */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#cb5c57]/10 blur-[100px]" />
              
              {activeOccasion ? (
                <div className="relative inline-flex items-center gap-2 rounded-full border border-[#cb5c57]/30 bg-[#19080a]/70 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#f3c9bf] shadow-[0_12px_32px_rgba(90,18,25,0.18)] backdrop-blur-md">
                  <HiOutlineSparkles className="text-[#ff9b88]" />
                  {t("catalog.curatedForMoment")}
                </div>
              ) : null}

              <div className="relative">
                <h1 className="mt-5 font-great-vibes text-[clamp(3.2rem,7vw,6.4rem)] leading-[0.95] font-normal text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.14)]">
                  {activeOccasion ? activeOccasionTitle : t("catalog.findYour")}
                  <span className="block bg-gradient-to-r from-[#ff9b88] via-[#dd5c5c] to-[#cb5c57] bg-clip-text text-transparent">
                    {activeOccasion ? t("catalog.bouquetsCollection") : t("catalog.perfectBouquet")}
                  </span>
                </h1>
              </div>

              <p className="relative mt-4 max-w-2xl text-sm leading-7 text-[#cba8a1] sm:text-base">
                {activeOccasion
                  ? t("catalog.occasionHeroDescription", {
                      occasion: activeOccasionTitle,
                      description: activeOccasionDescription,
                    })
                  : t("catalog.defaultHeroDescription")}
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3 lg:min-w-[400px]">
              {[
                {
                  label: t("catalog.totalBouquets"),
                  value: total,
                  icon: HiMiniGift,
                  gradient: "from-[#cb5c57]/20 to-[#ff9b88]/10",
                },
                {
                  label: t("catalog.currentlyShowing"),
                  value: bouquets.length,
                  icon: HiOutlineRocketLaunch,
                  gradient: "from-emerald-500/20 to-emerald-400/10",
                },
                {
                  label: selectedCategory ? getLocalizedCategoryName(selectedCategory) : t("catalog.allCategories"),
                  value: selectedCategory?.name ? t("catalog.active") : t("bouquetSection.all"),
                  icon: FaFilter,
                  gradient: "from-amber-500/20 to-amber-400/10",
                  isActive: !!selectedCategory,
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="group relative overflow-hidden rounded-2xl border border-[#5f2825]/30 bg-gradient-to-br from-[#1a0c0c]/70 to-[#0f0606]/70 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/40 hover:shadow-xl hover:shadow-[#cb5c57]/5"
                  >
                    <div className="absolute -right-3 -top-3 text-3xl opacity-[0.06] transition-all duration-500 group-hover:scale-125 group-hover:opacity-[0.12]">
                      <Icon />
                    </div>
                    <p className="relative z-10 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#b88d84]">
                      {stat.label}
                    </p>
                    <p className={`relative z-10 mt-1 truncate text-xl font-black ${
                      stat.isActive ? "text-[#ff9b88]" : "text-white"
                    }`}>
                      {typeof stat.value === "string" ? stat.value : stat.value.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Sticky Filters Bar ── */}
          <div
            className={`sticky top-16 z-20 rounded-2xl border border-[#5f2825]/40 bg-gradient-to-br from-[#100506]/90 to-[#0a0405]/90 p-4 shadow-2xl backdrop-blur-xl transition-shadow duration-300 ${
              scrolled ? "shadow-[#cb5c57]/10" : ""
            }`}
          >
            <div className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                  {/* Search input */}
                  <div className="group relative flex-1">
                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#c88f88] transition-colors group-focus-within:text-[#ff9b88]" />
                    <input
                      {...register("search")}
                      placeholder={t("catalog.searchPlaceholder")}
                      className="h-12 w-full rounded-xl border border-[#5f2825]/50 bg-[#090304]/60 pl-11 pr-10 text-sm text-[#fff3ee] outline-none transition-all duration-300 placeholder:text-[#8b6b64] focus:border-[#cb5c57] focus:shadow-[0_0_0_3px_rgba(203,92,87,0.15)] focus:bg-[#090304]/80"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => {
                          setValue("search", "");
                          setSearchParams((current) => {
                            const next = new URLSearchParams(current);
                            next.delete("search");
                            next.delete("occasion");
                            return next;
                          });
                        }}
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#c9aaa2] transition-all duration-200 hover:bg-[#2b1012] hover:text-white"
                      >
                        <HiXMark className="text-sm" />
                      </button>
                    )}
                  </div>

                  {/* View toggle */}
                  <div className="inline-flex rounded-xl border border-[#5f2825]/50 bg-[#090304]/60 p-1">
                    <button
                      type="button"
                      onClick={() => setView("grid")}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                        view === "grid"
                          ? "bg-gradient-to-r from-[#cb5c57] to-[#ff9b88] text-white shadow-lg"
                          : "text-[#ad8d85] hover:bg-[#2b1012] hover:text-white"
                      }`}
                      title={t("catalog.gridView")}
                      aria-label={t("catalog.gridView")}
                    >
                      <HiOutlineSquares2X2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                        view === "list"
                          ? "bg-gradient-to-r from-[#cb5c57] to-[#ff9b88] text-white shadow-lg"
                          : "text-[#ad8d85] hover:bg-[#2b1012] hover:text-white"
                      }`}
                      title={t("catalog.listView")}
                      aria-label={t("catalog.listView")}
                    >
                      <HiOutlineBars3BottomLeft size={18} />
                    </button>
                  </div>

                  {/* Result card */}
                  {renderResultCard()}
                </div>

                {/* Category chips */}
                {renderCategoryChips()}
            </div>
          </div>

          {/* ── Active filter indicators ── */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#c9aaa2]">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#b88d84]">
                <FaFilter size={10} />
                {t("catalog.activeFilters")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setValue("search", "");
                  setSelectedCategoryId(null);
                  setSearchParams({});
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#7a342f]/60 bg-[#160809]/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f3d0c7] transition-all duration-300 hover:border-[#cb5c57] hover:bg-[#241012] hover:text-white"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cb5c57]/15 text-[#ff9b88]">
                  <HiXMark size={12} />
                </span>
                {t("catalog.clearFilters")}
              </button>
              {selectedCategory && (
                <span className="inline-flex animate-fade-in-up items-center gap-1.5 rounded-full border border-[#5f2825]/40 bg-[#1a0c0c]/80 px-3 py-1 text-xs shadow-sm backdrop-blur-sm">
                  <FaTag size={8} className="text-[#ff9b88]" />
                  {getLocalizedCategoryName(selectedCategory)}
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="ml-0.5 rounded-full p-0.5 text-[#cb5c57] transition hover:bg-[#cb5c57]/20 hover:text-white"
                  >
                    <HiXMark size={12} />
                  </button>
                </span>
              )}
              {activeOccasion && (
                <span className="inline-flex animate-fade-in-up items-center gap-1.5 rounded-full border border-[#5f2825]/40 bg-[#1a0c0c]/80 px-3 py-1 text-xs shadow-sm backdrop-blur-sm">
                  <HiOutlineSparkles size={10} className="text-[#ff9b88]" />
                  {t("occasionSection.filteredBy", {
                    occasion: t(`occasionSection.items.${activeOccasion}.title`),
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchParams((current) => {
                        const next = new URLSearchParams(current);
                        next.delete("occasion");
                        next.delete("search");
                        return next;
                      });
                      setValue("search", "");
                    }}
                    className="ml-0.5 rounded-full p-0.5 text-[#cb5c57] transition hover:bg-[#cb5c57]/20 hover:text-white"
                    aria-label={t("occasionSection.clear")}
                  >
                    <HiXMark size={12} />
                  </button>
                </span>
              )}
              {shouldShowSearchChip && (
                <span className="inline-flex animate-fade-in-up items-center gap-1.5 rounded-full border border-[#5f2825]/40 bg-[#1a0c0c]/80 px-3 py-1 text-xs shadow-sm backdrop-blur-sm">
                  <HiOutlineMagnifyingGlass size={10} className="text-[#ff9b88]" />
                  "{debouncedSearch}"
                  <button
                    type="button"
                    onClick={() => {
                      setValue("search", "");
                      setSearchParams((current) => {
                        const next = new URLSearchParams(current);
                        next.delete("search");
                        next.delete("occasion");
                        return next;
                      });
                    }}
                    className="ml-0.5 rounded-full p-0.5 text-[#cb5c57] transition hover:bg-[#cb5c57]/20 hover:text-white"
                  >
                    <HiXMark size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* ── Bouquets Grid / List ── */}
          {bouquetsQuery.isLoading ? (
            <BouquetGridSkeleton 
              count={6} 
              className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3" 
              imageClassName="h-[300px] w-full rounded-t-2xl"
            />
          ) : bouquets.length ? (
            <div
              className={`mt-8 grid gap-6 ${
                view === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              }`}
            >
              {bouquets.map((bouquet, idx) => renderBouquetCard(bouquet, idx))}
            </div>
          ) : (
            renderEmptyState()
          )}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-4" />

          {/* Loading more & end-of-results */}
          {bouquetsQuery.isFetchingNextPage && renderLoadingMore()}
          {!bouquetsQuery.hasNextPage && bouquets.length > 0 && renderEndOfResults()}
        </div>
      </section>

      {/* ── Global styles ── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes floatPetals {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: var(--petal-opacity, 0.6); }
          90%  { opacity: var(--petal-opacity, 0.6); }
          100% { transform: translateY(110vh) rotate(var(--petal-rotation, 720deg)); opacity: 0; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out both;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-float-petal {
          animation: floatPetals var(--float-duration, 18s) ease-in infinite normal;
          --petal-opacity: 0.5;
          --petal-rotation: 360deg;
          --float-duration: 18s;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes ping {
          75%, 100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </main>
  );
}

export default BouquetCatalog;
