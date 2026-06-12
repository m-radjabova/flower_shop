import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaInstagram, FaTelegramPlane } from "react-icons/fa";
import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
import {
  HiArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineStar,
  HiPhone,
  HiStar,
} from "react-icons/hi2";
import NotFound from "../../components/NotFound";
import BouquetAvailabilityBadge from "../../components/catalog/BouquetAvailabilityBadge";
import PremiumBreadcrumb from "../../components/catalog/PremiumBreadcrumb";
import { DetailPageSkeleton } from "../../components/PageSkeletons";
import ReviewSection from "../../components/catalog/ReviewSection";
import ShopVerifiedBadge from "../../components/shops/ShopVerifiedBadge";
import { useBouquet } from "../../hooks/useCatalog";
import { formatPrice, getBouquetAvailability, getBouquetImages, isBouquetAvailable } from "../../utils/catalog";
import { getBouquetAddonOptions, getBouquetImageForSize, getBouquetSizeOptions } from "../../utils/bouquetOptions";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";

// ─── Intersection observer hook ──────────────────────────────────────────────
const EMPTY_OPTIONS: IntersectionObserverInit = {};
function useInView(options: IntersectionObserverInit = EMPTY_OPTIONS): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.1, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return [ref, visible];
}

// ─── Animated reveal block ───────────────────────────────────────────────────
function Reveal({
  children,
  className = "",
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "none";
}) {
  const [ref, visible] = useInView();
  const initial = {
    bottom: "translate-y-10",
    left: "-translate-x-8",
    right: "translate-x-8",
    none: "",
  }[from];

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${initial}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Floating particles ──────────────────────────────────────────────────────
function FloatingOrbs() {
  const orbs = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: `${12 + i * 15}%`,
      top: `${-8 + (i % 3) * 12}%`,
      size: 6 + (i % 3) * 4,
      duration: 14 + i * 3,
      delay: i * 2.5,
    })), []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {orbs.map(({ id, left, top, size, duration, delay }) => (
        <span
          key={id}
          className="absolute animate-floatOrb rounded-full opacity-20"
          style={{
            left, top,
            width: size, height: size,
            background: "radial-gradient(circle, #ff9b88, #cb5c57)",
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </div>
  );
}

function BouquetDetail() {
  const { t } = useTranslation();
  const { bouquetId } = useParams();
  const { data: bouquet, isLoading, isError } = useBouquet(bouquetId);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedSizeKey, setSelectedSizeKey] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!bouquet) return;
    const sizeOptions = getBouquetSizeOptions(bouquet);
    setSelectedSizeKey(sizeOptions.find((item) => item.key === "medium")?.key ?? sizeOptions[0]?.key ?? null);
    setActiveImage(null);
  }, [bouquet]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !bouquet) {
    return <NotFound />;
  }

  const images = getBouquetImages(bouquet);
  const sizeOptions = getBouquetSizeOptions(bouquet);
  const addonOptions = getBouquetAddonOptions(bouquet);
  const selectedSize = sizeOptions.find((item) => item.key === selectedSizeKey) ?? sizeOptions[0];
  const heroImage = activeImage ?? getBouquetImageForSize(bouquet, selectedSize?.key) ?? images[0] ?? bouquet.image;
  const shopInstagramUrl = bouquet.shop.instagram ? normalizeInstagramLink(bouquet.shop.instagram) : "";
  const shopTelegramUrl = bouquet.shop.telegram ? normalizeTelegramLink(bouquet.shop.telegram) : "";
  const isPopular = Number(bouquet.rating) >= 4.5 && bouquet.reviews_count >= 20;
  const availability = getBouquetAvailability(bouquet);
  const canAddToCart = isBouquetAvailable(bouquet);

  return (
    <main className="relative isolate min-h-screen overflow-hidden text-[#fff6f4]">

      {/* ── Backgrounds ── */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[#0a0203]" />
      <div className="pointer-events-none fixed inset-0 -z-15">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#cb5c57]/10 blur-3xl animate-pulse-soft" />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#ff9b88]/6 blur-3xl" />
        <div className="absolute -right-20 top-56 h-80 w-80 rounded-full bg-[#d9b56f]/5 blur-3xl animate-pulse-soft" style={{ animationDelay: "2.5s" }} />
        <div className="absolute left-[20%] top-[60%] h-64 w-64 rounded-full bg-[#cb5c57]/5 blur-3xl animate-pulse-soft" style={{ animationDelay: "4s" }} />
      </div>
      <FloatingOrbs />

      <section className="relative px-4 pb-20 pt-28 sm:px-6 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-7xl">

          {/* Breadcrumb */}
          <Reveal>
            <PremiumBreadcrumb
              items={[
                { label: t("header.bouquets"), to: "/bouquets" },
                { label: bouquet.name },
              ]}
            />
          </Reveal>

          {/* Main grid */}
          <div className="mt-6 grid gap-6 lg:gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: Image gallery */}
            <Reveal from="left">
              <div>
                <div className="group relative overflow-hidden rounded-2xl border border-[#3a1214]/40 bg-gradient-to-br from-[#0d0405] to-[#080204] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-black/30">
                  <div className="relative overflow-hidden rounded-[1.7rem]">
                    <button
                      type="button"
                      onClick={() => setZoomed(!zoomed)}
                      className="w-full"
                    >
                      <img loading="lazy" decoding="async"
                        src={heroImage}
                        alt={bouquet.name}
                        className={`h-[18rem] sm:h-[28rem] md:h-[34rem] lg:h-[40rem] w-full object-cover transition-all duration-700 ease-out ${
                          zoomed ? "scale-125 cursor-zoom-out" : "scale-100 cursor-zoom-in group-hover:scale-105"
                        }`}
                      />
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080204]/60 via-transparent to-transparent pointer-events-none" />

                    {/* Badges */}
                    <div className="absolute left-3 sm:left-5 top-3 sm:top-5 z-10 flex flex-wrap gap-1.5 sm:gap-2">
                      {bouquet.category ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#9f1525] to-[#cb2a3d] px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-lg shadow-[#9f1525]/30">
                          {bouquet.category.name}
                        </span>
                      ) : null}
                      {isPopular && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-lg">
                          <HiStar className="animate-pulse text-[10px]" />
                          {t("bouquetDetail.popular")}
                        </span>
                      )}
                      <BouquetAvailabilityBadge bouquet={bouquet} />
                    </div>

                    {/* Rating badge */}
                    <div className="absolute right-3 sm:right-5 top-3 sm:top-5 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm font-semibold text-[#fff4ef] backdrop-blur-md">
                      <HiStar className="text-amber-400 text-[10px] sm:text-base" />
                      {bouquet.rating}
                      <span className="text-[#cfa89e] hidden sm:inline text-xs">({bouquet.reviews_count})</span>
                    </div>
                  </div>
                </div>

                {/* Thumbnail grid */}
                {images.length > 1 && (
                  <div className="mt-3 sm:mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                    {images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(image)}
                        className={`overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                          heroImage === image
                            ? "border-[#cb5c57] opacity-100 shadow-lg shadow-[#cb5c57]/20 ring-1 ring-[#cb5c57]/30"
                            : "border-[#3a1214]/40 opacity-60 hover:opacity-100 hover:border-[#5f2825]/60"
                        }`}
                      >
                        <img loading="lazy" decoding="async"
                          src={image}
                          alt={`${bouquet.name} ${index + 1}`}
                          className="h-14 sm:h-20 md:h-28 w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            {/* Right: Details */}
            <div className="flex flex-col gap-5">
              <Reveal from="right">
                <div className="rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/80 p-6 sm:p-8 backdrop-blur-sm shadow-lg">

                  {/* Name */}
                  <h1 className="font-cormorant text-[2.5rem] sm:text-[3.2rem] md:text-[3.8rem] font-bold leading-none text-white">
                    {bouquet.name}
                  </h1>

                  {/* Divider */}
                  <div className="mt-4 h-px w-20 bg-gradient-to-r from-[#cb5c57] to-transparent" />

                  {/* Description */}
                  {bouquet.description && (
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-[#c9a09a] sm:text-base sm:leading-8">
                      {bouquet.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-6 flex items-end gap-3">
                    <p className="text-4xl sm:text-5xl font-bold text-white">
                      {formatPrice(selectedSize?.price ?? bouquet.price)}
                    </p>
                    {bouquet.old_price ? (
                      <p className="pb-0.5 sm:pb-1 text-lg sm:text-xl font-semibold text-[#8a6a63] line-through">
                        {formatPrice(bouquet.old_price)}
                      </p>
                    ) : null}
                    {bouquet.old_price && (
                      <span className="mb-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                        Sale
                      </span>
                    )}
                  </div>

                  {/* Info cards */}
                  <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-3 sm:p-3.5 transition-all duration-300 hover:border-[#cb5c57]/30">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.size")}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{selectedSize?.label ?? bouquet.size ?? t("bouquetDetail.custom")}</p>
                    </div>
                    <div className="rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-3 sm:p-3.5 transition-all duration-300 hover:border-[#cb5c57]/30">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.stock")}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {availability.count ?? bouquet.stock} {availability.count ? t("availability.leftShort") : t("bouquetDetail.available")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-3 sm:p-3.5 transition-all duration-300 hover:border-[#cb5c57]/30">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.status")}</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-white">{bouquet.status.replace("_", " ")}</p>
                    </div>
                  </div>

                  {/* Size selector */}
                  {sizeOptions.length > 1 && (
                    <div className="mt-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#cb5c57]">{t("bouquetDetail.size")}</p>
                      <div className="mt-3 grid gap-2.5 grid-cols-2">
                        {sizeOptions.map((option) => {
                          const active = selectedSize?.key === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => {
                                setSelectedSizeKey(option.key);
                                setActiveImage(option.image);
                              }}
                              className={`rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                                active
                                  ? "border-[#cb5c57] bg-[#2a0c12] shadow-lg shadow-[#cb5c57]/10"
                                  : "border-[#3a1214]/50 bg-[#120607]/60 hover:border-[#5f2825]/60 hover:bg-[#160809]"
                              }`}
                            >
                              <p className="text-base sm:text-lg font-semibold text-white">{option.label}</p>
                              <p className="mt-0.5 text-xs sm:text-sm text-[#ff9bab]">{formatPrice(option.price)}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Composition */}
                  {bouquet.compound ? (
                    <div className="mt-5 rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-[#cb5c57]">
                        <HiOutlineSparkles size={15} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{t("bouquetDetail.composition")}</p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[#c9a09a]">{bouquet.compound}</p>
                    </div>
                  ) : null}

                  {/* Addons */}
                  {addonOptions.length ? (
                    <div className="mt-5 rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-[#cb5c57]">
                        <HiOutlineSparkles size={15} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Add-ons</p>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {addonOptions.map((addon) => (
                          <div
                            key={addon.id}
                            className="group relative overflow-hidden rounded-xl border border-[#3a1214]/40 bg-[#0d0405]/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cb5c57]/35 hover:shadow-lg hover:shadow-[#cb5c57]/8"
                          >
                            <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-[#cb5c57]/5 blur-2xl transition-all duration-500 group-hover:bg-[#cb5c57]/10 group-hover:blur-3xl" />
                            <div className="relative p-3">
                              <p className="text-sm font-semibold text-[#fdf2ef]">{addon.name}</p>
                              <p className="mt-1 text-xs text-[#ff9bab]">+{formatPrice(addon.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Add to cart */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!canAddToCart) {
                        toast.error(`${bouquet.name} ${t("availability.outOfStockMessage")}`);
                        return;
                      }
                      addToCart(bouquet);
                      toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`);
                    }}
                    disabled={!canAddToCart}
                    className={`group relative mt-5 inline-flex h-13 w-full items-center justify-center gap-3 overflow-hidden rounded-xl text-sm font-bold uppercase tracking-[0.12em] shadow-lg transition-all duration-300 active:scale-[0.98] ${
                      canAddToCart
                        ? "bg-[#9f1525] text-white hover:-translate-y-0.5 hover:bg-[#b51b2c] hover:shadow-[0_16px_38px_rgba(159,21,37,0.32)]"
                        : "cursor-not-allowed border border-[#5b2b31] bg-[#1a0b0d] text-[#c39b94] opacity-80"
                    }`}
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 transition-transform duration-500 group-hover:translate-x-full" />
                    <span className="relative z-10 flex items-center gap-2.5">
                      <HiOutlineShoppingBag size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
                      {canAddToCart ? t("bouquetDetail.addToCart") : t("availability.outOfStock")}
                    </span>
                  </button>
                </div>
              </Reveal>

              {/* Shop card */}
              <Reveal delay={100}>
                <Link
                  to={`/shops/${bouquet.shop.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/80 p-5 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#cb5c57]/35 hover:shadow-xl hover:shadow-black/20"
                >
                  <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-[#cb5c57]/5 blur-2xl transition-all duration-500 group-hover:bg-[#cb5c57]/10 group-hover:blur-3xl" />
                  
                  <div className="relative flex items-center gap-4 sm:gap-5">
                    {bouquet.shop.logo ? (
                      <img loading="lazy" decoding="async"
                        src={bouquet.shop.logo}
                        alt={bouquet.shop.name}
                        className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl object-cover ring-2 ring-[#3a1214]/50 transition-all duration-300 group-hover:ring-[#cb5c57]/40"
                      />
                    ) : (
                      <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2b1012] to-[#1a0809] font-cormorant text-2xl sm:text-3xl ring-2 ring-[#3a1214]/50 transition-all duration-300 group-hover:ring-[#cb5c57]/40">
                        {bouquet.shop.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.soldBy")}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <h2 className="font-cormorant text-xl sm:text-2xl text-white transition-colors duration-300 group-hover:text-[#cb5c57]">
                          {bouquet.shop.name}
                        </h2>
                        {bouquet.shop.is_verified && <ShopVerifiedBadge />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#c9a09a]">
                        {bouquet.shop.city ? (
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineMapPin size={12} className="text-[#cb5c57]" />
                            {bouquet.shop.city}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineStar size={12} className="text-amber-400" />
                          {bouquet.shop.rating}
                        </span>
                      </div>
                    </div>
                    <HiArrowLeft size={18} className="shrink-0 text-[#5f2825] transition-all duration-300 group-hover:-translate-x-1 group-hover:text-[#cb5c57]" />
                  </div>

                  {shopInstagramUrl || shopTelegramUrl ? (
                    <div className="relative mt-3 flex gap-2 border-t border-[#3a1214]/40 pt-3" onClick={(e) => e.stopPropagation()}>
                      {shopInstagramUrl && (
                        <a
                          href={shopInstagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#3a1214]/40 bg-[#120607]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f0d2ca] backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/40 hover:bg-[#cb5c57]/10 hover:text-white"
                        >
                          <FaInstagram size={10} />
                          Instagram
                        </a>
                      )}
                      {shopTelegramUrl && (
                        <a
                          href={shopTelegramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#3a1214]/40 bg-[#120607]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f0d2ca] backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/40 hover:bg-[#cb5c57]/10 hover:text-white"
                        >
                          <FaTelegramPlane size={10} />
                          Telegram
                        </a>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#8a6a63]">
                        <HiPhone size={10} />
                        {t("bouquetDetail.viewShop")}
                      </span>
                    </div>
                  ) : null}
                </Link>
              </Reveal>

              {/* Shop active status */}
              {bouquet.shop.status === "active" && (
                <Reveal delay={200}>
                  <div className="flex items-center gap-2 rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 px-5 py-3.5 text-xs text-[#c9a09a] backdrop-blur-sm">
                    <HiOutlineCheckCircle size={14} className="shrink-0 text-emerald-400" />
                    <span>{t("bouquetDetail.shopActive")}</span>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      <Reveal>
        <ReviewSection bouquet={bouquet} />
      </Reveal>

      <style>{`
        @keyframes floatOrb {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.2; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(110vh) scale(0.7); opacity: 0; }
        }
        .animate-floatOrb { animation: floatOrb linear infinite; }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        .animate-pulse-soft { animation: pulse-soft 6s ease-in-out infinite; }

        .duration-400 { transition-duration: 400ms; }
        .duration-600 { transition-duration: 600ms; }
      `}</style>
    </main>
  );
}

export default BouquetDetail;
