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
  HiOutlineEnvelope,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiChevronDown,
  HiOutlineGlobeAlt,
  HiOutlineHashtag,
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

// Fix Leaflet default marker icon
// @ts-expect-error – Leaflet's default icon path is broken in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

// ─────────────────────────────────────────────
// Animated Counter
// ─────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 800;
    const step = Math.max(1, Math.floor(value / 30));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, duration / (value / step));
    return () => clearInterval(interval);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function ShopsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="overflow-hidden rounded-[1.8rem] border border-[#4f2224] bg-[linear-gradient(180deg,#160809_0%,#0f0506_100%)]"
        >
          <div className="h-48 sm:h-64 animate-pulse bg-[#241012]" />
          <div className="space-y-4 p-5">
            <div className="h-8 w-3/5 animate-pulse rounded-full bg-[#241012]" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#241012]" />
            <div className="h-16 animate-pulse rounded-2xl bg-[#241012]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-11 animate-pulse rounded-2xl bg-[#241012]" />
              <div className="h-11 animate-pulse rounded-2xl bg-[#241012]" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MapBoundsController({ shops }: { shops: Shop[] }) {
  const map = useMap();

  useEffect(() => {
    if (!shops.length) return;

    const bounds = L.latLngBounds(
      shops.map((shop) => [Number(shop.latitude), Number(shop.longitude)] as [number, number]),
    );

    if (!bounds.isValid()) return;

    map.fitBounds(bounds.pad(0.18), { animate: false });
  }, [map, shops]);

  return null;
}

// ─────────────────────────────────────────────
// Shop Card (Grid)
// ─────────────────────────────────────────────
function ShopCard({ shop, index }: { shop: Shop; index: number }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";
  const description = shop.description ?? t("shopsPage.noDescription");
  const city = shop.city ?? t("shopsPage.noCity");

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-[1.9rem] border border-[#5b252a]/60 bg-[linear-gradient(180deg,rgba(28,9,11,0.95),rgba(15,5,7,0.98))] shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#cc6a6b]/45 hover:shadow-[0_28px_84px_rgba(121,29,39,0.32)]"
    >
      {/* Glow overlay on hover */}
      <div className="pointer-events-none absolute -inset-0.5 z-0 rounded-[1.9rem] bg-gradient-to-br from-[#cc6a6b]/0 via-[#cc6a6b]/0 to-[#cc6a6b]/0 opacity-0 blur-xl transition-all duration-500 group-hover:from-[#cc6a6b]/5 group-hover:via-[#cc6a6b]/3 group-hover:to-[#cc6a6b]/8 group-hover:opacity-100" />

      <div className="relative z-10">
        <Link to={`/shops/${shop.slug}`} className="block">
          <div className="relative h-48 sm:h-64 overflow-hidden">
            <motion.img
              src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
              alt={shop.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.7 }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,4,6,0.12),rgba(9,2,4,0.88))]" />

            <div className="absolute left-3 sm:left-5 top-3 sm:top-5 z-10 flex max-w-[60%] sm:max-w-[65%] flex-col items-start gap-2">
              <ShopFeatureBadges shop={shop} />
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#15080a]/70 px-2 sm:px-3 py-1 text-[0.55rem] sm:text-xs uppercase tracking-[0.22em] text-[#f4d1c3] backdrop-blur-md">
                <HiMapPin className="text-xs sm:text-sm text-[#f2bf88]" />
                {city}
              </div>
            </div>

            <div className="absolute right-3 sm:right-5 top-3 sm:top-5 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#f2c67c]/25 bg-[#15080a]/70 px-2 sm:px-3 py-1 text-[0.55rem] sm:text-xs font-semibold text-white backdrop-blur-md">
              <HiOutlineStar className="text-[#f2c67c]" />
              {shop.rating}
              <span className="text-[#d4ada4] hidden sm:inline">· {shop.reviews_count} {t("shopsPage.reviews")}</span>
            </div>

            <div className="absolute inset-x-3 sm:inset-x-5 bottom-3 sm:bottom-5 flex items-end gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex h-14 w-14 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] sm:rounded-[1.7rem] border border-white/10 bg-[#140708]/85 shadow-lg backdrop-blur-md"
              >
                {shop.logo ? (
                  <img
                    src={shop.logo}
                    alt={`${shop.name} logo`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-cormorant text-2xl sm:text-4xl text-white">{shop.name.charAt(0)}</span>
                )}
              </motion.div>
              <div className="min-w-0 pb-0 sm:pb-1">
                <p className="text-[0.5rem] sm:text-xs uppercase tracking-[0.28em] text-[#dcb39a]">{t("shopsPage.curatedBoutique")}</p>
                <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2">
                  <h2 className="truncate font-cormorant text-2xl sm:text-4xl leading-none text-white">{shop.name}</h2>
                  {shop.is_verified ? <ShopVerifiedBadge className="h-4 w-4 sm:h-5 sm:w-5" iconClassName="h-4 w-4 sm:h-5 sm:w-5" /> : null}
                </div>
              </div>
            </div>
          </div>
        </Link>

        <div className="space-y-4 sm:space-y-5 p-4 sm:p-5">
          <p className="line-clamp-3 min-h-[3.6rem] sm:min-h-[4.8rem] text-xs sm:text-sm leading-6 sm:leading-7 text-[#d3aca4]">{description}</p>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-[1.3rem] border border-[#4f2326] bg-[#130709] p-3 sm:p-4 transition hover:border-[#b95559]/50">
              <p className="text-[0.6rem] sm:text-[0.68rem] uppercase tracking-[0.2em] text-[#b99087]">{t("shopsPage.contact")}</p>
              <p className="mt-1.5 sm:mt-2 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                <HiOutlinePhone className="text-xs sm:text-sm text-[#e0a495]" />
                {formatUzbekPhone(shop.phone)}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-[#4f2326] bg-[#130709] p-3 sm:p-4 transition hover:border-[#b95559]/50">
              <p className="text-[0.6rem] sm:text-[0.68rem] uppercase tracking-[0.2em] text-[#b99087]">{t("shopsPage.address")}</p>
              <p className="mt-1.5 sm:mt-2 line-clamp-2 text-xs sm:text-sm leading-5 sm:leading-6 text-white">
                <HiMapPin className="mr-1 inline text-xs sm:text-sm text-[#e0a495]" />
                {shop.address}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {instagramUrl ? (
                <motion.a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="inline-flex h-9 sm:h-11 w-9 sm:w-11 items-center justify-center rounded-2xl border border-[#5a2c31] bg-[#140708] text-[#f3cbc0] transition hover:border-[#ca5b63] hover:text-white"
                  aria-label={t("shopsPage.instagram")}
                >
                  <FaInstagram />
                </motion.a>
              ) : null}
              {telegramUrl ? (
                <motion.a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="inline-flex h-9 sm:h-11 w-9 sm:w-11 items-center justify-center rounded-2xl border border-[#5a2c31] bg-[#140708] text-[#f3cbc0] transition hover:border-[#ca5b63] hover:text-white"
                  aria-label={t("shopsPage.telegram")}
                >
                  <FaTelegramPlane />
                </motion.a>
              ) : null}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <motion.a
                href={`tel:${shop.phone}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-[#694044] bg-[#16090b] px-3 sm:px-4 text-xs sm:text-sm font-semibold text-[#f0d2c7] transition hover:border-[#cc6870] hover:text-white"
              >
                <HiOutlinePhone />
                {t("shopsPage.call")}
              </motion.a>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={`/shops/${shop.slug}`}
                  className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#971725] to-[#cf3048] px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-[0_16px_34px_rgba(154,24,40,0.32)] transition hover:brightness-110"
                >
                  {t("shopsPage.openShop")}
                  <HiArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────
// Shop Card (List View)
// ─────────────────────────────────────────────
function ShopCardList({ shop, index }: { shop: Shop; index: number }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";
  const description = shop.description ?? t("shopsPage.noDescription");
  const city = shop.city ?? t("shopsPage.noCity");

  return (
    <motion.article
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-[1.9rem] border border-[#5b252a]/60 bg-[linear-gradient(145deg,rgba(28,9,11,0.95),rgba(15,5,7,0.98))] shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-[#cc6a6b]/40 hover:shadow-[0_28px_84px_rgba(121,29,39,0.3)]"
    >
      <div className="flex flex-col sm:flex-row">
        <Link to={`/shops/${shop.slug}`} className="relative block h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-56 lg:w-72">
          <img
            src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
            alt={shop.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,4,6,0.2),rgba(9,2,4,0.88))] sm:bg-[linear-gradient(90deg,rgba(17,4,6,0.08),rgba(9,2,4,0.85))]" />
          <div className="absolute left-3 sm:left-4 top-3 sm:top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#15080a]/70 px-2 sm:px-3 py-1 text-[0.55rem] sm:text-xs uppercase tracking-[0.22em] text-[#f4d1c3] backdrop-blur-md">
            <HiMapPin className="text-xs sm:text-sm text-[#f2bf88]" />
            {city}
          </div>
        </Link>

        <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6rem] sm:text-xs uppercase tracking-[0.28em] text-[#dcb39a]">{t("shopsPage.curatedBoutique")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-cormorant text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">{shop.name}</h2>
                  {shop.is_verified ? <ShopVerifiedBadge className="h-4 w-4 sm:h-5 sm:w-5" iconClassName="h-4 w-4 sm:h-5 sm:w-5" /> : null}
                </div>
                <ShopFeatureBadges shop={shop} className="mt-2 sm:mt-3" />
              </div>
              <div className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border border-[#f2c67c]/25 bg-[#15080a]/70 px-2 sm:px-3 py-1 text-[0.55rem] sm:text-xs font-semibold text-white backdrop-blur-md">
                <HiOutlineStar className="text-[#f2c67c]" />
                {shop.rating}
                <span className="text-[#d4ada4] hidden sm:inline">· {shop.reviews_count}</span>
              </div>
            </div>
            <p className="line-clamp-2 text-xs sm:text-sm leading-5 sm:leading-6 text-[#d3aca4]">{description}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#4f2326] bg-[#130709] px-2.5 sm:px-3 py-1.5 sm:py-2">
                <p className="text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-[#b99087]">{t("shopsPage.contact")}</p>
                <p className="text-xs sm:text-sm font-semibold text-white">{formatUzbekPhone(shop.phone)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {instagramUrl ? (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full border border-[#5a2c31] bg-[#140708] text-[#f3cbc0] transition hover:border-[#ca5b63] hover:text-white" aria-label={t("shopsPage.instagram")}>
                    <FaInstagram className="text-xs" />
                  </a>
                ) : null}
                {telegramUrl ? (
                  <a href={telegramUrl} target="_blank" rel="noreferrer" className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full border border-[#5a2c31] bg-[#140708] text-[#f3cbc0] transition hover:border-[#ca5b63] hover:text-white" aria-label={t("shopsPage.telegram")}>
                    <FaTelegramPlane className="text-xs" />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${shop.phone}`} className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-2xl border border-[#694044] bg-[#16090b] px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold text-[#f0d2c7] transition hover:border-[#cc6870] hover:text-white">
                <HiOutlinePhone className="text-xs" />
                {t("shopsPage.call")}
              </a>
              <Link to={`/shops/${shop.slug}`} className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#971725] to-[#cf3048] px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold text-white shadow-[0_16px_34px_rgba(154,24,40,0.32)] transition hover:brightness-110">
                {t("shopsPage.openShop")}
                <HiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────
// Map Popup Card for Leaflet
// ─────────────────────────────────────────────
function MapPopupContent({ shop }: { shop: Shop }) {
  const { t } = useTranslation();
  return (
    <div className="w-56 sm:w-64 rounded-xl p-0 font-sans text-sm">
        <div className="-mx-0 -mt-0 mb-3 h-24 sm:h-28 overflow-hidden rounded-t-xl">
          <img
            src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
            alt={shop.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-gray-900">{shop.name}</h3>
      <p className="mt-1 text-xs text-gray-600">{shop.address}</p>
      <p className="mt-1 text-xs text-gray-600">
        <strong>{t("shopsPage.contact")}:</strong> {formatUzbekPhone(shop.phone)}
      </p>
      {shop.working_hours && (
        <p className="mt-1 text-xs text-gray-600">
          <strong>{t("shopsPage.workingHours")}:</strong> {shop.working_hours}
        </p>
      )}
      <Link
        to={`/shops/${shop.slug}`}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#971725] to-[#cf3048] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
      >
        {t("shopsPage.openShop")}
        <HiArrowRight />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────
// Featured Shops Spotlight
// ─────────────────────────────────────────────
function FeaturedShopsCarousel({ shops }: { shops: Shop[] }) {
  const { t } = useTranslation();
  const featured = useMemo(() => shops.filter((s) => Number(s.rating) >= 4.5).slice(0, 5), [shops]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length < 2) return null;

  const shop = featured[current];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[2rem] border border-[#f2c67c]/20 bg-[linear-gradient(135deg,rgba(43,14,17,0.95),rgba(20,6,8,0.98))] shadow-[0_24px_60px_rgba(121,29,39,0.2)]"
    >
      <div className="relative flex flex-col md:flex-row">
        <div className="relative h-48 sm:h-56 w-full shrink-0 overflow-hidden md:h-auto md:w-72 lg:w-80">
          <AnimatePresence mode="wait">
            <motion.img loading="lazy" decoding="async"
              key={shop.id}
              src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
              alt={shop.name}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,4,6,0.15),rgba(17,4,6,0.85))]" />
          <div className="absolute left-4 sm:left-5 top-4 sm:top-5 inline-flex items-center gap-2 rounded-full border border-[#f2c67c]/30 bg-[#15080a]/80 px-2.5 sm:px-3 py-1.5 text-[0.55rem] sm:text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#f2c67c] backdrop-blur-md">
            <HiOutlineStar className="text-[#f2c67c]" />
            {t("shopsPage.featured")}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center p-5 sm:p-8">
          <p className="text-[0.6rem] sm:text-xs uppercase tracking-[0.34em] text-[#dcb39a]">{t("shopsPage.topRatedBoutiques")}</p>
          <AnimatePresence mode="wait">
            <motion.h3
              key={shop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-2 font-cormorant text-3xl sm:text-4xl leading-tight text-white"
            >
              {shop.name}
            </motion.h3>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={shop.id + "desc"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-2 sm:mt-3 line-clamp-2 text-xs sm:text-sm leading-5 sm:leading-6 text-[#d3aca4]"
            >
              {shop.description ?? t("shopsPage.noDescription")}
            </motion.p>
          </AnimatePresence>
          <div className="mt-4 sm:mt-5 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "w-6 sm:w-8 bg-[#cf3048]" : "w-1.5 bg-[#5a2c31] hover:bg-[#8f3f47]"
                  }`}
                />
              ))}
            </div>
            <Link
              to={`/shops/${shop.slug}`}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#971725] to-[#cf3048] px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-[0_16px_34px_rgba(154,24,40,0.32)] transition hover:brightness-110"
            >
              {t("shopsPage.openShop")}
              <HiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ─────────────────────────────────────────────
// Quick View Modal
// ─────────────────────────────────────────────
function ShopQuickModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const { t } = useTranslation();
  const instagramUrl = shop.instagram ? normalizeInstagramLink(shop.instagram) : "";
  const telegramUrl = shop.telegram ? normalizeTelegramLink(shop.telegram) : "";
  const description = shop.description ?? t("shopsPage.noDescription");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-[#5b252a]/70 bg-[linear-gradient(180deg,rgba(30,10,12,0.98),rgba(16,5,7,0.99))] shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur transition hover:border-[#cc6a6b] hover:bg-[#971725]/60"
            aria-label={t("shopsPage.closePreview")}
          >
            <HiOutlineEnvelope />
          </button>

          <div className="relative h-48 sm:h-56 overflow-hidden">
            <img
              src={shop.banner ?? shop.logo ?? FALLBACK_BANNER}
              alt={shop.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,4,6,0.1),rgba(9,2,4,0.92))]" />
            <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-6 right-4 sm:right-6 flex items-end gap-3 sm:gap-4">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem] border border-white/10 bg-[#140708]/85 shadow-lg backdrop-blur-md">
                {shop.logo ? (
                  <img
                    src={shop.logo}
                    alt={`${shop.name} logo`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-cormorant text-3xl sm:text-4xl text-white">{shop.name.charAt(0)}</span>
                )}
              </div>
              <div className="pb-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-cormorant text-3xl sm:text-4xl leading-none text-white">{shop.name}</h2>
                  {shop.is_verified ? <ShopVerifiedBadge className="h-4 w-4 sm:h-5 sm:w-5" iconClassName="h-4 w-4 sm:h-5 sm:w-5" /> : null}
                </div>
                <ShopFeatureBadges shop={shop} className="mt-2 sm:mt-3" />
                <div className="mt-1 sm:mt-2 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#d4ada4]">
                  <span className="flex items-center gap-1">
                    <HiOutlineStar className="text-[#f2c67c]" /> {shop.rating}
                  </span>
                  <span>·</span>
                  <span>{shop.reviews_count} {t("shopsPage.reviews")}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <HiMapPin /> {shop.city ?? t("shopsPage.noCity")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5 p-5 sm:p-6">
            <p className="text-xs sm:text-sm leading-6 sm:leading-7 text-[#d3aca4]">{description}</p>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[#4f2326] bg-[#130709] p-3 sm:p-4">
                <p className="text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-[#b99087]">{t("shopsPage.contact")}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                  <HiOutlinePhone className="text-xs text-[#e0a495]" />
                  {formatUzbekPhone(shop.phone)}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[#4f2326] bg-[#130709] p-3 sm:p-4">
                <p className="text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-[#b99087]">{t("shopsPage.address")}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm leading-5 text-white">
                  <HiMapPin className="shrink-0 text-xs text-[#e0a495]" />
                  {shop.address}
                </p>
              </div>
            </div>

            {shop.working_hours && (
              <div className="rounded-[1.2rem] border border-[#4f2326] bg-[#130709] p-3 sm:p-4">
                <p className="text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-[#b99087]">{t("shopsPage.workingHours")}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                  <HiMapPin className="text-xs text-[#e0a495]" />
                  {shop.working_hours}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 sm:pt-2">
              <div className="flex items-center gap-2">
                {instagramUrl ? (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full border border-[#5a2c31] bg-[#140708] text-[#f3cbc0] transition hover:border-[#ca5b63] hover:text-white" aria-label={t("shopsPage.instagram")}>
                    <FaInstagram />
                  </a>
                ) : null}
                {telegramUrl ? (
                  <a href={telegramUrl} target="_blank" rel="noreferrer" className="flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full border border-[#5a2c31] bg-[#140708] text-[#f3cbc0] transition hover:border-[#ca5b63] hover:text-white" aria-label={t("shopsPage.telegram")}>
                    <FaTelegramPlane />
                  </a>
                ) : null}
                <a href={`tel:${shop.phone}`} className="flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-2xl border border-[#694044] bg-[#16090b] px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold text-[#f0d2c7] transition hover:border-[#cc6870] hover:text-white">
                  <HiOutlinePhone />
                  {t("shopsPage.call")}
                </a>
              </div>
              <Link to={`/shops/${shop.slug}`} className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#971725] to-[#cf3048] px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-[0_16px_34px_rgba(154,24,40,0.32)] transition hover:brightness-110">
                {t("shopsPage.openShop")}
                <HiArrowRight />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
export default function Shops() {
  const { t } = useTranslation();
  const { data: allShops = [], isLoading } = useShops();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMap, setShowMap] = useState(false);
  const [quickShop, setQuickShop] = useState<Shop | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shops = useMemo(
    () => sortShopsForDisplay(allShops.filter((shop) => shop.status === "active")),
    [allShops],
  );

  const cities = useMemo(
    () => [
      "all",
      ...Array.from(new Set(shops.map((shop) => shop.city?.trim()).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b),
      ),
    ],
    [shops],
  );

  const filteredShops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return shops.filter((shop) => {
      const matchesCity = selectedCity === "all" ? true : shop.city === selectedCity;
      const matchesQuery = normalizedQuery
        ? [shop.name, shop.city ?? "", shop.address, shop.description ?? ""].join(" ").toLowerCase().includes(normalizedQuery)
        : true;
      return matchesCity && matchesQuery;
    });
  }, [query, selectedCity, shops]);

  const stats = useMemo(
    () => ({
      total: shops.length,
      cities: cities.length - 1,
      featured: shops.filter((shop) => Number(shop.rating) >= 4.5).length,
    }),
    [cities.length, shops],
  );

  const shopsWithCoords = useMemo(
    () => filteredShops.filter((s) => s.latitude && s.longitude),
    [filteredShops],
  );

  const mapCenter: [number, number] =
    shopsWithCoords.length > 0
      ? [Number(shopsWithCoords[0].latitude), Number(shopsWithCoords[0].longitude)]
      : DEFAULT_MAP_CENTER;

  const handleQuickView = useCallback((shop: Shop) => setQuickShop(shop), []);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pt-36">
      <section className="mx-auto max-w-7xl">
        {/* ── Hero / Header Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[2.2rem] border border-[#5b252a]/60 bg-[linear-gradient(145deg,rgba(29,9,11,0.94),rgba(16,4,6,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
        >
          <div className="grid gap-6 sm:gap-8 px-5 sm:px-8 py-6 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[0.6rem] sm:text-sm uppercase tracking-[0.34em] text-[#ddb098]"
              >
                {t("shopsPage.pageLabel")}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-3 sm:mt-4 font-cormorant text-4xl sm:text-5xl lg:text-6xl leading-none text-white"
              >
                {t("shopsPage.title")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base leading-7 sm:leading-8 text-[#d5aea5]"
              >
                {t("shopsPage.description")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-6 sm:mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <label className="group relative block">
                  <HiMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#ba9287] transition-colors group-focus-within:text-[#d15d67]" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`${t("shopsPage.searchPlaceholder")}  (⌘K)`}
                    className="h-12 sm:h-14 w-full rounded-2xl border border-[#5a272b] bg-[#140708]/90 pl-12 pr-4 text-white outline-none transition placeholder:text-[#9f7f79] focus:border-[#cb6b6e] focus:shadow-[0_0_20px_rgba(203,107,110,0.15)]"
                  />
                </label>
                <Link
                  to="/bouquets"
                  className="inline-flex h-12 sm:h-14 items-center justify-center gap-2 rounded-2xl border border-[#d1a657]/35 bg-[#17090b] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#f4dfbb] transition hover:border-[#efc36c] hover:text-white"
                >
                  <HiOutlineBuildingStorefront />
                  {t("shopsPage.browseBouquets")}
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1"
            >
              {[
                { label: t("shopsPage.totalShops"), value: stats.total, icon: HiOutlineBuildingStorefront },
                { label: t("shopsPage.cities"), value: stats.cities, icon: HiOutlineGlobeAlt },
                { label: t("shopsPage.topRated"), value: stats.featured, icon: HiOutlineStar },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-[1.6rem] border border-[#4e2226] bg-[#120607]/88 p-3 sm:p-5 transition hover:border-[#b95559]/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[0.55rem] sm:text-[0.72rem] uppercase tracking-[0.22em] text-[#c79d94]">{item.label}</p>
                    <item.icon className="text-base sm:text-lg text-[#b47c73]" />
                  </div>
                  <p className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-semibold text-white">
                    <AnimatedCounter value={item.value} />
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* ── Featured Shots Spotlight ── */}
        {!query && selectedCity === "all" && !isLoading && (
          <div className="mt-6 sm:mt-8">
            <FeaturedShopsCarousel shops={shops} />
          </div>
        )}

        {/* ── Controls Bar ── */}
        <div className="mt-6 sm:mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-full border border-[#5c2a2e] bg-[#130708]/80 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-[#e0bbb2] transition hover:border-[#bb6068] hover:text-white lg:hidden"
              >
                <HiOutlineHashtag />
                {t("shopsPage.filters")}
                <HiChevronDown className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              <div className={`flex flex-wrap gap-2 ${showFilters ? "flex" : "hidden lg:flex"}`}>
                {cities.map((city) => {
                  const isActive = selectedCity === city;
                  return (
                    <motion.button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className={`inline-flex h-10 sm:h-11 items-center justify-center rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-semibold transition ${
                        isActive
                          ? "border-[#d15d67] bg-gradient-to-r from-[#8f1623] to-[#c92d45] text-white shadow-[0_12px_28px_rgba(154,24,40,0.28)]"
                          : "border-[#5c2a2e] bg-[#130708]/80 text-[#e0bbb2] hover:border-[#bb6068] hover:text-white"
                      }`}
                    >
                      {city === "all" ? t("shopsPage.allCities") : city}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-semibold transition ${
                  showMap
                    ? "border-[#d15d67] bg-gradient-to-r from-[#8f1623] to-[#c92d45] text-white shadow-[0_12px_28px_rgba(154,24,40,0.28)]"
                    : "border-[#5c2a2e] bg-[#130708]/80 text-[#e0bbb2] hover:border-[#bb6068] hover:text-white"
                }`}
              >
                <HiMapPin />
                <span className="hidden sm:inline">{showMap ? t("shopsPage.hideMap") : t("shopsPage.showMap")}</span>
                <span className="sm:hidden">{showMap ? t("shopsPage.hideMap") : t("shopsPage.showMap")}</span>
              </button>

              <div className="flex overflow-hidden rounded-full border border-[#5c2a2e] bg-[#130708]/80">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center text-sm transition ${
                    viewMode === "grid" ? "bg-[#c92d45] text-white" : "text-[#e0bbb2] hover:text-white"
                  }`}
                  aria-label={t("shopsPage.gridView")}
                >
                  <HiOutlineSquares2X2 />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center text-sm transition ${
                    viewMode === "list" ? "bg-[#c92d45] text-white" : "text-[#e0bbb2] hover:text-white"
                  }`}
                  aria-label={t("shopsPage.listView")}
                >
                  <HiOutlineBars3 />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Results count + clear ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 sm:mt-6 flex items-center justify-between gap-4"
        >
          <p className="text-xs sm:text-sm text-[#d8b3aa]">
            {t("shopsPage.results", { count: filteredShops.length })}
          </p>
          {(query || selectedCity !== "all") && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCity("all");
              }}
              className="text-xs sm:text-sm font-semibold text-[#f2c0b4] underline-offset-2 transition hover:text-white hover:underline"
            >
              {t("shopsPage.clearFilters")}
            </motion.button>
          )}
        </motion.div>

        {/* ── Map Section ── */}
        <AnimatePresence>
          {showMap && shopsWithCoords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4 sm:mt-6 overflow-hidden rounded-[2rem] border border-[#5b252a]/60"
            >
              <div className="h-[300px] sm:h-[420px] w-full">
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <MapBoundsController shops={shopsWithCoords} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {shopsWithCoords.map((shop) => (
                    <Marker
                      key={shop.id}
                      position={[Number(shop.latitude), Number(shop.longitude)]}
                      icon={customIcon}
                    >
                      <Popup>
                        <MapPopupContent shop={shop} />
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Shops Grid / List ── */}
        <section className="mt-4 sm:mt-6">
          {isLoading ? (
            <ShopsSkeleton />
          ) : filteredShops.length ? (
            viewMode === "grid" ? (
              <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredShops.map((shop, i) => (
                  <div key={shop.id} className="relative">
                    <ShopCard shop={shop} index={i} />
                    <button
                      type="button"
                      onClick={() => handleQuickView(shop)}
                      className="absolute right-3 sm:right-4 top-3 sm:top-4 z-20 flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[10px] text-white/70 backdrop-blur opacity-0 transition-all duration-300 hover:bg-[#971725]/60 hover:text-white group-hover:opacity-100"
                      aria-label={t("shopsPage.quickView")}
                    >
                      <HiOutlineEnvelope />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredShops.map((shop, i) => (
                  <ShopCardList key={shop.id} shop={shop} index={i} />
                ))}
              </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[1.8rem] border border-dashed border-[#5d2b31] bg-[#110607]/85 px-4 sm:px-6 py-12 sm:py-16 text-center"
            >
              <div className="mx-auto mb-4 sm:mb-6 flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full border border-[#5a2b31] bg-[#140708]/80">
                <HiOutlineBuildingStorefront className="text-2xl sm:text-3xl text-[#c79c93]" />
              </div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.34em] text-[#c79c93]">{t("shopsPage.noResultsLabel")}</p>
              <h2 className="mt-3 sm:mt-4 font-cormorant text-3xl sm:text-4xl text-white">{t("shopsPage.noResultsTitle")}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-6 sm:leading-7 text-[#d4ada4]">{t("shopsPage.noResultsDescription")}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCity("all");
                }}
                className="mt-5 sm:mt-6 inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#971725] to-[#cf3048] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-white shadow-[0_16px_34px_rgba(154,24,40,0.32)] transition hover:brightness-110"
              >
                {t("shopsPage.clearFilters")}
              </button>
            </motion.div>
          )}
        </section>
      </section>

      {/* ── Quick View Modal ── */}
      <AnimatePresence>
        {quickShop && <ShopQuickModal shop={quickShop} onClose={() => setQuickShop(null)} />}
      </AnimatePresence>
    </main>
  );
}
