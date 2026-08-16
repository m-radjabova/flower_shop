import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiArrowRight,
  HiOutlineBuildingStorefront,
  HiShoppingBag,
  HiSparkles,
} from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import flowerIcon from "../../assets/flower_icon.png";
import flowerIcon2 from "../../assets/flower_icon2.png";
import useIsMobile from "../../hooks/useIsMobile";

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 4 + Math.random() * 10,
  duration: 16 + Math.random() * 22,
  delay: Math.random() * 10,
  opacity: 0.12 + Math.random() * 0.22,
  rotate: Math.random() * 360,
}));

const FLOWER_ICONS = [flowerIcon, flowerIcon2];

function Hero() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [petals, setPetals] = useState<
    Array<{ id: number; x: number; delay: number; icon: string; size: number }>
  >([]);
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const enableHeavyEffects = !isMobile && !shouldReduceMotion;

  // ── Parallax scroll — spring for silk smooth feel ──
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
  });
  const textY = useTransform(smoothProgress, [0, 1], [0, 80]);
  const opacity = useTransform(smoothProgress, [0, 0.65], [1, 0]);

  // ── Falling petals — the section's one signature motion ──
  useEffect(() => {
    if (!enableHeavyEffects) {
      setPetals([]);
      return;
    }

    const interval = setInterval(() => {
      setPetals((prev) => {
        const nextPetal = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          delay: 0,
          icon: FLOWER_ICONS[Math.floor(Math.random() * FLOWER_ICONS.length)],
          size: 14 + Math.random() * 18,
        };

        return [...prev, nextPetal].slice(-8);
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [enableHeavyEffects]);

  // ── Container variants ──
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-screen overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Soft radial glow behind the heading, for depth — static, no cost */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] z-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(216,38,63,0.14), rgba(233,185,138,0.06), transparent)",
        }}
      />

      {/* ── Hero decorations ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-24 bottom-0 z-0 overflow-hidden sm:top-28 lg:top-32"
      >
        {/* ── Floating particles — ambient, unobtrusive ── */}
        {enableHeavyEffects
          ? PARTICLES.map((p) => (
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
                      ? "radial-gradient(circle, rgba(233,185,138,0.4), transparent)"
                      : p.id % 3 === 1
                        ? "radial-gradient(circle, rgba(216,38,63,0.3), transparent)"
                        : "radial-gradient(circle, rgba(255,200,220,0.22), transparent)",
                }}
                animate={{
                  y: [0, -26, 0],
                  x: [0, p.id % 2 === 0 ? 12 : -12, 0],
                  scale: [1, 1.12, 1],
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

        {/* ── Falling petals — the signature moment ── */}
        {enableHeavyEffects ? (
          <AnimatePresence>
            {petals.map((petal) => (
              <motion.div
                key={petal.id}
                className="pointer-events-none absolute z-20 select-none"
                style={{ left: `${petal.x}%`, top: -40 }}
                initial={{ y: -40, opacity: 0, rotate: 0 }}
                animate={{
                  y: window.innerHeight + 40,
                  opacity: [0, 0.6, 0.6, 0],
                  rotate: [0, 120, 240, 360],
                  x: [
                    0,
                    petal.id % 2 === 0 ? 40 : -40,
                    petal.id % 2 === 0 ? 80 : -80,
                    0,
                  ],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 9 + Math.random() * 5,
                  ease: "easeInOut",
                }}
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={petal.icon}
                  alt=""
                  className="block h-auto w-auto select-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
                  style={{ width: `${petal.size}px` }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : null}

        {/* ── Decorative corner lines ── */}
        <div className="pointer-events-none absolute left-8 top-8 z-10 h-16 w-[1px] bg-gradient-to-b from-[#e9b98a]/40 to-transparent sm:left-12 sm:top-12" />
        <div className="pointer-events-none absolute left-8 top-8 z-10 h-[1px] w-16 bg-gradient-to-r from-[#e9b98a]/40 to-transparent sm:left-12 sm:top-12" />
        <div className="pointer-events-none absolute right-8 top-8 z-10 h-16 w-[1px] bg-gradient-to-b from-[#e9b98a]/40 to-transparent sm:right-12 sm:top-12" />
        <div className="pointer-events-none absolute right-8 top-8 z-10 h-[1px] w-16 bg-gradient-to-l from-[#e9b98a]/40 to-transparent sm:right-12 sm:top-12" />
        <div className="pointer-events-none absolute bottom-8 left-8 z-10 h-16 w-[1px] bg-gradient-to-t from-[#e9b98a]/40 to-transparent sm:bottom-12 sm:left-12" />
        <div className="pointer-events-none absolute bottom-8 left-8 z-10 h-[1px] w-16 bg-gradient-to-r from-[#e9b98a]/40 to-transparent sm:bottom-12 sm:left-12" />
        <div className="pointer-events-none absolute bottom-8 right-8 z-10 h-16 w-[1px] bg-gradient-to-t from-[#e9b98a]/40 to-transparent sm:bottom-12 sm:right-12" />
        <div className="pointer-events-none absolute bottom-8 right-8 z-10 h-[1px] w-16 bg-gradient-to-l from-[#e9b98a]/40 to-transparent sm:bottom-12 sm:right-12" />
      </div>

      {/* ── Main content ── */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pb-20 lg:pt-36"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl text-center"
        >
          {/* ── Badge ── */}
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center justify-center"
          >
            <motion.div
              className="group relative inline-flex items-center gap-2.5 rounded-full border border-[#e9b98a]/30 bg-[#2a0d10]/60 px-5 py-2.5 backdrop-blur-md"
              whileHover={{ scale: 1.03, borderColor: "rgba(233,185,138,0.55)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Soft static glow — brightens only on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full opacity-20 blur-sm transition-opacity duration-500 group-hover:opacity-45"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(233,185,138,0.25), rgba(216,38,63,0.12))",
                }}
              />
              <HiSparkles className="relative text-[#e9b98a] text-lg" />
              <span className="font-great-vibes relative text-xl tracking-[0.06em] text-[#e9b98a] sm:text-2xl">
                {t("hero.freshFlowers")}
              </span>
              <HiSparkles className="relative text-[#e9b98a] text-lg" />
            </motion.div>
          </motion.div>

          {/* ── Heading ── */}
          <motion.div variants={itemVariants} className="relative">
            {/* Decorative swoosh — fades in once, then stays still */}
            <motion.svg
              className="pointer-events-none absolute -left-12 -top-8 h-32 w-40 opacity-0 sm:-left-16 sm:-top-12 sm:h-44 sm:w-56"
              viewBox="0 0 200 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 1.4, delay: 0.6 }}
              aria-hidden="true"
            >
              <path
                d="M10 140 C40 100, 60 40, 100 30 C140 20, 160 50, 190 20"
                stroke="url(#goldGrad)"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
              />
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e9b98a" stopOpacity="0" />
                  <stop offset="50%" stopColor="#e9b98a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#e9b98a" stopOpacity="0" />
                </linearGradient>
              </defs>
            </motion.svg>

            <motion.h1
              className="font-great-vibes relative mt-5 text-[4.4rem] font-normal leading-[0.88] text-[#d8263f] drop-shadow-[0_16px_48px_rgba(0,0,0,0.5)] sm:text-[6.4rem] lg:text-[7.6rem]"
              whileHover={enableHeavyEffects ? { scale: 1.008 } : undefined}
              transition={
                enableHeavyEffects
                  ? { type: "spring", stiffness: 200, damping: 15 }
                  : undefined
              }
            >
              {enableHeavyEffects ? (
                <>
                  <span
                    className="inline-block"
                    style={{ textShadow: "0 4px 30px rgba(216,38,63,0.15)" }}
                  >
                    {t("hero.title")
                      .split("")
                      .map((char, i) => (
                        <motion.span
                          key={i}
                          className="inline-block"
                          initial={{ opacity: 0, y: 60, rotateX: -30 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          transition={{
                            delay: 0.5 + i * 0.035,
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1] as const,
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                  </span>
                  <br />
                  <span
                    className="inline-block"
                    style={{ textShadow: "0 4px 30px rgba(216,38,63,0.15)" }}
                  >
                    {t("hero.title2")
                      .split("")
                      .map((char, i) => (
                        <motion.span
                          key={i}
                          className="inline-block"
                          initial={{ opacity: 0, y: 60, rotateX: -30 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          transition={{
                            delay: 0.5 + (t("hero.title").length + i) * 0.035,
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1] as const,
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                  </span>
                </>
              ) : (
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  style={{ textShadow: "0 4px 22px rgba(216,38,63,0.12)" }}
                >
                  {t("hero.title")}
                  <br />
                  {t("hero.title2")}
                </motion.span>
              )}
            </motion.h1>

            {/* Decorative swoosh – right, fades in once */}
            <motion.svg
              className="pointer-events-none absolute -bottom-6 -right-10 h-28 w-36 opacity-0 sm:-bottom-8 sm:-right-14 sm:h-40 sm:w-48"
              viewBox="0 0 200 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 1.4, delay: 0.9 }}
              aria-hidden="true"
            >
              <path
                d="M10 20 C40 60, 60 120, 100 130 C140 140, 160 110, 190 140"
                stroke="url(#goldGrad2)"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
              />
              <defs>
                <linearGradient id="goldGrad2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e9b98a" stopOpacity="0" />
                  <stop offset="50%" stopColor="#e9b98a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#e9b98a" stopOpacity="0" />
                </linearGradient>
              </defs>
            </motion.svg>
          </motion.div>

          {/* ── CTA Buttons ── */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-col justify-center gap-5 sm:flex-row"
          >
            {/* Primary CTA — carries the one ongoing microinteraction */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative"
            >
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0 blur-xl"
                animate={
                  enableHeavyEffects ? { opacity: [0, 0.22, 0] } : undefined
                }
                transition={
                  enableHeavyEffects
                    ? { duration: 3, repeat: Infinity }
                    : undefined
                }
                style={{
                  background:
                    "linear-gradient(135deg, rgba(233,185,138,0.15), rgba(216,38,63,0.1))",
                }}
              />
              <Link
                to="/bouquets"
                className="group relative inline-flex h-15 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#ffc677]/25 bg-[linear-gradient(135deg,#8f111d,#c5243a_48%,#ff7d8e)] px-8 text-[0.82rem] font-extrabold uppercase tracking-[0.16em] text-[#fff8ef] shadow-[0_18px_42px_rgba(159,21,35,0.36)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(159,21,35,0.5)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708]"
              >
                <span className="absolute inset-0 -translate-x-[120%] skew-x-[-12deg] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
                <HiShoppingBag className="relative z-10 text-base" />
                <span className="relative z-10">{t("hero.shopNow")}</span>
                <motion.span
                  className="relative z-10"
                  animate={enableHeavyEffects ? { x: [0, 3, 0] } : undefined}
                  transition={
                    enableHeavyEffects
                      ? { duration: 1.6, repeat: Infinity }
                      : undefined
                  }
                >
                  <HiArrowRight />
                </motion.span>
              </Link>
            </motion.div>

            {/* Secondary CTA — quiet by default, animates only on interaction */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/shops"
                className="group relative inline-flex h-15 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#e9b98a]/30 bg-[#0c0304]/60 px-8 text-[0.82rem] font-extrabold uppercase tracking-[0.16em] text-[#ead6c7] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#e9b98a]/60 hover:bg-[#270a0c]/70 hover:shadow-[0_18px_34px_rgba(233,185,138,0.14)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708]"
              >
                <span className="absolute inset-0 -translate-x-[120%] skew-x-[-12deg] bg-[linear-gradient(110deg,transparent,rgba(233,185,138,0.14),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
                <HiOutlineBuildingStorefront className="relative z-10 text-base" />
                <span className="relative z-10">{t("hero.exploreShops")}</span>
                <span className="relative z-10 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <HiArrowRight />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Scroll indicator ── */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
          >
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[#ead6c7]/30">
              Scroll
            </span>
            <motion.div
              className="h-8 w-[1px] bg-gradient-to-b from-[#e9b98a]/30 to-transparent"
              animate={
                enableHeavyEffects
                  ? { height: [8, 24, 8], opacity: [0.3, 0.6, 0.3] }
                  : undefined
              }
              transition={
                enableHeavyEffects
                  ? { duration: 2, repeat: Infinity }
                  : undefined
              }
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;