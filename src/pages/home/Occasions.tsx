import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineHeart,
  HiOutlineSparkles,
  HiOutlineGift,
  HiOutlineSun,
  HiOutlineStar,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { LuCakeSlice } from "react-icons/lu";
import { TbRings } from "react-icons/tb";
import { useCategories } from "../../hooks/useCatalog";
import occasionHeroImage from "../../assets/occasion_bg.png";

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

// ─── Category card styles ────────────────────────────────────────────────────
const CARD_STYLES: Array<{ icon: ComponentType<{ className?: string }>; gradient: string; accent: string }> = [
  { icon: LuCakeSlice,       gradient: "from-amber-900/40 to-orange-950/60",  accent: "#f59e0b" },
  { icon: TbRings,           gradient: "from-fuchsia-900/40 to-pink-950/60",  accent: "#d946ef" },
  { icon: HiOutlineHeart,    gradient: "from-rose-900/40 to-red-950/60",      accent: "#f43f5e" },
  { icon: HiOutlineSparkles, gradient: "from-sky-900/40 to-cyan-950/60",      accent: "#38bdf8" },
  { icon: HiOutlineSun,      gradient: "from-emerald-900/40 to-teal-950/60",  accent: "#34d399" },
  { icon: HiOutlineHeart,    gradient: "from-pink-900/40 to-rose-950/60",     accent: "#fb7185" },
  { icon: HiOutlineGift,     gradient: "from-[#5a1a1a]/60 to-[#2a0a0a]/80",  accent: "#ff9b88" },
];
const getCardStyle = (i: number) => CARD_STYLES[i % CARD_STYLES.length];

// ─── Static data ─────────────────────────────────────────────────────────────
const STATS = [
  { value: "25K+", labelKey: "occasionPage.statsDelivered", icon: HiOutlineSparkles },
  { value: "100%", labelKey: "occasionPage.statsFreshness", icon: HiOutlineShieldCheck },
  { value: "1hr", labelKey: "occasionPage.statsDelivery", icon: HiOutlineTruck },
];

const HOW_IT_WORKS = [
  { step: 1, titleKey: "occasionPage.howStep1Title", descriptionKey: "occasionPage.howStep1Description", icon: HiOutlineHeart },
  { step: 2, titleKey: "occasionPage.howStep2Title", descriptionKey: "occasionPage.howStep2Description", icon: HiOutlineGift },
  { step: 3, titleKey: "occasionPage.howStep3Title", descriptionKey: "occasionPage.howStep3Description", icon: HiOutlineTruck },
];

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

// ─── Main component ──────────────────────────────────────────────────────────
function Occasions() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const displayCategories = useMemo(
    () => [...categories]
      .filter((c) => c.is_active)
      .sort((a, b) => a.name.localeCompare(b.name, "uz", { sensitivity: "base" })),
    [categories],
  );

  const allStats = useMemo(
    () => [
      STATS[0],
      { value: String(displayCategories.length), labelKey: "occasionPage.statsOccasionTypes", icon: HiOutlineHeart },
      STATS[1],
      STATS[2],
    ],
    [displayCategories.length],
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden text-[#fff6f4]">

      {/* ── Backgrounds ── */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <img src={occasionHeroImage} alt="" aria-hidden="true" className="h-full w-full object-cover object-center opacity-80" />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-15 bg-gradient-to-b from-[#0a0203]/75 via-[#0a0203]/50 to-[#0a0203]/80" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#cb5c57]/10 blur-3xl animate-pulse-soft" />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#ff9b88]/6 blur-3xl" />
        <div className="absolute -right-20 top-56 h-80 w-80 rounded-full bg-[#d9b56f]/5 blur-3xl animate-pulse-soft" style={{ animationDelay: "2.5s" }} />
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
              {t("header.occasions")}
            </span>
          </Reveal>

          {/* Heading */}
          <Reveal delay={120}>
            <h1 className="mt-6 font-great-vibes text-[clamp(3.8rem,11vw,8rem)] leading-[0.88] text-[#fff7f0] [text-shadow:0_16px_45px_rgba(0,0,0,0.6)]">
              <span className="block">{t("occasionPage.heroTitleLine1")}</span>
              <span className="block bg-gradient-to-r from-[#ff7b8a] via-[#ff9b88] to-[#e8c987] bg-clip-text text-transparent">
                {t("occasionPage.heroTitleLine2")}
              </span>
            </h1>
          </Reveal>

          {/* Description */}
          <Reveal delay={240}>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#f0ddd8]/85 sm:text-lg">
              {t("occasionPage.heroDescription")}
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
                  {t("occasionPage.heroButton")}
                  <HiOutlineArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <a
                href="#occasion-categories"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/20 bg-[#0e0406]/55 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#ead6c7] backdrop-blur-sm transition-all duration-300 hover:border-[#d9b56f]/40 hover:text-white"
              >
                <HiOutlineSparkles size={14} className="text-[#d9b56f]" />
                {t("header.categories")}
              </a>
            </div>
          </Reveal>

          {/* Scroll cue */}
          <Reveal delay={480}>
            <a href="#stats" className="mt-14 flex flex-col items-center gap-1 text-[#d9b56f]/30 transition-colors hover:text-[#d9b56f]/50">
              <span className="text-[9px] uppercase tracking-[0.32em]">{t("occasionPage.scrollLabel")}</span>
              <div className="flex flex-col gap-0.5 animate-bounce">
                <span className="block h-1 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-3 self-center rounded-full bg-current opacity-60" />
              </div>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
           STATS BAR
      ══════════════════════════════════════ */}
      <Divider />

      <section id="stats" className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="grid gap-3 rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/70 p-4 backdrop-blur-sm sm:grid-cols-4">
              {allStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.labelKey}
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
                      <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-[#b9978f]">{t(stat.labelKey)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
           OCCASION CATEGORIES
      ══════════════════════════════════════ */}
      <Divider />

      <section id="occasion-categories" className="px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <Reveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/18 bg-[#180a0c]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e8c987]">
              {t("occasionPage.sectionBadge")}
            </span>
            <h2 className="mt-4 font-cormorant text-3xl font-semibold text-white sm:text-4xl">
              {t("occasionPage.sectionTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#c9a09a] sm:text-base">
              {t("occasionPage.sectionDescription")}
            </p>
          </Reveal>

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[22rem] animate-pulse rounded-2xl border border-[#3a1214]/40 bg-[#0d0405]/60" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {displayCategories.map((category, index) => {
                const { icon: Icon, gradient, accent } = getCardStyle(index);
                const title = category.name;
                const description = category.description?.trim() || t("occasionSection.dynamicDescription", { category: title });
                const isHovered = hoveredCard === category.id;

                return (
                  <Reveal key={category.id} delay={Math.min(index * 70, 350)}>
                    <Link
                      to={`/bouquets?category=${encodeURIComponent(category.slug)}`}
                      onMouseEnter={() => setHoveredCard(category.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="group relative block h-full overflow-hidden rounded-2xl border border-[#3a1214]/40 bg-[#0d0405] shadow-lg transition-all duration-400 hover:-translate-y-2 hover:border-[#cb5c57]/35 hover:shadow-2xl hover:shadow-black/40"
                    >
                      {/* Background image */}
                      <div className="absolute inset-0">
                        <img
                          src={category.image ?? occasionHeroImage}
                          alt={title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-108"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080204]/90 via-[#080204]/30 to-transparent" />
                      </div>

                      {/* Accent glow on hover */}
                      <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                        style={{ background: `radial-gradient(ellipse at 50% 100%, ${accent}18, transparent 70%)` }}
                      />

                      {/* Content */}
                      <div className="relative flex min-h-[22rem] flex-col justify-between p-5">
                        {/* Top */}
                        <div className="flex items-start justify-between">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-black/50"
                            style={{ boxShadow: isHovered ? `0 0 20px ${accent}30` : "none" }}
                          >
                            <Icon className="text-xl text-white" />
                          </div>
                          <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm">
                            {t("occasionPage.cardLabel")}
                          </span>
                        </div>

                        {/* Bottom */}
                        <div>
                          <h3 className="font-cormorant text-[2rem] font-semibold leading-tight text-white sm:text-[2.1rem]">
                            {title}
                          </h3>
                          {description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">
                              {description}
                            </p>
                          )}
                          <div
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-300 group-hover:gap-2.5"
                            style={{ color: accent }}
                          >
                            <span>{t("occasionPage.cardAction")}</span>
                            <HiOutlineArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
           HOW IT WORKS
      ══════════════════════════════════════ */}
      <Divider />

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9b56f]/18 bg-[#180a0c]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e8c987]">
              {t("occasionPage.howBadge")}
            </span>
            <h2 className="mt-4 font-cormorant text-3xl font-semibold text-white sm:text-4xl">
              {t("occasionPage.howTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#c9a09a]">
              {t("occasionPage.howDescription")}
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.step} delay={i * 100}>
                  <div className="group relative overflow-hidden rounded-2xl border border-[#3a1214]/50 bg-[#0d0405]/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#cb5c57]/35 hover:shadow-xl hover:shadow-[#cb5c57]/8">
                    {/* Subtle bg glow */}
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-[#cb5c57]/5 blur-2xl transition-all duration-500 group-hover:bg-[#cb5c57]/10 group-hover:blur-3xl" />

                    <div className="relative">
                      {/* Step number */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#5f2825]/40 bg-[#160708] text-lg font-bold text-[#ff9b88] transition-all duration-300 group-hover:border-[#cb5c57]/50 group-hover:scale-110">
                          {item.step}
                        </div>
                        {/* Connector — visible only on desktop between steps */}
                        {i < HOW_IT_WORKS.length - 1 && (
                          <div className="hidden h-px flex-1 mx-4 border-t border-dashed border-[#5f2825]/30 md:block" />
                        )}
                      </div>

                      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#cb5c57]/12 text-[#ff9b88]">
                        <Icon size={17} />
                      </div>

                      <h3 className="font-cormorant text-xl font-semibold text-white">{t(item.titleKey)}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#c9a09a]">{t(item.descriptionKey)}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
           CUSTOM BOUQUET CTA
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
                      {t("occasionPage.customBadge")}
                    </span>
                  </Reveal>

                  <Reveal delay={80} from="left">
                    <h2 className="mt-5 font-cormorant text-4xl font-semibold leading-tight text-white sm:text-5xl">
                      {t("occasionPage.customTitle")}{" "}
                      <span className="bg-gradient-to-r from-[#ff7b8a] via-[#ff9b88] to-[#e8c987] bg-clip-text text-transparent">
                        {t("occasionPage.customTitleAccent")}
                      </span>
                    </h2>
                  </Reveal>

                  <Reveal delay={160} from="left">
                    <p className="mt-4 text-sm leading-7 text-[#c9a09a] sm:text-base">
                      {t("occasionPage.customDescription")}
                    </p>
                  </Reveal>

                  <Reveal delay={240} from="left">
                    <div className="mt-6 space-y-3">
                      {[
                        { icon: HiOutlineHeart, text: t("occasionPage.customFeatureOne") },
                        { icon: HiOutlineSparkles, text: t("occasionPage.customFeatureTwo") },
                        { icon: HiOutlinePhone, text: t("occasionPage.customFeatureThree") },
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
                        to="/bouquets"
                        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#9f1525] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_32px_rgba(159,21,37,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b51b2c] hover:shadow-[0_18px_38px_rgba(159,21,37,0.38)]"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/12 to-white/0 transition-transform duration-500 group-hover:translate-x-full" />
                        <span className="relative z-10 flex items-center gap-2">
                          {t("occasionPage.customButton")}
                          <HiOutlineArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                      <Link
                        to="/about-us"
                        className="inline-flex items-center gap-2 rounded-full border border-[#5f2825]/50 bg-[#120607] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f0ddd8] transition-all duration-300 hover:border-[#cb5c57]/50 hover:text-white"
                      >
                        {t("header.aboutUs")}
                      </Link>
                    </div>
                  </Reveal>
                </div>

                {/* Right — image */}
                <Reveal from="right" className="relative">
                  <div className="group relative h-full min-h-[20rem] overflow-hidden">
                    <img
                      src={occasionHeroImage}
                      alt={t("occasionPage.customImageAlt")}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0d0405]/70 via-transparent to-transparent lg:from-[#0d0405]/80" />

                    {/* Info card */}
                    <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-[#0d0405]/70 px-5 py-4 backdrop-blur-md">
                      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#ffb0b9]">
                        <HiOutlineCheckCircle size={11} className="text-emerald-400" />
                        {t("occasionPage.customCardLabel")}
                      </p>
                      <p className="mt-1.5 max-w-[15rem] text-sm leading-6 text-[#f0d7d0]">
                        {t("occasionPage.customCardDescription")}
                      </p>
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

export default Occasions;
