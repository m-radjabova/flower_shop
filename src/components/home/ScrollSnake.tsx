import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useMemo } from "react";
import useIsMobile from "../../hooks/useIsMobile";

const PATH_LENGTH = 1;

// Elegant wave-like path with smoother curves
const SNAKE_PATH = "M32 6 C4 52 50 98 22 150 C-6 202 46 258 20 314 C-6 370 48 430 22 488 C-4 546 46 600 24 654 C8 696 30 704 28 714";

// Section milestones – positions along scroll
const MILESTONES = [0.08, 0.22, 0.38, 0.55, 0.72, 0.88];

function ScrollSnake() {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Ultra-smooth spring for buttery progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 55,
    damping: 32,
    mass: 0.3,
    restDelta: 0.0005,
  });

  // Core path animation
  const pathLength = useTransform(smoothProgress, [0, 1], [0.04, PATH_LENGTH]);
  const pathOffset = useTransform(smoothProgress, [0, 1], [0.96, 0]);

  // Head position along the path
  const headY = useTransform(smoothProgress, [0, 1], ["4%", "94%"]);
  const headX = useTransform(
    smoothProgress,
    [0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1],
    isMobile
      ? [26, 8, 30, 10, 28, 12, 29, 22]
      : [32, 7, 38, 9, 36, 8, 34, 26]
  );

  // Head dynamic effects
  const headScale = useTransform(smoothProgress, [0, 0.3, 0.6, 0.85, 1], [0.75, 1.18, 1.06, 1.12, 0.85]);
  const headRotate = useTransform(smoothProgress, [0, 0.3, 0.6, 1], [0, 12, -8, 4]);
  const headBlur = useTransform(smoothProgress, [0, 0.4, 0.7, 1], [2.5, 0, 0, 1.8]);

  // Head shadow – shifts from rose to gold to peach
  const headBoxShadow = useTransform(
    smoothProgress,
    [0, 0.3, 0.55, 0.8, 1],
    [
      "0 0 14px rgba(255,111,134,0.25)",
      "0 0 40px rgba(232,201,135,0.75)",
      "0 0 55px rgba(255,180,130,0.8)",
      "0 0 45px rgba(232,201,135,0.7)",
      "0 0 20px rgba(255,155,136,0.35)",
    ]
  );

  // Ambient glow intensity
  const ambientGlow = useTransform(
    smoothProgress,
    [0, 0.08, 0.3, 0.6, 0.85, 1],
    [0.1, 0.5, 1, 0.9, 1, 0.3]
  );

  // Trail intensity
  const trailIntensity = useTransform(smoothProgress, [0, 0.12, 0.88, 1], [0.05, 0.9, 0.85, 0.15]);

  // Dynamic stroke width
  const strokeWidthSpring = useSpring(
    useTransform(smoothProgress, [0, 0.2, 0.5, 0.8, 1], [2, 4.5, 5.5, 4.8, 3]),
    { stiffness: 100, damping: 20 }
  );

  // Path opacity – fades in/out
  const pathOpacity = useTransform(smoothProgress, [0, 0.04, 0.96, 1], [0, 1, 1, 0.2]);

  // Secondary golden glow opacity
  const goldenGlowOpacity = useTransform(smoothProgress, [0, 0.4, 0.8, 1], [0, 0.6, 0.4, 0]);

  // Head visibility – fades in/out
  const headOpacity = useTransform(smoothProgress, [0, 0.03, 0.97, 1], [0, 1, 1, 0]);

  // Head filter blur
  const headFilter = useTransform(headBlur, (v) => `blur(${v}px)`);

  // Pulse overlay opacity
  const pulseOpacity = useTransform(trailIntensity, (v) => v * 0.5);

  // Secondary edge glow opacity
  const edgeGlowOpacity = useTransform(trailIntensity, (v) => v * 0.3);

  // Petal data: elegant floating particles
  const petals = useMemo(
    () => [
      { top: "6%", left: "52%", delay: 0, duration: 4.2, size: 7, glow: true, driftX: 8, driftY: -4 },
      { top: "16%", left: "68%", delay: 0.5, duration: 5.0, size: 5, glow: false, driftX: -6, driftY: 3 },
      { top: "28%", left: "12%", delay: 1.0, duration: 4.6, size: 6, glow: true, driftX: 5, driftY: -5 },
      { top: "38%", left: "78%", delay: 1.8, duration: 3.8, size: 4, glow: false, driftX: -4, driftY: 6 },
      { top: "48%", left: "16%", delay: 2.2, duration: 4.8, size: 8, glow: true, driftX: 7, driftY: -3 },
      { top: "58%", left: "72%", delay: 2.8, duration: 4.0, size: 5, glow: false, driftX: -7, driftY: 4 },
      { top: "68%", left: "10%", delay: 3.4, duration: 4.4, size: 6, glow: true, driftX: 6, driftY: -6 },
      { top: "78%", left: "65%", delay: 4.0, duration: 5.2, size: 4, glow: false, driftX: -5, driftY: 5 },
      { top: "88%", left: "20%", delay: 4.6, duration: 3.6, size: 5, glow: true, driftX: 4, driftY: -2 },
      { top: "95%", left: "55%", delay: 5.2, duration: 4.2, size: 6, glow: false, driftX: -6, driftY: 3 },
    ],
    []
  );

  // Sparkle positions that fade in/out
  const sparkles = useMemo(
    () =>
      MILESTONES.map((_, i) => ({
        top: `${6 + i * 12}%`,
        left: `${18 + (i % 3) * 20}%`,
        delay: i * 0.3,
        size: 3 + (i % 3),
      })),
    []
  );

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-2 top-1/2 z-50 hidden h-[78vh] w-20 -translate-y-1/2 sm:block lg:right-5 xl:right-7 2xl:right-10"
    >
      {/* Elegant background gradient line */}
      <div className="absolute inset-y-0 right-[22px] w-px bg-gradient-to-b from-transparent via-[#e8c987]/10 to-transparent" />

      {/* Outer ambient glow behind snake */}
      <motion.div
        className="absolute inset-y-0 right-2 w-20 rounded-full bg-gradient-to-r from-[#ffb4bf]/5 via-[#ff6f86]/8 to-transparent blur-3xl"
        style={{ opacity: ambientGlow }}
      />

      {/* Secondary golden glow */}
      <motion.div
        className="absolute inset-y-[10%] right-4 w-12 rounded-full bg-gradient-to-b from-transparent via-[#e8c987]/6 to-transparent blur-2xl"
        style={{ opacity: goldenGlowOpacity }}
      />

      {/* SVG Snake Path */}
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 56 720"
        preserveAspectRatio="none"
        style={{ willChange: "transform" }}
      >
        <defs>
          {/* Premium main gradient */}
          <linearGradient id="scroll-snake-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffb4bf" stopOpacity="0.04" />
            <stop offset="12%" stopColor="#ff7a90" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#ff6f86" stopOpacity="0.88" />
            <stop offset="48%" stopColor="#ffb47b" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#e8c987" stopOpacity="1" />
            <stop offset="80%" stopColor="#ff9b88" stopOpacity="0.85" />
            <stop offset="92%" stopColor="#ff7a90" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffb4bf" stopOpacity="0.06" />
          </linearGradient>

          {/* Pulsing energy wave */}
          <linearGradient id="pulse-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ff6f86" stopOpacity="0">
              <animate attributeName="offset" values="0;1;0" dur="3.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="40%" stopColor="#e8c987" stopOpacity="0.85">
              <animate attributeName="offset" values="-0.5;0.5;1.5" dur="3.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#ffb4bf" stopOpacity="0">
              <animate attributeName="offset" values="0;1;0" dur="3.5s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          {/* Core glow filter with multi-layered blur */}
          <filter id="scroll-snake-glow" x="-80%" y="-20%" width="260%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feGaussianBlur stdDeviation="18" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Petal glow */}
          <filter id="petal-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft blur for milestone dots */}
          <filter id="milestone-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle background path */}
        <path
          d={SNAKE_PATH}
          fill="none"
          stroke="rgba(245,215,164,0.05)"
          strokeLinecap="round"
          strokeWidth="4"
        />

        {/* Milestone markers along the path */}
        {MILESTONES.map((ms, i) => (
          <motion.circle
            key={`milestone-${i}`}
            cx={32}
            cy={(ms * 700) + 10}
            r={3}
            fill="none"
            stroke="rgba(232,201,135,0.25)"
            strokeWidth="1.5"
            filter="url(#milestone-glow)"
          >
            <animate
              attributeName="r"
              values="2;4;2"
              dur={`${2.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.15;0.6;0.15"
              dur={`${3 + i * 0.4}s`}
              repeatCount="indefinite"
            />
          </motion.circle>
        ))}

        {/* Main animated snake path – premium glow layer */}
        <motion.path
          d={SNAKE_PATH}
          fill="none"
          filter="url(#scroll-snake-glow)"
          pathLength={PATH_LENGTH}
          stroke="url(#scroll-snake-gradient)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidthSpring}
          style={{
            pathLength,
            pathOffset,
            opacity: pathOpacity,
          }}
        />

        {/* Pulse overlay */}
        <motion.path
          d={SNAKE_PATH}
          fill="none"
          stroke="url(#pulse-gradient)"
          strokeLinecap="round"
          strokeWidth="1.8"
          style={{
            pathLength,
            pathOffset,
            opacity: pulseOpacity,
          }}
        />

        {/* Secondary subtle path edge glow */}
        <motion.path
          d={SNAKE_PATH}
          fill="none"
          stroke="rgba(232,201,135,0.08)"
          strokeLinecap="round"
          strokeWidth="8"
          style={{
            pathLength,
            pathOffset,
            opacity: edgeGlowOpacity,
          }}
        />
      </svg>

      {/* ── Snake Head – ultra-premium ── */}
      <motion.div
        className="absolute -ml-3.5 flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          top: headY,
          left: headX,
          scale: headScale,
          rotate: headRotate,
          opacity: headOpacity,
          filter: headFilter,
          boxShadow: headBoxShadow,
          willChange: "transform",
        }}
      >
        {/* Multi-layer aura rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-[#ffd2a3]/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border border-[#ffb47b]/15"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.1, 0.35, 0.1],
          }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
        />

        {/* Inner core */}
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[#ffd2a3]/50 bg-gradient-to-br from-[#1f080b] via-[#2a0a0e] to-[#0d0305] shadow-2xl backdrop-blur-[2px]">
          {/* Central gem */}
          <motion.span
            className="relative z-10 h-4 w-4 rounded-full bg-gradient-to-br from-[#fff5e6] via-[#ffb088] to-[#d8263f] shadow-xl"
            animate={{
              scale: [1, 1.18, 1],
              boxShadow: [
                "0 0 14px rgba(255,155,136,0.5)",
                "0 0 32px rgba(232,201,135,1)",
                "0 0 14px rgba(255,155,136,0.5)",
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner ring */}
          <motion.div
            className="absolute inset-1 rounded-full border border-[#ffd2a3]/25"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />

          {/* Tiny sparkle dot */}
          <motion.div
            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#fff5e6]"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
          />
        </div>

        {/* Energy beam above head */}
        <motion.div
          className="absolute -top-6 left-1/2 h-4 w-px -translate-x-1/2 bg-gradient-to-t from-[#e8c987] to-transparent"
          animate={{
            opacity: [0, 0.6, 0],
            height: [4, 12, 4],
          }}
          transition={{
            duration: 2.0,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* ── Floating Petals – enhanced with drift ── */}
      {petals.map((petal) => (
        <motion.span
          key={`${petal.top}-${petal.left}`}
          className="absolute rounded-full bg-gradient-to-br from-[#ffe0b5] via-[#ffb47b] to-[#ff8a6f] shadow-xl"
          style={{
            top: petal.top,
            left: petal.left,
            width: petal.size,
            height: petal.size,
            filter: petal.glow ? "url(#petal-glow)" : "none",
            willChange: "transform",
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.85, 0.3],
            x: [0, petal.driftX, 0],
            y: [0, petal.driftY, 0],
            boxShadow: petal.glow
              ? [
                  "0 0 6px rgba(255,180,130,0.3)",
                  "0 0 22px rgba(232,201,135,0.8)",
                  "0 0 6px rgba(255,180,130,0.3)",
                ]
              : [
                  "0 0 2px rgba(255,180,130,0.2)",
                  "0 0 10px rgba(232,201,135,0.5)",
                  "0 0 2px rgba(255,180,130,0.2)",
                ],
          }}
          transition={{
            duration: petal.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: petal.delay,
            x: {
              duration: petal.duration * 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: petal.delay,
            },
            y: {
              duration: petal.duration * 1.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: petal.delay,
            },
          }}
        />
      ))}

      {/* ── Sparkle dots – subtle accent particles ── */}
      {sparkles.map((sp, i) => (
        <motion.span
          key={`sparkle-${i}`}
          className="absolute rounded-full bg-[#e8c987]"
          style={{
            top: sp.top,
            left: sp.left,
            width: sp.size,
            height: sp.size,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: 3 + (i % 2),
            repeat: Infinity,
            ease: "easeInOut",
            delay: sp.delay,
          }}
        />
      ))}

      {/* ── Floating ember particles ── */}
      <motion.div
        className="absolute right-8 top-[20%] h-1.5 w-1.5 rounded-full bg-[#ffb47b]/30 blur-sm"
        animate={{
          y: [-20, 20, -20],
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute right-12 top-[60%] h-1 w-1 rounded-full bg-[#e8c987]/25 blur-sm"
        animate={{
          y: [15, -25, 15],
          opacity: [0, 0.4, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />
      <motion.div
        className="absolute right-6 top-[40%] h-1 w-1 rounded-full bg-[#ff8a6f]/25 blur-sm"
        animate={{
          y: [-10, 30, -10],
          opacity: [0, 0.45, 0],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.8,
        }}
      />
    </div>
  );
}

export default ScrollSnake;