import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiArrowLeft,
  HiOutlineSparkles,
  HiCheckBadge,
  HiOutlineHeart,
  HiStar,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import NotFound from "../../components/NotFound";
import { BouquetReviewsHeroSkeleton } from "../../components/PageSkeletons";
import ReviewSection from "../../components/catalog/ReviewSection";
import { useBouquet } from "../../hooks/useCatalog";

/* ─── Decorative floating particles ─── */
const FloatingPetals = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-[#c03b47]/15"
        style={{
          left: `${5 + i * 12}%`,
          top: `${10 + (i % 4) * 22}%`,
          fontSize: `${1 + (i % 3) * 0.5}rem`,
        }}
        animate={{
          y: [0, -18, 0],
          opacity: [0.15, 0.5, 0.15],
          scale: [1, 1.12, 1],
          rotate: [0, 10, -5, 0],
        }}
        transition={{
          duration: 4 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.4,
        }}
      >
        <HiOutlineHeart />
      </motion.div>
    ))}
  </div>
);

/* ─── RatingStars component for the hero ─── */
function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 200 }}
        >
          <HiStar
            className={`text-base sm:text-lg md:text-xl ${
              index < value ? "text-[#f2b15e] drop-shadow-[0_0_6px_rgba(242,177,94,0.4)]" : "text-[#5f3a35]"
            }`}
          />
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Animated rating badge ─── */
function RatingBadge({ rating, count }: { rating: string; count: number }) {
  const numRating = Number(rating) || 0;
  const progressPercent = Math.min(numRating * 20, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-4 sm:mt-5 rounded-2xl border border-[#5d2d29]/60 bg-[#120708]/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4"
    >
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Rating number */}
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.span
            key={numRating.toFixed(1)}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-none text-white"
          >
            {numRating.toFixed(1)}
          </motion.span>
          <div>
            <RatingStars value={Math.round(numRating)} />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-1 text-[10px] sm:text-xs font-medium tracking-wide text-[#c9aaa2]"
            >
              <span className="text-[#f2b15e] font-bold">{count}</span> approved reviews
            </motion.p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex-1 min-w-[100px] sm:min-w-[140px]">
          <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-[#321214]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#f2b15e] via-[#ff7d69] to-[#c82f43] shadow-[0_0_12px_rgba(242,177,94,0.3)]"
            />
          </div>
          <div className="mt-1 flex justify-between text-[8px] sm:text-[10px] text-[#8d6b64] font-medium">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Verified badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#2a6b3e]/50 bg-[#163522]/40 px-2.5 sm:px-3 py-1 sm:py-1.5"
        >
          <HiCheckBadge className="text-[#9ff0b4] text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-xs font-semibold text-[#9ff0b4]">Verified reviews</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function BouquetReviews() {
  const { bouquetId } = useParams();
  const { data: bouquet, isLoading, isError } = useBouquet(bouquetId);

  if (isLoading) {
    return <BouquetReviewsHeroSkeleton />;
  }

  if (isError || !bouquet) {
    return <NotFound />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-[#fff6f4]">
      {/* ─── Background decorative gradients ─── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[400px] sm:h-[600px] w-[400px] sm:w-[600px] rounded-full bg-[#c03b47]/[0.06] blur-[100px] sm:blur-[140px]" />
        <div className="absolute -right-32 bottom-0 h-[400px] sm:h-[500px] w-[400px] sm:w-[500px] rounded-full bg-[#8f1220]/[0.05] blur-[100px] sm:blur-[120px]" />
      </div>

      <section className="relative z-10 px-4 pb-16 sm:pb-20 pt-28 sm:pt-32 lg:pt-36 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* ─── Back button ─── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to={`/bouquets/${bouquet.id}`}
              className="group inline-flex items-center gap-2 rounded-full border border-[#6d3430]/50 bg-[#170809]/60 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#f5d6cd] backdrop-blur-sm transition-all hover:border-[#bd756c] hover:text-white hover:bg-[#170809]/90 hover:shadow-[0_0_25px_rgba(189,117,108,0.15)]"
            >
              <HiArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Back to bouquet</span>
            </Link>
          </motion.div>

          {/* ─── Hero Card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mt-4 sm:mt-6 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-[#63302d]/80 bg-[#140708] shadow-[0_25px_70px_rgba(0,0,0,0.35)]"
          >
            <FloatingPetals />

            <div className="pointer-events-none absolute -right-32 -top-32 h-64 sm:h-80 w-64 sm:w-80 rounded-full bg-[#c03b47]/10 blur-[80px] sm:blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 sm:h-60 w-48 sm:w-60 rounded-full bg-[#ff6077]/5 blur-[60px] sm:blur-[80px]" />

            <div className="relative z-10 grid gap-5 sm:gap-6 p-4 sm:p-8 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr] lg:p-10">
              {/* ─── Bouquet Image ─── */}
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="group relative overflow-hidden rounded-[1.4rem] sm:rounded-[1.8rem]"
                >
                  <div className="absolute -inset-4 rounded-[1.8rem] sm:rounded-[2.2rem] bg-gradient-to-br from-[#c03b47]/15 via-transparent to-[#ff9b88]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <img loading="lazy" decoding="async"
                    src={bouquet.image}
                    alt={bouquet.name}
                    className="relative h-56 sm:h-64 md:h-72 w-full rounded-[1.4rem] sm:rounded-[1.8rem] object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-[1.4rem] sm:rounded-[1.8rem] bg-gradient-to-t from-[#140708]/40 via-transparent to-transparent" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -bottom-2 -right-2 h-12 sm:h-16 w-12 sm:w-16 rounded-br-[1.4rem] sm:rounded-br-[1.8rem] border-b-4 border-r-4 border-[#c03b47]/30"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -left-2 -top-2 h-12 sm:h-16 w-12 sm:w-16 rounded-tl-[1.4rem] sm:rounded-tl-[1.8rem] border-l-4 border-t-4 border-[#c03b47]/30"
                />
              </div>

              {/* ─── Content ─── */}
              <div className="flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#c03b47]/25 bg-[#c03b47]/10 px-3 sm:px-3.5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff9b88]">
                    <HiOutlineSparkles size={10} />
                    Reviews & Ratings
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="mt-3 sm:mt-4 font-cormorant text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white"
                >
                  {bouquet.name}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="mt-2 sm:mt-3 max-w-xl text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-8 text-[#d7b8b0]"
                >
                  Discover what customers are saying about this beautiful arrangement. Read genuine reviews, see ratings, and share your own experience.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5d2d29]/50 bg-[#1a0a0b]/60 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-[#e0c3bb]">
                    <HiOutlineChatBubbleLeftRight className="text-[#c03b47]" />
                    {bouquet.reviews_count} reviews
                  </span>
                  {bouquet.shop && (
                    <Link
                      to={`/shops/${bouquet.shop.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#5d2d29]/50 bg-[#1a0a0b]/60 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-[#e0c3bb] transition-all hover:border-[#bd756c] hover:text-white"
                    >
                      <span>{bouquet.shop.name}</span>
                    </Link>
                  )}
                </motion.div>

                <RatingBadge rating={bouquet.rating} count={bouquet.reviews_count} />
              </div>
            </div>
          </motion.div>

          {/* ─── Reviews Section ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 sm:mt-10"
          >
            <ReviewSection bouquet={bouquet} mode="full" />
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default BouquetReviews;
