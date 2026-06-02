import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { addToCart } from "../../utils/cart";
import { Link, useNavigate } from "react-router-dom";
import {
  HiArrowRight,
  HiHeart,
  HiOutlineGift,
  HiOutlineHeart,
  HiOutlineSparkles,
  HiOutlineShoppingBag,
  HiStar,
  HiChevronRight,
  HiEye,
} from "react-icons/hi2";
import { LuCakeSlice, LuFlower2 } from "react-icons/lu";
import { TbRings } from "react-icons/tb";
import type { Bouquet, Category } from "../../types/catalog";
import { useFavoriteIds } from "../../hooks/useFavorites";
import { formatPrice, getBouquetImages, isNewBouquet } from "../../utils/catalog";
import { toggleFavoriteBouquet } from "../../utils/favorites";
import { HomeCategoriesSkeleton } from "../PageSkeletons";
import { useEffect, useRef, useState } from "react";

const categoryIcons = {
  roses: LuFlower2,
  birthday: LuCakeSlice,
  anniversary: HiHeart,
  wedding: TbRings,
  "new-baby": HiOutlineSparkles,
  "get-well-soon": HiOutlineHeart,
};

const categoryGradients = {
  roses: "from-rose-500/20 to-rose-900/20",
  birthday: "from-amber-500/20 to-orange-900/20",
  anniversary: "from-pink-500/20 to-red-900/20",
  wedding: "from-purple-500/20 to-indigo-900/20",
  "new-baby": "from-sky-500/20 to-blue-900/20",
  "get-well-soon": "from-emerald-500/20 to-teal-900/20",
};

const categoryBorderColors = {
  roses: "group-hover:border-rose-500",
  birthday: "group-hover:border-amber-500",
  anniversary: "group-hover:border-pink-500",
  wedding: "group-hover:border-purple-500",
  "new-baby": "group-hover:border-sky-500",
  "get-well-soon": "group-hover:border-emerald-500",
};

const categoryTextColors = {
  roses: "group-hover:text-rose-300",
  birthday: "group-hover:text-amber-300",
  anniversary: "group-hover:text-pink-300",
  wedding: "group-hover:text-purple-300",
  "new-baby": "group-hover:text-sky-300",
  "get-well-soon": "group-hover:text-emerald-300",
};

function getCategoryIcon(slug: string) {
  return categoryIcons[slug as keyof typeof categoryIcons] ?? HiOutlineGift;
}

function getCategoryGradient(slug: string) {
  return categoryGradients[slug as keyof typeof categoryGradients] ?? "from-gray-500/20 to-gray-900/20";
}

function getCategoryBorder(slug: string) {
  return categoryBorderColors[slug as keyof typeof categoryBorderColors] ?? "group-hover:border-gray-400";
}

function getCategoryText(slug: string) {
  return categoryTextColors[slug as keyof typeof categoryTextColors] ?? "group-hover:text-gray-300";
}

interface BouquetSectionProps {
  bouquets: Bouquet[];
  categories: Category[];
  isLoading: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

function BouquetSection({
  bouquets,
  categories,
  isLoading,
  selectedCategoryId,
  onSelectCategory,
}: BouquetSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const favoriteIds = useFavoriteIds();
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    const cards = document.querySelectorAll(".bouquet-card");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [bouquets]);

  // Reset visibility when bouquets change
  useEffect(() => {
    setVisibleCards(new Set());
    setImageLoaded({});
  }, [selectedCategoryId]);

  const handleFavoriteClick = (event: React.MouseEvent, bouquet: Bouquet) => {
    event.stopPropagation();
    const added = toggleFavoriteBouquet(bouquet);
    toast.success(
      added ? `${bouquet.name} ${t("bouquetSection.addedToFavorites")}` : `${bouquet.name} ${t("bouquetSection.removedFromFavorites")}`,
      { position: "bottom-right", autoClose: 2000, theme: "colored" }
    );
  };

  const handleAddToCart = (event: React.MouseEvent, bouquet: Bouquet) => {
    event.stopPropagation();
    addToCart(bouquet);
    toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`, { position: "bottom-right", autoClose: 2000, theme: "colored" });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-10"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-[#cb5c57]/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9b88]/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-rose-800/5 to-transparent blur-3xl" />
      </div>

      <div id="categories" className="scroll-mt-28">
        {/* ─── Header Section ─── */}
        <div className="relative mb-12">
          {/* Desktop Header */}
          <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-8 md:grid">
            <div className="h-px bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#cb5c57]/20 to-[#ff9b88]/20 rounded-full" />
              <div className="absolute inset-0 blur-[60px] bg-gradient-to-b from-[#cb5c57]/10 to-transparent rounded-full" />
              <h2 className="mt-5 font-great-vibes text-[clamp(3.2rem,7vw,6.4rem)] leading-[0.95] font-normal text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.14)]">
                {t("bouquetSection.newFlowers")}
              </h2>
              <div className="relative mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-[#cb5c57] via-[#ff9b88] to-[#cb5c57] opacity-40" />
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="h-px flex-1 bg-gradient-to-r from-[#5b2524] to-transparent" />
              <Link
                to="/bouquets"
                className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-[#cb5c57]/30 bg-[#1a0c0c]/50 px-6 py-2.5 text-sm font-semibold text-[#f1d5cb] backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57] hover:bg-[#cb5c57]/15 hover:text-white hover:shadow-lg hover:shadow-[#cb5c57]/20"
              >
                {t("bouquetSection.all")}
                <HiArrowRight className="text-[#cb5c57] transition-all duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#cb5c57]/20 to-[#ff9b88]/20 rounded-full" />
              <div className="relative">
                <h2 className="mt-5 font-great-vibes text-[clamp(3.2rem,7vw,6.4rem)] leading-[0.95] font-normal text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.14)]">
                  {t("bouquetSection.newFlowers")}
                </h2>
                <div className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-[#cb5c57] to-[#ff9b88] opacity-40" />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <HomeCategoriesSkeleton />
        ) : (
          <>
            {/* ─── Categories Section ─── */}
            <div className="relative mt-8">
              {/* Categories scroll hint */}
              <div className="flex overflow-x-auto pb-4 scrollbar-none md:pb-0">
                <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 min-w-max md:min-w-full mx-auto">
                  {categories.map((category, idx) => {
                    const Icon = getCategoryIcon(category.slug);
                    const active = selectedCategoryId === category.id;
                    const gradient = getCategoryGradient(category.slug);
                    const borderHover = getCategoryBorder(category.slug);
                    const textHover = getCategoryText(category.slug);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => onSelectCategory(active ? null : category.id)}
                        className={`group relative flex flex-col items-center text-center transition-all duration-500`}
                        style={{
                          animationDelay: `${idx * 50}ms`,
                        }}
                      >
  
                        
                        {/* Category icon container */}
                        <div
                          className={`relative inline-flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-[4rem] border-2 transition-all duration-300 sm:h-[6.5rem] sm:w-[6.5rem] ${
                            active
                              ? `border-[#cb5c57] bg-gradient-to-br ${gradient} shadow-2xl shadow-[#cb5c57]/10`
                              : `border-[#3a1a1a] bg-gradient-to-br from-[#1a0c0c] to-[#0f0606] shadow-lg ${borderHover} hover:shadow-xl`
                          }`}
                        >
                          
                          <Icon
                            size={36}
                            className={`relative z-10 transition-all duration-300 ${
                              active
                                ? "text-[#ff9b88] drop-shadow-lg scale-110"
                                : "text-[#b87a6a] group-hover:text-[#ff9b88] group-hover:scale-110"
                            }`}
                          />
                        </div>
                        
                        {/* Category name */}
                        <p
                          className={`mt-3 text-sm font-semibold leading-snug transition-all duration-300 ${
                            active
                              ? "bg-gradient-to-r from-[#ff9b88] to-[#f1ddd3] bg-clip-text text-transparent"
                              : `text-[#b99a92] ${textHover}`
                          }`}
                        >
                          {category.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile scroll indicator */}
              <div className="mt-4 flex justify-center gap-1.5 md:hidden">
                {categories.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === 0 ? "w-6 bg-[#cb5c57]" : "w-1.5 bg-[#3a1a1a]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Mobile View All Button */}
            <div className="mt-6 flex justify-center md:hidden">
              <Link
                to="/bouquets"
                className="group inline-flex items-center gap-2 rounded-full border border-[#cb5c57]/30 bg-[#1a0c0c]/50 px-6 py-2.5 text-sm font-semibold text-[#f1d5cb] backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57] hover:bg-[#cb5c57]/15 hover:text-white hover:shadow-lg"
              >
                {t("bouquetSection.all")}
                <HiArrowRight className="text-[#cb5c57] transition-all duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <div id="bouquets" className="scroll-mt-28" />

            {/* ─── Bouquets Grid ─── */}
            {bouquets.length ? (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {bouquets.map((bouquet, idx) => {
                  const bouquetImages = getBouquetImages(bouquet);
                  const previewImages = bouquetImages.slice(1, 4);
                  const isFavorite = favoriteIds.has(bouquet.id);
                  const showNewBadge = isNewBouquet(bouquet.created_at);
                  const isPopular = Number(bouquet.rating) >= 4.5 && bouquet.reviews_count >= 20;
                  const isVisible = visibleCards.has(`bouquet-${bouquet.id}`);
                  const isHovered = hoveredCardId === bouquet.id;
                  const imageReady = imageLoaded[`bouquet-${bouquet.id}`] !== false;

                  return (
                    <article
                      id={`bouquet-${bouquet.id}`}
                      key={bouquet.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNavigate(`/bouquets/${bouquet.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleNavigate(`/bouquets/${bouquet.id}`);
                        }
                      }}
                      onMouseEnter={() => setHoveredCardId(bouquet.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      className={`bouquet-card group relative transform overflow-hidden rounded-2xl border border-[#3a1a1a] bg-gradient-to-br from-[#1a0c0c] to-[#0f0606] shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-[#cb5c57]/50 hover:shadow-2xl hover:shadow-[#cb5c57]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb5c57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0606] ${
                        isVisible ? "opacity-100" : "opacity-0 translate-y-8"
                      }`}
                      style={{
                        animationDelay: `${idx * 100}ms`,
                        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {/* ── Image Section ── */}
                      <div className="relative overflow-hidden">
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0f0606] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        
                        {/* Image loading skeleton */}
                        {!imageReady && (
                          <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#2b1012] to-[#1a0809] animate-pulse" />
                        )}

                        {/* Badges */}
                        <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
                          {showNewBadge && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#dd3045] to-[#ff5b72] px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white shadow-lg shadow-red-500/20">
                              <HiOutlineSparkles className="animate-pulse" size={12} />
                               {t("bouquetSection.new")}
                            </span>
                          )}
                          {isPopular && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white shadow-lg shadow-amber-500/20">
                              <HiStar className="animate-pulse" size={12} />
                               {t("bouquetSection.popular")}
                            </span>
                          )}
                        </div>

                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => handleFavoriteClick(e, bouquet)}
                          aria-label={isFavorite ? t("bouquetSection.removeFromFavorites") : t("bouquetSection.addToFavorites")}
                          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#8c6158] bg-[#19090a]/80 text-[#f6dacf] backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#ff5b72] hover:bg-[#ff5b72]/20 hover:shadow-lg active:scale-90"
                        >
                          {isFavorite ? (
                            <HiHeart size={18} className="animate-heart-beat text-[#ff5b72]" />
                          ) : (
                            <HiOutlineHeart size={18} />
                          )}
                        </button>

                        {/* Quick view button on hover */}
                        <div className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-500 ${
                          isHovered ? "opacity-100" : "opacity-0"
                        }`}>
                          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm border border-white/10">
                            <HiEye className="text-white" size={16} />
                            <span className="text-sm font-medium text-white">{t("bouquetSection.view")}</span>
                          </div>
                        </div>

                        {/* Main Image */}
                        <div className="overflow-hidden bg-gradient-to-br from-[#2b1012] to-[#1a0809]">
                          <Link to={`/bouquets/${bouquet.id}`} aria-label={`${bouquet.name} — batafsil`} tabIndex={-1}>
                            <img
                              src={bouquet.image}
                              alt={bouquet.name}
                              loading="lazy"
                              onLoad={() => setImageLoaded(prev => ({ ...prev, [`bouquet-${bouquet.id}`]: true }))}
                              className={`h-[320px] w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
                                imageReady ? "opacity-100" : "opacity-0"
                              } md:h-[380px]`}
                            />
                          </Link>
                        </div>

                        {/* Preview Images */}
                        {previewImages.length > 0 && (
                          <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                            {previewImages.map((image, index) => (
                              <div
                                key={image}
                                className="overflow-hidden rounded-xl border-2 border-white/30 shadow-lg transition-all duration-300 hover:scale-110 hover:border-white/60 hover:shadow-xl"
                              >
                                <img
                                  src={image}
                                  alt={`${bouquet.name} — ko'rinish ${index + 2}`}
                                  loading="lazy"
                                  className="h-12 w-12 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── Content Section ── */}
                      <div className="relative p-5">
                        {/* Shop link */}
                        <Link
                          to={`/shops/${bouquet.shop.slug}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#cb5c57] transition-all duration-300 hover:text-[#ff9b88]"
                        >
                          {bouquet.shop.name}
                          <HiChevronRight className="opacity-0 -translate-x-2 transition-all duration-300 group-hover/name:opacity-100 group-hover/name:translate-x-0" size={12} />
                        </Link>

                        {/* Bouquet name */}
                        <Link
                          to={`/bouquets/${bouquet.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1.5 block font-cormorant text-2xl font-bold leading-tight text-[#f8ede6] transition-all duration-300 hover:text-[#ff9b88] md:text-3xl"
                        >
                          {bouquet.name.length > 30
                            ? `${bouquet.name.substring(0, 30)}...`
                            : bouquet.name}
                        </Link>

                        {/* Rating */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center gap-0.5" aria-label={`Reyting: ${bouquet.rating}`}>
                            {[...Array(5)].map((_, i) => {
                              const starValue = Number(bouquet.rating) || 0;
                              const filled = i < Math.floor(starValue);
                              const halfFilled = !filled && i < Math.ceil(starValue) && starValue % 1 >= 0.3;

                              return (
                                <HiStar
                                  key={i}
                                  className={`text-sm transition-all duration-200 ${
                                    filled
                                      ? "text-amber-400 drop-shadow-sm"
                                      : halfFilled
                                      ? "text-amber-400/60"
                                      : "text-gray-600"
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-sm font-semibold text-white">
                            {Number(bouquet.rating).toFixed(1)}
                          </span>
                          <span className="text-xs text-[#b08d86]">
                            ({bouquet.reviews_count} {t("bouquetSection.reviews")})
                          </span>
                        </div>

                        {/* Price */}
                        <div className="mt-4">
                          <p className="flex items-center gap-2 text-3xl font-bold text-white">
                            {formatPrice(bouquet.price)}
                          </p>
                          {bouquet.old_price && (
                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                              <span className="line-through">{formatPrice(bouquet.old_price)}</span>
                              <span className="rounded-full bg-[#dd3045]/20 px-2 py-0.5 text-[0.65rem] font-bold text-[#ff5b72]">
                                -{Math.round((1 - Number(bouquet.price) / Number(bouquet.old_price)) * 100)}%
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, bouquet)}
                          className="group/btn mt-5 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#8f1220]/20 transition-all duration-300 hover:from-[#aa1828] hover:via-[#bb2435] hover:to-[#dd3045] hover:shadow-xl hover:shadow-[#bb2435]/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cb5c57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a0c0c]"
                        >
                          <HiOutlineShoppingBag className="text-base transition-all duration-300 group-hover/btn:-translate-x-1 group-hover/btn:scale-110" />
                           <span>{t("bouquetSection.addToCart")}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              // ── Empty State ──
              <div className="mt-12 rounded-2xl border border-dashed border-[#623535] bg-gradient-to-br from-[#150809] to-[#0a0405] px-8 py-20 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1a0c0c] to-[#0f0606] ring-1 ring-[#623535]/50">
                  <HiOutlineHeart className="text-4xl text-[#cb5c57]" />
                </div>
                 <h3 className="font-cormorant text-4xl font-semibold text-[#fff0ea]">
                   {t("bouquetSection.noFlowersTitle")}
                 </h3>
                 <p className="mt-3 max-w-md mx-auto text-sm text-[#caaba5] leading-relaxed">
                   {t("bouquetSection.noFlowersDesc")}
                 </p>
                 <Link
                   to="/bouquets"
                   className="group mt-8 inline-flex items-center gap-2 rounded-full border border-[#764342] bg-[#1b0b0c] px-7 py-3 text-sm font-semibold text-[#f5ddd6] transition-all duration-300 hover:border-[#cb5c57] hover:bg-[#cb5c57]/10 hover:text-white hover:shadow-lg hover:shadow-[#cb5c57]/10"
                 >
                   {t("bouquetSection.browseAllFlowers")}
                  <HiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </>
        )}

        {/* ─── Bottom View All Button ─── */}
        {bouquets.length > 0 && (
          <div className="relative mt-16 flex justify-center">
            <div className="absolute inset-x-0 -top-8 h-px bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />
            <Link
              to="/bouquets"
              className="group relative inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-[#cb5c57]/40 bg-gradient-to-b from-[#1f0a0b]/90 to-[#180708]/80 px-8 text-sm font-bold uppercase tracking-[0.14em] text-[#fff0ea] shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cb5c57] hover:bg-[#cb5c57]/20 hover:shadow-xl hover:shadow-[#cb5c57]/10"
            >
               <span className="relative z-10">{t("bouquetSection.browseAllFlowers")}</span>
              <HiArrowRight className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {/* ─── Global CSS for animations ─── */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heartBeat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-heart-beat {
          animation: heartBeat 0.4s ease-in-out;
        }

        /* Hide scrollbar for category scroll */
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        /* Smooth image loading */
        .bouquet-card img {
          transition: opacity 0.5s ease, transform 0.7s ease-out;
        }
      `}</style>
    </section>
  );
}

export default BouquetSection;
