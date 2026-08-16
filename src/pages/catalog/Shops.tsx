import { useMemo, useState, useRef, useEffect, useCallback, useDeferredValue, Suspense, lazy, memo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiArrowRight,
  HiMagnifyingGlass,
  HiMapPin,
  HiOutlineBuildingStorefront,
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiOutlineGlobeAlt,
  HiXMark,
  HiOutlineClock,
  HiOutlineMap,
  HiChevronRight,
} from "react-icons/hi2";
import { FaInstagram, FaTelegramPlane } from "react-icons/fa";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useShops } from "../../hooks/useCatalog";
import ShopFeatureBadges from "../../components/shops/ShopFeatureBadges";
import ShopVerifiedBadge from "../../components/shops/ShopVerifiedBadge";
import type { Shop } from "../../types/catalog";
import { formatUzbekPhone } from "../../utils/phone";
import { sortShopsForDisplay } from "../../utils/shopBadges";
import { DEFAULT_MAP_CENTER } from "../../utils/location";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";
import shopsPageBackground from "../../assets/shops_bg.png";
import { Helmet } from "react-helmet-async";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * PERFORMANCE NOTES (why the page used to feel like it "froze" on open)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Every <ShopCard> ran a mount animation (`initial` → `animate`) at once,
 *    regardless of whether it was on screen. With 20-50+ shops that's
 *    dozens of simultaneous framer-motion tweens + layout writes on first
 *    paint → jank/freeze. Fixed by switching to `whileInView` so a card
 *    only animates the moment it scrolls into view (and only once).
 * 2. Leaflet (react-leaflet + leaflet) was imported eagerly at the top of
 *    the file even though the map is hidden by default. That's real JS
 *    weight blocking the initial bundle for a feature most visitors never
 *    open. Fixed by `React.lazy` + `Suspense`, loaded only on demand.
 * 3. The search input triggered a full re-filter of the shop list on every
 *    keystroke synchronously. Fixed with `useDeferredValue` so typing stays
 *    instant and filtering happens in a low-priority render.
 * 4. `ShopCard` re-rendered whenever any parent state changed (view mode,
 *    map toggle, etc.) even if that card's own data didn't change. Fixed
 *    by wrapping it in `React.memo`.
 * 5. Added `content-visibility: auto` to grid cards so the browser skips
 *    layout/paint work for cards far off-screen — cheap, native
 *    "virtualization" without a windowing library.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Map is heavy — only pull it into the bundle when the user actually opens it.
const ShopsMap = lazy(() => import("./ShopsMap"));

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1400&q=80";

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.max(1, Math.floor(value / 25));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else setDisplay(start);
    }, 30);
    return () => clearInterval(interval);
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function ShopsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[1.5rem] border border-[#3a1214]/60 bg-gradient-to-br from-[#120708] to-[#1a0a0e]"
        >
          <div className="relative h-[300px] overflow-hidden bg-gradient-to-br from-[#1e0b0d] to-[#2a1014]">
            <div className="shimmer absolute inset-0" />
          </div>
          <div className="space-y-3 p-5">
            <div className="h-7 w-2/3 rounded-lg bg-gradient-to-r from-[#1e0b0d] to-[#2a1014]" />
            <div className="h-4 w-1/2 rounded-lg bg-gradient-to-r from-[#1e0b0d] to-[#2a1014]" />
            <div className="h-16 rounded-xl bg-gradient-to-r from-[#1e0b0d] to-[#2a1014]" />
            <div className="flex gap-2 pt-2">
              <div className="h-10 flex-1 rounded-xl bg-gradient-to-r from-[#1e0b0d] to-[#2a1014]" />
              <div className="h-10 flex-1 rounded-xl bg-gradient-to-r from-[#1e0b0d] to-[#2a1014]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Pressed-Flower Divider (signature motif) ────────────────────────────────
// A thin botanical seal that stands in for the generic "01 / 02 / 03" markers
// or gradient blobs — ties every section back to the flower-shop subject.
function PressedFlowerDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#5f2825]/60 to-[#5f2825]/60" />
      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 text-[#cb5c57]/70">
        <path
          fill="currentColor"
          d="M12 2c1.6 2 1.6 5-.4 6.6C13.6 7 16.6 7 18.6 9c-2 1.6-5 1.6-6.6-.4C13.6 11 13.6 14 12 16c-1.6-2-1.6-5 .4-6.6C10.4 11 7.4 11 5.4 9c2-1.6 5-1.6 6.6.4C10.4 7 10.4 4 12 2z"
        />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#5f2825]/60 to-[#5f2825]/60" />
    </div>
  );
}

// ─── Shop Card (Grid) ────────────────────────────────────────────────────────
const ShopCard = memo(function ShopCard({
  shop,
  onQuickView,
  priority = false,
}: {
  shop: Shop;
  index: number;
  onQuickView: (s: Shop) => void;
  /** First visible row renders immediately instead of waiting for scroll-into-view */
  priority?: boolean;
}) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";
  const rating = Number(shop.rating || 0).toFixed(1);

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={priority ? undefined : { opacity: 1, y: 0 }}
      animate={priority ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 620px" }}
      className="group relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-[1.5rem] border border-[#3a1214]/70 bg-gradient-to-br from-[#120708] via-[#15090b] to-[#1a0a0e] shadow-[0_15px_45px_rgba(0,0,0,0.25)] transition-colors duration-500 hover:border-[#cb5c57]/50 hover:shadow-[0_25px_70px_rgba(0,0,0,0.4)]"
    >
      <div className="pointer-events-none absolute -inset-px z-0 rounded-[1.5rem] bg-gradient-to-br from-[#cb5c57]/20 via-transparent to-[#ff8fa0]/10 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />

      {/* IMAGE / HERO */}
      <Link to={`/shops/${shop.slug}`} className="relative z-10 block aspect-[7/6] shrink-0 overflow-hidden bg-[#1a0809]">
        <img
          src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
          alt={shop.name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          width={560}
          height={480}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0506]/35 via-transparent to-[#0f0506]/95" />

        <div className="absolute inset-x-4 top-4">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-[#0f0506]/80 px-4 text-[10px] font-medium uppercase tracking-[0.16em] text-[#f4d1c3] backdrop-blur-md">
              <HiMapPin size={12} className="shrink-0 text-[#f2bf88]" />
              {shop.city ?? t("shopsPage.noCity")}
            </span>
            <div className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#f2c67c]/20 bg-[#0f0506]/80 px-4 text-[10px] font-semibold text-white backdrop-blur-md">
              <HiOutlineStar size={12} className="text-[#f2c67c]" />
              <span>{rating}</span>
              <span className="text-[#c9a09a]">({shop.reviews_count})</span>
            </div>
          </div>
          <div className="mt-2 min-h-10">
            <ShopFeatureBadges shop={shop} />
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onQuickView(shop);
          }}
          className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0f0506]/75 text-white/80 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:border-transparent hover:bg-[#971725] hover:text-white"
          aria-label={t("shopsPage.quickView")}
        >
          <HiOutlineBuildingStorefront size={15} />
        </button>

        <div className="absolute bottom-5 left-4 right-4 flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#140708]/85 shadow-xl backdrop-blur-md">
            {shop.logo ? (
              <img src={shop.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="font-cormorant text-3xl text-white">{shop.name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-cormorant text-[2rem] leading-none text-white">{shop.name}</h2>
              {shop.is_verified && <ShopVerifiedBadge className="h-5 w-5 shrink-0" iconClassName="h-5 w-5" />}
            </div>
          </div>
        </div>
      </Link>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-1 flex-col p-5">
        <div className="min-h-[72px]">
          <p className="line-clamp-2 text-[15px] leading-7 text-[#c9a09a]">
            {shop.description ?? t("shopsPage.noDescription")}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-[82px] overflow-hidden rounded-2xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-4 py-3 transition-colors duration-300 group-hover:border-[#cb5c57]/20">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#9a706a]">{t("shopsPage.contact")}</p>
            <p className="mt-2 flex items-center gap-2 truncate text-sm font-medium text-white">
              <HiOutlinePhone size={13} className="shrink-0 text-[#e0a495]" />
              <span className="truncate">{formatUzbekPhone(shop.phone)}</span>
            </p>
          </div>
          <div className="h-[82px] overflow-hidden rounded-2xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-4 py-3 transition-colors duration-300 group-hover:border-[#cb5c57]/20">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#9a706a]">{t("shopsPage.address")}</p>
            <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-white">
              <HiMapPin size={13} className="mt-0.5 shrink-0 text-[#e0a495]" />
              <span className="line-clamp-2">{shop.address}</span>
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="flex min-w-0 items-center gap-2">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] text-[#e0b8b0] transition-all duration-300 hover:scale-110 hover:border-[#cb5c57]/50 hover:text-white hover:shadow-lg hover:shadow-[#cb5c57]/20"
                aria-label="Instagram"
              >
                <FaInstagram size={15} />
              </a>
            )}
            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] text-[#e0b8b0] transition-all duration-300 hover:scale-110 hover:border-[#cb5c57]/50 hover:text-white hover:shadow-lg hover:shadow-[#cb5c57]/20"
                aria-label="Telegram"
              >
                <FaTelegramPlane size={15} />
              </a>
            )}
            <a
              href={`tel:${shop.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-10 items-center gap-2 rounded-full border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-4 text-xs font-medium text-[#e0b8b0] transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white hover:shadow-lg hover:shadow-[#cb5c57]/10"
            >
              <HiOutlinePhone size={13} />
              {t("shopsPage.call")}
            </a>
          </div>

          <Link
            to={`/shops/${shop.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#971725] to-[#c22d3d] px-5 text-xs font-semibold text-white shadow-[0_10px_25px_rgba(151,23,37,0.22)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_15px_35px_rgba(151,23,37,0.35)]"
          >
            {t("shopsPage.openShop")}
            <HiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
});

// ─── Shop Card (List) ────────────────────────────────────────────────────────
const ShopCardList = memo(function ShopCardList({ shop, priority = false }: { shop: Shop; index: number; priority?: boolean }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";

  return (
    <motion.article
      initial={{ opacity: 0, x: -16 }}
      whileInView={priority ? undefined : { opacity: 1, x: 0 }}
      animate={priority ? { opacity: 1, x: 0 } : undefined}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 180px" }}
      className="group overflow-hidden rounded-2xl border border-[#3a1214]/60 bg-gradient-to-br from-[#120708] to-[#1a0a0e] shadow-lg transition-colors duration-500 hover:border-[#cb5c57]/50 hover:shadow-2xl hover:shadow-[#cb5c57]/15"
    >
      <div className="flex flex-col sm:flex-row">
        <Link to={`/shops/${shop.slug}`} className="relative block h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-56 lg:w-64">
          <img
            src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
            alt={shop.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent to-[#120708]/80 sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120708]/90 to-transparent sm:hidden" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#0f0506]/80 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#f4d1c3] backdrop-blur-sm">
            <HiMapPin size={10} className="text-[#f2bf88]" />
            {shop.city ?? t("shopsPage.noCity")}
          </span>
        </Link>

        <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-cormorant text-2xl leading-tight text-white sm:text-3xl">{shop.name}</h2>
                  {shop.is_verified && <ShopVerifiedBadge className="h-4 w-4" iconClassName="h-4 w-4" />}
                </div>
                <ShopFeatureBadges shop={shop} className="mt-1.5" />
              </div>
              <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#f2c67c]/20 bg-[#0d0405]/80 px-2.5 py-1 text-[10px] font-semibold text-white">
                <HiOutlineStar size={11} className="text-[#f2c67c]" />
                {Number(shop.rating).toFixed(1)}
                <span className="hidden text-[#9a706a] sm:inline">· {shop.reviews_count}</span>
              </div>
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-[#c9a09a]">{shop.description ?? t("shopsPage.noDescription")}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-3 py-1.5">
                <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.contact")}</p>
                <p className="text-xs font-medium text-white">{formatUzbekPhone(shop.phone)}</p>
              </div>
              <div className="flex gap-1.5">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] text-[#e0b8b0] transition-all duration-300 hover:scale-110 hover:border-[#cb5c57]/50 hover:text-white"
                  >
                    <FaInstagram size={13} />
                  </a>
                )}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] text-[#e0b8b0] transition-all duration-300 hover:scale-110 hover:border-[#cb5c57]/50 hover:text-white"
                  >
                    <FaTelegramPlane size={13} />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${shop.phone}`}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-3 text-xs font-medium text-[#e0b8b0] transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white hover:shadow-lg"
              >
                <HiOutlinePhone size={12} />
                {t("shopsPage.call")}
              </a>
              <Link
                to={`/shops/${shop.slug}`}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#971725] to-[#c22d3d] px-4 text-xs font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#971725]/30"
              >
                {t("shopsPage.openShop")}
                <HiArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

// ─── Quick View Modal ────────────────────────────────────────────────────────
function ShopQuickModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#3a1214]/70 bg-gradient-to-br from-[#120708] to-[#1a0a0e] shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-[#971725]"
          aria-label={t("shopsPage.closePreview")}
        >
          <HiXMark size={15} />
        </button>

        <div className="relative h-44 overflow-hidden">
          <img src={shop.banner ?? shop.logo ?? FALLBACK_BANNER} alt={shop.name} loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120708]/95 via-[#120708]/30 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-end gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#140708]/80 shadow-lg backdrop-blur-sm">
              {shop.logo ? (
                <img src={shop.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="font-cormorant text-3xl text-white">{shop.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cormorant text-2xl leading-none text-white">{shop.name}</h2>
                {shop.is_verified && <ShopVerifiedBadge className="h-4 w-4" iconClassName="h-4 w-4" />}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[#c9a09a]">
                <span className="flex items-center gap-1">
                  <HiOutlineStar size={11} className="text-[#f2c67c]" />
                  {Number(shop.rating).toFixed(1)}
                </span>
                <span>·</span>
                <span>
                  {shop.reviews_count} {t("shopsPage.reviews")}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <HiMapPin size={10} />
                  {shop.city ?? t("shopsPage.noCity")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <ShopFeatureBadges shop={shop} />
          <p className="text-sm leading-6 text-[#c9a09a]">{shop.description ?? t("shopsPage.noDescription")}</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.contact")}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-white">
                <HiOutlinePhone size={11} className="text-[#e0a495]" />
                {formatUzbekPhone(shop.phone)}
              </p>
            </div>
            <div className="rounded-xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.address")}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-white line-clamp-1">
                <HiMapPin size={11} className="shrink-0 text-[#e0a495]" />
                {shop.address}
              </p>
            </div>
          </div>

          {shop.working_hours && (
            <div className="rounded-xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.workingHours")}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-white">
                <HiOutlineClock size={11} className="text-[#e0a495]" />
                {shop.working_hours}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] text-[#e0b8b0] transition-all duration-300 hover:scale-110 hover:border-[#cb5c57]/50 hover:text-white"
                >
                  <FaInstagram size={14} />
                </a>
              )}
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] text-[#e0b8b0] transition-all duration-300 hover:scale-110 hover:border-[#cb5c57]/50 hover:text-white"
                >
                  <FaTelegramPlane size={14} />
                </a>
              )}
              <a
                href={`tel:${shop.phone}`}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3a1214]/60 bg-gradient-to-br from-[#0d0405] to-[#140708] px-3 text-xs font-medium text-[#e0b8b0] transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white hover:shadow-lg"
              >
                <HiOutlinePhone size={12} />
                {t("shopsPage.call")}
              </a>
            </div>
            <Link
              to={`/shops/${shop.slug}`}
              onClick={onClose}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#971725] to-[#c22d3d] px-4 text-xs font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#971725]/30"
            >
              {t("shopsPage.openShop")}
              <HiArrowRight size={12} />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Featured Spotlight ──────────────────────────────────────────────────────
function FeaturedSpotlight({ shops }: { shops: Shop[] }) {
  const { t } = useTranslation();
  const featured = useMemo(() => shops.filter((s) => Number(s.rating) >= 4.5).slice(0, 5), [shops]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (featured.length < 2 || paused) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % featured.length), 5500);
    return () => clearInterval(timer);
  }, [featured.length, paused]);

  if (featured.length < 2) return null;
  const shop = featured[current];
  const rating = Number(shop.rating || 0).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="overflow-hidden rounded-[2rem] border border-[#f2c67c]/20 bg-gradient-to-br from-[#1a0a0e] via-[#120708] to-[#0d0405] shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
    >
      <div className="flex flex-col lg:flex-row">
        <div className="relative h-56 w-full shrink-0 overflow-hidden lg:h-auto lg:w-[28rem]">
          <AnimatePresence mode="wait">
            <motion.img
              key={shop.id}
              src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
              alt={shop.name}
              loading="eager"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0203]/80 via-[#0a0203]/20 to-[#0a0203]/90 lg:from-[#0a0203]/60 lg:to-[#0a0203]/90" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#f2c67c]/30 bg-[#140809]/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f2c67c] backdrop-blur-md">
            <HiOutlineStar size={10} />
            {t("shopsPage.featured")}
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-[#160a0b]/60 p-3 backdrop-blur-md lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7aba2]">{t("shopsPage.topRatedBoutiques")}</p>
                <h3 className="mt-1 font-cormorant text-3xl leading-none text-white">{shop.name}</h3>
              </div>
              <div className="rounded-full border border-[#f2c67c]/25 bg-[#2a1114]/80 px-2.5 py-1 text-xs font-semibold text-[#ffe1a6]">{rating}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="hidden text-[10px] uppercase tracking-[0.34em] text-[#c9a09a] lg:block">{t("shopsPage.topRatedBoutiques")}</p>
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={shop.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden font-cormorant text-[3.2rem] leading-[0.95] tracking-tight text-white lg:mt-2 lg:block"
                  >
                    {shop.name}
                  </motion.h3>
                </AnimatePresence>
              </div>
              <div className="hidden items-center gap-2 self-start lg:flex">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f2c67c]/20 bg-[#211012]/80 px-3 py-1.5 text-sm text-[#ffe1a6]">
                  <HiOutlineStar className="text-[#f2c67c]" size={15} />
                  <span className="font-semibold">{rating}</span>
                </div>
                {shop.is_verified ? <ShopVerifiedBadge className="h-7 w-7" iconClassName="drop-shadow-[0_0_12px_rgba(77,163,255,0.3)]" /> : null}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={shop.id + "d"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="mt-4 max-w-2xl text-sm leading-7 text-[#d3aaa3] lg:mt-5 lg:text-[15px]"
              >
                {shop.description ?? t("shopsPage.noDescription")}
              </motion.p>
            </AnimatePresence>

            <div className="mt-5 flex flex-wrap gap-2.5 lg:mt-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#e5c2ba] backdrop-blur-sm">
                <HiMapPin size={14} className="text-[#ff8ea0]" />
                <span>{shop.city || t("shopsPage.cityNotSet")}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#e5c2ba] backdrop-blur-sm">
                <HiOutlineStar size={14} className="text-[#f2c67c]" />
                <span>
                  {rating} · {shop.reviews_count} {t("shopsPage.reviews")}
                </span>
              </div>
              {shop.working_hours ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#e5c2ba] backdrop-blur-sm">
                  <HiOutlineClock size={14} className="text-[#ff8ea0]" />
                  <span className="line-clamp-1">{shop.working_hours}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mt-8">
            <div className="flex items-center gap-3">
              {featured.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to featured shop ${i + 1}`}
                  className={`rounded-full transition-all duration-500 ${
                    i === current
                      ? "h-2.5 w-10 bg-gradient-to-r from-[#ff7d8f] to-[#cb5c57] shadow-[0_0_16px_rgba(203,92,87,0.4)]"
                      : "h-2.5 w-2.5 bg-[#6b3940] hover:scale-110 hover:bg-[#8f4f58]"
                  }`}
                />
              ))}
            </div>
            <Link
              to={`/shops/${shop.slug}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#971725] to-[#c22d3d] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(151,23,37,0.3)] transition-all duration-300 hover:translate-y-[-2px] hover:scale-105 hover:shadow-[0_18px_40px_rgba(151,23,37,0.4)]"
            >
              {t("shopsPage.openShop")}
              <HiChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Shops() {
  const { t } = useTranslation();
  const { data: allShops = [], isLoading } = useShops();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // keeps typing snappy on large lists
  const [selectedCity, setSelectedCity] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMap, setShowMap] = useState(false);
  const [quickShop, setQuickShop] = useState<Shop | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const shops = useMemo(() => sortShopsForDisplay(allShops.filter((s) => s.status === "active")), [allShops]);

  const cities = useMemo(
    () => ["all", ...Array.from(new Set(shops.map((s) => s.city?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))],
    [shops],
  );

  const filteredShops = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return shops.filter((s) => {
      const matchCity = selectedCity === "all" || s.city === selectedCity;
      const matchQ = q ? [s.name, s.city ?? "", s.address, s.description ?? ""].join(" ").toLowerCase().includes(q) : true;
      return matchCity && matchQ;
    });
  }, [deferredQuery, selectedCity, shops]);

  const stats = useMemo(
    () => ({
      total: shops.length,
      cities: cities.length - 1,
      topRated: shops.filter((s) => Number(s.rating) >= 4.5).length,
    }),
    [cities.length, shops],
  );

  const shopsWithCoords = useMemo(() => filteredShops.filter((s) => s.latitude && s.longitude), [filteredShops]);

  const mapCenter: [number, number] =
    shopsWithCoords.length > 0 ? [Number(shopsWithCoords[0].latitude), Number(shopsWithCoords[0].longitude)] : DEFAULT_MAP_CENTER;

  const handleQuickView = useCallback((shop: Shop) => setQuickShop(shop), []);
  const hasActiveFilters = query || selectedCity !== "all";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
    <Helmet>
            <title>Shops</title>
            <meta
              name="description"
              content="Discover the best flower shops in Uzbekistan. Browse our curated list of top-rated boutiques, read reviews, and find the perfect florist for your needs."
            />
          </Helmet>
          <main className="relative isolate min-h-screen overflow-hidden text-[#fff6f4]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <img
          src={shopsPageBackground}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="h-full w-full object-cover object-center opacity-70"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-15 bg-gradient-to-b from-[#0a0203]/80 via-[#0a0203]/60 to-[#0a0203]/85" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#cb5c57]/8 blur-3xl" />
        <div className="absolute -right-20 top-48 h-72 w-72 rounded-full bg-[#d9b56f]/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#ff8fa0]/5 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pt-36">
        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="text-[10px] uppercase tracking-[0.35em] text-[#efc8b5]"
          >
            {t("shopsPage.pageLabel")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            className="mt-3 font-great-vibes text-[clamp(3.2rem,7.5vw,6.5rem)] leading-[0.9] text-[#fff7f3] [text-shadow:0_8px_32px_rgba(0,0,0,0.5)]"
          >
            {t("shopsPage.title")}
          </motion.h1>

          <PressedFlowerDivider className="mx-auto mt-4 max-w-xs" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.35 }}
            className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#f0d8d0]/80"
          >
            {t("shopsPage.description")}
          </motion.p>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.35 }} className="mx-auto mt-6 flex max-w-2xl gap-3">
            <div className="group relative flex-1">
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c88f88] transition-colors group-focus-within:text-[#ff9b88]"
                size={16}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${t("shopsPage.searchPlaceholder")} (⌘K)`}
                className="h-11 w-full rounded-xl border border-[#5f2825]/50 bg-[#090304]/85 pl-11 pr-9 text-sm text-white outline-none transition-all duration-300 placeholder:text-[#9c7269] focus:border-[#cb5c57]/60 focus:shadow-[0_0_30px_rgba(203,92,87,0.1)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#c9aaa2] transition-all duration-300 hover:scale-110 hover:bg-[#2b1012] hover:text-white"
                >
                  <HiXMark size={13} />
                </button>
              )}
            </div>
            <Link
              to="/bouquets"
              className="flex h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-[#d1a657]/25 bg-[#110608] px-4 text-sm font-medium text-[#f4dfbb] transition-all duration-300 hover:border-[#d1a657]/50 hover:text-white hover:shadow-lg hover:shadow-[#d1a657]/10"
            >
              <HiOutlineBuildingStorefront size={15} />
              <span className="hidden sm:inline">{t("shopsPage.browseBouquets")}</span>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.35 }}
            className="mx-auto mt-5 inline-flex items-center gap-5 rounded-2xl border border-[#5f2825]/30 bg-[#100506]/80 px-6 py-3 shadow-lg backdrop-blur-sm"
          >
            {[
              { label: t("shopsPage.totalShops"), value: stats.total, icon: HiOutlineBuildingStorefront },
              { label: t("shopsPage.cities"), value: stats.cities, icon: HiOutlineGlobeAlt },
              { label: t("shopsPage.topRated"), value: stats.topRated, icon: HiOutlineStar },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-5">
                {i > 0 && <div className="h-7 w-px bg-[#5f2825]/40" />}
                <div className="text-center">
                  <p className="text-base font-bold text-white">
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#c9a09a]">
                    <stat.icon size={10} />
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Featured Spotlight ── */}
        {!hasActiveFilters && !isLoading && (
          <div className="mb-6">
            <FeaturedSpotlight shops={shops} />
          </div>
        )}

        {/* ── Filters bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mb-5 rounded-2xl border border-[#3a1214]/60 bg-[#0d0405]/90 p-3 shadow-lg backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-0.5">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                    selectedCity === city
                      ? "border-[#cb5c57] bg-gradient-to-r from-[#cb5c57] to-[#e0666a] text-white shadow-lg shadow-[#cb5c57]/30"
                      : "border-[#5f2825]/50 bg-[#0d0405]/80 text-[#dfc0b8] hover:border-[#cb5c57]/50 hover:text-white hover:shadow-lg hover:shadow-[#cb5c57]/10"
                  }`}
                >
                  {city === "all" ? t("shopsPage.allCities") : city}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-[#c9a09a] sm:block">
                {filteredShops.length} {t("shopsPage.results", { count: filteredShops.length }).replace(/\d+\s*/, "")}
              </span>

              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all duration-200 active:scale-95 ${
                  showMap
                    ? "border-[#cb5c57] bg-gradient-to-r from-[#cb5c57] to-[#e0666a] text-white shadow-lg shadow-[#cb5c57]/30"
                    : "border-[#5f2825]/50 bg-[#0d0405] text-[#dfc0b8] hover:border-[#cb5c57]/50 hover:text-white"
                }`}
              >
                <HiOutlineMap size={13} />
                <span className="hidden sm:inline">{showMap ? t("shopsPage.hideMap") : t("shopsPage.showMap")}</span>
              </button>

              <div className="flex rounded-xl border border-[#5f2825]/50 bg-[#0d0405] p-0.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                    viewMode === "grid" ? "bg-gradient-to-r from-[#cb5c57] to-[#e0666a] text-white shadow-lg shadow-[#cb5c57]/30" : "text-[#c9a09a] hover:text-white"
                  }`}
                  aria-label={t("shopsPage.gridView")}
                >
                  <HiOutlineSquares2X2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-90 ${
                    viewMode === "list" ? "bg-gradient-to-r from-[#cb5c57] to-[#e0666a] text-white shadow-lg shadow-[#cb5c57]/30" : "text-[#c9a09a] hover:text-white"
                  }`}
                  aria-label={t("shopsPage.listView")}
                >
                  <HiOutlineBars3 size={15} />
                </button>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#3a1214]/40 pt-2.5">
              {query && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cb5c57]/30 bg-[#cb5c57]/10 px-3 py-1 text-[11px] text-[#ffc8c0]">
                  "{query}"
                  <button type="button" onClick={() => setQuery("")} className="transition-colors hover:text-white">
                    <HiXMark size={11} />
                  </button>
                </span>
              )}
              {selectedCity !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cb5c57]/30 bg-[#cb5c57]/10 px-3 py-1 text-[11px] text-[#ffc8c0]">
                  <HiMapPin size={10} />
                  {selectedCity}
                  <button type="button" onClick={() => setSelectedCity("all")} className="transition-colors hover:text-white">
                    <HiXMark size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCity("all");
                }}
                className="text-[11px] text-[#9a706a] transition-colors hover:text-white"
              >
                {t("shopsPage.clearFilters")}
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Map (lazy-loaded, only when opened) ── */}
        <AnimatePresence>
          {showMap && shopsWithCoords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 overflow-hidden rounded-2xl border border-[#3a1214]/60 shadow-2xl"
            >
              <div className="h-[280px] w-full sm:h-[380px]">
                <Suspense
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-[#0d0405] text-xs text-[#c9a09a]">
                      {t("shopsPage.showMap")}…
                    </div>
                  }
                >
                  <ShopsMap shops={shopsWithCoords} center={mapCenter} />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid / List ── */}
        {isLoading ? (
          <ShopsSkeleton />
        ) : filteredShops.length ? (
          viewMode === "grid" ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredShops.map((shop, i) => (
                <ShopCard key={shop.id} shop={shop} index={i} onQuickView={handleQuickView} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShops.map((shop, i) => (
                <ShopCardList key={shop.id} shop={shop} index={i} priority={i < 4} />
              ))}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-dashed border-[#5f2825]/40 bg-[#0f0506]/60 px-6 py-20 text-center backdrop-blur-sm"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#5f2825]/30 bg-gradient-to-br from-[#150708] to-[#1a0a0e] shadow-lg">
              <HiOutlineBuildingStorefront size={28} className="text-[#cb5c57]" />
            </div>
            <h2 className="font-cormorant text-4xl text-white">{t("shopsPage.noResultsTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c9a09a]">{t("shopsPage.noResultsDescription")}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCity("all");
              }}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#971725] to-[#c22d3d] px-5 text-sm font-semibold text-white shadow-lg shadow-[#971725]/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
            >
              {t("shopsPage.clearFilters")}
            </button>
          </motion.div>
        )}
      </section>

      <AnimatePresence>{quickShop && <ShopQuickModal shop={quickShop} onClose={() => setQuickShop(null)} />}</AnimatePresence>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

        .shimmer {
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
    </>
    
  );
}