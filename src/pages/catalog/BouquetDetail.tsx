import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
import {
  HiArrowLeft,
  HiOutlineClock,
  HiOutlineGift,
  HiOutlineHeart,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiPhone,
  HiSparkles,
  HiStar,
} from "react-icons/hi2";
import NotFound from "../../components/NotFound";
import { DetailPageSkeleton } from "../../components/PageSkeletons";
import ReviewSection from "../../components/catalog/ReviewSection";
import { useBouquet } from "../../hooks/useCatalog";
import { formatPrice, getBouquetImages } from "../../utils/catalog";

function FloralFlourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 60" className={className} fill="none" aria-hidden="true">
      <path d="M8 30c26-22 52-22 78 0s52 22 78 0 32-22 48 0" stroke="url(#bouquet-flourish-gradient)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="58" cy="22" r="5" fill="#f0c89c" fillOpacity=".35" />
      <circle cx="162" cy="22" r="5" fill="#ff8b9f" fillOpacity=".35" />
      <defs>
        <linearGradient id="bouquet-flourish-gradient" x1="8" y1="30" x2="212" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0c89c" stopOpacity=".15" />
          <stop offset=".5" stopColor="#fff2ee" stopOpacity=".65" />
          <stop offset="1" stopColor="#ff8b9f" stopOpacity=".2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BouquetDetail() {
  const { bouquetId } = useParams();
  const { data: bouquet, isLoading, isError } = useBouquet(bouquetId);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !bouquet) {
    return <NotFound />;
  }

  const images = getBouquetImages(bouquet);
  const heroImage = activeImage ?? images[0] ?? bouquet.image;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070102] text-[#fff6f4]">
      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-10">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_16%_18%,rgba(205,77,74,0.32),transparent_28%),radial-gradient(circle_at_90%_8%,rgba(255,183,142,0.12),transparent_24%)]" />
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_82%_76%,rgba(255,121,155,0.10),transparent_18%),radial-gradient(circle_at_24%_68%,rgba(255,221,197,0.08),transparent_18%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            to="/#bouquets"
            className="inline-flex items-center gap-2 rounded-full border border-[#6d3430] bg-[#170809]/80 px-4 py-2 text-sm font-semibold text-[#f5d6cd] transition hover:border-[#bd756c] hover:text-white"
          >
            <HiArrowLeft />
            Back to bouquets
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-[#5d2825] bg-[#130708]/90 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
              <div className="relative overflow-hidden rounded-[1.55rem]">
                <img
                  src={heroImage}
                  alt={bouquet.name}
                  className="h-[430px] w-full object-cover sm:h-[560px]"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(255,218,188,0.18),transparent_20%),linear-gradient(180deg,rgba(10,2,4,0.02),rgba(10,2,4,0.24))]" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  {bouquet.category ? (
                    <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-semibold text-[#fff4ef] backdrop-blur">
                      {bouquet.category.name}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-semibold text-[#fff4ef] backdrop-blur">
                    <HiStar className="text-[#f2b15e]" />
                    {bouquet.rating} ({bouquet.reviews_count} reviews)
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`overflow-hidden rounded-[1.15rem] border transition ${
                      heroImage === image
                        ? "border-[#ff9c8e] opacity-100"
                        : "border-[#5e302d] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${bouquet.name} gallery ${index + 1}`}
                      className="h-24 w-full object-cover sm:h-28"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="rounded-[2rem] border border-[#63302d] bg-[linear-gradient(145deg,rgba(27,9,10,0.94),rgba(51,15,17,0.88))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#7a3d37] bg-[#19090a] px-4 py-2 text-sm text-[#f6d6cd]">
                    <HiOutlineGift className="text-[#ffb7a8]" />
                    Handcrafted arrangement
                  </span>
                </div>

                <h1 className="mt-6 font-cormorant text-5xl font-semibold leading-none text-white sm:text-7xl">
                  {bouquet.name}
                </h1>
                <FloralFlourish className="mt-4 h-10 w-full max-w-[22rem] opacity-90" />
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#dfc1ba]">
                  {bouquet.description ?? "A carefully prepared bouquet from a trusted local flower shop."}
                </p>

                <div className="mt-7 flex flex-wrap items-end gap-4">
                  <p className="text-4xl font-bold text-white">{formatPrice(bouquet.price)}</p>
                  {bouquet.old_price ? (
                    <p className="pb-1 text-xl font-semibold text-[#9f7d76] line-through">
                      {formatPrice(bouquet.old_price)}
                    </p>
                  ) : null}
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#5b2a28] bg-[#120708] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a9857d]">Size</p>
                    <p className="mt-2 font-semibold text-white">{bouquet.size ?? "Custom"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#5b2a28] bg-[#120708] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a9857d]">Stock</p>
                    <p className="mt-2 font-semibold text-white">{bouquet.stock} available</p>
                  </div>
                  <div className="rounded-2xl border border-[#5b2a28] bg-[#120708] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a9857d]">Status</p>
                    <p className="mt-2 font-semibold capitalize text-white">{bouquet.status.replace("_", " ")}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#5b2a28] bg-[linear-gradient(180deg,rgba(18,7,8,0.98),rgba(14,4,6,0.98))] p-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#271113] text-[#ffb7a8]">
                      <HiOutlineHeart className="text-lg" />
                    </div>
                    <p className="mt-3 text-sm uppercase tracking-[0.16em] text-[#a9857d]">Mood</p>
                    <p className="mt-1 text-base font-semibold text-white">Soft and elegant</p>
                  </div>
                  <div className="rounded-2xl border border-[#5b2a28] bg-[linear-gradient(180deg,rgba(18,7,8,0.98),rgba(14,4,6,0.98))] p-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#271113] text-[#ffb7a8]">
                      <HiSparkles className="text-lg" />
                    </div>
                    <p className="mt-3 text-sm uppercase tracking-[0.16em] text-[#a9857d]">Finish</p>
                    <p className="mt-1 text-base font-semibold text-white">Premium wrapped</p>
                  </div>
                  <div className="rounded-2xl border border-[#5b2a28] bg-[linear-gradient(180deg,rgba(18,7,8,0.98),rgba(14,4,6,0.98))] p-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#271113] text-[#ffb7a8]">
                      <HiOutlineGift className="text-lg" />
                    </div>
                    <p className="mt-3 text-sm uppercase tracking-[0.16em] text-[#a9857d]">Occasion</p>
                    <p className="mt-1 text-base font-semibold text-white">{bouquet.category?.name ?? "Thoughtful gifting"}</p>
                  </div>
                </div>

                {bouquet.compound ? (
                  <div className="mt-6 rounded-[1.4rem] border border-[#60302d] bg-[#150809] p-5">
                    <div className="flex items-center gap-2 text-[#ffc8bc]">
                      <HiSparkles />
                      <p className="font-semibold">Bouquet composition</p>
                    </div>
                    <p className="mt-3 leading-8 text-[#d8b8b0]">{bouquet.compound}</p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    addToCart(bouquet);
                    toast.success(`${bouquet.name} cartga qo'shildi`);
                  }}
                  className="mt-7 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-base font-bold uppercase tracking-[0.1em] text-white shadow-[0_18px_42px_rgba(143,18,32,0.38)] transition hover:brightness-110"
                >
                  <HiOutlineShoppingBag />
                  Add to cart
                </button>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#5b2a28] bg-[#120708] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a9857d]">Perfect for</p>
                    <p className="mt-2 text-lg font-semibold text-white">{bouquet.category?.name ?? "Elegant gifting"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#5b2a28] bg-[#120708] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#a9857d]">Delivery feel</p>
                    <p className="mt-2 text-lg font-semibold text-white">Fresh, wrapped, ready</p>
                  </div>
                </div>
              </div>

              <Link
                to={`/shops/${bouquet.shop.slug}`}
                className="mt-5 grid gap-4 rounded-[1.7rem] border border-[#61302d] bg-[#130708]/92 p-5 transition hover:-translate-y-1 hover:border-[#bd756c] hover:shadow-[0_22px_48px_rgba(0,0,0,0.28)] sm:grid-cols-[auto_1fr]"
              >
                {bouquet.shop.logo ? (
                  <img
                    src={bouquet.shop.logo}
                    alt={bouquet.shop.name}
                    className="h-20 w-20 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#321112] font-cormorant text-3xl">
                    {bouquet.shop.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#b58e86]">Sold by</p>
                  <h2 className="mt-1 font-cormorant text-3xl text-white">{bouquet.shop.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#d9b6ad]">
                    {bouquet.shop.city ? (
                      <span className="inline-flex items-center gap-1">
                        <HiOutlineMapPin />
                        {bouquet.shop.city}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <HiStar className="text-[#f2b15e]" />
                      {bouquet.shop.rating} shop rating
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HiPhone />
                      Open shop page
                    </span>
                  </div>
                </div>
              </Link>

              {bouquet.shop.status === "active" ? (
                <div className="mt-4 rounded-[1.3rem] border border-[#55302c] bg-[#100607] px-5 py-4 text-sm text-[#d5b5ad]">
                  <HiOutlineClock className="mr-2 inline text-[#ffb4a4]" />
                  This shop is active and ready to receive orders.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <ReviewSection bouquet={bouquet} />
    </main>
  );
}

export default BouquetDetail;
