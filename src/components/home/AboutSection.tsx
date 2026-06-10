import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  HiHeart,
  HiSparkles,
  HiOutlineShieldCheck,
  HiOutlineTruck
} from "react-icons/hi2";
import flowerIcon from "../../assets/flower_icon.png";
import flowerIcon2 from "../../assets/flower_icon2.png";
import bowImage from "../../assets/bow.png";
import useIsMobile from "../../hooks/useIsMobile";

const ABOUT_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 10,
  duration: 14 + Math.random() * 18,
  delay: Math.random() * 8,
  opacity: 0.08 + Math.random() * 0.18,
  rotate: Math.random() * 360,
}));

const FLOWER_ICONS = [flowerIcon, flowerIcon2];

// ── Values ──
const VALUES = [
  { key: "craft", icon: HiSparkles },
  { key: "quality", icon: HiOutlineShieldCheck },
  { key: "heart", icon: HiHeart },
  { key: "speed", icon: HiOutlineTruck },
];

function AboutSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [petals, setPetals] = useState<Array<{ id: number; x: number; icon: string; size: number }>>([]);
  const [, setStatsInView] = useState(false);
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const enableHeavyEffects = !isMobile && !shouldReduceMotion;

  // ── Parallax ──
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 60, damping: 24 });
  const bgY = useTransform(smoothScroll, [0, 1], [0, isMobile ? 0 : -60]);

  // ── Floating petals ──
  useEffect(() => {
    if (!enableHeavyEffects) {
      setPetals([]);
      return;
    }

    const interval = setInterval(() => {
      setPetals((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          icon: FLOWER_ICONS[Math.floor(Math.random() * FLOWER_ICONS.length)],
          size: 12 + Math.random() * 16,
        },
      ]);
      setPetals((prev) => prev.slice(-8));
    }, 2200);
    return () => clearInterval(interval);
  }, [enableHeavyEffects]);

  // ── Stats observer ──
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 36 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };
  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-28"
      id="about"
    >
      {/* ── Full‑bleed background layer ── */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        {/* Radial glow top */}
        <div className="absolute left-1/2 top-0 h-[54vh] w-[92vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(174,29,54,0.08),transparent_68%)] sm:h-[70vh] sm:w-[80vw]" />

        {/* Gradient ribbon from left */}
        <div className="absolute left-0 top-1/3 hidden h-[1px] w-1/3 bg-gradient-to-r from-[#d9b56f]/12 to-transparent sm:block" />
        <div className="absolute right-0 top-2/3 hidden h-[1px] w-1/3 bg-gradient-to-l from-[#d9b56f]/12 to-transparent sm:block" />

        {/* Corner gold accents */}
        <div className="absolute left-6 top-6 hidden h-20 w-[1px] bg-gradient-to-b from-[#d9b56f]/20 to-transparent sm:block" />
        <div className="absolute left-6 top-6 hidden h-[1px] w-20 bg-gradient-to-r from-[#d9b56f]/20 to-transparent sm:block" />
        <div className="absolute right-6 top-6 hidden h-20 w-[1px] bg-gradient-to-b from-[#d9b56f]/20 to-transparent sm:block" />
        <div className="absolute right-6 top-6 hidden h-[1px] w-20 bg-gradient-to-l from-[#d9b56f]/20 to-transparent sm:block" />
        <div className="absolute bottom-6 left-6 hidden h-20 w-[1px] bg-gradient-to-t from-[#d9b56f]/20 to-transparent sm:block" />
        <div className="absolute bottom-6 left-6 hidden h-[1px] w-20 bg-gradient-to-r from-[#d9b56f]/20 to-transparent sm:block" />
        <div className="absolute bottom-6 right-6 hidden h-20 w-[1px] bg-gradient-to-t from-[#d9b56f]/20 to-transparent sm:block" />
        <div className="absolute bottom-6 right-6 hidden h-[1px] w-20 bg-gradient-to-l from-[#d9b56f]/20 to-transparent sm:block" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </motion.div>

      {/* ── Floating particles ── */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        {enableHeavyEffects
          ? ABOUT_PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background:
                    p.id % 3 === 0
                      ? "radial-gradient(circle, rgba(217,181,111,0.3), transparent)"
                      : p.id % 3 === 1
                        ? "radial-gradient(circle, rgba(216,38,63,0.2), transparent)"
                        : "radial-gradient(circle, rgba(255,200,220,0.15), transparent)",
                  boxShadow:
                    p.id % 2 === 0 ? "0 0 18px rgba(217,181,111,0.06)" : "0 0 18px rgba(216,38,63,0.04)",
                }}
                animate={{
                  y: [0, -24, 0],
                  x: [0, p.id % 2 === 0 ? 12 : -12, 0],
                  scale: [1, 1.1, 1],
                  opacity: [p.opacity, p.opacity * 1.5, p.opacity],
                  rotate: [p.rotate, p.rotate + 180, p.rotate + 360],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeInOut",
                }}
              />
            ))
          : null}

        {/* ── Falling petals ── */}
        {enableHeavyEffects ? (
          <AnimatePresence>
            {petals.map((petal) => (
              <motion.div
                key={petal.id}
                className="pointer-events-none absolute z-20 select-none"
                style={{ left: `${petal.x}%`, top: -40 }}
                initial={{ y: -40, opacity: 0, rotate: 0 }}
                animate={{
                  y: typeof window !== "undefined" ? window.innerHeight + 40 : 800,
                  opacity: [0, 0.4, 0.4, 0],
                  rotate: [0, 120, 240, 360],
                  x: [0, petal.id % 2 === 0 ? 30 : -30, petal.id % 2 === 0 ? 60 : -60, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 10 + Math.random() * 6,
                  ease: "easeInOut",
                }}
              >
                <img loading="lazy" decoding="async"
                  src={petal.icon}
                  alt=""
                  className="block h-auto w-auto select-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.2)]"
                  style={{ width: `${petal.size}px` }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : null}
      </div>

      {/* ── Decorative swoosh behind heading (matching Hero style) ── */}
      <motion.svg
        className="pointer-events-none absolute left-[8%] top-14 z-[1] hidden h-36 w-48 opacity-15 sm:block sm:h-48 sm:w-64"
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={enableHeavyEffects ? { rotate: [0, 4, 0, -4, 0], scale: [1, 1.03, 1] } : undefined}
        transition={enableHeavyEffects ? { duration: 10, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        <path
          d="M10 140 C40 100, 60 40, 100 30 C140 20, 160 50, 190 20"
          stroke="url(#aboutGoldGrad)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="aboutGoldGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d9b56f" stopOpacity="0" />
            <stop offset="50%" stopColor="#d9b56f" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d9b56f" stopOpacity="0" />
          </linearGradient>
        </defs>
      </motion.svg>

      <motion.svg
        className="pointer-events-none absolute right-[8%] top-20 z-[1] hidden h-32 w-44 opacity-12 sm:block sm:h-44 sm:w-60"
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={enableHeavyEffects ? { rotate: [0, -3, 0, 3, 0], scale: [1, 1.02, 1] } : undefined}
        transition={enableHeavyEffects ? { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 } : undefined}
      >
        <path
          d="M10 20 C40 60, 60 120, 100 130 C140 140, 160 110, 190 140"
          stroke="url(#aboutGoldGrad2)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="aboutGoldGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d9b56f" stopOpacity="0" />
            <stop offset="50%" stopColor="#d9b56f" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d9b56f" stopOpacity="0" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* ── Main content ── */}
      <div className="relative z-[3] mx-auto ">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-[56rem] text-center"
        >
          {/* ── Badge ── */}
          <motion.div variants={itemVariants} className="mb-4 inline-flex items-center justify-center sm:mb-5">
            <motion.div
              className="group relative inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/25 bg-[#2a0d10]/50 px-4 py-2 backdrop-blur-md sm:gap-2.5 sm:px-5 sm:py-2.5"
              whileHover={{ scale: 1.03, borderColor: "rgba(217,181,111,0.45)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.span
                className="absolute inset-0 rounded-full opacity-0 blur-sm"
                animate={enableHeavyEffects ? { opacity: [0, 0.35, 0] } : undefined}
                transition={enableHeavyEffects ? { duration: 2.5, repeat: Infinity } : undefined}
                style={{
                  background: "linear-gradient(135deg, rgba(217,181,111,0.2), rgba(216,38,63,0.1))",
                }}
              />
              <HiSparkles className="relative text-[#e8c987] text-sm sm:text-base" />
              <span className="font-great-vibes relative text-base tracking-[0.06em] text-[#e8c987] sm:text-xl">
                {t("about.ourStory")}
              </span>
              <HiSparkles className="relative text-[#e8c987] text-sm sm:text-base" />
            </motion.div>
          </motion.div>

          {/* ── Title ── */}
          <motion.div variants={itemVariants} className="relative">
            <motion.h2
              className="font-great-vibes text-[clamp(2.5rem,13vw,5.8rem)] leading-[0.94] font-normal text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.12)] sm:text-[clamp(3rem,7vw,5.8rem)]"
            >
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
              >
                {t("about.title")}
              </motion.span>
            </motion.h2>

            {/* Decorative line under title */}
            <motion.div
              className="mx-auto mt-3 h-[2px] w-20 rounded-full bg-gradient-to-r from-transparent via-[#d9b56f]/50 to-transparent sm:mt-4 sm:w-24"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            />
          </motion.div>

          {/* ── Description ── */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-5 max-w-[46rem] text-[0.98rem] leading-[1.8] text-[#dcc3bc] sm:mt-6 sm:text-[clamp(1rem,1.6vw,1.18rem)] sm:leading-[1.95] max-md:max-w-[34rem]"
          >
            {t("about.description")}
          </motion.p>
        </motion.div>

        {/* ── The Bow (visually stunning centerpiece) ── */}
        <motion.div
          className="relative z-[2] mx-auto -mt-4 mb-4 max-w-[26rem] sm:-mt-8 sm:mb-6 sm:max-w-none"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Glow backdrop */}
          <motion.div
            className="absolute left-1/2 top-[15%] z-0 h-[60%] w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(174,29,54,0.18),transparent_65%)] blur-[30px]"
            animate={
              enableHeavyEffects
                ? {
                    scale: [1, 1.06, 1.1, 1.06, 1],
                    opacity: [0.6, 0.72, 0.85, 0.72, 0.6],
                  }
                : undefined
            }
            transition={enableHeavyEffects ? { duration: 14, repeat: Infinity, ease: "easeInOut" } : undefined}
          />
          <motion.img loading="lazy" decoding="async"
            src={bowImage}
            alt="Luxury satin bow"
            className="relative z-[3] block h-auto w-full select-none pointer-events-none"
            animate={
              enableHeavyEffects
                ? {
                    filter: [
                      "drop-shadow(0 22px 44px rgba(0, 0, 0, 0.3)) brightness(0.98) saturate(1)",
                      "drop-shadow(0 30px 58px rgba(82, 8, 22, 0.3)) brightness(1.02) saturate(1.04)",
                      "drop-shadow(0 34px 64px rgba(110, 14, 32, 0.26)) brightness(1.04) saturate(1.06)",
                      "drop-shadow(0 30px 58px rgba(82, 8, 22, 0.3)) brightness(1.02) saturate(1.04)",
                      "drop-shadow(0 22px 44px rgba(0, 0, 0, 0.3)) brightness(0.98) saturate(1)",
                    ],
                  }
                : undefined
            }
            transition={enableHeavyEffects ? { duration: 14, repeat: Infinity, ease: "easeInOut" } : undefined}
          />
          {/* Shine sweep */}
          <div className="pointer-events-none absolute inset-[5%_15%_20%_15%] z-[4] rounded-[40%] bg-[linear-gradient(110deg,transparent_0%,transparent_40%,rgba(255,247,240,0.03)_46%,rgba(255,248,241,0.22)_50%,rgba(255,247,240,0.06)_55%,transparent_62%,transparent_100%)] opacity-60 mix-blend-screen blur-[3px]" />
        </motion.div>

        {/* ── Stats Section ── */}
  
        {/* ── Values / Why Choose Us ── */}
        <motion.div
          className="relative z-[3] mx-auto mt-12 max-w-5xl sm:mt-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div variants={itemVariants} className="mb-6 text-center sm:mb-8">
            <motion.h3 className="font-great-vibes text-[2rem] leading-[1.05] text-[#f8ece4] sm:text-[3rem]">
              {t("about.whyUs")}
            </motion.h3>
            <motion.div
              className="mx-auto mt-2 h-[1.5px] w-14 rounded-full bg-gradient-to-r from-transparent via-[#d9b56f]/40 to-transparent sm:mt-3 sm:w-16"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={val.key}
                  variants={itemVariants}
                  className="group relative overflow-hidden rounded-2xl border border-[#d9b56f]/10 bg-[#170608]/40 p-4 backdrop-blur-[6px] transition-all duration-500 hover:border-[#d9b56f]/25 hover:bg-[#1f090c]/50 hover:shadow-[0_8px_30px_rgba(217,181,111,0.06)] sm:p-8"
                >
                  {/* Hover glow */}
                  <motion.div
                    className="pointer-events-none absolute -inset-24 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, rgba(217,181,111,0.04), transparent 70%)",
                    }}
                  />

                  <div className="relative flex items-start gap-5">
                    <motion.div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d9b56f]/15 bg-[#2a0d10]/40 text-[#d9b56f] sm:h-12 sm:w-12"
                      whileHover={{ scale: 1.08, borderColor: "rgba(217,181,111,0.3)" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon className="text-lg sm:text-xl" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-cormorant text-[1rem] font-bold text-[#f0ded6] sm:text-[1.25rem]">
                        {t(`about.value${val.key.charAt(0).toUpperCase() + val.key.slice(1)}Title`)}
                      </h4>
                      <p className="mt-1.5 text-[0.85rem] leading-[1.65] text-[#b19787] sm:text-[0.9rem]">
                        {t(`about.value${val.key.charAt(0).toUpperCase() + val.key.slice(1)}Desc`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Custom keyframes for shine ── */}
      <style>{`
        @keyframes about-shine-sweep {
          0% { transform: translate3d(-40%, -1%, 18px) rotate(-10deg); opacity: 0; }
          20% { opacity: 0.15; }
          50% { transform: translate3d(18%, -2%, 28px) rotate(-6deg); opacity: 0.7; }
          75% { opacity: 0.1; }
          100% { transform: translate3d(48%, -1%, 18px) rotate(-2deg); opacity: 0; }
        }
        .about-shine-sweep {
          animation: about-shine-sweep 9s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

export default AboutSection;
