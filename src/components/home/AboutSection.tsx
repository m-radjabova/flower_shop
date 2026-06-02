import { motion } from "framer-motion";
import AnimatedBow from "./AnimatedBow";
import { useTranslation } from "react-i18next";

function AboutSection() {
  const { t } = useTranslation();
  return (
    <section
      className="relative overflow-hiddenpx-6 pb-0 pt-24 max-[480px]:px-4 max-md:pt-20"
      id="about"
    >
      
      <div className="relative z-[1] mx-auto max-w-[88rem] pb-4 max-md:pb-2">
        <motion.div
          className="relative mx-auto max-w-[52rem] text-center"
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="m-0 text-[0.82rem] font-semibold uppercase tracking-[0.42em] text-[#c9a17b] max-[480px]:text-[0.72rem] max-[480px]:tracking-[0.34em]">
            {t("about.ourStory")}
          </p>
          <h2 className="mt-5 font-great-vibes text-[clamp(3.2rem,7vw,6.4rem)] leading-[0.95] font-normal text-[#f8ece4] [text-shadow:0_10px_30px_rgba(0,0,0,0.35),0_0_45px_rgba(125,13,36,0.14)]">
            {t("about.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-[42rem] text-[clamp(1rem,1.8vw,1.2rem)] leading-[1.95] text-[#dcc3bc] max-md:max-w-[32rem] max-md:leading-[1.8] max-[480px]:text-[0.98rem]">
            {t("about.description")}
          </p>
        </motion.div>

        <div className="relative z-[2] left-1/2 -mt-10 flex w-screen -translate-x-1/2 justify-center [perspective:1800px] [perspective-origin:center_top] max-md:-mt-6">
          <AnimatedBow />
        </div>
      </div>

      
      <style>{`
        @keyframes about-bow-shine {
          0% {
            transform: translate3d(-42%, -1%, 18px) rotate(-10deg);
            opacity: 0;
          }
          18% {
            opacity: 0.18;
          }
          48% {
            transform: translate3d(16%, -2%, 28px) rotate(-6deg);
            opacity: 0.78;
          }
          72% {
            opacity: 0.14;
          }
          100% {
            transform: translate3d(46%, -1%, 18px) rotate(-2deg);
            opacity: 0;
          }
        }

        .about-bow-shine {
          animation: about-bow-shine 8.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

export default AboutSection;
