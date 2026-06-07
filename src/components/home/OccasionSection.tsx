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

type OccasionKey =
  | "birthday"
  | "anniversary"
  | "wedding"
  | "newBaby"
  | "getWell"
  | "romantic";

const OCCASION_SEARCH_TERMS: Record<OccasionKey, string> = {
  birthday: "birthday",
  anniversary: "anniversary",
  wedding: "wedding",
  newBaby: "new baby",
  getWell: "get well",
  romantic: "romantic",
};

interface OccasionSectionProps {
  selectedOccasion: OccasionKey | null;
  onSelectOccasion: (occasion: OccasionKey | null) => void;
}

const OCCASION_CONFIG = {
  birthday: {
    icon: LuCakeSlice,
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.15)",
    fromColor: "#f97316",
    toColor: "#ea580c",
    bgGradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    borderColor: "border-orange-500/25",
    lightBg: "bg-orange-500/10",
    label: "birthday",
  },
  anniversary: {
    icon: HiOutlineHeart,
    color: "#ec4899",
    glowColor: "rgba(236,72,153,0.15)",
    fromColor: "#ec4899",
    toColor: "#db2777",
    bgGradient: "from-pink-500/10 via-rose-500/5 to-transparent",
    borderColor: "border-pink-500/25",
    lightBg: "bg-pink-500/10",
    label: "anniversary",
  },
  wedding: {
    icon: TbRings,
    color: "#a855f7",
    glowColor: "rgba(168,85,247,0.15)",
    fromColor: "#a855f7",
    toColor: "#9333ea",
    bgGradient: "from-purple-500/10 via-fuchsia-500/5 to-transparent",
    borderColor: "border-purple-500/25",
    lightBg: "bg-purple-500/10",
    label: "wedding",
  },
  newBaby: {
    icon: HiOutlineSparkles,
    color: "#06b6d4",
    glowColor: "rgba(6,182,212,0.15)",
    fromColor: "#06b6d4",
    toColor: "#0891b2",
    bgGradient: "from-cyan-500/10 via-sky-500/5 to-transparent",
    borderColor: "border-cyan-500/25",
    lightBg: "bg-cyan-500/10",
    label: "newBaby",
  },
  getWell: {
    icon: HiOutlineSun,
    color: "#22c55e",
    glowColor: "rgba(34,197,94,0.15)",
    fromColor: "#22c55e",
    toColor: "#16a34a",
    bgGradient: "from-green-500/10 via-emerald-500/5 to-transparent",
    borderColor: "border-green-500/25",
    lightBg: "bg-green-500/10",
    label: "getWell",
  },
  romantic: {
    icon: LuFlower2,
    color: "#ef4444",
    glowColor: "rgba(239,68,68,0.15)",
    fromColor: "#ef4444",
    toColor: "#dc2626",
    bgGradient: "from-red-500/10 via-rose-500/5 to-transparent",
    borderColor: "border-red-500/25",
    lightBg: "bg-red-500/10",
    label: "romantic",
  },
} as const;

// Floating decorative particles
const DECORATIVE_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
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

function OccasionSection({ selectedOccasion, onSelectOccasion }: OccasionSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<OccasionKey | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
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
  }, []);

  const occasions = useMemo(() => {
    const keys: OccasionKey[] = ["birthday", "anniversary", "wedding", "newBaby", "getWell", "romantic"];
    return keys.map((key) => ({
      key,
      ...OCCASION_CONFIG[key],
      title: t(`occasionSection.items.${key}.title`),
      description: t(`occasionSection.items.${key}.description`),
    }));
  }, [t]);

  const handleSelect = (key: OccasionKey) => {
    const nextOccasion = selectedOccasion === key ? null : key;
    onSelectOccasion(nextOccasion);

    const params = new URLSearchParams();

    if (nextOccasion) {
      params.set("occasion", nextOccasion);
      params.set("search", OCCASION_SEARCH_TERMS[nextOccasion]);
    }

    navigate({
      pathname: "/bouquets",
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const handleShowAll = () => {
    onSelectOccasion(null);
    navigate("/bouquets");
  };

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* ── Premium background decoration ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Large ambient glows */}
        <div className="absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#cb5c57]/8 to-transparent blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#ff9b88]/5 to-transparent blur-3xl" />
        <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-rose-800/5 to-transparent blur-3xl" />
        
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating particles */}
        {DECORATIVE_PARTICLES.map((p) => (
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

        {/* Decorative corner lines (gold style) */}
        <div className="absolute left-6 top-6 z-10 h-12 w-[1px] bg-gradient-to-b from-[#d9b56f]/20 to-transparent sm:left-8 sm:top-8" />
        <div className="absolute left-6 top-6 z-10 h-[1px] w-12 bg-gradient-to-r from-[#d9b56f]/20 to-transparent sm:left-8 sm:top-8" />
        <div className="absolute right-6 top-6 z-10 h-12 w-[1px] bg-gradient-to-b from-[#d9b56f]/20 to-transparent sm:right-8 sm:top-8" />
        <div className="absolute right-6 top-6 z-10 h-[1px] w-12 bg-gradient-to-l from-[#d9b56f]/20 to-transparent sm:right-8 sm:top-8" />
        <div className="absolute bottom-6 left-6 z-10 h-12 w-[1px] bg-gradient-to-t from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:left-8" />
        <div className="absolute bottom-6 left-6 z-10 h-[1px] w-12 bg-gradient-to-r from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:left-8" />
        <div className="absolute bottom-6 right-6 z-10 h-12 w-[1px] bg-gradient-to-t from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:right-8" />
        <div className="absolute bottom-6 right-6 z-10 h-[1px] w-12 bg-gradient-to-l from-[#d9b56f]/20 to-transparent sm:bottom-8 sm:right-8" />
      </div>

      {/* ── Section Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-14 text-center"
      >
        {/* Badge */}
        <div className="mb-5 inline-flex items-center justify-center">
          <motion.div
            className="group relative inline-flex items-center gap-2.5 rounded-full border border-[#d9b56f]/25 bg-[#2a0d10]/50 px-5 py-2 backdrop-blur-md"
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
            <LuPartyPopper className="relative text-[#e8c987] text-base" />
            <span className="relative text-xs font-semibold uppercase tracking-[0.18em] text-[#e8c987]">
              {t("occasionSection.badge")}
            </span>
          </motion.div>
        </div>

        {/* Title with Great Vibes font */}
        <h2 className="font-great-vibes text-[clamp(2.8rem,6vw,5rem)] font-normal leading-[0.92] text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.12)]">
          {t("occasionSection.title")}
        </h2>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#caaba5]">
          {t("occasionSection.description")}
        </p>

        {/* Decorative divider */}
        <div className="mt-7 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />
          <div className="flex items-center gap-1.5">
            <span className="block h-1.5 w-1.5 rotate-45 bg-[#d9b56f]/30" />
            <span className="block h-1.5 w-1.5 rotate-45 bg-[#cb5c57]/40" />
            <span className="block h-1.5 w-1.5 rotate-45 bg-[#d9b56f]/30" />
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />
        </div>
      </motion.div>

      {/* ── Occasion Grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {occasions.map((occasion) => {
          const Icon = occasion.icon;
          const isSelected = selectedOccasion === occasion.key;
          const isHovered = hoveredCard === occasion.key;
          const config = OCCASION_CONFIG[occasion.key];

          return (
            <motion.button
              key={occasion.key}
              variants={cardVariants}
              onClick={() => handleSelect(occasion.key)}
              onMouseEnter={() => setHoveredCard(occasion.key)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`
                group relative overflow-hidden rounded-2xl border p-[1px] text-left
                transition-all duration-500 ease-out
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
                transition: "border-color 0.5s, box-shadow 0.5s",
              }}
            >
              {/* Inner glow ring */}
              <div
                className={`
                  absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500
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
                  transition-opacity duration-500
                  ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}
                `}
              />

              {/* Content card */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#1a0c0c]/95 to-[#0f0606]/98 p-6 backdrop-blur-sm h-full">
                {/* Selected indicator - chic checkmark */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute right-4 top-4 z-20"
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm"
                        style={{
                          background: `linear-gradient(135deg, ${config.color}, ${config.toColor})`,
                          boxShadow: `0 0 20px ${config.glowColor}`,
                        }}
                      >
                        <HiCheck className="h-4 w-4 text-white" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon row */}
                <div className="mb-5 flex items-center gap-4">
                  {/* Icon container */}
                  <motion.div
                    className={`
                      relative flex h-14 w-14 items-center justify-center rounded-xl
                      transition-all duration-300
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
                      className="relative z-10 h-7 w-7 transition-all duration-300"
                      style={{
                        color: isSelected ? config.color : isHovered ? config.color : "#8c6f68",
                        filter: isSelected ? `drop-shadow(0 0 8px ${config.color}66)` : "none",
                      }}
                    />
                  </motion.div>

                  {/* Title */}
                  <h3
                    className="font-cormorant text-2xl font-bold leading-tight transition-colors duration-300"
                    style={{
                      color: isSelected ? "#f8ece4" : isHovered ? "#fff0ea" : "#c6a79e",
                    }}
                  >
                    {occasion.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="mb-5 text-sm leading-relaxed text-[#a6847b]">
                  {occasion.description}
                </p>

                {/* Bottom action bar */}
                <div className="flex items-center justify-between">
                  <div
                    className={`
                      inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider
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
                        className="h-3 w-3 transition-all duration-300"
                        style={{
                          transform: isHovered ? "translateX(4px)" : "translateX(0)",
                        }}
                      />
                    )}
                  </div>

                  {/* Accent dot */}
                  <div
                    className="h-2 w-2 rounded-full transition-all duration-300"
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

      {/* ── Show All Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-12 flex justify-center"
      >
        {/* Decorative line above button */}
        <div className="absolute -top-6 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#5b2524] to-transparent" />
        
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <button
            onClick={handleShowAll}
            className="group relative inline-flex h-12 items-center justify-center gap-3 overflow-hidden rounded-xl border border-[#cb5c57]/35 bg-gradient-to-b from-[#1f0a0b]/90 to-[#180708]/80 px-8 text-sm font-bold uppercase tracking-[0.14em] text-[#fff0ea] shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cb5c57] hover:bg-[#cb5c57]/15 hover:shadow-xl hover:shadow-[#cb5c57]/10"
          >
            <span className="absolute inset-0 -translate-x-[120%] skew-x-[-12deg] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
            <span className="relative z-10">{t("occasionSection.showAll")}</span>
            <HiArrowRight className="relative z-10 transition-all duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>

      {/* ── Selected occasion hint ── */}
      <AnimatePresence>
        {selectedOccasion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-8 text-center"
          >
            <motion.div
              className="inline-flex items-center gap-2.5 rounded-full border border-[#cb5c57]/25 bg-[#1b0b0d]/80 px-5 py-2 backdrop-blur-sm"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: OCCASION_CONFIG[selectedOccasion].color }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-[#f1d5cb]">
                {t("occasionSection.filterActive", {
                  occasion: t(`occasionSection.items.${selectedOccasion}.title`),
                })}
              </span>
              <button
                type="button"
                onClick={handleShowAll}
                aria-label={t("occasionSection.clear")}
                title={t("occasionSection.clear")}
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3a1a1a] text-xs text-[#b08d86] transition-all duration-300 hover:bg-[#cb5c57]/30 hover:text-white"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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