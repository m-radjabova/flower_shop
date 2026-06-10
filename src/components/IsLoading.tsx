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





// const petals = [
//   { left: "12%", top: "18%", size: 16, delay: 0.2, duration: 7.2, rotate: -18 },
//   { left: "82%", top: "14%", size: 12, delay: 1.1, duration: 8.4, rotate: 22 },
//   { left: "18%", top: "74%", size: 14, delay: 0.8, duration: 7.8, rotate: 12 },
//   { left: "86%", top: "72%", size: 18, delay: 0.4, duration: 9.2, rotate: -10 },
//   { left: "50%", top: "8%", size: 10, delay: 1.5, duration: 8.7, rotate: 6 },
//   { left: "8%", top: "52%", size: 13, delay: 1.9, duration: 9.6, rotate: -26 },
//   { left: "92%", top: "48%", size: 15, delay: 0.9, duration: 8.9, rotate: 18 },
//   { left: "52%", top: "88%", size: 11, delay: 1.3, duration: 7.7, rotate: -8 },
// ];

// const orbitDots = Array.from({ length: 10 }, (_, index) => {
//   const angle = (index / 10) * Math.PI * 2;

//   return {
//     id: index,
//     x: Math.cos(angle) * 115,
//     y: Math.sin(angle) * 115,
//     delay: index * 0.12,
//   };
// });

// function IsLoading() {
//   return (
//     <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0405] px-6 text-white">
//       <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,145,164,0.18),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(237,155,102,0.14),transparent_26%),radial-gradient(circle_at_50%_85%,rgba(214,79,98,0.15),transparent_28%),linear-gradient(180deg,#16070a_0%,#0c0405_48%,#090203_100%)]" />
//       <div
//         className="pointer-events-none absolute inset-0 opacity-[0.012]"
//         style={{
//           backgroundImage:
//             "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
//           backgroundSize: "72px 72px",
//         }}
//       />

//       <div className="pointer-events-none absolute -left-24 top-8 h-80 w-80 rounded-full bg-[#bd2f45]/20 blur-3xl" />
//       <div className="pointer-events-none absolute -right-28 top-24 h-96 w-96 rounded-full bg-[#ed9b66]/10 blur-3xl" />
//       <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ff7f95]/8 blur-3xl" />

//       <div className="pointer-events-none absolute left-6 top-6 hidden h-24 w-24 rounded-tl-[1.8rem] border-l border-t border-[#ffb3bf]/20 sm:block" />
//       <div className="pointer-events-none absolute right-6 top-6 hidden h-24 w-24 rounded-tr-[1.8rem] border-r border-t border-[#ffb3bf]/20 sm:block" />
//       <div className="pointer-events-none absolute bottom-6 left-6 hidden h-24 w-24 rounded-bl-[1.8rem] border-b border-l border-[#ed9b66]/16 sm:block" />
//       <div className="pointer-events-none absolute bottom-6 right-6 hidden h-24 w-24 rounded-br-[1.8rem] border-b border-r border-[#ed9b66]/16 sm:block" />

//       {petals.map((petal) => (
//         <span
//           key={`${petal.left}-${petal.top}`}
//           className="pointer-events-none absolute rounded-full animate-[float_7s_ease-in-out_infinite]"
//           style={{
//             left: petal.left,
//             top: petal.top,
//             width: petal.size,
//             height: petal.size,
//             animationDelay: `${petal.delay}s`,
//             animationDuration: `${petal.duration}s`,
//             transform: `rotate(${petal.rotate}deg)`,
//             background:
//               "radial-gradient(circle, rgba(255,188,193,0.9) 0%, rgba(255,188,193,0.28) 45%, transparent 72%)",
//             filter: "blur(0.7px)",
//           }}
//         />
//       ))}

//       <div className="relative w-full max-w-[560px] animate-[fadeIn_0.8s_ease-out_both]">
//         <div className="pointer-events-none absolute -inset-10 rounded-[3rem] border border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,130,150,0.07),transparent_68%)] blur-sm" />

//         <div className="relative overflow-hidden rounded-[2.4rem] border border-[#7f2a35]/45 bg-[linear-gradient(160deg,rgba(31,10,13,0.94),rgba(12,4,5,0.98))] px-6 py-10 text-center shadow-[0_45px_140px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:px-10 sm:py-12">
//           <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff96a7]/55 to-transparent" />
//           <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ed9b66]/25 to-transparent" />
//           <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_28%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.02)_44%,transparent_70%)]" />

//           <div className="pointer-events-none absolute left-5 top-5 h-14 w-14 rounded-tl-[1.5rem] border-l border-t border-[#ff9aab]/25" />
//           <div className="pointer-events-none absolute right-5 top-5 h-14 w-14 rounded-tr-[1.5rem] border-r border-t border-[#ff9aab]/25" />
//           <div className="pointer-events-none absolute bottom-5 left-5 h-14 w-14 rounded-bl-[1.5rem] border-b border-l border-[#ed9b66]/18" />
//           <div className="pointer-events-none absolute bottom-5 right-5 h-14 w-14 rounded-br-[1.5rem] border-b border-r border-[#ed9b66]/18" />

//           <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
//             <span className="h-2 w-2 rounded-full bg-[#ff8ea0] shadow-[0_0_18px_rgba(255,142,160,0.65)]" />
//             <span className="font-cormorant text-sm uppercase tracking-[0.34em] text-[#f3d1c7]">
//               Muslima Boutique
//             </span>
//           </div>

//           <div className="relative mx-auto mt-9 flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
//             <div className="absolute inset-0 rounded-full border border-dashed border-[#ffb3bf]/22 animate-[spin_18s_linear_infinite]" />
//             <div className="absolute inset-3 rounded-full border border-dashed border-[#ed9b66]/20 animate-[spin_14s_linear_infinite_reverse]" />
//             <div className="absolute inset-7 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,158,175,0.26),rgba(132,27,43,0.32)_55%,rgba(18,5,7,0.92)_100%)] shadow-[inset_0_0_50px_rgba(255,150,171,0.12),0_0_60px_rgba(189,47,69,0.14)]" />

//             <div className="absolute inset-[22px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(255,167,179,0.18),rgba(255,101,126,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />

//             <div className="absolute left-1/2 top-0 h-4 w-[1px] -translate-x-1/2 bg-gradient-to-b from-[#ffb6c0] to-transparent" />
//             <div className="absolute left-1/2 bottom-0 h-4 w-[1px] -translate-x-1/2 bg-gradient-to-t from-[#ffb6c0] to-transparent" />
//             <div className="absolute left-0 top-1/2 h-[1px] w-4 -translate-y-1/2 bg-gradient-to-r from-[#ffb6c0] to-transparent" />
//             <div className="absolute right-0 top-1/2 h-[1px] w-4 -translate-y-1/2 bg-gradient-to-l from-[#ffb6c0] to-transparent" />

//             <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
//               <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_68%)] blur-sm" />
//               <div className="absolute left-1/2 top-0 h-10 w-3 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ffcfaa] via-[#ff8ea0] to-[#7a1a2a] opacity-95" />
//               <div className="absolute left-1/2 top-0 h-10 w-3 -translate-x-1/2 rotate-45 rounded-full bg-gradient-to-b from-[#ffcfaa] via-[#ff8ea0] to-[#7a1a2a] opacity-90" />
//               <div className="absolute left-1/2 top-0 h-10 w-3 -translate-x-1/2 -rotate-45 rounded-full bg-gradient-to-b from-[#ffcfaa] via-[#ff8ea0] to-[#7a1a2a] opacity-90" />
//               <div className="absolute inset-6 rounded-full border border-white/12 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.18),rgba(255,255,255,0.04)_48%,rgba(0,0,0,0.1)_100%)] shadow-[0_0_30px_rgba(255,142,160,0.22)]" />
//               <div className="absolute inset-[38%] rounded-full bg-[#f5dec9] shadow-[0_0_20px_rgba(245,222,201,0.6)]" />
//               <div className="absolute inset-[31%] rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.25),transparent_32%),linear-gradient(180deg,rgba(255,160,172,0.22),rgba(255,105,126,0.12))] shadow-[0_0_24px_rgba(255,142,160,0.16)]" />
//             </div>

//             {orbitDots.map((dot) => (
//               <span
//                 key={dot.id}
//                 className="absolute h-2.5 w-2.5 rounded-full bg-[#f4d2c0] shadow-[0_0_16px_rgba(244,210,192,0.9)]"
//                 style={{
//                   transform: `translate(${dot.x}px, ${dot.y}px)`,
//                   animationDelay: `${dot.delay}s`,
//                 }}
//               />
//             ))}
//           </div>

//           <div className="mx-auto mt-8 max-w-sm">
//             <p className="font-cormorant text-[clamp(2rem,5vw,3.2rem)] leading-none text-[#fff2ee]">
//               Opening the rose atelier
//             </p>
//             <p className="mt-3 text-sm leading-7 text-[#d9b1ad]">
//               Preparing the bouquet gallery, curated collections, and boutique details with a soft, cinematic touch.
//             </p>
//           </div>

//           <div className="mx-auto mt-8 flex w-full max-w-[18rem] items-center gap-3">
//             <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ff9cb0]/45 to-[#ff9cb0]/10" />
//             <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[#f0c7be]">
//               <span className="h-1.5 w-1.5 rounded-full bg-[#ff8ea0] animate-pulse" />
//               Curating
//             </div>
//             <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#ed9b66]/30 to-[#ed9b66]/8" />
//           </div>

//           <div className="mx-auto mt-5 h-1.5 w-full max-w-[18rem] overflow-hidden rounded-full bg-white/6">
//             <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-[#bd2f45] via-[#ff8ea0] to-[#ed9b66] shadow-[0_0_20px_rgba(255,142,160,0.35)] animate-[loading-progress_2s_ease-in-out_infinite]" />
//           </div>

//           <div className="mt-5 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#b99087]">
//             <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#b99087]/35" />
//             Crafted for a softer entrance
//             <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#b99087]/35" />
//           </div>

//           <div className="mt-7 flex items-center justify-center gap-2">
//             <span className="h-2 w-2 rounded-full bg-[#ff8ea0] animate-[pulse_1.4s_ease-in-out_infinite]" />
//             <span className="h-2 w-2 rounded-full bg-[#ed9b66] animate-[pulse_1.4s_ease-in-out_infinite] [animation-delay:180ms]" />
//             <span className="h-2 w-2 rounded-full bg-[#f5dec9] animate-[pulse_1.4s_ease-in-out_infinite] [animation-delay:360ms]" />
//           </div>

//           <div className="mx-auto mt-8 flex max-w-[22rem] items-center justify-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[#d2a19b]">
//             <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ff96a7]/30 to-transparent" />
//             Fresh blooms, refined moments
//             <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ed9b66]/20 to-transparent" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default IsLoading;