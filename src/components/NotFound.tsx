import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* Background gradient orbs */}
      <div
        className="pointer-events-none absolute -top-20 left-10 h-80 w-80 animate-pulse rounded-full bg-[#b6283e]/20 blur-3xl"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="pointer-events-none absolute -bottom-28 right-8 h-80 w-80 animate-pulse rounded-full bg-[#f2a66f]/10 blur-3xl"
        style={{ animationDuration: "5s", animationDelay: "1s" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-1/4 h-60 w-60 animate-pulse rounded-full bg-[#cd4f63]/10 blur-3xl"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />

      {/* Floating botanical emojis */}
      <span className="pointer-events-none absolute left-[8%] top-[15%] animate-float-slow text-3xl opacity-20 sm:text-4xl">
        🌸
      </span>
      <span className="pointer-events-none absolute right-[12%] top-[25%] animate-float-slower delay-1000 text-2xl opacity-15 sm:text-3xl">
        🌿
      </span>
      <span className="pointer-events-none absolute left-[15%] bottom-[20%] animate-float-slower delay-2000 text-2xl opacity-15 sm:text-3xl">
        🌺
      </span>
      <span className="pointer-events-none absolute right-[8%] bottom-[15%] animate-float-slow delay-500 text-xl opacity-20 sm:text-2xl">
        ✦
      </span>
      <span className="pointer-events-none absolute left-[45%] top-[10%] animate-float-slower delay-1500 text-lg opacity-10 sm:text-xl">
        🌷
      </span>
      <span className="pointer-events-none absolute right-[35%] bottom-[10%] animate-float-slow delay-2500 text-xl opacity-15 sm:text-2xl">
        🍃
      </span>

      {/* Main card */}
      <div className="relative w-full max-w-2xl rounded-[2.5rem] border border-[#7d3841]/40 bg-[linear-gradient(160deg,rgba(27,10,14,0.92),rgba(12,5,8,0.92))] p-8 text-center shadow-[0_30px_95px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-12 md:p-14">
        {/* Decorative corner accents */}
        <span className="absolute -top-px -left-px h-16 w-16 rounded-tl-[2.5rem] border-l-2 border-t-2 border-[#cd4f63]/40" />
        <span className="absolute -top-px -right-px h-16 w-16 rounded-tr-[2.5rem] border-r-2 border-t-2 border-[#cd4f63]/40" />
        <span className="absolute -bottom-px -left-px h-16 w-16 rounded-bl-[2.5rem] border-l-2 border-b-2 border-[#cd4f63]/40" />
        <span className="absolute -bottom-px -right-px h-16 w-16 rounded-br-[2.5rem] border-r-2 border-b-2 border-[#cd4f63]/40" />

        {/* Brand */}
        <p className="text-xs uppercase tracking-[0.48em] text-[#f3baa8]">
          {t("notFound.brand")}
        </p>

        {/* Floral divider */}
        <div className="mx-auto mt-3 flex items-center justify-center gap-3 sm:mt-4">
          <span className="block h-px w-12 bg-gradient-to-r from-transparent to-[#cd4f63]/60" />
          <span className="text-lg text-[#cd4f63]/80">✿</span>
          <span className="block h-px w-12 bg-gradient-to-l from-transparent to-[#cd4f63]/60" />
        </div>

        {/* 404 with animated digits */}
        <div className="relative mt-6 sm:mt-8">
          {/* Glow behind 404 */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-56 rounded-full bg-[#cd4f63]/10 blur-3xl" />

          <p className="animate-fade-in font-cormorant text-[5.5rem] leading-none text-white sm:text-[7.5rem] md:text-[8.5rem]">
            <span className="inline-block animate-float-slow">4</span>
            <span className="inline-block animate-float-slower delay-500">0</span>
            <span className="inline-block animate-float-slow delay-1000">4</span>
          </p>

          {/* Decorative sparkle dots */}
          <span
            className="absolute -top-2 -right-2 h-2 w-2 animate-ping rounded-full bg-[#cd4f63]/60 sm:-right-4"
            style={{ animationDuration: "3s" }}
          />
          <span
            className="absolute -bottom-2 -left-2 h-1.5 w-1.5 animate-ping rounded-full bg-[#f3baa8]/40 sm:-left-4"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          />
        </div>

        {/* Title */}
        <h1 className="mt-4 animate-fade-in font-cormorant text-4xl text-[#ffe4de] sm:text-5xl">
          {t("notFound.title")}
        </h1>

        {/* Small diamond divider */}
        <div className="mx-auto mt-5 flex items-center justify-center gap-2 sm:mt-6">
          <span className="block h-px w-6 rounded-full bg-gradient-to-r from-transparent to-[#cd4f63]/40" />
          <span className="block h-1.5 w-1.5 rotate-45 bg-[#cd4f63]/60" />
          <span className="block h-px w-6 rounded-full bg-gradient-to-l from-transparent to-[#cd4f63]/40" />
        </div>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#ddb8b2] sm:text-lg">
          {t("notFound.description")}
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="group relative inline-flex h-12 min-w-[220px] items-center justify-center overflow-hidden rounded-xl border border-[#cd4f63] bg-gradient-to-r from-[#8f1020] to-[#ca2940] px-8 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:shadow-[0_0_25px_rgba(205,79,99,0.5)] hover:brightness-110"
          >
            <span className="relative z-10">{t("notFound.backHome")}</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-[#ca2940] to-[#e63a54] transition-transform duration-500 group-hover:translate-x-0" />
          </Link>
          <Link
            to="/bouquets"
            className="group relative inline-flex h-12 min-w-[220px] items-center justify-center overflow-hidden rounded-xl border border-[#7d595d] bg-[#17090c] px-8 text-sm font-semibold uppercase tracking-[0.08em] text-[#f2cbc3] transition-all duration-300 hover:border-[#cd4f63]/60 hover:shadow-[0_0_20px_rgba(205,79,99,0.2)] hover:text-white"
          >
            <span className="relative z-10">{t("notFound.viewBouquets")}</span>
            <span className="absolute inset-0 bg-[#cd4f63]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes float-slower {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-16px);
          }
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-float-slow {
          animation: float-slow 3s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 4s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.7s ease-out forwards;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-1500 {
          animation-delay: 1.5s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
        .delay-2500 {
          animation-delay: 2.5s;
        }
      `}</style>
    </div>
  );
}

export default NotFound;