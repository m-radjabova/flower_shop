import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaInstagram, FaTelegramPlane } from "react-icons/fa";
import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
import {
  HiArrowLeft,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiPhone,
  HiSparkles,
  HiStar,
} from "react-icons/hi2";
import NotFound from "../../components/NotFound";
import BouquetAvailabilityBadge from "../../components/catalog/BouquetAvailabilityBadge";
import { DetailPageSkeleton } from "../../components/PageSkeletons";
import ReviewSection from "../../components/catalog/ReviewSection";
import ShopVerifiedBadge from "../../components/shops/ShopVerifiedBadge";
import { useBouquet } from "../../hooks/useCatalog";
import { formatPrice, getBouquetAvailability, getBouquetImages, isBouquetAvailable } from "../../utils/catalog";
import { getBouquetAddonOptions, getBouquetImageForSize, getBouquetSizeOptions } from "../../utils/bouquetOptions";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../utils/social";

function BouquetDetail() {
  const { t } = useTranslation();
  const { bouquetId } = useParams();
  const { data: bouquet, isLoading, isError } = useBouquet(bouquetId);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedSizeKey, setSelectedSizeKey] = useState<string | null>(null);

  useEffect(() => {
    if (!bouquet) return;
    const sizeOptions = getBouquetSizeOptions(bouquet);
    setSelectedSizeKey(sizeOptions.find((item) => item.key === "medium")?.key ?? sizeOptions[0]?.key ?? null);
    setActiveImage(null);
  }, [bouquet]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !bouquet) {
    return <NotFound />;
  }

  const images = getBouquetImages(bouquet);
  const sizeOptions = getBouquetSizeOptions(bouquet);
  const addonOptions = getBouquetAddonOptions(bouquet);
  const selectedSize = sizeOptions.find((item) => item.key === selectedSizeKey) ?? sizeOptions[0];
  const heroImage = activeImage ?? getBouquetImageForSize(bouquet, selectedSize?.key) ?? images[0] ?? bouquet.image;
  const shopInstagramUrl = bouquet.shop.instagram ? normalizeInstagramLink(bouquet.shop.instagram) : "";
  const shopTelegramUrl = bouquet.shop.telegram ? normalizeTelegramLink(bouquet.shop.telegram) : "";
  const isPopular = Number(bouquet.rating) >= 4.5 && bouquet.reviews_count >= 20;
  const availability = getBouquetAvailability(bouquet);
  const canAddToCart = isBouquetAvailable(bouquet);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070102] text-[#fff6f4]">
      {/* Decorative bg */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#cb5c57]/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#ff9b88]/5 blur-3xl" />
      </div>

      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* Back button */}
          <Link
            to="/#bouquets"
            className="group inline-flex items-center gap-2 rounded-full border border-[#5b2524]/50 bg-[#170809]/60 px-4 py-2 text-sm font-semibold text-[#f5d6cd] backdrop-blur-sm transition hover:border-[#cb5c57] hover:bg-[#cb5c57]/10 hover:text-white"
          >
            <HiArrowLeft className="transition-transform duration-300 group-hover:-translate-x-0.5" />
             {t("bouquetDetail.backToBouquets")}
          </Link>

          {/* Main grid */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: Image gallery */}
            <div>
              <div className="group relative overflow-hidden rounded-[2rem] border border-[#3a1a1a] bg-gradient-to-br from-[#1a0c0c] to-[#0f0606] p-2 shadow-xl">
                <div className="relative overflow-hidden rounded-[1.7rem]">
                  <img
                    src={heroImage}
                    alt={bouquet.name}
                    className="h-[440px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 sm:h-[580px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0606] via-transparent to-transparent opacity-60" />
                  
                  {/* Badges */}
                  <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                    {bouquet.category ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#dd3045] to-[#ff5b72] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-lg">
                        {bouquet.category.name}
                      </span>
                    ) : null}
                    {isPopular && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-lg">
                        <HiStar className="animate-pulse" />
                         {t("bouquetDetail.popular")}
                      </span>
                    )}
                    <BouquetAvailabilityBadge bouquet={bouquet} />
                  </div>

                  {/* Rating badge */}
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm font-semibold text-[#fff4ef] backdrop-blur-md">
                    <HiStar className="text-amber-400" />
                    {bouquet.rating}
                    <span className="text-[#cfa89e]">({bouquet.reviews_count})</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail grid */}
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      className={`overflow-hidden rounded-[1.2rem] border-2 transition-all duration-300 ${
                        heroImage === image
                          ? "border-[#cb5c57] opacity-100 shadow-lg shadow-[#cb5c57]/20"
                          : "border-[#3a1a1a] opacity-60 hover:opacity-100 hover:border-[#6d3430]"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${bouquet.name} ${index + 1}`}
                        className="h-24 w-full object-cover sm:h-28"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="flex flex-col gap-6">
              <div className="rounded-[2rem] border border-[#3a1a1a] bg-gradient-to-br from-[#1a0c0c] to-[#0f0606] p-7 shadow-xl sm:p-9">
                {/* Name */}
                <h1 className="font-cormorant text-[3rem] font-bold leading-none text-white sm:text-[3.8rem]">
                  {bouquet.name}
                </h1>

                {/* Decorative divider */}
                <div className="mt-5 h-px w-24 bg-gradient-to-r from-[#cb5c57] to-transparent" />

                {/* Description */}
                {bouquet.description && (
                  <p className="mt-6 max-w-2xl text-base leading-8 text-[#cfa89e]">
                    {bouquet.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-7 flex items-end gap-4">
                  <p className="text-5xl font-bold text-white">{formatPrice(selectedSize?.price ?? bouquet.price)}</p>
                  {bouquet.old_price ? (
                    <p className="pb-1 text-xl font-semibold text-[#8a6a63] line-through">
                      {formatPrice(bouquet.old_price)}
                    </p>
                  ) : null}
                </div>

                {/* Info cards */}
                <div className="mt-7 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#3a1a1a] bg-[#120708] p-3.5">
                     <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.size")}</p>
                     <p className="mt-1.5 text-sm font-semibold text-white">{selectedSize?.label ?? bouquet.size ?? t("bouquetDetail.custom")}</p>
                   </div>
                   <div className="rounded-xl border border-[#3a1a1a] bg-[#120708] p-3.5">
                     <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.stock")}</p>
                     <p className="mt-1.5 text-sm font-semibold text-white">
                       {availability.count ?? bouquet.stock} {availability.count ? t("availability.leftShort") : t("bouquetDetail.available")}
                     </p>
                   </div>
                   <div className="rounded-xl border border-[#3a1a1a] bg-[#120708] p-3.5">
                     <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.status")}</p>
                    <p className="mt-1.5 text-sm font-semibold capitalize text-white">{bouquet.status.replace("_", " ")}</p>
                  </div>
                </div>

                {/* Composition */}
                {bouquet.compound ? (
                  <div className="mt-6 rounded-[1.3rem] border border-[#3a1a1a] bg-[#120708] p-5">
                    <div className="flex items-center gap-2 text-[#cb5c57]">
                      <HiSparkles className="text-lg" />
                       <p className="text-sm font-bold uppercase tracking-[0.12em]">{t("bouquetDetail.composition")}</p>
                    </div>
                    <p className="mt-3 leading-8 text-[#cfa89e]">{bouquet.compound}</p>
                  </div>
                ) : null}

                {sizeOptions.length ? (
                  <div className="mt-6">
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#cb5c57]">{t("bouquetDetail.size")}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {sizeOptions.map((option) => {
                        const active = selectedSize?.key === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setSelectedSizeKey(option.key);
                              setActiveImage(option.image);
                            }}
                            className={`rounded-[1.2rem] border px-4 py-3 text-left transition ${
                              active ? "border-[#cb5c57] bg-[#2a0c12]" : "border-[#3a1a1a] bg-[#120708]"
                            }`}
                          >
                            <p className="text-lg font-semibold text-white">{option.label}</p>
                            <p className="mt-1 text-sm text-[#ff9bab]">{formatPrice(option.price)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {addonOptions.length ? (
                  <div className="mt-6 rounded-[1.3rem] border border-[#3a1a1a] bg-[#120708] p-5">
                    <div className="flex items-center gap-2 text-[#cb5c57]">
                      <HiSparkles className="text-lg" />
                      <p className="text-sm font-bold uppercase tracking-[0.12em]">Add-ons</p>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {addonOptions.map((addon) => (
                        <div key={addon.id} className="group overflow-hidden rounded-[1.35rem] border border-[#4a2020] bg-[linear-gradient(180deg,#1b0a0d,#140608)] shadow-[0_14px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-[#cb5c57]/60 hover:shadow-[0_18px_40px_rgba(157,42,60,0.22)]">
                          <div className="relative">
                            <img src={addon.image} alt={addon.name} className="h-32 w-full object-cover transition duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#120507] via-transparent to-transparent" />
                            </div>
                          <div className="p-4">
                            <p className="text-base font-semibold text-[#fdf2ef]">{addon.name}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-sm text-[#ff9bab]">+{formatPrice(addon.price)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Add to cart */}
                <button
                  type="button"
                  onClick={() => {
                    if (!canAddToCart) {
                      toast.error(`${bouquet.name} ${t("availability.outOfStockMessage")}`);
                      return;
                    }
                    addToCart(bouquet);
                    toast.success(`${bouquet.name} ${t("catalog.addedToCart")}`);
                  }}
                  disabled={!canAddToCart}
                  className={`group/btn mt-7 inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl text-base font-bold uppercase tracking-[0.1em] shadow-lg transition-all duration-300 ${
                    canAddToCart
                      ? "bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-white hover:from-[#aa1828] hover:via-[#bb2435] hover:to-[#dd3045] hover:shadow-xl active:scale-[0.98]"
                      : "cursor-not-allowed border border-[#5b2b31] bg-[#1a0b0d] text-[#c39b94] opacity-80"
                  }`}
                >
                  <HiOutlineShoppingBag className="text-lg transition-transform duration-300 group-hover/btn:-translate-x-1" />
                   {canAddToCart ? t("bouquetDetail.addToCart") : t("availability.outOfStock")}
                </button>
              </div>

              {/* Shop card */}
              <Link
                to={`/shops/${bouquet.shop.slug}`}
                className="group rounded-[1.7rem] border border-[#3a1a1a] bg-gradient-to-br from-[#1a0c0c] to-[#0f0606] p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#cb5c57]/50 hover:shadow-2xl"
              >
                <div className="flex items-center gap-5">
                  {bouquet.shop.logo ? (
                    <img
                      src={bouquet.shop.logo}
                      alt={bouquet.shop.name}
                      className="h-18 w-18 shrink-0 rounded-2xl object-cover ring-2 ring-[#3a1a1a]"
                    />
                  ) : (
                    <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2b1012] to-[#1a0809] font-cormorant text-3xl ring-2 ring-[#3a1a1a]">
                      {bouquet.shop.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                     <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8a6a63]">{t("bouquetDetail.soldBy")}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <h2 className="font-cormorant text-2xl text-white transition-colors duration-300 group-hover:text-[#cb5c57]">
                        {bouquet.shop.name}
                      </h2>
                      {bouquet.shop.is_verified ? <ShopVerifiedBadge /> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#cfa89e]">
                      {bouquet.shop.city ? (
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineMapPin className="text-[#cb5c57]" />
                          {bouquet.shop.city}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <HiStar className="text-amber-400" />
                        {bouquet.shop.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social links */}
                {(shopInstagramUrl || shopTelegramUrl) && (
                  <div className="mt-4 flex gap-2 border-t border-[#3a1a1a] pt-4" onClick={(e) => e.stopPropagation()}>
                    {shopInstagramUrl && (
                      <a
                        href={shopInstagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[#3a1a1a] bg-[#120708] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#f0d2ca] transition hover:border-[#cb5c57] hover:bg-[#cb5c57]/10 hover:text-white"
                      >
                        <FaInstagram />
                        Instagram
                      </a>
                    )}
                    {shopTelegramUrl && (
                      <a
                        href={shopTelegramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[#3a1a1a] bg-[#120708] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#f0d2ca] transition hover:border-[#cb5c57] hover:bg-[#cb5c57]/10 hover:text-white"
                      >
                        <FaTelegramPlane />
                        Telegram
                      </a>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-[#8a6a63]">
                      <HiPhone />
                       {t("bouquetDetail.viewShop")}
                    </span>
                  </div>
                )}
              </Link>

              {/* Shop active status */}
              {bouquet.shop.status === "active" && (
                <div className="flex items-center gap-2 rounded-[1.2rem] border border-[#3a1a1a] bg-[#120708] px-5 py-3.5 text-sm text-[#cfa89e]">
                  <HiOutlineClock className="shrink-0 text-emerald-400" />
                   <span>{t("bouquetDetail.shopActive")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ReviewSection bouquet={bouquet} />
    </main>
  );
}

export default BouquetDetail;
