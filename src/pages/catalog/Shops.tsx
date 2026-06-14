import { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useShops } from "../../hooks/useCatalog";
import ShopFeatureBadges from "../../components/shops/ShopFeatureBadges";
import ShopVerifiedBadge from "../../components/shops/ShopVerifiedBadge";
import type { Shop } from "../../types/catalog";
import { formatUzbekPhone } from "../../utils/phone";
import { sortShopsForDisplay } from "../../utils/shopBadges";
import { DEFAULT_MAP_CENTER } from "../../utils/location";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";
import shopsPageBackground from "../../assets/shops_bg.png";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1400&q=80";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
      if (start >= value) { setDisplay(value); clearInterval(interval); }
      else setDisplay(start);
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
        <div key={i} className="overflow-hidden rounded-2xl border border-[#3a1214]/60 bg-[#120708]">
          <div className="h-52 animate-pulse bg-[#1e0b0d]" />
          <div className="space-y-3 p-4">
            <div className="h-7 w-2/3 animate-pulse rounded-lg bg-[#1e0b0d]" />
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-[#1e0b0d]" />
            <div className="h-14 animate-pulse rounded-xl bg-[#1e0b0d]" />
            <div className="flex gap-2">
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-[#1e0b0d]" />
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-[#1e0b0d]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Map bounds ─────────────────────────────────────────────────────────────
function MapBoundsController({ shops }: { shops: Shop[] }) {
  const map = useMap();
  useEffect(() => {
    if (!shops.length) return;
    const bounds = L.latLngBounds(
      shops.map((s) => [Number(s.latitude), Number(s.longitude)] as [number, number]),
    );
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.15), { animate: false });
  }, [map, shops]);
  return null;
}

// ─── Map Popup ──────────────────────────────────────────────────────────────
function MapPopupContent({ shop }: { shop: Shop }) {
  const { t } = useTranslation();
  return (
    <div className="w-56 font-sans">
      <div className="-mx-0 -mt-0 mb-3 h-24 overflow-hidden rounded-t-xl">
        <img src={shop.banner ?? shop.logo ?? FALLBACK_BANNER} alt={shop.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <h3 className="text-sm font-bold text-gray-900">{shop.name}</h3>
      <p className="mt-1 text-xs text-gray-600">{shop.address}</p>
      {shop.working_hours && (
        <p className="mt-1 text-xs text-gray-600">{shop.working_hours}</p>
      )}
      <Link
        to={`/shops/${shop.slug}`}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#971725] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#b01e2f]"
      >
        {t("shopsPage.openShop")} <HiArrowRight size={12} />
      </Link>
    </div>
  );
}

// ─── Shop Card (Grid) ────────────────────────────────────────────────────────
function ShopCard({ shop, index, onQuickView }: { shop: Shop; index: number; onQuickView: (s: Shop) => void }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-[#3a1214]/60 bg-[#120708] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#cb5c57]/40 hover:shadow-xl hover:shadow-[#cb5c57]/10"
    >
      {/* Image */}
      <Link to={`/shops/${shop.slug}`} className="block relative h-52 overflow-hidden bg-[#1a0809]">
        <img
          src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
          alt={shop.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0506]/85 via-transparent to-transparent" />

        {/* Top-left: city + badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0f0506]/70 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#f4d1c3] backdrop-blur-sm">
            <HiMapPin size={10} className="text-[#f2bf88]" />
            {shop.city ?? t("shopsPage.noCity")}
          </span>
          <ShopFeatureBadges shop={shop} />
        </div>

        {/* Top-right: rating */}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#f2c67c]/20 bg-[#0f0506]/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          <HiOutlineStar size={11} className="text-[#f2c67c]" />
          {shop.rating}
          <span className="text-[#c9a09a]">({shop.reviews_count})</span>
        </div>

        {/* Quick view button */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onQuickView(shop); }}
          className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#0f0506]/70 text-white/70 backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-[#971725]/80 hover:text-white hover:border-transparent"
          aria-label={t("shopsPage.quickView")}
        >
          <HiOutlineBuildingStorefront size={14} />
        </button>

        {/* Bottom: logo + name */}
        <div className="absolute bottom-3 left-3 flex items-end gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#140708]/80 backdrop-blur-sm">
            {shop.logo
              ? <img src={shop.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
              : <span className="font-cormorant text-2xl text-white">{shop.name.charAt(0)}</span>
            }
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-cormorant text-2xl leading-none text-white">{shop.name}</h2>
              {shop.is_verified && <ShopVerifiedBadge className="h-4 w-4" iconClassName="h-4 w-4" />}
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 min-h-[2.8rem] text-sm leading-6 text-[#c9a09a]">
          {shop.description ?? t("shopsPage.noDescription")}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.contact")}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-white truncate">
              <HiOutlinePhone size={11} className="text-[#e0a495] shrink-0" />
              {formatUzbekPhone(shop.phone)}
            </p>
          </div>
          <div className="rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.address")}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white line-clamp-1">
              <HiMapPin size={11} className="text-[#e0a495] shrink-0" />
              {shop.address}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a1214]/60 bg-[#0d0405] text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white"
                aria-label="Instagram">
                <FaInstagram size={13} />
              </a>
            )}
            {telegramUrl && (
              <a href={telegramUrl} target="_blank" rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a1214]/60 bg-[#0d0405] text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white"
                aria-label="Telegram">
                <FaTelegramPlane size={13} />
              </a>
            )}
            <a href={`tel:${shop.phone}`}
              className="flex h-8 items-center gap-1.5 rounded-full border border-[#3a1214]/60 bg-[#0d0405] px-3 text-xs font-medium text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white">
              <HiOutlinePhone size={11} />
              {t("shopsPage.call")}
            </a>
          </div>
          <Link
            to={`/shops/${shop.slug}`}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[#971725] px-3.5 text-xs font-semibold text-white transition hover:bg-[#b01e2f]"
          >
            {t("shopsPage.openShop")}
            <HiArrowRight size={12} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Shop Card (List) ────────────────────────────────────────────────────────
function ShopCardList({ shop, index }: { shop: Shop; index: number }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";

  return (
    <motion.article
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group overflow-hidden rounded-2xl border border-[#3a1214]/60 bg-[#120708] shadow-lg transition-all duration-300 hover:border-[#cb5c57]/35 hover:shadow-xl hover:shadow-[#cb5c57]/8"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <Link to={`/shops/${shop.slug}`} className="relative block h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-56 lg:w-64">
          <img
            src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
            alt={shop.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#120708]/80 hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120708]/80 to-transparent sm:hidden" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#0f0506]/70 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#f4d1c3] backdrop-blur-sm">
            <HiMapPin size={10} className="text-[#f2bf88]" />
            {shop.city ?? t("shopsPage.noCity")}
          </span>
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-cormorant text-2xl sm:text-3xl leading-tight text-white truncate">{shop.name}</h2>
                  {shop.is_verified && <ShopVerifiedBadge className="h-4 w-4" iconClassName="h-4 w-4" />}
                </div>
                <ShopFeatureBadges shop={shop} className="mt-1.5" />
              </div>
              <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#f2c67c]/20 bg-[#0d0405] px-2.5 py-1 text-[10px] font-semibold text-white">
                <HiOutlineStar size={11} className="text-[#f2c67c]" />
                {shop.rating}
                <span className="text-[#9a706a] hidden sm:inline">· {shop.reviews_count}</span>
              </div>
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-[#c9a09a]">{shop.description ?? t("shopsPage.noDescription")}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 py-1.5">
                <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.contact")}</p>
                <p className="text-xs font-medium text-white">{formatUzbekPhone(shop.phone)}</p>
              </div>
              <div className="flex gap-1.5">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a1214]/60 bg-[#0d0405] text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white">
                    <FaInstagram size={13} />
                  </a>
                )}
                {telegramUrl && (
                  <a href={telegramUrl} target="_blank" rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a1214]/60 bg-[#0d0405] text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white">
                    <FaTelegramPlane size={13} />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${shop.phone}`}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 text-xs font-medium text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white">
                <HiOutlinePhone size={12} />
                {t("shopsPage.call")}
              </a>
              <Link
                to={`/shops/${shop.slug}`}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[#971725] px-4 text-xs font-semibold text-white transition hover:bg-[#b01e2f]">
                {t("shopsPage.openShop")}
                <HiArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Quick View Modal ────────────────────────────────────────────────────────
function ShopQuickModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#3a1214]/70 bg-[#120708] shadow-2xl"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-[#971725]"
          aria-label={t("shopsPage.closePreview")}
        >
          <HiXMark size={15} />
        </button>

        {/* Banner */}
        <div className="relative h-44 overflow-hidden">
          <img src={shop.banner ?? shop.logo ?? FALLBACK_BANNER} alt={shop.name} loading="lazy"
            className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120708]/90 via-[#120708]/20 to-transparent" />

          <div className="absolute bottom-4 left-4 flex items-end gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#140708]/80 backdrop-blur-sm">
              {shop.logo
                ? <img src={shop.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
                : <span className="font-cormorant text-3xl text-white">{shop.name.charAt(0)}</span>
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cormorant text-2xl leading-none text-white">{shop.name}</h2>
                {shop.is_verified && <ShopVerifiedBadge className="h-4 w-4" iconClassName="h-4 w-4" />}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[#c9a09a]">
                <span className="flex items-center gap-1"><HiOutlineStar size={11} className="text-[#f2c67c]" />{shop.rating}</span>
                <span>·</span>
                <span>{shop.reviews_count} {t("shopsPage.reviews")}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><HiMapPin size={10} />{shop.city ?? t("shopsPage.noCity")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <ShopFeatureBadges shop={shop} />
          <p className="text-sm leading-6 text-[#c9a09a]">{shop.description ?? t("shopsPage.noDescription")}</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.contact")}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-white">
                <HiOutlinePhone size={11} className="text-[#e0a495]" />
                {formatUzbekPhone(shop.phone)}
              </p>
            </div>
            <div className="rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[#9a706a]">{t("shopsPage.address")}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-white line-clamp-1">
                <HiMapPin size={11} className="text-[#e0a495] shrink-0" />
                {shop.address}
              </p>
            </div>
          </div>

          {shop.working_hours && (
            <div className="rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 py-2">
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
                <a href={instagramUrl} target="_blank" rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a1214]/60 bg-[#0d0405] text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white">
                  <FaInstagram size={14} />
                </a>
              )}
              {telegramUrl && (
                <a href={telegramUrl} target="_blank" rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a1214]/60 bg-[#0d0405] text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white">
                  <FaTelegramPlane size={14} />
                </a>
              )}
              <a href={`tel:${shop.phone}`}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3a1214]/60 bg-[#0d0405] px-3 text-xs font-medium text-[#e0b8b0] transition hover:border-[#cb5c57]/50 hover:text-white">
                <HiOutlinePhone size={12} />
                {t("shopsPage.call")}
              </a>
            </div>
            <Link to={`/shops/${shop.slug}`} onClick={onClose}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-[#971725] px-4 text-xs font-semibold text-white transition hover:bg-[#b01e2f]">
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

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % featured.length), 4500);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length < 2) return null;
  const shop = featured[current];
  const rating = Number(shop.rating || 0).toFixed(1);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#f2c67c]/15 bg-[linear-gradient(135deg,rgba(25,8,10,0.96),rgba(16,5,7,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col lg:flex-row">
        {/* Image panel */}
        <div className="relative h-56 w-full shrink-0 overflow-hidden lg:h-auto lg:w-[26rem]">
          <AnimatePresence mode="wait">
            <motion.img
              key={shop.id}
              src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
              alt={shop.name}
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,3,4,0.12),rgba(9,3,4,0.02)_35%,rgba(15,6,8,0.84)_100%)] hidden lg:block" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,3,4,0.04),rgba(15,6,8,0.78)_100%)] lg:hidden" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#f2c67c]/30 bg-[#140809]/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f2c67c] backdrop-blur-md">
            <HiOutlineStar size={10} />
            {t("shopsPage.featured")}
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-[#160a0b]/55 p-3 backdrop-blur-md lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7aba2]">{t("shopsPage.topRatedBoutiques")}</p>
                <h3 className="mt-1 font-cormorant text-3xl leading-none text-white">{shop.name}</h3>
              </div>
              <div className="rounded-full border border-[#f2c67c]/25 bg-[#2a1114]/80 px-2.5 py-1 text-xs font-semibold text-[#ffe1a6]">
                {rating}
              </div>
            </div>
          </div>
        </div>

        {/* Text panel */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 lg:p-8">
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
                    transition={{ duration: 0.25 }}
                    className="hidden font-cormorant text-[3.1rem] leading-[0.95] tracking-tight text-white lg:mt-2 lg:block"
                  >
                    {shop.name}
                  </motion.h3>
                </AnimatePresence>
              </div>
              <div className="hidden lg:flex items-center gap-2 self-start">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#e5c2ba]">
                <HiMapPin size={14} className="text-[#ff8ea0]" />
                <span>{shop.city || t("shopsPage.cityNotSet")}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#e5c2ba]">
                <HiOutlineStar size={14} className="text-[#f2c67c]" />
                <span>{rating} · {shop.reviews_count} reviews</span>
              </div>
              {shop.working_hours ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#e5c2ba]">
                  <HiOutlineClock size={14} className="text-[#ff8ea0]" />
                  <span className="line-clamp-1">{shop.working_hours}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mt-8">
            <div className="flex items-center gap-2.5">
              {featured.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to featured shop ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "h-2 w-8 bg-gradient-to-r from-[#ff7d8f] to-[#cb5c57] shadow-[0_0_12px_rgba(203,92,87,0.35)]"
                      : "h-2 w-2 bg-[#6b3940] hover:bg-[#8f4f58]"
                  }`}
                />
              ))}
            </div>
            <Link
              to={`/shops/${shop.slug}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#971725] to-[#c22d3d] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(151,23,37,0.28)] transition hover:translate-y-[-1px] hover:from-[#ab1f2f] hover:to-[#d73749]"
            >
              {t("shopsPage.openShop")}
              <HiChevronRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Shops() {
  const { t } = useTranslation();
  const { data: allShops = [], isLoading } = useShops();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMap, setShowMap] = useState(false);
  const [quickShop, setQuickShop] = useState<Shop | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const shops = useMemo(
    () => sortShopsForDisplay(allShops.filter((s) => s.status === "active")),
    [allShops],
  );

  const cities = useMemo(
    () => ["all", ...Array.from(new Set(shops.map((s) => s.city?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))],
    [shops],
  );

  const filteredShops = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      const matchCity = selectedCity === "all" || s.city === selectedCity;
      const matchQ = q ? [s.name, s.city ?? "", s.address, s.description ?? ""].join(" ").toLowerCase().includes(q) : true;
      return matchCity && matchQ;
    });
  }, [query, selectedCity, shops]);

  const stats = useMemo(() => ({
    total: shops.length,
    cities: cities.length - 1,
    topRated: shops.filter((s) => Number(s.rating) >= 4.5).length,
  }), [cities.length, shops]);

  const shopsWithCoords = useMemo(
    () => filteredShops.filter((s) => s.latitude && s.longitude),
    [filteredShops],
  );

  const mapCenter: [number, number] =
    shopsWithCoords.length > 0
      ? [Number(shopsWithCoords[0].latitude), Number(shopsWithCoords[0].longitude)]
      : DEFAULT_MAP_CENTER;

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
    <main className="relative isolate min-h-screen overflow-hidden text-[#fff6f4]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <img src={shopsPageBackground} alt="" aria-hidden="true" className="h-full w-full object-cover object-center opacity-80" />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-15 bg-gradient-to-b from-[#0a0203]/75 via-[#0a0203]/55 to-[#0a0203]/80" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#cb5c57]/8 blur-3xl" />
        <div className="absolute -right-20 top-48 h-72 w-72 rounded-full bg-[#d9b56f]/5 blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pt-36">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#efc8b5]">{t("shopsPage.pageLabel")}</p>
          <h1 className="mt-3 font-great-vibes text-[clamp(3rem,7vw,6rem)] leading-[0.92] text-[#fff7f3] [text-shadow:0_8px_28px_rgba(0,0,0,0.5)]">
            {t("shopsPage.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#f0d8d0]/80">
            {t("shopsPage.description")}
          </p>

          {/* Search */}
          <div className="mx-auto mt-6 flex max-w-2xl gap-3">
            <div className="group relative flex-1">
              <HiMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c88f88] transition-colors group-focus-within:text-[#ff9b88]" size={16} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${t("shopsPage.searchPlaceholder")} (⌘K)`}
                className="h-11 w-full rounded-xl border border-[#5f2825]/50 bg-[#090304]/85 pl-11 pr-9 text-sm text-white outline-none transition placeholder:text-[#9c7269] focus:border-[#cb5c57]/70"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#c9aaa2] transition hover:bg-[#2b1012] hover:text-white">
                  <HiXMark size={13} />
                </button>
              )}
            </div>
            <Link to="/bouquets"
              className="flex h-11 items-center gap-2 rounded-xl border border-[#d1a657]/25 bg-[#110608] px-4 text-sm font-medium text-[#f4dfbb] transition hover:border-[#d1a657]/50 hover:text-white whitespace-nowrap">
              <HiOutlineBuildingStorefront size={15} />
              <span className="hidden sm:inline">{t("shopsPage.browseBouquets")}</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-5 inline-flex items-center gap-5 rounded-2xl border border-[#5f2825]/30 bg-[#100506]/70 px-6 py-3 backdrop-blur-sm">
            {[
              { label: t("shopsPage.totalShops"), value: stats.total, icon: HiOutlineBuildingStorefront },
              { label: t("shopsPage.cities"), value: stats.cities, icon: HiOutlineGlobeAlt },
              { label: t("shopsPage.topRated"), value: stats.topRated, icon: HiOutlineStar },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-5">
                {i > 0 && <div className="h-7 w-px bg-[#5f2825]/40" />}
                <div className="text-center">
                  <p className="text-base font-bold text-white"><AnimatedCounter value={stat.value} /></p>
                  <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#c9a09a]">
                    <stat.icon size={10} />
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Featured Spotlight ── */}
        {!hasActiveFilters && !isLoading && (
          <div className="mb-6">
            <FeaturedSpotlight shops={shops} />
          </div>
        )}

        {/* ── Filters bar ── */}
        <div className="mb-5 rounded-2xl border border-[#3a1214]/60 bg-[#0d0405]/90 p-3 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* City chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                    selectedCity === city
                      ? "border-[#cb5c57] bg-[#cb5c57] text-white"
                      : "border-[#5f2825]/50 bg-[#0d0405]/80 text-[#dfc0b8] hover:border-[#cb5c57]/50 hover:text-white"
                  }`}
                >
                  {city === "all" ? t("shopsPage.allCities") : city}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Results count */}
              <span className="text-xs text-[#c9a09a] hidden sm:block">
                {filteredShops.length} {t("shopsPage.results", { count: filteredShops.length }).replace(/\d+\s*/, "")}
              </span>

              {/* Map toggle */}
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
                  showMap
                    ? "border-[#cb5c57] bg-[#cb5c57] text-white"
                    : "border-[#5f2825]/50 bg-[#0d0405] text-[#dfc0b8] hover:border-[#cb5c57]/50 hover:text-white"
                }`}
              >
                <HiOutlineMap size={13} />
                <span className="hidden sm:inline">{showMap ? t("shopsPage.hideMap") : t("shopsPage.showMap")}</span>
              </button>

              {/* View toggle */}
              <div className="flex rounded-xl border border-[#5f2825]/50 bg-[#0d0405] p-0.5">
                <button type="button" onClick={() => setViewMode("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${viewMode === "grid" ? "bg-[#cb5c57] text-white" : "text-[#c9a09a] hover:text-white"}`}
                  aria-label={t("shopsPage.gridView")}>
                  <HiOutlineSquares2X2 size={15} />
                </button>
                <button type="button" onClick={() => setViewMode("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${viewMode === "list" ? "bg-[#cb5c57] text-white" : "text-[#c9a09a] hover:text-white"}`}
                  aria-label={t("shopsPage.listView")}>
                  <HiOutlineBars3 size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#3a1214]/40 pt-2.5">
              {query && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cb5c57]/30 bg-[#cb5c57]/10 px-3 py-1 text-[11px] text-[#ffc8c0]">
                  "{query}"
                  <button type="button" onClick={() => setQuery("")} className="hover:text-white"><HiXMark size={11} /></button>
                </span>
              )}
              {selectedCity !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cb5c57]/30 bg-[#cb5c57]/10 px-3 py-1 text-[11px] text-[#ffc8c0]">
                  <HiMapPin size={10} />
                  {selectedCity}
                  <button type="button" onClick={() => setSelectedCity("all")} className="hover:text-white"><HiXMark size={11} /></button>
                </span>
              )}
              <button type="button" onClick={() => { setQuery(""); setSelectedCity("all"); }}
                className="text-[11px] text-[#9a706a] transition hover:text-white">
                {t("shopsPage.clearFilters")}
              </button>
            </div>
          )}
        </div>

        {/* ── Map ── */}
        <AnimatePresence>
          {showMap && shopsWithCoords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-5 overflow-hidden rounded-2xl border border-[#3a1214]/60 shadow-xl"
            >
              <div className="h-[280px] sm:h-[380px] w-full">
                <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                  <MapBoundsController shops={shopsWithCoords} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {shopsWithCoords.map((shop) => (
                    <Marker key={shop.id} position={[Number(shop.latitude), Number(shop.longitude)]} icon={customIcon}>
                      <Popup><MapPopupContent shop={shop} /></Popup>
                    </Marker>
                  ))}
                </MapContainer>
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
                <ShopCard key={shop.id} shop={shop} index={i} onQuickView={handleQuickView} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShops.map((shop, i) => (
                <ShopCardList key={shop.id} shop={shop} index={i} />
              ))}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-[#5f2825]/40 bg-[#0f0506]/60 px-6 py-16 text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#5f2825]/30 bg-[#150708]">
              <HiOutlineBuildingStorefront size={24} className="text-[#cb5c57]" />
            </div>
            <h2 className="font-cormorant text-4xl text-white">{t("shopsPage.noResultsTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c9a09a]">{t("shopsPage.noResultsDescription")}</p>
            <button
              type="button"
              onClick={() => { setQuery(""); setSelectedCity("all"); }}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#971725] px-5 text-sm font-semibold text-white transition hover:bg-[#b01e2f]"
            >
              {t("shopsPage.clearFilters")}
            </button>
          </motion.div>
        )}
      </section>

      {/* ── Quick View Modal ── */}
      <AnimatePresence>
        {quickShop && <ShopQuickModal shop={quickShop} onClose={() => setQuickShop(null)} />}
      </AnimatePresence>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
