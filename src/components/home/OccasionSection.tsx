import { useMemo, useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  HiArrowRight,
  HiOutlineHeart,
  HiOutlineSparkles,
  HiOutlineSun,
  HiCheck,
} from "react-icons/hi2";
import { LuCakeSlice, LuFlower2, LuPartyPopper } from "react-icons/lu";
import { TbRings } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";
import useIsMobile from "../../hooks/useIsMobile";
import { Skeleton } from "../Skeleton";
import type { Category } from "../../types/catalog";

interface OccasionSectionProps {
  categories: Category[];
  isLoading: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CATEGORY_CARD_STYLES = [
  {
    icon: LuCakeSlice,
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.15)",
    fromColor: "#f97316",
    toColor: "#ea580c",
    bgGradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    borderColor: "border-orange-500/25",
    lightBg: "bg-orange-500/10",
  },
  {
    icon: HiOutlineHeart,
    color: "#ec4899",
    glowColor: "rgba(236,72,153,0.15)",
    fromColor: "#ec4899",
    toColor: "#db2777",
    bgGradient: "from-pink-500/10 via-rose-500/5 to-transparent",
    borderColor: "border-pink-500/25",
    lightBg: "bg-pink-500/10",
  },
  {
    icon: TbRings,
    color: "#a855f7",
    glowColor: "rgba(168,85,247,0.15)",
    fromColor: "#a855f7",
    toColor: "#9333ea",
    bgGradient: "from-purple-500/10 via-fuchsia-500/5 to-transparent",
    borderColor: "border-purple-500/25",
    lightBg: "bg-purple-500/10",
  },
  {
    icon: HiOutlineSparkles,
    color: "#06b6d4",
    glowColor: "rgba(6,182,212,0.15)",
    fromColor: "#06b6d4",
    toColor: "#0891b2",
    bgGradient: "from-cyan-500/10 via-sky-500/5 to-transparent",
    borderColor: "border-cyan-500/25",
    lightBg: "bg-cyan-500/10",
  },
  {
    icon: HiOutlineSun,
    color: "#22c55e",
    glowColor: "rgba(34,197,94,0.15)",
    fromColor: "#22c55e",
    toColor: "#16a34a",
    bgGradient: "from-green-500/10 via-emerald-500/5 to-transparent",
    borderColor: "border-green-500/25",
    lightBg: "bg-green-500/10",
  },
  {
    icon: LuFlower2,
    color: "#ef4444",
    glowColor: "rgba(239,68,68,0.15)",
    fromColor: "#ef4444",
    toColor: "#dc2626",
    bgGradient: "from-red-500/10 via-rose-500/5 to-transparent",
    borderColor: "border-red-500/25",
    lightBg: "bg-red-500/10",
  },
];

function getCategoryStyle(index: number) {
  return CATEGORY_CARD_STYLES[index % CATEGORY_CARD_STYLES.length];
}

// Floating decorative particles
const DECORATIVE_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: 5 + Math.random() * 90, // keep particles within 5-95% range to avoid overflow
  y: 5 + Math.random() * 90,
  size: 2 + Math.random() * 4,
  duration: 8 + Math.random() * 12,
  delay: Math.random() * 5,
  opacity: 0.08 + Math.random() * 0.12,
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function OccasionSectionSkeleton() {
  return (
    <>
      <div className="relative mb-10 text-center sm:mb-14">
        <div className="mb-4 inline-flex items-center justify-center sm:mb-5">
          <Skeleton className="h-9 w-44 rounded-full sm:h-11 sm:w-56" />
        </div>
        <Skeleton className="mx-auto h-14 w-[min(92%,44rem)] rounded-full sm:h-20" />
        <Skeleton className="mx-auto mt-3 h-5 w-[min(88%,32rem)] rounded-full sm:mt-4 sm:h-6" />
        <Skeleton className="mx-auto mt-2 h-5 w-[min(82%,26rem)] rounded-full sm:h-6" />
        <div className="mt-5 flex items-center justify-center gap-3 sm:mt-7">
          <Skeleton className="h-px w-10 sm:w-16" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-1.5 w-1.5 rotate-45 rounded-[2px]" />
            <Skeleton className="h-1.5 w-1.5 rotate-45 rounded-[2px]" />
            <Skeleton className="h-1.5 w-1.5 rotate-45 rounded-[2px]" />
          </div>
          <Skeleton className="h-px w-10 sm:w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-2xl border border-[#2a1214] bg-gradient-to-br from-[#1a0c0c]/95 to-[#0f0606]/98 p-4 sm:p-5 md:p-6"
          >
            <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4 md:mb-5">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl sm:h-12 sm:w-12 md:h-14 md:w-14" />
              <Skeleton className="h-8 w-36 rounded-full sm:h-9 sm:w-40 md:w-44" />
            </div>
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="mt-2 h-4 w-11/12 rounded-full" />
            <Skeleton className="mt-2 h-4 w-4/5 rounded-full" />
            <div className="mt-6 flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-full sm:h-5 sm:w-32" />
              <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-10 flex justify-center sm:mt-12">
        <div className="absolute left-1/4 right-1/4 top-0 h-px -translate-y-5 sm:-translate-y-6">
          <Skeleton className="h-full w-full" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl sm:h-12 sm:w-48" />
      </div>
    </>
  );
}

function OccasionSection({ categories, isLoading, selectedCategoryId, onSelectCategory }: OccasionSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, [isMobile]);

  const occasions = useMemo(() => {
    return categories.map((category, index) => {
      return {
        category,
        style: getCategoryStyle(index),
        title: category.name,
        description: category.description?.trim() || t("occasionSection.dynamicDescription", { category: category.name }),
      };
    });
  }, [categories, t]);

  const handleSelect = (category: Category) => {
    const nextCategoryId = selectedCategoryId === category.id ? null : category.id;
    onSelectCategory(nextCategoryId);

    const params = new URLSearchParams();

    if (nextCategoryId) {
      params.set("category", category.slug);
    }

    navigate({
      pathname: "/bouquets",
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const handleShowAll = () => {
    onSelectCategory(null);
    navigate("/bouquets");
  };

  const selectedCategoryIndex = categories.findIndex((category) => category.id === selectedCategoryId);
  const selectedCategory = selectedCategoryIndex >= 0 ? categories[selectedCategoryIndex] : null;
  const selectedStyle = selectedCategory ? getCategoryStyle(selectedCategoryIndex) : null;

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 overflow-hidden"
    >
      {/* ── Premium background decoration ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Large ambient glows - reduced size on mobile */}
        {/* <div className="absolute -top-48 -right-48 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-gradient-to-br from-[#cb5c57]/8 to-transparent blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-gradient-to-tr from-[#ff9b88]/5 to-transparent blur-3xl" />
        <div className="absolute top-1/4 left-1/3 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-gradient-to-br from-rose-800/5 to-transparent blur-3xl" />
         */}
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating particles (hidden on very small screens to prevent layout issues) */}
        {!isMobile && DECORATIVE_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, rgba(217,181,111,0.3), transparent)`,
              boxShadow: "0 0 8px rgba(217,181,111,0.06)",
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, p.id % 2 === 0 ? 10 : -10, 0],
              opacity: [p.opacity, p.opacity * 1.8, p.opacity],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Decorative corner lines - adjusted for mobile */}
        <div className="absolute left-4 top-4 z-10 h-8 w-[1px] bg-gradient-to-b from-[#d9b56f]/20 to-transparent sm:left-8 sm:top-8 sm:h-12" />
        <div className="absolute left-4 top-4 z-10 h-[1px] w-8 bg-gradient-to-r from-[#d9b56f]/20 to-transparent sm:left-8 sm:top-8 sm:w-12" />
        <div className="absolute right-4 top-4 z-10 h-8 w-[1px] bg-gradient-to-b from-[#d9b56f]/20 to-transparent sm:right-8 sm:top-8 sm:h-12" />
        <div className="absolute right-4 top-4 z-10 h-[1px] w-8 bg-gradient-to-l from-[#d9b56f]/20 to-transparent sm:right-8 sm:top-8 sm:w-12" />
        <div className="absolute bottom-4 left-4 z-10 h-8 w-[1px] bg-gradient-to-t from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:left-8 sm:h-12" />
        <div className="absolute bottom-4 left-4 z-10 h-[1px] w-8 bg-gradient-to-r from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:left-8 sm:w-12" />
        <div className="absolute bottom-4 right-4 z-10 h-8 w-[1px] bg-gradient-to-t from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:right-8 sm:h-12" />
        <div className="absolute bottom-4 right-4 z-10 h-[1px] w-8 bg-gradient-to-l from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:right-8 sm:w-12" />
      </div>

      {isLoading ? (
        <OccasionSectionSkeleton />
      ) : (
        <>
          {/* ── Section Header ── */}
          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={isMobile ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-10 sm:mb-14 text-center"
          >
            <div className="mb-4 sm:mb-5 inline-flex items-center justify-center">
              <motion.div
                className="group relative inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/25 bg-[#2a0d10]/50 px-3.5 py-1.5 sm:px-5 sm:py-2 backdrop-blur-md"
                whileHover={{ scale: 1.03, borderColor: "rgba(217,181,111,0.4)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full opacity-0 blur-sm"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{
                    background: "linear-gradient(135deg, rgba(217,181,111,0.15), rgba(203,92,87,0.08))",
                  }}
                />
                <LuPartyPopper className="relative text-[#e8c987] text-sm sm:text-base" />
                <span className="relative text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#e8c987]">
                  {t("occasionSection.badge")}
                </span>
              </motion.div>
            </div>

            <h2 className="font-great-vibes text-[clamp(2.2rem,7vw,5rem)] font-normal leading-[0.92] text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.12)]">
              {t("occasionSection.title")}
            </h2>

            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#caaba5]">
              {t("occasionSection.description")}
            </p>

            <div className="mt-5 sm:mt-7 flex items-center justify-center gap-3">
              <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />
              <div className="flex items-center gap-1.5">
                <span className="block h-1.5 w-1.5 rotate-45 bg-[#d9b56f]/30" />
                <span className="block h-1.5 w-1.5 rotate-45 bg-[#cb5c57]/40" />
                <span className="block h-1.5 w-1.5 rotate-45 bg-[#d9b56f]/30" />
              </div>
              <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />
            </div>
          </motion.div>

          <motion.div
            variants={isMobile ? undefined : containerVariants}
            initial={isMobile ? false : "hidden"}
            animate={isVisible ? "visible" : "hidden"}
            className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {occasions.map((occasion) => {
          const Icon = occasion.style.icon;
          const isSelected = selectedCategoryId === occasion.category.id;
          const isHovered = hoveredCard === occasion.category.id;
          const config = occasion.style;

          return (
            <motion.button
              key={occasion.category.id}
              variants={isMobile ? undefined : cardVariants}
              initial={isMobile ? false : undefined}
              animate={isMobile ? { opacity: 1, y: 0, scale: 1 } : undefined}
              transition={isMobile ? { duration: 0 } : undefined}
              onClick={() => handleSelect(occasion.category)}
              onMouseEnter={() => setHoveredCard(occasion.category.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`
                group relative overflow-hidden rounded-2xl border p-[1px] text-left w-full
                transition-all duration-300 ease-out
                ${isSelected 
                  ? "shadow-2xl" 
                  : "hover:shadow-xl"
                }
              `}
              style={{
                borderColor: isSelected ? config.color : "#2a1214",
                boxShadow: isSelected
                  ? `0 0 30px ${config.glowColor}, 0 8px 32px rgba(0,0,0,0.3)`
                  : isHovered
                  ? `0 0 20px ${config.glowColor}`
                  : "0 4px 16px rgba(0,0,0,0.2)",
                transition: "border-color 0.25s, box-shadow 0.25s",
              }}
            >
              {/* Inner glow ring */}
              <div
                className={`
                  absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300
                  ${isHovered || isSelected ? "opacity-100" : ""}
                `}
                style={{
                  background: `radial-gradient(600px circle at 50% 0%, ${config.glowColor}, transparent 70%)`,
                }}
              />

              {/* Background gradient */}
              <div
                className={`
                  absolute inset-0 rounded-2xl bg-gradient-to-br ${config.bgGradient}
                  transition-opacity duration-300
                  ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}
                `}
              />

              {/* Content card - reduced padding on mobile */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#1a0c0c]/95 to-[#0f0606]/98 p-4 sm:p-5 md:p-6 backdrop-blur-sm h-full">
                {/* Selected indicator - chic checkmark */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute right-3 top-3 sm:right-4 sm:top-4 z-20"
                    >
                      <div
                        className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full backdrop-blur-sm"
                        style={{
                          background: `linear-gradient(135deg, ${config.color}, ${config.toColor})`,
                          boxShadow: `0 0 20px ${config.glowColor}`,
                        }}
                      >
                        <HiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon row */}
                <div className="mb-3 sm:mb-4 md:mb-5 flex items-center gap-3 sm:gap-4">
                  {/* Icon container - smaller on mobile */}
                  <motion.div
                    className={`
                      relative flex h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-xl
                      transition-all duration-300 shrink-0
                    `}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${config.color}22, transparent)`
                        : "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)",
                      boxShadow: isSelected
                        ? `inset 0 1px 0 ${config.color}44, 0 4px 16px ${config.glowColor}`
                        : "inset 0 1px 0 rgba(255,255,255,0.05)",
                      border: `1px solid ${isSelected ? `${config.color}33` : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    {/* Icon glow */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at center, ${config.glowColor}, transparent 70%)`,
                        opacity: isSelected || isHovered ? 0.6 : 0,
                      }}
                    />
                    <Icon
                      className="relative z-10 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-all duration-300"
                      style={{
                        color: isSelected ? config.color : isHovered ? config.color : "#8c6f68",
                        filter: isSelected ? `drop-shadow(0 0 8px ${config.color}66)` : "none",
                      }}
                    />
                  </motion.div>

                  {/* Title - smaller on mobile */}
                  <h3
                    className="font-cormorant text-lg sm:text-xl md:text-2xl font-bold leading-tight transition-colors duration-300"
                    style={{
                      color: isSelected ? "#f8ece4" : isHovered ? "#fff0ea" : "#c6a79e",
                    }}
                  >
                    {occasion.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="mb-3 sm:mb-4 md:mb-5 text-xs sm:text-sm leading-relaxed text-[#a6847b]">
                  {occasion.description}
                </p>

                {/* Bottom action bar */}
                <div className="flex items-center justify-between">
                  <div
                    className={`
                      inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider
                      transition-all duration-300
                    `}
                    style={{
                      color: isSelected ? config.color : "#6b4f48",
                    }}
                  >
                    <span>
                      {isSelected
                        ? t("occasionSection.selected")
                        : t("occasionSection.selectHint")
                      }
                    </span>
                    {!isSelected && (
                      <HiArrowRight
                        className="h-2.5 w-2.5 sm:h-3 sm:w-3 transition-all duration-300"
                        style={{
                          transform: isHovered ? "translateX(4px)" : "translateX(0)",
                        }}
                      />
                    )}
                  </div>

                  {/* Accent dot */}
                  <div
                    className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all duration-300 shrink-0"
                    style={{
                      backgroundColor: isSelected ? config.color : "#2a1214",
                      boxShadow: isSelected ? `0 0 10px ${config.glowColor}` : "none",
                      opacity: isSelected ? 1 : isHovered ? 0.5 : 0.3,
                    }}
                  />
                </div>

                {/* Selected bottom bar */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ scaleX: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute bottom-0 left-0 right-0 h-[3px] origin-left rounded-b-2xl"
                      style={{
                        background: `linear-gradient(90deg, ${config.color}, ${config.toColor})`,
                        boxShadow: `0 0 12px ${config.glowColor}`,
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
          </motion.div>

          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={isMobile ? { duration: 0 } : { duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-10 sm:mt-12 flex justify-center"
          >
            <div className="absolute -top-5 sm:-top-6 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <button
                onClick={handleShowAll}
                className="group relative inline-flex h-10 sm:h-12 items-center justify-center gap-2 sm:gap-3 overflow-hidden rounded-xl border border-[#cb5c57]/35 bg-gradient-to-b from-[#1f0a0b]/90 to-[#180708]/80 px-5 sm:px-8 text-[11px] sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-[#fff0ea] shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cb5c57] hover:bg-[#cb5c57]/15 hover:shadow-xl hover:shadow-[#cb5c57]/10"
              >
                <span className="absolute inset-0 -translate-x-[120%] skew-x-[-12deg] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
                <span className="relative z-10">{t("occasionSection.showAll")}</span>
                <HiArrowRight className="relative z-10 transition-all duration-300 group-hover:translate-x-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {selectedCategory && selectedStyle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-6 sm:mt-8 text-center"
              >
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full border border-[#cb5c57]/25 bg-[#1b0b0d]/80 px-4 sm:px-5 py-1.5 sm:py-2 backdrop-blur-sm"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.span
                    className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0"
                    style={{ backgroundColor: selectedStyle.color }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-xs sm:text-sm font-medium text-[#f1d5cb]">
                    {t("occasionSection.filterActive", {
                      occasion: selectedCategory.name,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={handleShowAll}
                    aria-label={t("occasionSection.clear")}
                    title={t("occasionSection.clear")}
                    className="ml-1 inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#3a1a1a] text-[10px] sm:text-xs text-[#b08d86] transition-all duration-300 hover:bg-[#cb5c57]/30 hover:text-white shrink-0"
                  >
                    ✕
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      {/* ── Inline animation keyframes ── */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

export default OccasionSection;
