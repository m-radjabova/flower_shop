import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaHeart, FaRegHeart, FaShoppingBag, FaStar, FaTrashAlt, FaRegStar, FaSortAmountDown, FaTh, FaList } from "react-icons/fa";
import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
import {
  HiOutlineSparkles,
  HiMiniGift,
  HiOutlineRocketLaunch,
} from "react-icons/hi2";
import { useFavoriteItems } from "../../hooks/useFavorites";
import { formatPrice } from "../../utils/catalog";
import { removeFavoriteBouquet, type FavoriteBouquetItem } from "../../utils/favorites";

type SortValue = "recent" | "priceAsc" | "priceDesc" | "ratingDesc";

/* ─── Decorative floating particles ─── */
const FloatingHearts = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-[#ff6077]/10"
        style={{
          left: `${10 + i * 18}%`,
          top: `${20 + (i % 3) * 25}%`,
          fontSize: `${1 + (i % 3) * 0.5}rem`,
        }}
        animate={{
          y: [0, -18, 0],
          opacity: [0.3, 0.8, 0.3],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 3.5 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.6,
        }}
      >
        <FaHeart />
      </motion.div>
    ))}
  </div>
);

/* ─── Animated heart pulse icon ─── */
const HeartPulse = ({ count }: { count: number }) => (
  <motion.div
    key={count}
    initial={{ scale: 1 }}
    animate={{ scale: [1, 1.25, 1] }}
    transition={{ duration: 0.45, ease: "easeOut" }}
    className="inline-flex items-center gap-2"
  >
    <FaHeart className="text-[#ff6077] drop-shadow-[0_0_8px_rgba(255,96,119,0.5)]" />
    <span className="text-base sm:text-lg font-bold tracking-wide">{count}</span>
  </motion.div>
);

/* ─── Star rating display ─── */
const RatingStars = ({ rating }: { rating: number | string }) => {
  const num = Number(rating) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.25 }}
          className={i < Math.floor(num) ? "text-amber-400" : "text-gray-600"}
        >
          {i < Math.floor(num) ? <FaStar size={10} /> : <FaRegStar size={10} />}
        </motion.span>
      ))}
    </div>
  );
};

/* ─── DiscountBadge ─── */
const DiscountBadge = ({ oldPrice, price }: { oldPrice?: string | null; price: string }) => {
  if (!oldPrice) return null;
  const discountPercent = Math.round((1 - Number(price) / Number(oldPrice)) * 100);
  if (discountPercent <= 0) return null;
  return (
    <motion.span
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="absolute -left-1 top-4 z-10 inline-flex items-center gap-1 rounded-r-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-2 py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30"
    >
      <HiOutlineRocketLaunch size={8} />
      -{discountPercent}%
    </motion.span>
  );
};

/* ─── Card variants for staggered animation ─── */
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
  exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.25 } },
};

/* ─── Main Component ─── */
function Favorites() {
  const { t } = useTranslation();
  const [view, setView] = useState<"grid" | "list">("grid");
  const { register, watch } = useForm<{ sortBy: SortValue }>({
    defaultValues: { sortBy: "recent" },
  });
  const sortBy = watch("sortBy");
  const favoriteItems = useFavoriteItems();

  const sortedFavorites = useMemo(() => {
    const list = [...favoriteItems];
    switch (sortBy) {
      case "priceAsc":
        list.sort((a, b) => Number(a.bouquet.price) - Number(b.bouquet.price));
        break;
      case "priceDesc":
        list.sort((a, b) => Number(b.bouquet.price) - Number(a.bouquet.price));
        break;
      case "ratingDesc":
        list.sort((a, b) => Number(b.bouquet.rating) - Number(a.bouquet.rating));
        break;
      case "recent":
      default:
        list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }
    return list;
  }, [favoriteItems, sortBy]);

  const sortOptions: { value: SortValue; label: string }[] = [
    { value: "recent", label: t("sort.recent") },
    { value: "priceAsc", label: t("sort.priceAsc") },
    { value: "priceDesc", label: t("sort.priceDesc") },
    { value: "ratingDesc", label: t("sort.topRated") },
  ];

  const handleRemove = (id: string, name: string) => {
    removeFavoriteBouquet(id);
    toast.info(`${name} ${t("bouquetSection.removedFromFavorites")}`);
  };

  const handleAddToCart = (bouquet: FavoriteBouquetItem["bouquet"]) => {
    addToCart(bouquet);
    toast.success(`${bouquet.name} ${t("favorites.addedToCart")}`);
  };

  const containerClass =
    view === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
      : "flex flex-col gap-3 sm:gap-4";

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-[#fff6f4]">
      {/* Background decorative gradient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-[400px] sm:h-[500px] w-[400px] sm:w-[500px] rounded-full bg-[#ff6077]/5 blur-[100px] sm:blur-[120px]" />
        <div className="absolute -right-32 bottom-32 h-[300px] sm:h-[400px] w-[300px] sm:w-[400px] rounded-full bg-[#c03b47]/5 blur-[100px] sm:blur-[120px]" />
      </div>

      <section className="relative z-10 min-h-screen px-4 pb-16 sm:pb-20 pt-28 sm:pt-32 lg:pt-36 sm:px-6 lg:px-10">
        <div className="relative mx-auto max-w-[1400px]">
          {/* ─── Hero Header ─── */}
          <div className="relative overflow-hidden px-4 sm:px-10 py-6 sm:py-14">
            <FloatingHearts />

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6077]/30 bg-[#ff6077]/10 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-[#ff9b88]">
                  <HiOutlineSparkles size={12} />
                  {t("favorites.yourCollection")}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 sm:mt-5 font-great-vibes text-[clamp(2.4rem,7vw,3.6rem)] sm:text-[clamp(3.2rem,7vw,6.4rem)] leading-[0.95] font-normal text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.14)]"
              >
                {t("favorites.my")}{" "}
                <span className="bg-gradient-to-r from-[#ff6077] to-[#ff9b88] bg-clip-text text-transparent">
                  {t("favorites.favorites")}
                </span>
              </motion.h1>
            </div>
          </div>

          {/* ─── Controls Bar ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 sm:mt-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 backdrop-blur-lg rounded-2xl">
              <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-[#5f2825]/60 bg-[#2b1012]/40 px-3 sm:px-5 py-2 sm:py-2.5 text-[#f8d9d2]">
                <HeartPulse count={favoriteItems.length} />
                <span className="text-sm sm:text-lg font-bold tracking-wide">{t("favorites.items")}</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="inline-flex rounded-xl border border-[#5f2825]/60 bg-[#1c0a0b]/60 p-1">
                  {[
                    { mode: "grid" as const, icon: FaTh },
                    { mode: "list" as const, icon: FaList },
                  ].map(({ mode, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      className={`inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-lg text-xs sm:text-sm transition-all duration-300 ${
                        view === mode
                          ? "bg-gradient-to-br from-[#8f1220] to-[#bb2435] text-white shadow-lg shadow-[#8f1220]/40"
                          : "text-[#ab8a82] hover:text-white hover:bg-[#2b1012]/50"
                      }`}
                    >
                      <Icon />
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <select
                    {...register("sortBy")}
                    className="h-10 sm:h-11 appearance-none rounded-xl border border-[#5f2825]/60 bg-[#1c0a0b]/70 pl-3 sm:pl-4 pr-8 sm:pr-10 text-xs sm:text-sm font-medium text-[#f8d9d2] outline-none backdrop-blur-sm transition-all duration-300 hover:border-[#c03b47]/60 focus:border-[#ff6077]/60 focus:shadow-[0_0_20px_rgba(255,96,119,0.15)]"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1c0a0b]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FaSortAmountDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#ab8a82] text-[10px]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── Items Grid/List ─── */}
          <AnimatePresence mode="wait">
            {sortedFavorites.length ? (
              <motion.div
                key={view + sortBy}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`mt-4 sm:mt-6 ${containerClass}`}
              >
                <AnimatePresence>
                  {sortedFavorites.map((item, index) => {
                    const bouquet = item.bouquet;

                    if (view === "list") {
                      return (
                        <motion.article
                          key={item.id}
                          custom={index}
                          variants={cardVariants}
                          layout
                          className="group relative flex flex-col gap-0 overflow-hidden rounded-2xl border border-[#3d1c1b]/50 bg-gradient-to-br from-[#0f0507]/90 via-[#1a090c]/80 to-[#0f0507]/90 transition-all duration-500 hover:border-[#c03b47]/40 hover:shadow-[0_8px_40px_rgba(192,59,71,0.15)] sm:flex-row"
                        >
                          <div className="relative w-full overflow-hidden sm:w-[220px] lg:w-[280px]">
                            <DiscountBadge oldPrice={bouquet.old_price} price={bouquet.price} />
                            <Link to={`/bouquets/${bouquet.id}`}>
                              <motion.img loading="lazy" decoding="async"
                                whileHover={{ scale: 1.08 }}
                                transition={{ duration: 0.6 }}
                                src={bouquet.image}
                                alt={bouquet.name}
                                className="h-44 sm:h-56 w-full object-cover transition-all duration-500 sm:h-full sm:min-h-[200px] lg:min-h-[240px]"
                              />
                            </Link>
                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                          </div>

                          <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 py-3 sm:py-4">
                            <Link
                              to={`/bouquets/${bouquet.id}`}
                              className="font-cormorant text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-white transition-colors hover:text-[#ff9b88]"
                            >
                              {bouquet.name}
                            </Link>
                            <Link
                              to={`/shops/${bouquet.shop.slug}`}
                              className="mt-1 inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#c8a8a0] transition-colors hover:text-[#ffb7ab]"
                            >
                              <HiMiniGift size={12} />
                              {bouquet.shop.name}
                            </Link>

                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                              <RatingStars rating={bouquet.rating} />
                              <span className="text-xs sm:text-sm font-semibold text-amber-400">{bouquet.rating}</span>
                              <span className="text-[10px] sm:text-xs text-[#ad8b84]">({bouquet.reviews_count})</span>
                            </div>

                            <div className="mt-2 sm:mt-3 flex items-center justify-between gap-4">
                              <motion.span
                                key={bouquet.price}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
                              >
                                {formatPrice(bouquet.price)}
                              </motion.span>
                            </div>
                          </div>

                          <div className="flex flex-row items-center justify-end gap-2 border-t border-[#3d1c1b]/40 px-4 sm:px-5 py-3 sm:flex-col sm:justify-center sm:border-l sm:border-t-0 sm:px-4">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(bouquet)}
                              className="inline-flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-xl border border-[#c03b47]/50 bg-gradient-to-br from-[#8f1220]/90 to-[#bb2435]/90 text-white shadow-lg shadow-[#c03b47]/20 transition-all duration-300 hover:shadow-[0_0_25px_rgba(192,59,71,0.4)] active:scale-95"
                              title={t("favorites.addToCart")}
                            >
                              <FaShoppingBag size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(item.id, bouquet.name)}
                              className="inline-flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-xl border border-[#5f2825]/60 text-[#f8d9d2] transition-all duration-300 hover:border-[#ff6077]/50 hover:bg-[#ff6077]/10 hover:text-[#ff6077] active:scale-95"
                              title={t("favorites.removeFromFavorites")}
                            >
                              <FaTrashAlt size={11} />
                            </button>
                          </div>
                        </motion.article>
                      );
                    }

                    return (
                      <motion.article
                        key={item.id}
                        custom={index}
                        variants={cardVariants}
                        layout
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#3d1c1b]/50 bg-gradient-to-br from-[#0f0507]/90 via-[#1a090c]/80 to-[#0f0507]/90 transition-all duration-500 hover:border-[#c03b47]/40 hover:shadow-[0_8px_40px_rgba(192,59,71,0.15)] hover:-translate-y-1"
                      >
                        <div className="relative overflow-hidden">
                          <DiscountBadge oldPrice={bouquet.old_price} price={bouquet.price} />
                          <Link to={`/bouquets/${bouquet.id}`}>
                            <motion.img loading="lazy" decoding="async"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.6 }}
                              src={bouquet.image}
                              alt={bouquet.name}
                              className="h-[200px] sm:h-[260px] w-full object-cover transition-all duration-500"
                            />
                          </Link>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0507]/70 via-transparent to-transparent" />

                          <motion.button
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => handleRemove(item.id, bouquet.name)}
                            className="absolute right-3 top-3 z-10 flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-full border border-[#ff6077]/30 bg-[#1c0a0b]/80 text-[#ff6077] backdrop-blur-sm transition-all duration-300 hover:bg-[#ff6077]/20 hover:border-[#ff6077]/60"
                            title={t("favorites.remove")}
                          >
                            <FaTrashAlt size={11} />
                          </motion.button>
                        </div>

                        <div className="flex flex-1 flex-col px-4 sm:px-5 pb-4 sm:pb-5 pt-3 sm:pt-4">
                          <Link
                            to={`/bouquets/${bouquet.id}`}
                            className="font-cormorant text-[1.3rem] sm:text-[1.6rem] font-bold leading-tight text-white transition-colors hover:text-[#ff9b88] line-clamp-2"
                          >
                            {bouquet.name}
                          </Link>
                          <Link
                            to={`/shops/${bouquet.shop.slug}`}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] sm:text-xs text-[#c8a8a0] transition-colors hover:text-[#ffb7ab]"
                          >
                            <HiMiniGift size={10} />
                            {bouquet.shop.name}
                          </Link>

                          <div className="mt-2 sm:mt-3 flex items-center gap-2">
                            <RatingStars rating={bouquet.rating} />
                            <span className="text-[10px] sm:text-xs font-semibold text-amber-400">{bouquet.rating}</span>
                            <span className="text-[8px] sm:text-[10px] text-[#ad8b84]">({bouquet.reviews_count})</span>
                          </div>

                          <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:pt-4">
                            <motion.span
                              key={bouquet.price}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                              className="text-[1.4rem] sm:text-[1.8rem] font-extrabold tracking-tight text-white"
                            >
                              {formatPrice(bouquet.price)}
                            </motion.span>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleAddToCart(bouquet)}
                              className="inline-flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-xl border border-[#c03b47]/50 bg-gradient-to-br from-[#8f1220]/90 to-[#bb2435]/90 text-white shadow-lg shadow-[#c03b47]/20 transition-all duration-300 hover:shadow-[0_0_25px_rgba(192,59,71,0.4)]"
                              title={t("favorites.addToCart")}
                            >
                              <FaShoppingBag size={12} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative mt-6 sm:mt-8 overflow-hidden rounded-[2rem] border border-dashed border-[#5f2825]/50 bg-gradient-to-br from-[#0f0507]/50 via-[#1a090c]/40 to-[#0f0507]/50 px-4 sm:px-8 py-12 sm:py-20 text-center"
              >
                <div className="relative z-10 mx-auto max-w-md">
                  <motion.div
                    animate={{
                      scale: [1, 1.08, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto flex h-20 sm:h-24 w-20 sm:w-24 items-center justify-center rounded-full border-2 border-dashed border-[#ff6077]/30 bg-[#ff6077]/5"
                  >
                    <FaRegHeart className="text-3xl sm:text-4xl text-[#ff6077]/60 drop-shadow-[0_0_12px_rgba(255,96,119,0.3)]" />
                  </motion.div>

                  <h2 className="mt-4 sm:mt-6 font-cormorant text-3xl sm:text-4xl md:text-5xl font-bold text-[#fff3ed]">
                    {t("favorites.noFavorites")}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#c9aba4]">
                    {t("favorites.noFavoritesDesc")}
                  </p>

                  <Link
                    to="/#bouquets"
                    className="group relative mt-6 sm:mt-8 inline-flex h-11 sm:h-12 items-center gap-2.5 overflow-hidden rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-6 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-[0.1em] text-white shadow-lg shadow-[#c03b47]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(192,59,71,0.4)] active:scale-[0.97]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <HiOutlineSparkles size={14} />
                      {t("favorites.exploreBouquets")}
                    </span>
                    <div className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-white/0 via-white/15 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

export default Favorites;
