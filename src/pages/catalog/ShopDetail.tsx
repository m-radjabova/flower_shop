import { Link, useParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlinePhone,
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
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,1,2,0.92),rgba(8,1,2,0.48),rgba(8,1,2,0.2))]" />
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
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-lg leading-9 text-[#dfc1ba]">
                  {shop.description ?? "A local flower shop with curated bouquets and fresh seasonal arrangements."}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href={`tel:${shop.phone}`}
                    className="rounded-2xl border border-[#5d2d29] bg-[#100607] p-4 transition hover:border-[#bd756c]"
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
                  <iframe
                    title={`${shop.name} location map`}
                    src={mapUrl}
                    className="h-[27rem] w-full border-0 grayscale-[0.2] sepia-[0.12]"
                    loading="lazy"
                  />
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
              </div>
              <p className="text-[#caa9a1]">{shopBouquets.data?.length ?? 0} bouquets available</p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {(shopBouquets.data ?? []).map((bouquet) => (
                <Link
                  key={bouquet.id}
                  to={`/bouquets/${bouquet.id}`}
                  className="group overflow-hidden rounded-[1.8rem] border border-[#5d2d29] bg-[#140708] transition hover:-translate-y-1 hover:border-[#bd756c]"
                >
                  <img
                    src={bouquet.image}
                    alt={bouquet.name}
                    className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
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
