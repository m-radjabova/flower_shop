import { Link, useParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineGift,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineSparkles,
  HiStar,
} from "react-icons/hi2";
import NotFound from "../../components/NotFound";
import { ShopDetailSkeleton } from "../../components/PageSkeletons";
import { useBouquets, useShop } from "../../hooks/useCatalog";
import { formatPrice } from "../../utils/catalog";
import { formatUzbekPhone } from "../../utils/phone";

function buildMapUrl(latitude: string, longitude: string) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const box = [lon - 0.018, lat - 0.012, lon + 0.018, lat + 0.012].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik&marker=${lat},${lon}`;
}

function FloralFlourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 60" className={className} fill="none" aria-hidden="true">
      <path d="M8 30c26-22 52-22 78 0s52 22 78 0 32-22 48 0" stroke="url(#flourish-gradient)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52 22c5-10 14-12 19-4-11 1-14 9-12 16-7-2-12-7-7-12Z" fill="#f0c89c" fillOpacity=".35" />
      <path d="M164 22c5-10 14-12 19-4-11 1-14 9-12 16-7-2-12-7-7-12Z" fill="#ff8b9f" fillOpacity=".35" />
      <defs>
        <linearGradient id="flourish-gradient" x1="8" y1="30" x2="212" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0c89c" stopOpacity=".15" />
          <stop offset=".5" stopColor="#fff2ee" stopOpacity=".65" />
          <stop offset="1" stopColor="#ff8b9f" stopOpacity=".2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ShopDetail() {
  const { slug } = useParams();
  const { data: shop, isLoading, isError } = useShop(slug);
  const shopBouquets = useBouquets({ shopId: shop?.id });

  if (isLoading) {
    return <ShopDetailSkeleton />;
  }

  if (isError || !shop) {
    return <NotFound />;
  }

  const hasCoordinates = Boolean(shop.latitude && shop.longitude);
  const mapUrl = hasCoordinates ? buildMapUrl(shop.latitude ?? "", shop.longitude ?? "") : null;

  return (
    <main className="min-h-screen bg-[#070102] text-[#fff6f4]">
      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-10">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(190,58,58,0.34),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,209,186,0.08),transparent_16%),radial-gradient(circle_at_88%_12%,rgba(255,115,144,0.10),transparent_18%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            to="/#bouquets"
            className="inline-flex items-center gap-2 rounded-full border border-[#6d3430] bg-[#170809]/80 px-4 py-2 text-sm font-semibold text-[#f5d6cd] transition hover:border-[#bd756c] hover:text-white"
          >
            <HiArrowLeft />
            Back to catalog
          </Link>

          <div className="mt-8 overflow-hidden rounded-[2.2rem] border border-[#63302d] bg-[#140708] shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
            <div className="relative min-h-[24rem]">
              <img
                src={shop.banner ?? shop.logo ?? "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1400&q=80"}
                alt={shop.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,1,2,0.92),rgba(8,1,2,0.5),rgba(8,1,2,0.18))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,215,186,0.16),transparent_22%),radial-gradient(circle_at_28%_80%,rgba(255,95,121,0.18),transparent_26%)]" />
              <div className="relative flex min-h-[24rem] flex-col justify-end p-6 sm:p-10">
                <div className="flex flex-wrap items-end gap-5">
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={`${shop.name} logo`}
                      className="h-24 w-24 rounded-[2rem] border border-white/25 object-cover shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
                    />
                  ) : null}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#fff3e8] px-4 py-2 text-sm font-bold text-[#4f1513]">
                        {shop.city ?? "Flower shop"}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                        <HiStar className="text-[#f3b55f]" />
                        {shop.rating} ({shop.reviews_count})
                      </span>
                    </div>
                    <h1 className="mt-4 font-cormorant text-5xl font-semibold leading-none text-white sm:text-7xl">
                      {shop.name}
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#f7ddd6]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 backdrop-blur">
                        <HiOutlineSparkles className="text-[#ffb7a8]" />
                        Signature floral studio
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 backdrop-blur">
                        <HiOutlineGift className="text-[#ffb7a8]" />
                        Same-day gifting ready
                      </span>
                    </div>
                  </div>
                </div>
                <FloralFlourish className="mt-6 h-10 w-full max-w-[22rem] opacity-90" />
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-lg leading-9 text-[#dfc1ba]">
                  {shop.description ?? "A local flower shop with curated bouquets and fresh seasonal arrangements."}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#5d2d29] bg-[linear-gradient(180deg,rgba(23,8,10,0.96),rgba(15,5,7,0.98))] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#a9857d]">Bouquets</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{shopBouquets.data?.length ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-[#5d2d29] bg-[linear-gradient(180deg,rgba(23,8,10,0.96),rgba(15,5,7,0.98))] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#a9857d]">Rating</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{shop.rating}</p>
                  </div>
                  <div className="rounded-2xl border border-[#5d2d29] bg-[linear-gradient(180deg,rgba(23,8,10,0.96),rgba(15,5,7,0.98))] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#a9857d]">Reviews</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{shop.reviews_count}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`tel:${shop.phone}`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#b86760] bg-[linear-gradient(180deg,rgba(46,14,16,0.96),rgba(28,8,10,0.98))] px-5 text-sm font-semibold text-[#fff0ec] transition hover:-translate-y-0.5 hover:border-[#e0a298]"
                  >
                    <HiOutlinePhone className="text-[#ffb7a8]" />
                    Call shop
                  </a>
                  {mapUrl ? (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#5d2d29] bg-[#100607] px-5 text-sm font-semibold text-[#f3d4cc] transition hover:-translate-y-0.5 hover:border-[#bd756c]"
                    >
                      <HiOutlineMapPin className="text-[#ffb7a8]" />
                      Open directions
                    </a>
                  ) : null}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href={`tel:${shop.phone}`}
                    className="rounded-2xl border border-[#5d2d29] bg-[#100607] p-4 transition hover:-translate-y-0.5 hover:border-[#bd756c]"
                  >
                    <HiOutlinePhone className="text-2xl text-[#ffad9f]" />
                    <p className="mt-3 text-sm text-[#a9857d]">Phone</p>
                    <p className="font-semibold text-white">{formatUzbekPhone(shop.phone)}</p>
                  </a>
                  <div className="rounded-2xl border border-[#5d2d29] bg-[#100607] p-4">
                    <HiOutlineClock className="text-2xl text-[#ffad9f]" />
                    <p className="mt-3 text-sm text-[#a9857d]">Working hours</p>
                    <p className="font-semibold text-white">{shop.working_hours ?? "Contact shop"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#5d2d29] bg-[#100607] p-4 sm:col-span-2">
                    <HiOutlineMapPin className="text-2xl text-[#ffad9f]" />
                    <p className="mt-3 text-sm text-[#a9857d]">Address</p>
                    <p className="font-semibold text-white">{shop.address}</p>
                  </div>
                  <a
                    href={`mailto:${shop.owner.email}`}
                    className="rounded-2xl border border-[#5d2d29] bg-[#100607] p-4 transition hover:border-[#bd756c] sm:col-span-2"
                  >
                    <HiOutlineEnvelope className="text-2xl text-[#ffad9f]" />
                    <p className="mt-3 text-sm text-[#a9857d]">Owner</p>
                    <p className="font-semibold text-white">
                      {shop.owner.full_name} · {shop.owner.email}
                    </p>
                  </a>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-[#61302d] bg-[#100607]">
                {mapUrl ? (
                  <>
                    <div className="flex items-center justify-between border-b border-[#61302d] px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#a9857d]">Visit the boutique</p>
                        <p className="mt-1 text-lg font-semibold text-white">{shop.address}</p>
                      </div>
                      <span className="rounded-full bg-[#1a090c] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#f0c4ba]">
                        Open map
                      </span>
                    </div>
                    <iframe
                      title={`${shop.name} location map`}
                      src={mapUrl}
                      className="h-[27rem] w-full border-0 grayscale-[0.2] sepia-[0.12]"
                      loading="lazy"
                    />
                  </>
                ) : (
                  <div className="flex h-[27rem] flex-col items-center justify-center p-8 text-center">
                    <HiOutlineMapPin className="text-5xl text-[#ffad9f]" />
                    <p className="mt-4 font-cormorant text-4xl text-white">Location coming soon</p>
                    <p className="mt-3 leading-7 text-[#caa9a1]">{shop.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[#b58e86]">Shop collection</p>
                <h2 className="mt-2 font-cormorant text-5xl text-white">Bouquets by {shop.name}</h2>
                <p className="mt-3 max-w-2xl text-[#caa9a1]">Curated arrangements with a stronger visual hierarchy, faster scanning, and a softer luxury feel for the customer.</p>
              </div>
              <p className="text-[#caa9a1]">{shopBouquets.data?.length ?? 0} bouquets available</p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {(shopBouquets.data ?? []).map((bouquet) => (
                <Link
                  key={bouquet.id}
                  to={`/bouquets/${bouquet.id}`}
                  className="group overflow-hidden rounded-[1.8rem] border border-[#5d2d29] bg-[#140708] transition hover:-translate-y-1 hover:border-[#bd756c] hover:shadow-[0_22px_48px_rgba(0,0,0,0.28)]"
                >
                  <div className="relative">
                    <img
                      src={bouquet.image}
                      alt={bouquet.name}
                      className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#140708] to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white backdrop-blur">
                      {bouquet.category?.name ?? "Bouquet"}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-cormorant text-3xl leading-none text-white">{bouquet.name}</h3>
                      <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-sm font-bold text-[#4f1513]">
                        {formatPrice(bouquet.price)}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#caa9a1]">
                      {bouquet.description ?? bouquet.compound ?? "Fresh flower arrangement"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default ShopDetail;
