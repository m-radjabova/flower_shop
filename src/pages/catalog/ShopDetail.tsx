import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaInstagram,
  FaTelegramPlane,
  FaTruck,
  FaCheckCircle,
  FaRegClock,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaShareAlt,
  FaShoppingBag,
  FaStar,
  FaLeaf,
  FaAward,
  FaStore,
  FaRegCalendarAlt,
} from "react-icons/fa";
import {
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlineStar,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import NotFound from "../../components/NotFound";
import BouquetAvailabilityBadge from "../../components/catalog/BouquetAvailabilityBadge";
import PremiumBreadcrumb from "../../components/catalog/PremiumBreadcrumb";
import ShopVerifiedBadge from "../../components/shops/ShopVerifiedBadge";
import { ShopDetailSkeleton } from "../../components/PageSkeletons";
import { useBouquets, useShop } from "../../hooks/useCatalog";
import { formatPrice, getComputedOldPrice, isBouquetAvailable } from "../../utils/catalog";
import { CART_AUTH_REQUIRED_MESSAGE, CART_SINGLE_BOUQUET_MESSAGE, addToCart } from "../../utils/cart";
import { formatUzbekPhone } from "../../utils/phone";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";
import { getBouquetPath } from "../../utils/routes";
import type { Bouquet } from "../../types/catalog";

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

// ─── Helpers ───────────────────────────────────────────────
function buildMapUrl(latitude: string, longitude: string) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const box = [lon - 0.018, lat - 0.012, lon + 0.018, lat + 0.012].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik&marker=${lat},${lon}`;
}

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

// ─── Bouquet Card ──────────────────────────────────────────
function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const isNewBouquet = isNew(bouquet.created_at);
  const isPopular = Number(bouquet.rating) >= 4.5 && bouquet.reviews_count >= 10;
  const canAddToCart = isBouquetAvailable(bouquet);

  return (
    <Reveal>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative overflow-hidden rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/80 backdrop-blur-sm shadow-lg transition-all duration-400 hover:-translate-y-1.5 hover:border-[#cb5c57]/35 hover:shadow-2xl hover:shadow-black/30"
      >
        <Link to={getBouquetPath(bouquet)} className="block">
          <div className="relative overflow-hidden">
            <img loading="lazy" decoding="async"
              src={bouquet.image}
              alt={bouquet.name}
              className={`h-56 sm:h-72 lg:h-80 w-full object-cover transition-all duration-600 ease-out ${isHovered ? "scale-108" : "scale-100"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080204]/80 via-transparent to-transparent" />

            <div className="absolute left-3 sm:left-4 top-3 sm:top-4 flex flex-wrap gap-1.5 sm:gap-2">
              {isNewBouquet && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-500/20">
                  <FaLeaf size={8} />
                  {t("catalog.new")}
                </span>
              )}
              {isPopular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-amber-500/20">
                  <FaStar size={8} />
                  {t("catalog.popular")}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-600 to-red-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-rose-600/20">
                Sale
              </span>
              <BouquetAvailabilityBadge bouquet={bouquet} compact />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!canAddToCart) {
                  toast.error(`${bouquet.name} ${t("availability.outOfStockMessage")}`);
                  return;
                }
                const result = addToCart(bouquet);
                if (!result.ok) {
                  toast.info(result.reason === "auth_required" ? CART_AUTH_REQUIRED_MESSAGE : CART_SINGLE_BOUQUET_MESSAGE);
                  return;
                }
                toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`);
              }}
              disabled={!canAddToCart}
              className={`absolute right-3 sm:right-4 bottom-3 sm:bottom-4 z-10 flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-full shadow-xl transition-all duration-300 ${
                canAddToCart
                  ? "bg-[#9f1525] text-white hover:bg-[#b51b2c] hover:scale-110 active:scale-95"
                  : "cursor-not-allowed border border-[#5b2b31] bg-[#1a0b0d] text-[#c39b94]"
              } ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            >
              <HiOutlineShoppingBag size={16} />
            </button>

            {bouquet.category && (
              <span className="absolute left-3 sm:left-4 bottom-3 sm:bottom-4 rounded-full border border-white/10 bg-black/40 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
                {bouquet.category.name}
              </span>
            )}
          </div>
        </Link>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link to={getBouquetPath(bouquet)}>
                <h3 className="font-cormorant text-lg sm:text-xl md:text-2xl font-semibold leading-tight text-white transition-colors duration-300 hover:text-[#cb5c57]">
                  {bouquet.name}
                </h3>
              </Link>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#c9a09a]">
                <div className="flex items-center gap-1">
                  <HiOutlineStar size={11} className="text-amber-400" />
                  <span className="font-semibold text-white">{bouquet.rating}</span>
                </div>
                <span className="text-[#5f2825]">·</span>
                <span className="text-[#8a6a63]">{bouquet.reviews_count} {t("catalog.reviews")}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between border-t border-[#3a1214]/30 pt-3">
            <div className="flex items-end gap-2">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{formatPrice(bouquet.price)}</span>
              <span className="pb-0.5 text-xs sm:text-sm font-medium text-[#8a6a63] line-through">
                {formatPrice(getComputedOldPrice(bouquet.price))}
              </span>
            </div>
            <BouquetAvailabilityBadge bouquet={bouquet} compact />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Navigation Pills ──────────────────────────────────────
const sectionIds = ["bouquets", "about-shop", "reviews", "policies"] as const;

function NavPills({
  activeSection,
  scrollToSection,
  counts,
}: {
  activeSection: string;
  scrollToSection: (id: string) => void;
  counts: { bouquets: number; reviews: number };
}) {
  const { t } = useTranslation();
  const items = [
    { id: "bouquets", label: t("shopDetail.bouquets"), icon: <FaShoppingBag size={11} />, value: counts.bouquets },
    { id: "about-shop", label: t("shopDetail.about"), icon: <FaStore size={11} />, value: null },
    { id: "reviews", label: t("shopDetail.reviews"), icon: <FaStar size={11} />, value: counts.reviews },
    { id: "policies", label: t("shopDetail.info"), icon: <FaRegClock size={11} />, value: null },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 rounded-[1.4rem] border border-[#3a1214]/40 bg-[#120607]/70 p-1.5 backdrop-blur-xl">
      {items.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={`relative flex items-center gap-1.5 sm:gap-2 rounded-[1.2rem] px-2.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-medium transition-all duration-300 ${
              isActive
                ? "bg-[#9f1525] text-white shadow-lg"
                : "text-[#c9a09a] hover:text-white hover:bg-white/5"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.value !== null && (
              <span className={`ml-0.5 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-[#3a1214]/40 text-[#c9a09a]"
              }`}>
                {item.value}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Reveal>
      <div className="group rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-3 sm:p-4 backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/30 hover:bg-[#160809]">
        <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          {icon}
        </div>
        <p className="text-lg sm:text-xl font-bold text-white">{value}</p>
        <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-[#b9978f]">{label}</p>
      </div>
    </Reveal>
  );
}

// ─── Main Component ───────────────────────────────────────
function ShopDetail() {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState("bouquets");
  const { slug } = useParams();
  const { data: shop, isLoading, isError } = useShop(slug);
  const shopBouquetsQuery = useBouquets({ shopId: shop?.id });

  // Intersection Observer for active section
  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      { rootMargin: "-20% 0px -50% 0px", threshold: [0.1, 0.3, 0.5] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [shop]);

  const bouquets = useMemo(
    () =>
      [...(shopBouquetsQuery.data ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [shopBouquetsQuery.data],
  );

  if (isLoading) return <ShopDetailSkeleton />;
  if (isError || !shop) return <NotFound />;

  const hasCoordinates = Boolean(shop.latitude && shop.longitude);
  const mapUrl = hasCoordinates ? buildMapUrl(shop.latitude!, shop.longitude!) : null;
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";

  const averagePrice = bouquets.length
    ? formatPrice(
        String(bouquets.reduce((acc, b) => acc + Number(b.price), 0) / bouquets.length),
      )
    : formatPrice("0");

  const inStockCount = bouquets.filter((b) => b.stock > 0).length;
  const topRatedCount = bouquets.filter((b) => Number(b.rating) >= 4.5).length;
  const newBouquetsCount = bouquets.filter((b) => isNew(b.created_at)).length;
  const minPrice = bouquets.length ? Math.min(...bouquets.map((b) => Number(b.price))) : 0;
  const maxPrice = bouquets.length ? Math.max(...bouquets.map((b) => Number(b.price))) : 0;
  const minPriceFormatted = formatPrice(String(minPrice));
  const maxPriceFormatted = formatPrice(String(maxPrice));
  const formatMemberSince = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("shopDetail.recentlyJoined");
    const localeMap: Record<string, string> = {
      uz: "uz-UZ",
      ru: "ru-RU",
      en: "en-US",
    };
    return new Intl.DateTimeFormat(localeMap[i18n.language] ?? "en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  };
  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: shop.name, text: t("shopDetail.shareMessage", { name: shop.name }), url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("shopDetail.shopLinkCopied"));
    } catch {
      toast.error(t("shopDetail.couldNotShare"));
    }
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(sectionId);
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden text-[#fff6f4]">

      {/* ── Backgrounds ── */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[#0a0203]" />
      <div className="pointer-events-none fixed inset-0 -z-15">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#cb5c57]/10 blur-3xl animate-pulse-soft" />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#ff9b88]/6 blur-3xl" />
        <div className="absolute -right-20 top-56 h-80 w-80 rounded-full bg-[#d9b56f]/5 blur-3xl animate-pulse-soft" style={{ animationDelay: "2.5s" }} />
      </div>
      <FloatingOrbs />

      <div className="relative z-10">
        {/* ─── HERO SECTION ─────────────────────────── */}
        <section className="relative px-4 sm:px-6 lg:px-10 pb-6 sm:pb-8 pt-28 sm:pt-32 lg:pt-36">
          <div className="mx-auto max-w-[1500px]">
            {/* Breadcrumb */}
            <Reveal>
              <PremiumBreadcrumb
                items={[
                  { label: t("header.shops"), to: "/shops" },
                  { label: shop.name },
                ]}
              />
            </Reveal>

            {/* Hero Card */}
            <Reveal delay={100}>
              <div className="relative mt-4 sm:mt-6 overflow-hidden rounded-2xl border border-[#3a1214]/40 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-black/30">
                <img loading="lazy" decoding="async"
                  src={shop.banner ?? shop.logo ?? "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1400&q=80"}
                  alt={shop.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0203] via-[#0a0203]/92 to-[#0a0203]/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0203] via-transparent to-transparent" />

                <div className="relative z-10 flex min-h-[20rem] sm:min-h-[26rem] lg:min-h-[32rem] flex-col justify-between gap-6 sm:gap-8 p-6 sm:p-8 lg:p-10">
                  {/* Top Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-5">
                    <div className="flex items-start gap-4 sm:gap-6">
                      {/* Logo */}
                      <Reveal from="left">
                        {shop.logo ? (
                          <img loading="lazy" decoding="async"
                            src={shop.logo}
                            alt={`${shop.name} logo`}
                            className="h-20 w-20 sm:h-28 sm:w-28 lg:h-36 lg:w-36 rounded-2xl sm:rounded-[1.7rem] border-2 border-[#cb5c57]/40 object-cover shadow-lg"
                          />
                        ) : (
                          <div className="flex h-20 w-20 sm:h-28 sm:w-28 lg:h-36 lg:w-36 items-center justify-center rounded-2xl sm:rounded-[1.7rem] border-2 border-[#cb5c57]/40 bg-gradient-to-br from-[#2b1012] to-[#1a0809] font-cormorant text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ff9b88] shadow-lg">
                            {shop.name.charAt(0)}
                          </div>
                        )}
                      </Reveal>

                      {/* Name & Info */}
                      <div className="max-w-2xl pt-0 sm:pt-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
                          <Reveal delay={120} from="bottom">
                            <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold leading-none text-white [text-shadow:0_8px_24px_rgba(0,0,0,0.35)]">
                              {shop.name}
                            </h1>
                          </Reveal>
                          {shop.is_verified && (
                            <Reveal delay={200}>
                              <ShopVerifiedBadge
                                className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
                                iconClassName="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
                              />
                            </Reveal>
                          )}
                        </div>

                        <Reveal delay={180}>
                          <div className="mt-2 sm:mt-4 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm md:text-base">
                            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/30 px-2 sm:px-3 py-0.5 sm:py-1 backdrop-blur-sm">
                              <HiOutlineStar size={12} className="text-amber-400" />
                              <span className="font-bold text-white">{shop.rating}</span>
                              <span className="text-[#c9a09a] hidden sm:inline text-xs">({shop.reviews_count} {t("shopDetail.reviews")})</span>
                            </span>
                            {shop.city && (
                              <span className="inline-flex items-center gap-1.5 text-[#c9a09a]">
                                <HiOutlineMapPin size={12} className="text-[#cb5c57]" />
                                {shop.city}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 text-[#c9a09a]">
                              <FaRegCalendarAlt size={10} className="text-[#cb5c57]" />
                              {t("shopDetail.memberSince")} {formatMemberSince(shop.created_at)}
                            </span>
                          </div>
                        </Reveal>

                        <Reveal delay={240}>
                          <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-base leading-6 sm:leading-8 text-[#c9a09a]">
                            {shop.description ?? t("shopDetail.noDescription")}
                          </p>
                        </Reveal>
                      </div>
                    </div>

                    <Reveal delay={300} from="right">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="group inline-flex items-center gap-2 rounded-full border border-[#5f2825]/50 bg-[#120607]/70 px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-[#f0ddd8] backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white"
                      >
                        <FaShareAlt size={10} className="transition-transform duration-300 group-hover:scale-110" />
                        {t("shopDetail.share")}
                      </button>
                    </Reveal>
                  </div>

                  {/* Action Buttons */}
                  <Reveal delay={360}>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <a
                        href={`tel:${shop.phone}`}
                        className="group relative inline-flex h-11 sm:h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#9f1525] px-5 sm:px-7 text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_32px_rgba(159,21,37,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b51b2c] hover:shadow-[0_18px_38px_rgba(159,21,37,0.38)] active:scale-[0.98]"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 transition-transform duration-500 group-hover:translate-x-full" />
                        <span className="relative z-10 flex items-center gap-2">
                          <FaPhoneAlt size={10} />
                          {t("shopDetail.callShop")}
                        </span>
                      </a>
                      {telegramUrl && (
                        <a
                          href={telegramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl border border-[#5f2825]/50 bg-[#120607]/60 px-5 sm:px-6 text-xs sm:text-xs font-semibold uppercase tracking-[0.12em] text-[#f0ddd8] backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white"
                        >
                          <FaTelegramPlane size={12} />
                          {t("shopDetail.message")}
                        </a>
                      )}
                      {!telegramUrl && instagramUrl && (
                        <a
                          href={instagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl border border-[#5f2825]/50 bg-[#120607]/60 px-5 sm:px-6 text-xs sm:text-xs font-semibold uppercase tracking-[0.12em] text-[#f0ddd8] backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white"
                        >
                          <FaInstagram size={12} />
                          {t("shopDetail.instagram")}
                        </a>
                      )}
                    </div>
                  </Reveal>
                </div>
              </div>
            </Reveal>

            {/* ─── STATS ROW ───────────────────────────── */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard icon={<FaShoppingBag size={14} className="text-white" />} label={t("shopDetail.totalBouquets")} value={String(bouquets.length)} color="bg-gradient-to-br from-[#9f1525] to-[#cb2a3d]" />
              <StatCard icon={<FaCheckCircle size={14} className="text-white" />} label={t("shopDetail.inStock")} value={String(inStockCount)} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <StatCard icon={<FaStar size={14} className="text-white" />} label={t("shopDetail.topRated")} value={String(topRatedCount)} color="bg-gradient-to-br from-amber-500 to-orange-600" />
              <StatCard icon={<FaLeaf size={14} className="text-white" />} label={t("shopDetail.newArrivals")} value={String(newBouquetsCount)} color="bg-gradient-to-br from-rose-500 to-pink-600" />
              <StatCard icon={<FaAward size={14} className="text-white" />} label={t("shopDetail.avgPrice")} value={averagePrice} color="bg-gradient-to-br from-violet-500 to-purple-600" />
              <StatCard icon={<FaTruck size={14} className="text-white" />} label={t("shopDetail.delivery")} value={shop.city ?? t("shopDetail.availableNow")} color="bg-gradient-to-br from-sky-500 to-blue-600" />
            </div>

            {/* ─── NAV ─────────────────────────── */}
            <Reveal delay={100}>
              <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
                <NavPills
                  activeSection={activeSection}
                  scrollToSection={scrollToSection}
                  counts={{ bouquets: bouquets.length, reviews: shop.reviews_count }}
                />
              </div>
            </Reveal>

            {/* ─── MAIN GRID: Bouquets + Sidebar ────────── */}
            <Reveal delay={150}>
              <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
                {/* Bouquets Grid */}
                <div id="bouquets" className="scroll-mt-28">
                  {shopBouquetsQuery.isLoading ? (
                    <ShopDetailSkeleton />
                  ) : bouquets.length ? (
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                      {bouquets.map((bouquet) => (
                        <BouquetCard key={bouquet.id} bouquet={bouquet} />
                      ))}
                    </div>
                  ) : (
                    <Reveal>
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#3a1214]/50 bg-[#120607]/60 p-8 sm:p-16 text-center">
                        <FaShoppingBag size={36} className="text-[#3a1214]/50 mb-3" />
                        <p className="font-cormorant text-2xl sm:text-3xl text-white">{t("shopDetail.noBouquetsYet")}</p>
                        <p className="mt-2 text-xs sm:text-sm text-[#b9978f]">{t("shopDetail.noBouquetsDesc")}</p>
                      </div>
                    </Reveal>
                  )}
                </div>

                {/* ─── SIDEBAR ─────────────────────────────── */}
                <aside className="space-y-4 sm:space-y-5">
                  {/* About Shop */}
                  <Reveal>
                    <div
                      id="about-shop"
                      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#3a1214]/40 bg-[#0d0405]/80 backdrop-blur-sm shadow-lg"
                    >
                      <div className="p-5 sm:p-7">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="inline-flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9f1525] to-[#cb2a3d]">
                            <FaStore size={11} className="text-white" />
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#b9978f]">{t("shopDetail.about")}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-bold text-white">{shop.name}</h2>
                          {shop.is_verified && <ShopVerifiedBadge className="h-5 w-5 sm:h-6 sm:w-6" iconClassName="h-5 w-5 sm:h-6 sm:w-6" />}
                        </div>
                        <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-6 sm:leading-7 text-[#c9a09a]">
                          {shop.description ?? t("shopDetail.aboutShopFallback")}
                        </p>

                        <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3 border-t border-[#3a1214]/30 pt-4 sm:pt-5">
                          {shop.phone && (
                            <a href={`tel:${shop.phone}`} className="flex items-center gap-3 rounded-xl bg-[#120607]/60 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#c9a09a] transition-all duration-200 hover:bg-[#1a0a0c] hover:text-white group">
                              <span className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-[#9f1525]/20 text-[#cb5c57] group-hover:scale-110 transition-transform duration-200">
                                <FaPhoneAlt size={9} />
                              </span>
                              <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#b9978f]">{t("shopDetail.phone")}</p>
                                <p className="font-medium text-white">{formatUzbekPhone(shop.phone)}</p>
                              </div>
                            </a>
                          )}
                          {shop.address && (
                            <div className="flex items-start gap-3 rounded-xl bg-[#120607]/60 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#c9a09a]">
                              <span className="flex h-7 sm:h-8 w-7 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                                <FaMapMarkerAlt size={9} />
                              </span>
                              <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#b9978f]">{t("shopDetail.address")}</p>
                                <p className="font-medium text-white">{shop.address}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 sm:mt-6 grid gap-2 sm:gap-3 border-t border-[#3a1214]/30 pt-4 sm:pt-5 sm:grid-cols-2">
                          <div className="rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-3 sm:p-4 transition-all duration-200 hover:border-emerald-500/20">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <FaTruck size={11} />
                              <p className="text-xs sm:text-sm font-semibold text-white">{t("shopDetail.sameDayDelivery")}</p>
                            </div>
                            <p className="mt-1 text-[10px] text-[#b9978f]">{t("shopDetail.sameDayDeliveryDesc")}</p>
                          </div>
                          <div className="rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 p-3 sm:p-4 transition-all duration-200 hover:border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-400">
                              <FaLeaf size={11} />
                              <p className="text-xs sm:text-sm font-semibold text-white">{t("shopDetail.freshFlowers")}</p>
                            </div>
                            <p className="mt-1 text-[10px] text-[#b9978f]">{t("shopDetail.freshFlowersDesc")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>

                  {/* Shop Information / Policies */}
                  <Reveal delay={80}>
                    <div
                      id="policies"
                      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#3a1214]/40 bg-[#0d0405]/80 backdrop-blur-sm shadow-lg"
                    >
                      <div className="p-5 sm:p-7">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="inline-flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                            <FaRegClock size={11} className="text-white" />
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#b9978f]">{t("shopDetail.info")}</span>
                        </div>
                        <h3 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-bold text-white">{t("shopDetail.shopDetails")}</h3>

                        <div className="mt-4 sm:mt-6 space-y-3">
                          {[
                            { label: t("shopDetail.totalProducts"), value: String(bouquets.length), color: "from-[#9f1525] to-[#cb2a3d]" },
                            { label: t("shopDetail.availableNow"), value: String(inStockCount), color: "from-emerald-500 to-teal-600" },
                            { label: t("shopDetail.priceRange"), value: `${minPriceFormatted} — ${maxPriceFormatted}`, color: "from-violet-500 to-purple-600" },
                            { label: t("shopDetail.averagePrice"), value: averagePrice, color: "from-amber-500 to-orange-600" },
                            { label: t("shopDetail.topRatedLabel"), value: String(topRatedCount), color: "from-rose-500 to-pink-600" },
                            { label: t("shopDetail.newThisWeek"), value: String(newBouquetsCount), color: "from-sky-500 to-blue-600" },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-[#120607]/60 px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 hover:bg-[#1a0a0c]">
                              <span className="text-xs sm:text-sm text-[#c9a09a]">{item.label}</span>
                              <div className="flex items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${item.color}`} />
                                <span className="text-xs sm:text-sm font-bold text-white">{item.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {shop.working_hours && (
                          <div className="mt-4 sm:mt-5 border-t border-[#3a1214]/30 pt-4 sm:pt-5">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#c9a09a]">
                              <FaRegClock size={11} className="text-[#cb5c57]" />
                              <span className="font-semibold text-white">{t("shopDetail.workingHours")}</span>
                              <span>{shop.working_hours}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Reveal>

                  {/* Map */}
                  <Reveal delay={160}>
                    <div className="overflow-hidden rounded-2xl border border-[#3a1214]/40 bg-[#0d0405]/80 backdrop-blur-sm shadow-lg">
                      {mapUrl ? (
                        <>
                          <div className="border-b border-[#3a1214]/30 px-4 sm:px-6 py-3 sm:py-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#b9978f]">{t("shopDetail.location")}</p>
                            <p className="mt-1 text-sm sm:text-base font-semibold text-white">{shop.address}</p>
                          </div>
                          <iframe
                            title={`${shop.name} location`}
                            src={mapUrl}
                            className="h-[16rem] sm:h-[20rem] w-full border-0"
                            loading="lazy"
                          />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center px-6 sm:px-8 py-12 sm:py-16 text-center">
                          <div className="mb-3 sm:mb-4 flex h-12 sm:h-16 w-12 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3a1214] to-[#1a0809]">
                            <FaMapMarkerAlt size={20} className="text-[#b9978f]" />
                          </div>
                          <p className="font-cormorant text-xl sm:text-2xl font-bold text-white">{t("shopDetail.locationComingSoon")}</p>
                          <p className="mt-2 text-xs sm:text-sm text-[#b9978f]">{t("shopDetail.locationComingSoonDesc")}</p>
                        </div>
                      )}
                    </div>
                  </Reveal>
                </aside>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

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
        .group-hover\\:scale-108:hover { transform: scale(1.08); }
      `}</style>
    </main>
  );
}

export default ShopDetail;
