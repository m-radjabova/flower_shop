import { Skeleton } from "./Skeleton";

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

      {/* ── Main loading card ── */}
      <div
        className="relative w-full max-w-sm animate-[fadeIn_0.7s_ease-out_both]"
        style={{ animationDelay: "0.1s" }}
      >
        {/* ── Outer glow ring ── */}
        <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] border border-[#7f2a35]/20 bg-[radial-gradient(ellipse_at_center,rgba(189,47,69,0.06),transparent_70%)] blur-sm" />

        <div className="relative rounded-[2rem] border border-[#7f2a35]/50 bg-[linear-gradient(160deg,rgba(40,14,18,0.92),rgba(15,6,8,0.96))] p-8 text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* ── Decorative corner accents ── */}
          <div className="pointer-events-none absolute left-4 top-4 h-10 w-10 border-l-2 border-t-2 border-[#bd2f45]/30 rounded-tl-lg" />
          <div className="pointer-events-none absolute right-4 top-4 h-10 w-10 border-r-2 border-t-2 border-[#bd2f45]/30 rounded-tr-lg" />
          <div className="pointer-events-none absolute bottom-4 left-4 h-10 w-10 border-b-2 border-l-2 border-[#bd2f45]/30 rounded-bl-lg" />
          <div className="pointer-events-none absolute bottom-4 right-4 h-10 w-10 border-b-2 border-r-2 border-[#bd2f45]/30 rounded-br-lg" />

          {/* ── Logo / icon ── */}
          <div className="relative mx-auto mb-2">
            <div
              className="mx-auto h-22 w-22 animate-[fadeIn_0.6s_ease-out_both]"
              style={{ animationDelay: "0.3s" }}
            >
              <Skeleton className="h-full w-full rounded-full border-2 border-[#b14655]/40 shadow-[0_0_30px_rgba(189,47,69,0.15)]" />
            </div>
            {/* ── Spinning ring around icon ── */}
            <div
              className="pointer-events-none absolute -inset-3 animate-[spin_3s_linear_infinite] opacity-60"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="h-full w-full rounded-full border border-dashed border-[#bd2f45]/40" />
            </div>
            <div
              className="pointer-events-none absolute -inset-5 animate-[spin_4s_linear_infinite_reverse] opacity-30"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="h-full w-full rounded-full border border-dashed border-[#ed9b66]/25" />
            </div>
          </div>

          {/* ── Brand name shimmer ── */}
          <div
            className="mx-auto mt-5 h-3 w-28 animate-[fadeIn_0.6s_ease-out_both]"
            style={{ animationDelay: "0.5s" }}
          >
            <Skeleton className="h-full w-full rounded-full" />
          </div>

          {/* ── Title skeleton ── */}
          <div
            className="mx-auto mt-5 h-6 w-56 animate-[fadeIn_0.6s_ease-out_both]"
            style={{ animationDelay: "0.7s" }}
          >
            <Skeleton className="h-full w-full rounded-full" />
          </div>

          {/* ── Subtitle lines ── */}
          <div
            className="mx-auto mt-3 space-y-2.5 animate-[fadeIn_0.6s_ease-out_both]"
            style={{ animationDelay: "0.9s" }}
          >
            <Skeleton className="mx-auto h-4 w-48 rounded-full" />
            <Skeleton className="mx-auto h-4 w-36 rounded-full" />
          </div>

          {/* ── Progress bar ── */}
          <div
            className="mx-auto mt-8 h-1.5 w-44 animate-[fadeIn_0.6s_ease-out_both]"
            style={{ animationDelay: "1.1s" }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-full bg-white/6">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#bd2f45] via-[#d66d59] to-[#ed9b66] animate-[loading-progress_2s_ease-in-out_infinite]"
                style={{ width: "40%" }}
              />
            </div>
          </div>

          {/* ── Loading text ── */}
          <div
            className="mt-5 animate-[fadeIn_0.6s_ease-out_both]"
            style={{ animationDelay: "1.3s" }}
          >
            <p className="bg-gradient-to-r from-[#ed9b66] via-[#ffb088] to-[#ed9b66] bg-clip-text text-xs font-medium tracking-[0.2em] uppercase text-transparent animate-[shimmer-text_2.5s_linear_infinite]">
              Loading&hellip;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IsLoading;