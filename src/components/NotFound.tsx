import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-16 left-10 h-72 w-72 rounded-full bg-[#b6283e]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-8 h-80 w-80 rounded-full bg-[#f2a66f]/10 blur-3xl" />

      <div className="relative w-full max-w-2xl rounded-[2.2rem] border border-[#7d3841]/55 bg-[linear-gradient(160deg,rgba(27,10,14,0.9),rgba(12,5,8,0.9))] p-8 text-center shadow-[0_30px_95px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-12">
        <p className="text-xs uppercase tracking-[0.48em] text-[#f3baa8]">Muslima Boutique</p>
        <p className="mt-5 font-cormorant text-[5rem] leading-none text-white sm:text-[6.8rem]">404</p>
        <h1 className="mt-3 font-cormorant text-4xl text-[#ffe4de] sm:text-5xl">Sahifa topilmadi</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#ddb8b2] sm:text-lg">
          Bu manzil o'zgargan yoki o'chirilgan bo'lishi mumkin. Kerakli bo'limga qaytib, kolleksiyalarni davom ettiring.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-xl border border-[#cd4f63] bg-gradient-to-r from-[#8f1020] to-[#ca2940] px-8 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:brightness-110"
          >
            Bosh sahifaga qaytish
          </Link>
          <Link
            to="/bouquets"
            className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-xl border border-[#7d595d] bg-[#17090c] px-8 text-sm font-semibold uppercase tracking-[0.08em] text-[#f2cbc3] transition hover:border-[#aa747b] hover:bg-[#1e0b0f]"
          >
            Bouquets ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
