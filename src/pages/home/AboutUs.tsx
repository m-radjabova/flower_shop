import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineArrowRight,
  HiOutlineHeart,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineTruck,
  HiOutlineUsers,
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlinePhone,
} from "react-icons/hi2";
import { useEffect, useMemo, useRef, useState } from "react";
import aboutHeroImage from "../../assets/about_us_hero.png";
import aboutStoryImage from "../../assets/about_us_img.png";
import aboutPageBackground from "../../assets/about_hero_bg.png";

// ─── Intersection observer hook ──────────────────────────────────────────────
const EMPTY_OPTIONS: IntersectionObserverInit = {};
function useInView(options: IntersectionObserverInit = EMPTY_OPTIONS): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.1, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return [ref, visible];
}

// ─── Animated reveal block ───────────────────────────────────────────────────
function Reveal({
  children,
  className = "",
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "none";
}) {
  const [ref, visible] = useInView();
  const initial = {
    bottom: "translate-y-10",
    left: "-translate-x-8",
    right: "translate-x-8",
    none: "",
  }[from];

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${initial}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Animated number counter ─────────────────────────────────────────────────
function Counter({ value }: { value: string }) {
  const [ref, inView] = useInView();
  const numeric = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/[\d]/g, "");
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || isNaN(numeric)) return;
    let n = 0;
    const step = Math.max(1, Math.ceil(numeric / 20));
    const id = setInterval(() => {
      n += step;
      if (n >= numeric) { setDisplay(numeric); clearInterval(id); }
      else setDisplay(n);
    }, 40);
    return () => clearInterval(id);
  }, [inView, numeric]);

  if (isNaN(numeric)) return <span ref={ref as React.Ref<HTMLDivElement>}>{value}</span>;
  return <span ref={ref as React.Ref<HTMLDivElement>}>{display}{suffix}</span>;
}

// ─── Floating particles ──────────────────────────────────────────────────────
function FloatingOrbs() {
  const orbs = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: `${12 + i * 15}%`,
      top: `${-8 + (i % 3) * 12}%`,
      size: 6 + (i % 3) * 4,
      duration: 14 + i * 3,
      delay: i * 2.5,
    })), []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {orbs.map(({ id, left, top, size, duration, delay }) => (
        <span
          key={id}
          className="absolute animate-floatOrb rounded-full opacity-20"
          style={{
            left, top,
            width: size, height: size,
            background: "radial-gradient(circle, #ff9b88, #cb5c57)",
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────
function Divider() {
  return (
    <div className="relative flex items-center justify-center py-3">
      <div className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-[#cb5c57]/20 to-transparent" />
      <span className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-[#cb5c57]/20 bg-[#120607]">
        <HiOutlineStar size={11} className="text-[#ff9b88]/50" />
      </span>
    </div>
  );
}

function AboutUs() {
  const { t } = useTranslation();

  const stats = [
    { value: "12", label: t("about.statHappy"), icon: HiOutlineUsers },
    { value: "300", label: t("aboutPage.partnerFlorists"), icon: HiOutlineSparkles },
    { value: "25", label: t("about.statBouquets"), icon: HiOutlineHeart },
    { value: "4.9", label: t("aboutPage.averageRating"), icon: HiOutlineStar },
  ];

  const values = [
    {
      icon: HiOutlineSparkles,
      title: t("about.valueCraftTitle"),
      description: t("about.valueCraftDesc"),
      gradient: "from-rose-900/40 to-red-950/60",
      accent: "#f43f5e",
    },
    {
      icon: HiOutlineHeart,
      title: t("about.valueHeartTitle"),
      description: t("about.valueHeartDesc"),
      gradient: "from-fuchsia-900/40 to-pink-950/60",
      accent: "#d946ef",
    },
    {
      icon: HiOutlineShieldCheck,
      title: t("about.valueQualityTitle"),
      description: t("about.valueQualityDesc"),
      gradient: "from-emerald-900/40 to-teal-950/60",
      accent: "#34d399",
    },
    {
      icon: HiOutlineTruck,
      title: t("about.valueSpeedTitle"),
      description: t("about.valueSpeedDesc"),
      gradient: "from-sky-900/40 to-cyan-950/60",
      accent: "#38bdf8",
    },
  ];

  const journey = [
    {
      title: t("aboutPage.journeyOneTitle"),
      description: t("aboutPage.journeyOneDesc"),
    },
    {
      title: t("aboutPage.journeyTwoTitle"),
      description: t("aboutPage.journeyTwoDesc"),
    },
    {
      title: t("aboutPage.journeyThreeTitle"),
      description: t("aboutPage.journeyThreeDesc"),
    },
  ];

  return (
    <main className="relative isolate min-h-screen overflow-hidden text-[#fff6f4]">

      {/* ── Backgrounds ── */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <img src={aboutPageBackground} alt="" aria-hidden="true" className="h-full w-full object-cover object-center opacity-80" />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-15 bg-gradient-to-b from-[#0a0203]/75 via-[#0a0203]/50 to-[#0a0203]/80" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#cb5c57]/10 blur-3xl animate-pulse-soft" />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#ff9b88]/6 blur-3xl" />
        <div className="absolute -right-20 top-56 h-80 w-80 rounded-full bg-[#d9b56f]/5 blur-3xl animate-pulse-soft" style={{ animationDelay: "2.5s" }} />
        <div className="absolute left-[20%] top-[60%] h-64 w-64 rounded-full bg-[#cb5c57]/5 blur-3xl animate-pulse-soft" style={{ animationDelay: "4s" }} />
      </div>
      <FloatingOrbs />

      {/* ══════════════════════════════════════
           HERO
      ══════════════════════════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-12 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">

          {/* Badge */}
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/30 bg-[#180a0c]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#f5d7a4] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f5d7a4] shadow-[0_0_6px_rgba(245,215,164,0.6)]" />
              {t("header.aboutUs")}
            </span>
          </Reveal>

          {/* Heading */}
          <Reveal delay={120}>
            <h1 className="mt-6 font-great-vibes text-[clamp(3.8rem,11vw,8rem)] leading-[0.88] text-[#fff7f0] [text-shadow:0_16px_45px_rgba(0,0,0,0.6)]">
              <span className="block">{t("aboutPage.heroTitleLine1")}</span>
              <span className="block bg-gradient-to-r from-[#ff7b8a] via-[#ff9b88] to-[#e8c987] bg-clip-text text-transparent">
                {t("aboutPage.heroTitleLine2")}
              </span>
            </h1>
          </Reveal>

          {/* Description */}
          <Reveal delay={240}>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#f0ddd8]/85 sm:text-lg">
              {t("aboutPage.heroDescription")}
            </p>
          </Reveal>

          {/* CTA buttons */}
          <Reveal delay={360}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/bouquets"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#9f1525] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_16px_38px_rgba(159,21,37,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b51b2c] hover:shadow-[0_20px_44px_rgba(159,21,37,0.42)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/12 to-white/0 transition-transform duration-500 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center gap-2">
                  {t("aboutPage.exploreBouquets")}
                  <HiOutlineArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                to="/occasions"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/20 bg-[#0e0406]/55 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#ead6c7] backdrop-blur-sm transition-all duration-300 hover:border-[#d9b56f]/40 hover:text-white"
              >
                <HiOutlineSparkles size={14} className="text-[#d9b56f]" />
                {t("aboutPage.exploreOccasions")}
              </Link>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={480}>
            <div className="mt-14 grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label}
                    className="group flex items-center gap-3.5 rounded-xl border border-[#3a1214]/40 bg-[#120607]/60 px-4 py-3 transition-all duration-300 hover:border-[#cb5c57]/30 hover:bg-[#160809]"
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#5f2825]/30 bg-[#1a0a0c]/60 text-[#ff9b88] transition-all duration-300 group-hover:scale-110 group-hover:border-[#cb5c57]/40">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-none text-[#ff9b88]">
                        <Counter value={stat.value} />
                      </p>
                      <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-[#b9978f]">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Scroll cue */}
          <Reveal delay={600}>
            <a href="#mission" className="mt-12 flex flex-col items-center gap-1 text-[#d9b56f]/30 transition-colors hover:text-[#d9b56f]/50">
              <span className="text-[9px] uppercase tracking-[0.32em]">{t("aboutPage.scrollLabel")}</span>
              <div className="flex flex-col gap-0.5 animate-bounce">
                <span className="block h-1 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-3 self-center rounded-full bg-current opacity-60" />
              </div>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
           MISSION & JOURNEY
      ══════════════════════════════════════ */}
      <Divider />

      <section id="mission" className="px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">

          {/* Section header */}
          <Reveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/18 bg-[#180a0c]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e8c987]">
              {t("aboutPage.missionBadge")}
            </span>
            <h2 className="mt-4 font-cormorant text-3xl font-semibold text-white sm:text-4xl">
              {t("aboutPage.missionTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#c9a09a] sm:text-base">
              {t("aboutPage.missionDescription")}
            </p>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            {/* Image */}
            <Reveal from="left">
              <div className="group relative overflow-hidden rounded-2xl border border-[#3a1214]/40 bg-[#0d0405] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-black/30">
                <div className="absolute inset-0 bg-gradient-to-t from-[#080204]/70 via-[#080204]/20 to-transparent z-10" />
                <img
                  src={aboutStoryImage}
                  alt={t("aboutPage.storyImageAlt")}
                  className="h-[22rem] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[26rem]"
                />
                {/* Caption badge */}
                <div className="absolute bottom-4 left-4 z-20 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f4d9d2] backdrop-blur-md">
                  <span className="flex items-center gap-2">
                    <HiOutlineSparkles size={12} className="text-[#e8c987]" />
                    {t("aboutPage.storyCaption")}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Journey cards */}
            <div className="grid gap-4">
              {journey.map((item, index) => (
                <Reveal key={item.title} delay={150 + index * 100} from="right">
                  <div className="group relative overflow-hidden rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/80 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cb5c57]/35 hover:shadow-xl hover:shadow-[#cb5c57]/8">
                    {/* Subtle bg glow */}
                    <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-[#cb5c57]/5 blur-2xl transition-all duration-500 group-hover:bg-[#cb5c57]/10 group-hover:blur-3xl" />
                    
                    <div className="relative flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#5f2825]/40 bg-[#160708] text-sm font-bold text-[#ff9b88] transition-all duration-300 group-hover:border-[#cb5c57]/50 group-hover:scale-110">
                        0{index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-cormorant text-xl font-semibold text-white transition-colors duration-300 group-hover:text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-[#c9a09a] transition-colors duration-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
           VALUES / PRINCIPLES
      ══════════════════════════════════════ */}
      <Divider />

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/18 bg-[#180a0c]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e8c987]">
              {t("aboutPage.valuesBadge")}
            </span>
            <h2 className="mt-4 font-cormorant text-3xl font-semibold text-white sm:text-4xl">
              {t("aboutPage.valuesIntro")}
            </h2>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {values.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={i * 100}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/80 p-6 backdrop-blur-sm transition-all duration-400 hover:-translate-y-1.5 hover:border-[#cb5c57]/35 hover:shadow-2xl hover:shadow-black/30">
                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: `radial-gradient(ellipse at 50% 100%, ${item.accent}18, transparent 70%)` }}
                    />

                    <div className="relative z-10">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5f2825]/30 bg-[#1a0a0c]/60 text-[#ff9b88] transition-all duration-300 group-hover:scale-110 group-hover:border-[#cb5c57]/40">
                        <Icon size={20} className="transition-transform duration-300 group-hover:rotate-3" />
                      </div>
                      <h3 className="mt-4 font-cormorant text-2xl font-semibold text-white transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#c9a09a] transition-colors duration-300 group-hover:text-[#dcc0b8]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
           STORY / CONTACT (dual)
      ══════════════════════════════════════ */}
      <Divider />

      <section className="px-4 pb-20 pt-10 sm:px-6 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/80 backdrop-blur-sm">
              <div className="grid gap-0 lg:grid-cols-2">

                {/* Left — text */}
                <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
                  <Reveal from="left">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/18 bg-[#180a0c] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e8c987]">
                      {t("aboutPage.storyBadge")}
                    </span>
                  </Reveal>

                  <Reveal delay={80} from="left">
                    <h2 className="mt-5 font-cormorant text-4xl font-semibold leading-tight text-white sm:text-5xl">
                      {t("aboutPage.storyTitle")}{" "}
                      <span className="bg-gradient-to-r from-[#ff7b8a] via-[#ff9b88] to-[#e8c987] bg-clip-text text-transparent">
                        {t("aboutPage.storyTitleAccent")}
                      </span>
                    </h2>
                  </Reveal>

                  <Reveal delay={160} from="left">
                    <p className="mt-4 text-sm leading-7 text-[#c9a09a] sm:text-base">
                      {t("aboutPage.storyDescription")}
                    </p>
                  </Reveal>

                  <Reveal delay={240} from="left">
                    <div className="mt-6 space-y-3">
                      {[
                        { icon: HiOutlineHeart, text: t("aboutPage.storyFeatureOne") },
                        { icon: HiOutlineSparkles, text: t("aboutPage.storyFeatureTwo") },
                        { icon: HiOutlinePhone, text: t("aboutPage.storyFeatureThree") },
                      ].map((f) => {
                        const FIcon = f.icon;
                        return (
                          <div key={f.text} className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#cb5c57]/12 text-[#ff9b88]">
                              <FIcon size={13} />
                            </div>
                            <p className="text-sm leading-6 text-[#d4b8b0]">{f.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </Reveal>

                  <Reveal delay={320} from="left">
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        to="/shops"
                        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#9f1525] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_32px_rgba(159,21,37,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b51b2c] hover:shadow-[0_18px_38px_rgba(159,21,37,0.38)]"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/12 to-white/0 transition-transform duration-500 group-hover:translate-x-full" />
                        <span className="relative z-10 flex items-center gap-2">
                          {t("header.shops")}
                          <HiOutlineArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                      <Link
                        to="/occasions"
                        className="inline-flex items-center gap-2 rounded-full border border-[#5f2825]/50 bg-[#120607] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f0ddd8] transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white"
                      >
                        {t("header.occasions")}
                      </Link>
                    </div>
                  </Reveal>
                </div>

                {/* Right — image + cards */}
                <Reveal from="right" className="relative">
                  <div className="relative h-full">
                    {/* Main image */}
                    <div className="group relative h-[16rem] overflow-hidden sm:h-[18rem]">
                      <img
                        src={aboutHeroImage}
                        alt={t("aboutPage.heroImageAlt")}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0405]/70 via-transparent to-transparent lg:from-[#0d0405]/80" />
                      
                      {/* Info card */}
                      <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-[#0d0405]/70 px-4 py-3 backdrop-blur-md">
                        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#ffb0b9]">
                          <HiOutlineCheckCircle size={11} className="text-emerald-400" />
                          {t("aboutPage.heroCardLabel")}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#f0d7d0]">
                          {t("aboutPage.heroCardDescription")}
                        </p>
                      </div>
                    </div>

                    {/* Bottom card grid */}
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                      {/* Contact card */}
                      <div className="group rounded-2xl border border-[#3a1214]/40 bg-[#0d0405]/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/30 hover:bg-[#120607]">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff9b88]">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d9b56f]/10 bg-[#2a0d10]/40 text-[10px]">
                            <HiOutlineStar size={10} />
                          </span>
                          {t("aboutPage.contactCardTitle")}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-[#c9a09a] transition-colors duration-300 group-hover:text-[#dcc0b8]">
                          {t("aboutPage.contactCardDescription")}
                        </p>
                      </div>

                      {/* Community card */}
                      <div className="group rounded-2xl border border-[#3a1214]/40 bg-[#0d0405]/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/30 hover:bg-[#120607]">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#5f2825]/30 bg-[#1a0a0c]/60 text-[#ff9b88] transition-all duration-300 group-hover:scale-110 group-hover:border-[#cb5c57]/40">
                            <HiOutlineUsers size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff9b88]">
                              {t("aboutPage.communityCardTitle")}
                            </p>
                            <p className="mt-0.5 text-xs leading-6 text-[#c9a09a] transition-colors duration-300 group-hover:text-[#dcc0b8]">
                              {t("aboutPage.communityCardDescription")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Closing card (full width) */}
                      <div className="sm:col-span-2 rounded-2xl border border-[#3a1214]/40 bg-gradient-to-br from-[#0d0405]/60 to-[#120607]/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[#cb5c57]/30">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff9b88]">
                          <HiOutlineSparkles size={12} className="text-[#e8c987]" />
                          {t("aboutPage.closingBadge")}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-[#c9a09a] transition-colors duration-300">
                          {t("aboutPage.closingText")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>

              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        @keyframes floatOrb {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.2; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(110vh) scale(0.7); opacity: 0; }
        }
        .animate-floatOrb { animation: floatOrb linear infinite; }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        .animate-pulse-soft { animation: pulse-soft 6s ease-in-out infinite; }

        .duration-400 { transition-duration: 400ms; }
        .duration-600 { transition-duration: 600ms; }
        .group-hover\\:scale-108:hover { transform: scale(1.08); }
      `}</style>
    </main>
  );
}

export default AboutUs;
