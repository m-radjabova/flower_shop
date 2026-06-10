import { motion } from "framer-motion";
import bowImage from "../../assets/bow.png";

function AnimatedBow() {
  return (
    <motion.div
      className="relative w-[100vw] max-w-none -translate-y-[12%] [transform-style:preserve-3d] will-change-transform max-md:-translate-y-[8%]"
      animate={{
        y: [0, -8, -14, -8, 0],
        scale: [1, 1.012, 1.024, 1.012, 1],
      }}
      transition={{
        duration: 16,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
    >
      <motion.div
        className="absolute left-1/2 top-[18%] z-0 h-[72%] w-[78%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(174,29,54,0.22),transparent_68%)] blur-[34px] [transform:translateZ(-60px)]"
        animate={{
          scale: [1, 1.05, 1.08, 1.05, 1],
          opacity: [0.75, 0.88, 1, 0.88, 0.75],
        }}
        transition={{
          duration: 16,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1 left-1/2 z-[1] h-[16%] w-[68%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.48),transparent_72%)] blur-[22px] [transform:translateZ(-80px)]"
        animate={{
          scaleX: [1, 1.03, 1.06, 1.03, 1],
          opacity: [0.42, 0.36, 0.3, 0.36, 0.42],
        }}
        transition={{
          duration: 16,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.img loading="lazy" decoding="async"
        src={bowImage}
        alt="Luxury satin bow"
        className="relative z-[3] block h-auto w-full select-none pointer-events-none"
        animate={{
          filter: [
            "drop-shadow(0 26px 52px rgba(0, 0, 0, 0.34)) brightness(0.98) saturate(1)",
            "drop-shadow(0 34px 68px rgba(82, 8, 22, 0.34)) brightness(1.03) saturate(1.04)",
            "drop-shadow(0 38px 74px rgba(110, 14, 32, 0.3)) brightness(1.05) saturate(1.06)",
            "drop-shadow(0 34px 68px rgba(82, 8, 22, 0.34)) brightness(1.03) saturate(1.04)",
            "drop-shadow(0 26px 52px rgba(0, 0, 0, 0.34)) brightness(0.98) saturate(1)",
          ],
        }}
        transition={{
          duration: 16,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <div className="about-bow-shine pointer-events-none absolute inset-[5%_14%_18%] z-[4] rounded-[45%] bg-[linear-gradient(105deg,transparent_0%,transparent_38%,rgba(255,247,240,0.04)_45%,rgba(255,248,241,0.28)_50%,rgba(255,247,240,0.08)_56%,transparent_64%,transparent_100%)] opacity-65 mix-blend-screen blur-[3px] max-[480px]:inset-[8%_11%_20%]" />
    </motion.div>
  );
}

export default AnimatedBow;
