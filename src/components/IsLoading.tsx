import Lottie from "lottie-react";
import loopingFlower from "../assets/Looping Flower.json";

const particles = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 6 + Math.random() * 14,
  delay: Math.random() * 5,
  duration: 5 + Math.random() * 6,
}));


function IsLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#4b0f17_0%,#190809_45%,#0d0405_100%)] px-6">
      {/* ── Ambient glow orbs ── */}
      <div className="pointer-events-none absolute -left-28 top-10 h-80 w-80 rounded-full bg-[#bd2f45]/20 blur-4xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-[#ed9b66]/10 blur-4xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#d66d59]/8 blur-4xl" />

      {/* ── Floating petal particles ── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute animate-[float_6s_ease-in-out_infinite]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background:
              p.id % 3 === 0
                ? "radial-gradient(circle, rgba(189,47,69,0.5), transparent)"
                : p.id % 3 === 1
                  ? "radial-gradient(circle, rgba(237,155,102,0.35), transparent)"
                  : "radial-gradient(circle, rgba(255,200,210,0.3), transparent)",
            borderRadius: "50%",
            filter: "blur(1.5px)",
          }}
        />
      ))}

      {/* ── Lottie loading animation ── */}
      <div
        className="relative flex w-full max-w-sm animate-[fadeIn_0.7s_ease-out_both] flex-col items-center"
        style={{ animationDelay: "0.1s" }}
      >
        {/* ── Outer glow ring ── */}
        <div className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(189,47,69,0.12),transparent_70%)] blur-2xl" />

        <div className="relative">
          {/* ── Looping Flower Lottie ── */}
          <Lottie
            animationData={loopingFlower}
            loop
            autoplay
            className="relative h-56 w-56 sm:h-72 sm:w-72"
            rendererSettings={{
              preserveAspectRatio: "xMidYMid slice",
            }}
          />

          {/* ── Soft pulsing ring behind the flower ── */}
          <div className="pointer-events-none absolute inset-0 -z-10 -m-6 animate-[pulse-soft_3.5s_ease-in-out_infinite] rounded-full border border-[#bd2f45]/20" />

          {/* ── Decorative spinning dashed rings ── */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-[40%] animate-[spin_9s_linear_infinite] border border-dashed border-[#bd2f45]/20"
            style={{ margin: "-9%" }}
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-[40%] animate-[spin_14s_linear_infinite_reverse] border border-dashed border-[#ed9b66]/15"
            style={{ margin: "-15%" }}
          />
        </div>

        {/* ── Brand divider ── */}
        <div className="mt-6 flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#bd2f45]/40 to-[#ed9b66]/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8ea0] animate-pulse" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#bd2f45]/40 to-[#ed9b66]/25" />
        </div>

        {/* ── Loading text ── */}
        <div
          className="mt-5 animate-[fadeIn_0.6s_ease-out_both]"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="bg-gradient-to-r from-[#ed9b66] via-[#ffb088] to-[#ed9b66] bg-clip-text text-xs font-medium tracking-[0.2em] uppercase text-transparent animate-[shimmer-text_2.5s_linear_infinite]">
            Loading&hellip;
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div
          className="mx-auto mt-5 h-1.5 w-44 animate-[fadeIn_0.6s_ease-out_both]"
          style={{ animationDelay: "0.45s" }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-full bg-white/6">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#bd2f45] via-[#d66d59] to-[#ed9b66] animate-[loading-progress_2s_ease-in-out_infinite]"
              style={{ width: "40%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default IsLoading;
