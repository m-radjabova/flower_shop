import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiArrowRight, HiOutlineBuildingStorefront, HiShoppingBag } from "react-icons/hi2";

function Hero() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden [perspective:1200px]">
      <div className="pointer-events-none absolute inset-0 " />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pb-20 lg:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="font-great-vibes inline-flex rounded-full border border-[#d9b56f]/35 bg-[#2a0d10]/70 px-5 py-2 text-xl tracking-[0.08em] text-[#e8c987] shadow-[0_0_35px_rgba(196,137,57,0.12)] backdrop-blur sm:text-2xl"
          >
            Fresh flowers, timeless emotions
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-great-vibes mt-7 text-[4.6rem] font-normal leading-[0.86] text-[#d8263f] drop-shadow-[0_16px_48px_rgba(0,0,0,0.45)] sm:text-[6.6rem] lg:text-[7.8rem]"
          >
            Flowers that <br /> speak from the heart
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, duration: 0.75 }}
            className="mt-12 flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link
              to="/#bouquets"
              className="group relative inline-flex h-15 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#ffc677]/25 bg-[linear-gradient(135deg,#8f111d,#c5243a_48%,#dc4156)] px-7 text-[0.82rem] font-extrabold uppercase tracking-[0.16em] text-[#fff8ef] shadow-[0_18px_42px_rgba(159,21,35,0.36)] transition hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="absolute inset-0 -translate-x-[120%] skew-x-[-12deg] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
              <HiShoppingBag />
              <span className="relative z-10">Shop Now</span>
              <HiArrowRight className="relative z-10 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/#bouquets"
              className="inline-flex h-15 items-center justify-center gap-3 rounded-2xl border border-[#dab56f]/35 bg-[#0c0304]/70 px-7 text-[0.82rem] font-extrabold uppercase tracking-[0.16em] text-[#ead6c7] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#efc77e]/70 hover:bg-[#270a0c]/80 hover:shadow-[0_18px_34px_rgba(217,181,111,0.1)] active:translate-y-0"
            >
              <HiOutlineBuildingStorefront />
              Explore Shops
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
