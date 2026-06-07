import { useEffect, useMemo, useState } from "react";
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
  FaChevronDown,
  FaRegCalendarAlt,
} from "react-icons/fa";
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlineClock,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import NotFound from "../../components/NotFound";
import BouquetAvailabilityBadge from "../../components/catalog/BouquetAvailabilityBadge";
import ShopVerifiedBadge from "../../components/shops/ShopVerifiedBadge";
import { ShopDetailSkeleton } from "../../components/PageSkeletons";
import { useBouquets, useShop } from "../../hooks/useCatalog";
import { formatPrice, isBouquetAvailable } from "../../utils/catalog";
import { addToCart } from "../../utils/cart";
import { formatUzbekPhone } from "../../utils/phone";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";
import type { Bouquet } from "../../types/catalog";

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

// ─── Animation Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ─── Bouquet Card ──────────────────────────────────────────
function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const isNewBouquet = isNew(bouquet.created_at);
  const hasDiscount = Boolean(bouquet.old_price);
  const isPopular = Number(bouquet.rating) >= 4.5 && bouquet.reviews_count >= 10;
  const canAddToCart = isBouquetAvailable(bouquet);

  return (
    <motion.article
      variants={itemVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-[1.8rem] border border-[#4a2020]/60 bg-gradient-to-b from-[#1e0b0d] to-[#120608] shadow-lg transition-all duration-500 hover:border-[#cb5c57]/40 hover:shadow-[0_20px_60px_rgba(203,92,87,0.15)]"
    >
      <Link to={`/bouquets/${bouquet.id}`} className="block">
        <div className="relative overflow-hidden">
          <motion.img
            src={bouquet.image}
            alt={bouquet.name}
            className="h-72 w-full object-cover sm:h-80"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120608] via-transparent to-transparent opacity-70" />

          {/* Badges */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {isNewBouquet && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-500/20">
                <FaLeaf className="text-[0.5rem]" />
                {t("catalog.new")}
              </span>
            )}
            {isPopular && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-amber-500/20">
                <FaStar className="text-[0.5rem]" />
                {t("catalog.popular")}
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-rose-600/20">
                {t("shopDetail.sale")}
              </span>
            )}
            <BouquetAvailabilityBadge bouquet={bouquet} compact />
          </div>

          {/* Quick add button on hover */}
          <motion.button
            type="button"
              onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!canAddToCart) {
                toast.error(`${bouquet.name} ${t("availability.outOfStockMessage")}`);
                return;
              }
              addToCart(bouquet);
              toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`);
            }}
            disabled={!canAddToCart}
            className={`absolute right-4 bottom-4 z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-xl ${
              canAddToCart
                ? "bg-gradient-to-br from-[#cb5c57] to-[#a3322e] text-white shadow-[#cb5c57]/20"
                : "cursor-not-allowed border border-[#5b2b31] bg-[#1a0b0d] text-[#c39b94]"
            }`}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.5, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.25 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <HiOutlineShoppingBag className="text-lg" />
          </motion.button>

          {/* Category tag */}
          {bouquet.category && (
            <span className="absolute left-4 bottom-4 rounded-full border border-white/10 bg-black/30 px-3.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
              {bouquet.category.name}
            </span>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link to={`/bouquets/${bouquet.id}`}>
              <h3 className="font-cormorant text-2xl font-semibold leading-tight text-white transition-colors duration-300 hover:text-[#f0a89a]">
                {bouquet.name}
              </h3>
            </Link>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#dbb8b0]">
              <div className="flex items-center gap-1">
                <FaStar className="text-[0.7rem] text-amber-400" />
                <span className="font-semibold text-white">{bouquet.rating}</span>
              </div>
              <span className="text-[#8a6a63]">·</span>
              <span className="text-[#8a6a63]">{bouquet.reviews_count} {t("catalog.reviews")}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-[#4a2020]/30 pt-4">
          <div className="flex items-end gap-2.5">
            <span className="text-2xl font-bold text-white">{formatPrice(bouquet.price)}</span>
            {hasDiscount && (
              <span className="pb-0.5 text-sm font-medium text-[#8a6a63] line-through">
                {formatPrice(bouquet.old_price!)}
              </span>
            )}
          </div>
          <BouquetAvailabilityBadge bouquet={bouquet} compact />
        </div>
      </div>
    </motion.article>
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
    { id: "bouquets", label: t("shopDetail.bouquets"), icon: <FaShoppingBag className="text-xs" />, value: counts.bouquets },
    { id: "about-shop", label: t("shopDetail.about"), icon: <FaStore className="text-xs" />, value: null },
    { id: "reviews", label: t("shopDetail.reviews"), icon: <FaStar className="text-xs" />, value: counts.reviews },
    { id: "policies", label: t("shopDetail.info"), icon: <FaRegClock className="text-xs" />, value: null },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-[1.6rem] border border-[#4a2020]/50 bg-[#120608]/80 p-1.5 backdrop-blur-xl">
      {items.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={`relative flex items-center gap-2.5 rounded-[1.2rem] px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-r from-[#cb5c57] to-[#a3322e] text-white shadow-lg shadow-[#cb5c57]/20"
                : "text-[#cfa89e] hover:text-white hover:bg-white/5"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.value !== null && (
              <span className={`ml-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-[#4a2020]/40 text-[#cfa89e]"
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
    <motion.div
      variants={itemVariants}
      className="group rounded-[1.4rem] border border-[#4a2020]/40 bg-gradient-to-br from-[#1a0a0c] to-[#100608] p-5 transition-all duration-300 hover:border-[#cb5c57]/30 hover:shadow-[0_10px_40px_rgba(203,92,87,0.08)]"
    >
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-[#a88680]">{label}</p>
    </motion.div>
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
    <main className="min-h-screen bg-[#070102] text-[#fff4f1]">
      {/* Ambient background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#cb5c57]/5 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-[#ff9b88]/3 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a3322e]/3 blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* ─── HERO SECTION ─────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden px-4 pb-8 pt-28 sm:px-6 lg:px-10"
        >
          <div className="mx-auto max-w-[1500px]">
            {/* Back button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Link
                to="/#bouquets"
                className="group inline-flex items-center gap-2 rounded-full border border-[#4a2020]/40 bg-[#120608]/60 px-4 py-2 text-sm font-semibold text-[#f0d2ca] backdrop-blur-md transition-all duration-300 hover:border-[#cb5c57]/50 hover:bg-[#cb5c57]/10 hover:text-white"
              >
                <HiOutlineArrowLeft className="transition-transform duration-300 group-hover:-translate-x-0.5" />
                {t("shopDetail.backToShops")}
              </Link>
            </motion.div>

            {/* Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative mt-6 overflow-hidden rounded-[2.4rem] border border-[#4a2020]/40 shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
            >
              {/* Background Image */}
              <img
                src={shop.banner ?? shop.logo ?? "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1400&q=80"}
                alt={shop.name}
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0203] via-[#120608]/92 to-[#1a080a]/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0203] via-transparent to-transparent" />
              <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-gradient-to-bl from-[#cb5c57]/8 to-transparent" />

              {/* Decorative floating elements */}
              <div className="pointer-events-none absolute top-10 right-10 h-32 w-32 rounded-full border border-[#cb5c57]/10" />
              <div className="pointer-events-none absolute bottom-20 left-1/4 h-20 w-20 rounded-full border border-[#ff9b88]/8" />

              <div className="relative z-10 flex min-h-[26rem] flex-col justify-between gap-8 p-6 sm:p-8 lg:min-h-[32rem] lg:p-12">
                {/* Top Row */}
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="flex items-start gap-5 sm:gap-7">
                    {/* Logo */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {shop.logo ? (
                        <img
                          src={shop.logo}
                          alt={`${shop.name} logo`}
                          className="h-28 w-28 rounded-[2rem] border-2 border-[#d9a86d]/60 object-cover shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:h-36 sm:w-36"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border-2 border-[#d9a86d]/60 bg-gradient-to-br from-[#2b1012] to-[#1a0809] font-cormorant text-4xl font-bold text-[#f7d9a6] shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:h-36 sm:w-36 sm:text-5xl">
                          {shop.name.charAt(0)}
                        </div>
                      )}
                    </motion.div>

                    {/* Name & Info */}
                    <div className="max-w-2xl pt-2">
                      <div className="flex flex-wrap items-center gap-3.5">
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.35 }}
                          className="font-cormorant text-4xl font-bold leading-none text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl xl:text-7xl"
                        >
                          {shop.name}
                        </motion.h1>
                        {shop.is_verified ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.42 }}
                          >
                            <ShopVerifiedBadge
                              className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
                              iconClassName="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
                            />
                          </motion.div>
                        ) : null}
                      </div>

                      {/* Rating, Location, Member Since */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm sm:text-base"
                      >
                        <span className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 backdrop-blur-sm">
                          <FaStar className="text-amber-400" />
                          <span className="font-bold text-white">{shop.rating}</span>
                          <span className="text-[#cfa89e]">({shop.reviews_count} {t("shopDetail.reviews")})</span>
                        </span>
                        {shop.city && (
                          <span className="inline-flex items-center gap-2 text-[#f0d2ca]">
                            <HiOutlineMapPin className="text-[#f0a89a]" />
                            {shop.city}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2 text-[#f0d2ca]">
                          <FaRegCalendarAlt className="text-[0.7rem] text-[#f0a89a]" />
                          {t("shopDetail.memberSince")} {formatMemberSince(shop.created_at)}
                        </span>
                      </motion.div>

                      {/* Description */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                        className="mt-4 max-w-xl text-base leading-8 text-[#e8c9c1] drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
                      >
                        {shop.description ?? t("shopDetail.noDescription")}
                      </motion.p>
                    </div>
                  </div>

                  {/* Share Button */}
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    type="button"
                    onClick={handleShare}
                    className="group inline-flex items-center gap-2.5 rounded-full border border-[#4a2020]/50 bg-black/30 px-5 py-2.5 text-sm font-medium text-[#f0d2ca] backdrop-blur-md transition-all duration-300 hover:border-[#cb5c57]/50 hover:bg-[#cb5c57]/10 hover:text-white"
                  >
                    <FaShareAlt className="text-xs transition-transform duration-300 group-hover:scale-110" />
                    {t("shopDetail.share")}
                  </motion.button>
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-wrap gap-3"
                >
                  <a
                    href={`tel:${shop.phone}`}
                    className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#be2338] via-[#cf2b44] to-[#dd3752] px-7 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(199,44,69,0.28)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_20px_40px_rgba(199,44,69,0.35)] active:scale-[0.98]"
                  >
                    <FaPhoneAlt className="text-xs" />
                    {t("shopDetail.callShop")}
                  </a>
                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-xl border border-[#4a2020]/50 bg-[#120608]/60 px-6 text-sm font-semibold text-[#f0d2ca] backdrop-blur-md transition-all duration-300 hover:border-[#d9a06b]/50 hover:bg-[#d9a06b]/10 hover:text-white"
                    >
                      <FaTelegramPlane />
                      {t("shopDetail.message")}
                    </a>
                  )}
                  {!telegramUrl && instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-xl border border-[#4a2020]/50 bg-[#120608]/60 px-6 text-sm font-semibold text-[#f0d2ca] backdrop-blur-md transition-all duration-300 hover:border-[#d9a06b]/50 hover:bg-[#d9a06b]/10 hover:text-white"
                    >
                      <FaInstagram />
                      {t("shopDetail.instagram")}
                    </a>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* ─── STATS ROW ───────────────────────────── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            >
              <StatCard
                icon={<FaShoppingBag className="text-white" />}
                label={t("shopDetail.totalBouquets")}
                value={String(bouquets.length)}
                color="bg-gradient-to-br from-[#cb5c57] to-[#a3322e]"
              />
              <StatCard
                icon={<FaCheckCircle className="text-white" />}
                label={t("shopDetail.inStock")}
                value={String(inStockCount)}
                color="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              <StatCard
                icon={<FaStar className="text-white" />}
                label={t("shopDetail.topRated")}
                value={String(topRatedCount)}
                color="bg-gradient-to-br from-amber-500 to-orange-600"
              />
              <StatCard
                icon={<FaLeaf className="text-white" />}
                label={t("shopDetail.newArrivals")}
                value={String(newBouquetsCount)}
                color="bg-gradient-to-br from-rose-500 to-pink-600"
              />
              <StatCard
                icon={<FaAward className="text-white" />}
                label={t("shopDetail.avgPrice")}
                value={averagePrice}
                color="bg-gradient-to-br from-violet-500 to-purple-600"
              />
              <StatCard
                icon={<FaTruck className="text-white" />}
                label={t("shopDetail.delivery")}
                value={shop.city ?? t("shopDetail.availableNow")}
                color="bg-gradient-to-br from-sky-500 to-blue-600"
              />
            </motion.div>

            {/* ─── NAV + SORT ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
            >
              <NavPills
                activeSection={activeSection}
                scrollToSection={scrollToSection}
                counts={{ bouquets: bouquets.length, reviews: shop.reviews_count }}
              />

              <div className="inline-flex items-center gap-3 rounded-[1.4rem] border border-[#4a2020]/40 bg-[#120608]/70 px-5 py-3 text-sm backdrop-blur-md">
                <span className="text-[#a88680]">{t("shopDetail.sortBy")}</span>
                <span className="flex items-center gap-2 font-semibold text-[#f5d0a4]">
                  {t("shopDetail.sortNewest")}
                  <FaChevronDown className="text-[0.55rem] text-[#a88680]" />
                </span>
              </div>
            </motion.div>

            {/* ─── MAIN GRID: Bouquets + Sidebar ────────── */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]"
            >
              {/* Bouquets Grid */}
              <div id="bouquets" className="scroll-mt-28">
                {shopBouquetsQuery.isLoading ? (
                  <ShopDetailSkeleton />
                ) : bouquets.length ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-5 md:grid-cols-2"
                  >
                    {bouquets.map((bouquet) => (
                      <BouquetCard key={bouquet.id} bouquet={bouquet} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#4a2020]/50 bg-[#120608]/60 p-16 text-center"
                  >
                    <FaShoppingBag className="text-5xl text-[#4a2020]/50 mb-4" />
                    <p className="font-cormorant text-3xl text-white">{t("shopDetail.noBouquetsYet")}</p>
                    <p className="mt-2 text-sm text-[#a88680]">{t("shopDetail.noBouquetsDesc")}</p>
                  </motion.div>
                )}
              </div>

              {/* ─── SIDEBAR ─────────────────────────────── */}
              <aside className="space-y-5">
                {/* About Shop */}
                <motion.div
                  id="about-shop"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5 }}
                  className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-[#4a2020]/40 bg-gradient-to-b from-[#1a0a0c] to-[#100608] shadow-lg"
                >
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#cb5c57] to-[#a3322e]">
                        <FaStore className="text-xs text-white" />
                      </span>
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#a88680]">{t("shopDetail.about")}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-cormorant text-3xl font-bold text-white sm:text-4xl">{shop.name}</h2>
                      {shop.is_verified ? <ShopVerifiedBadge className="h-6 w-6" iconClassName="h-6 w-6" /> : null}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#dbb8b0]">
                      {shop.description ?? t("shopDetail.aboutShopFallback")}
                    </p>

                    {/* Contact Info */}
                    <div className="mt-6 space-y-3 border-t border-[#4a2020]/30 pt-5">
                      {shop.phone && (
                        <a href={`tel:${shop.phone}`} className="flex items-center gap-3 rounded-xl bg-[#120608] px-4 py-3 text-sm text-[#dbb8b0] transition-all duration-200 hover:bg-[#1a0a0c] hover:text-white group">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#cb5c57]/20 to-[#a3322e]/20 text-[#cb5c57] group-hover:scale-110 transition-transform duration-200">
                            <FaPhoneAlt className="text-[0.65rem]" />
                          </span>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-[#a88680]">{t("shopDetail.phone")}</p>
                            <p className="font-medium text-white">{formatUzbekPhone(shop.phone)}</p>
                          </div>
                        </a>
                      )}
                      {instagramUrl && (
                        <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-[#120608] px-4 py-3 text-sm text-[#dbb8b0] transition-all duration-200 hover:bg-[#1a0a0c] hover:text-white group">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-400 group-hover:scale-110 transition-transform duration-200">
                            <FaInstagram className="text-[0.65rem]" />
                          </span>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-[#a88680]">{t("shopDetail.instagram")}</p>
                            <p className="font-medium text-white">{shop.instagram}</p>
                          </div>
                        </a>
                      )}
                      {telegramUrl && (
                        <a href={telegramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-[#120608] px-4 py-3 text-sm text-[#dbb8b0] transition-all duration-200 hover:bg-[#1a0a0c] hover:text-white group">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-400 group-hover:scale-110 transition-transform duration-200">
                            <FaTelegramPlane className="text-[0.65rem]" />
                          </span>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-[#a88680]">{t("shopDetail.telegram")}</p>
                            <p className="font-medium text-white">{shop.telegram}</p>
                          </div>
                        </a>
                      )}
                      {shop.address && (
                        <div className="flex items-start gap-3 rounded-xl bg-[#120608] px-4 py-3 text-sm text-[#dbb8b0]">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400">
                            <FaMapMarkerAlt className="text-[0.65rem]" />
                          </span>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-[#a88680]">{t("shopDetail.address")}</p>
                            <p className="font-medium text-white">{shop.address}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mt-6 grid gap-3 border-t border-[#4a2020]/30 pt-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#4a2020]/30 bg-[#120608] p-4 transition-all duration-200 hover:border-emerald-500/20 hover:bg-[#120608]">
                        <div className="flex items-center gap-2.5 text-emerald-400">
                          <FaTruck className="text-sm" />
                          <p className="text-sm font-semibold text-white">{t("shopDetail.sameDayDelivery")}</p>
                        </div>
                        <p className="mt-2 text-xs text-[#a88680]">{t("shopDetail.sameDayDeliveryDesc")}</p>
                      </div>
                      <div className="rounded-xl border border-[#4a2020]/30 bg-[#120608] p-4 transition-all duration-200 hover:border-amber-500/20 hover:bg-[#120608]">
                        <div className="flex items-center gap-2.5 text-amber-400">
                          <FaLeaf className="text-sm" />
                          <p className="text-sm font-semibold text-white">{t("shopDetail.freshFlowers")}</p>
                        </div>
                        <p className="mt-2 text-xs text-[#a88680]">{t("shopDetail.freshFlowersDesc")}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Shop Information / Policies */}
                <motion.div
                  id="policies"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-[#4a2020]/40 bg-gradient-to-b from-[#1a0a0c] to-[#100608] shadow-lg"
                >
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                        <FaRegClock className="text-xs text-white" />
                      </span>
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#a88680]">{t("shopDetail.info")}</span>
                    </div>
                    <h3 className="font-cormorant text-3xl font-bold text-white sm:text-4xl">{t("shopDetail.shopDetails")}</h3>

                    <div className="mt-6 space-y-4">
                      {[
                        { label: t("shopDetail.totalProducts"), value: String(bouquets.length), color: "from-[#cb5c57] to-[#a3322e]" },
                        { label: t("shopDetail.availableNow"), value: String(inStockCount), color: "from-emerald-500 to-teal-600" },
                        { label: t("shopDetail.priceRange"), value: `${minPriceFormatted} — ${maxPriceFormatted}`, color: "from-violet-500 to-purple-600" },
                        { label: t("shopDetail.averagePrice"), value: averagePrice, color: "from-amber-500 to-orange-600" },
                        { label: t("shopDetail.topRatedLabel"), value: String(topRatedCount), color: "from-rose-500 to-pink-600" },
                        { label: t("shopDetail.newThisWeek"), value: String(newBouquetsCount), color: "from-sky-500 to-blue-600" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#120608] px-4 py-3 transition-all duration-200 hover:bg-[#1a0a0c]"
                        >
                          <span className="text-sm text-[#dbb8b0]">{item.label}</span>
                          <div className="flex items-center gap-2.5">
                            <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${item.color}`} />
                            <span className="text-sm font-bold text-white">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {shop.working_hours && (
                      <div className="mt-5 border-t border-[#4a2020]/30 pt-5">
                        <div className="flex items-center gap-2.5 text-sm text-[#dbb8b0]">
                          <HiOutlineClock className="text-[#f0a89a]" />
                          <span className="font-semibold text-white">{t("shopDetail.workingHours")}</span>
                          <span>{shop.working_hours}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Map */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="overflow-hidden rounded-[2rem] border border-[#4a2020]/40 bg-[#100608] shadow-lg"
                >
                  {mapUrl ? (
                    <>
                      <div className="border-b border-[#4a2020]/30 px-6 py-4">
                        <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[#a88680]">{t("shopDetail.location")}</p>
                        <p className="mt-1.5 font-semibold text-white">{shop.address}</p>
                      </div>
                      <iframe
                        title={`${shop.name} location`}
                        src={mapUrl}
                        className="h-[20rem] w-full border-0 sepia-[0.12] grayscale-[0.1]"
                        loading="lazy"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a2020] to-[#2b1012]">
                        <FaMapMarkerAlt className="text-2xl text-[#a88680]" />
                      </div>
                      <p className="font-cormorant text-2xl font-bold text-white">{t("shopDetail.locationComingSoon")}</p>
                      <p className="mt-2 text-sm text-[#a88680]">{t("shopDetail.locationComingSoonDesc")}</p>
                    </div>
                  )}
                </motion.div>
              </aside>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

export default ShopDetail;
