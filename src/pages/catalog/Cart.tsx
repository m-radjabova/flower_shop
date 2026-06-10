import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiHeart,
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiStar,
  HiArrowRight,
  HiShoppingBag,
  HiTrash,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { useReviews } from "../../hooks/useCatalog";
import { useCartItems } from "../../hooks/useCart";
import { useFavoriteIds } from "../../hooks/useFavorites";
import { ReviewsPanelSkeleton } from "../../components/PageSkeletons";
import { formatPrice, getBouquetImages } from "../../utils/catalog";
import { getBouquetAddonOptions, getBouquetImageForSize, getBouquetSizeOptions } from "../../utils/bouquetOptions";
import { removeFromCart, removeManyFromCart } from "../../utils/cart";
import { toggleFavoriteBouquet } from "../../utils/favorites";

function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useCartItems();
  const favoriteIds = useFavoriteIds();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const primaryItem = items[0] ?? null;
  const reviewsQuery = useReviews({
    bouquetId: primaryItem?.bouquet.id,
  });

  useEffect(() => {
    if (items.length <= 1) return;
    removeManyFromCart(items.slice(1).map((item) => item.id));
    toast.info("Cart bitta bouquet uchun ishlaydi.");
  }, [items]);

  const galleryImages = useMemo(() => (primaryItem ? getBouquetImages(primaryItem.bouquet) : []), [primaryItem]);
  const sizeOptions = useMemo(() => (primaryItem ? getBouquetSizeOptions(primaryItem.bouquet) : []), [primaryItem]);
  const addonOptions = useMemo(() => (primaryItem ? getBouquetAddonOptions(primaryItem.bouquet) : []), [primaryItem]);
  const selectedSizeOption = sizeOptions.find((item) => item.key === selectedSize) ?? sizeOptions[0];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [primaryItem?.id]);

  useEffect(() => {
    setSelectedAddons([]);
    setSelectedSize(sizeOptions.find((item) => item.key === "medium")?.key ?? sizeOptions[0]?.key ?? "");
  }, [primaryItem?.id, sizeOptions]);

  const activeImage = galleryImages[activeImageIndex]
    ?? (primaryItem ? getBouquetImageForSize(primaryItem.bouquet, selectedSizeOption?.key) : "")
    ?? primaryItem?.bouquet.image
    ?? "";

  const sizePrice = Number(selectedSizeOption?.price ?? primaryItem?.bouquet.price ?? 0);
  const addonsTotal = addonOptions.filter((item) => selectedAddons.includes(item.id)).reduce((acc, item) => acc + Number(item.price), 0);
  const quantity = primaryItem?.quantity ?? 0;
  const finalPrice = (sizePrice + addonsTotal) * quantity;

  const reviews = reviewsQuery.data ?? [];
  const averageRating = reviews.length
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : Number(primaryItem?.bouquet.rating ?? 0);
  const topReviews = reviews.slice(0, 3);

  const proceedToDelivery = () => {
    if (!primaryItem) return;

    const params = new URLSearchParams();
    if (selectedSize) {
      params.set("size", selectedSize);
    }
    if (selectedAddons.length) {
      params.set("addons", selectedAddons.join(","));
    }
    navigate(`/delivery?${params.toString()}`);
  };

  const handleRemoveFromCart = () => {
    if (!primaryItem) return;
    removeFromCart(primaryItem.id);
    toast.info(t("cart.removedFromCart"));
  };

  const isFavorite = primaryItem ? favoriteIds.has(primaryItem.bouquet.id) : false;

  return (
    <main className="min-h-screen overflow-hidden bg-transparent text-[#fff6f4]">
      <section className="relative px-3 sm:px-6 lg:px-10 pb-12 sm:pb-16 pt-28 sm:pt-32 lg:pt-36">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_14%,rgba(190,18,41,0.18),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(151,14,26,0.10),transparent_34%)]" />

        <div className="relative mx-auto max-w-[1500px]">
          <div className="mb-4 sm:mb-6 lg:mb-10 flex text-center flex-col gap-2 sm:gap-3">
            <p className="text-[8px] sm:text-sm uppercase tracking-[0.25em] text-[#ff8ca0]/80">
              {t("cart.pageLabel")}
            </p>
            <h1 className="mt-1 sm:mt-2 font-great-vibes text-[2.2rem] sm:text-[3.5rem] lg:text-[5rem] leading-[0.9]">
              {t("cart.pageTitle")}
            </h1>
          </div>
          {!primaryItem ? (
            <div className="animate-fadeIn group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-[#7d4943]/40 bg-gradient-to-b from-[#17080a] via-[#14080b] to-[#0d0506] px-4 sm:px-8 py-12 sm:py-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="relative mx-auto max-w-3xl">
                <div className="mx-auto flex flex-col items-center text-center">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="flex h-20 sm:h-28 w-20 sm:w-28 animate-float items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] border border-[#a2555d]/30 bg-gradient-to-br from-[#2a0f13] to-[#1a080b] shadow-[0_0_30px_rgba(162,85,93,0.15)]">
                      <HiOutlineShoppingBag className="text-3xl sm:text-5xl text-[#f3b0b4]" />
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-6 sm:h-8 w-6 sm:w-8 items-center justify-center rounded-full border border-[#ff4d6a]/40 bg-[#ff4d6a]/20 text-[10px] sm:text-xs text-[#ff8ca0]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 sm:h-4 w-3 sm:w-4">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </div>
                  </div>

                  <h2 className="font-cormorant text-4xl sm:text-5xl md:text-7xl leading-[0.95] tracking-tight text-[#ffe7e0]">
                    {t("cart.emptyTitle")}
                    <br />
                    <span className="bg-gradient-to-r from-[#ff7d9a] to-[#f3b0b4] bg-clip-text text-transparent">{t("cart.emptyTitle2")}</span>
                  </h2>

                  <div className="mx-auto mt-3 sm:mt-5 h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#a2555d]/50 to-transparent" />

                  <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-8 text-[#d8b5ad]">
                     {t("cart.emptyDesc")}
                  </p>

                  <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row">
                    <Link
                      to="/bouquets"
                      className="group/btn inline-flex h-12 sm:h-14 min-w-[180px] sm:min-w-[220px] items-center justify-center gap-2 rounded-xl border border-[#ce4a60] bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] px-5 sm:px-7 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-[0_4px_20px_rgba(143,18,32,0.35)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(143,18,32,0.5)] hover:brightness-110"
                    >
                       {t("cart.browseBouquets")}
                      <HiArrowRight className="text-sm sm:text-base transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                    <Link
                      to="/"
                      className="inline-flex h-12 sm:h-14 min-w-[180px] sm:min-w-[220px] items-center justify-center rounded-xl border border-[#7d5558] bg-[#15090b] px-5 sm:px-7 text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-[#f1c4bb] transition-all duration-300 hover:border-[#9a6a6e] hover:bg-[#1e0c0f]"
                    >
                       {t("cart.backToHome")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                {/* ====== GALLERY SECTION ====== */}
                <div className="animate-slideUp overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-[#4f2224]/40 bg-gradient-to-b from-[#120507] via-[#100507] to-[#090204] p-2 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.4)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    {/* Thumbnails */}
                    <div className="order-2 flex gap-2 sm:order-1 sm:flex-col">
                      {galleryImages.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`group/thumb relative overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
                            index === activeImageIndex
                              ? "border-[#db4d62] shadow-[0_0_20px_rgba(219,77,98,0.3)]"
                              : "border-[#5f2b2d]/50 opacity-70 hover:opacity-100 hover:border-[#5f2b2d]"
                          }`}
                        >
                          <img loading="lazy" decoding="async"
                            src={image}
                            alt="thumb"
                            className="h-10 sm:h-20 w-10 sm:w-20 rounded-lg object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                          />
                          {index === activeImageIndex && (
                            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-[#db4d62]/30" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Main image */}
                    <div className="order-1 sm:order-2 relative flex-1 overflow-hidden rounded-2xl border border-[#5f2b2d]/50 bg-[#0d0405] shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]">
                      <button
                        type="button"
                        onClick={() => {
                          if (!primaryItem) return;
                          const nextState = toggleFavoriteBouquet(primaryItem.bouquet);
                          toast.info(
                            nextState
                              ? `${primaryItem.bouquet.name} favoritesga qo'shildi`
                              : `${primaryItem.bouquet.name} favoritesdan olib tashlandi`,
                          );
                        }}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        className={`absolute right-2 sm:right-4 top-2 sm:top-4 z-10 inline-flex h-8 sm:h-11 w-8 sm:w-11 items-center justify-center rounded-full border bg-black/40 backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
                          isFavorite
                            ? "border-[#ff6a82] text-[#ff6a82] shadow-[0_0_20px_rgba(255,106,130,0.3)]"
                            : "border-[#ba8a63]/80 text-[#f2d5ba] hover:border-[#ff6a82] hover:text-[#ff6a82]"
                        }`}
                      >
                        {isFavorite ? <HiHeart size={16} /> : <HiOutlineHeart size={16} />}
                      </button>

                      <div className="absolute left-2 sm:left-4 top-2 sm:top-4 z-10 rounded-full border border-[#5f2b2d]/40 bg-black/50 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-xs text-[#d8b5ad] backdrop-blur-sm">
                        {activeImageIndex + 1} / {galleryImages.length}
                      </div>

                      <div className="relative flex items-center justify-center">
                        <img loading="lazy" decoding="async"
                          src={activeImage}
                          alt={primaryItem.bouquet.name}
                          className="h-[220px] sm:h-[400px] md:h-[580px] lg:h-[620px] w-full object-cover transition-all duration-500 hover:scale-105"
                        />
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 sm:h-20 bg-gradient-to-t from-[#0d0405] to-transparent" />
                      </div>
                    </div>
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="mt-3 sm:mt-4 flex items-center justify-center gap-4 sm:gap-5 text-[#d6bcb5]">
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((value) => Math.max(0, value - 1))}
                        disabled={activeImageIndex === 0}
                        className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full border border-[#6a3a3c]/60 text-[#d6bcb5] transition-all duration-200 hover:border-[#db4d62] hover:text-[#ff8ca0] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <HiChevronLeft />
                      </button>
                      <div className="flex gap-2">
                        {galleryImages.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`h-2 rounded-full transition-all duration-500 ${
                              index === activeImageIndex
                                ? "w-6 sm:w-8 bg-gradient-to-r from-[#e53257] to-[#ff6a82] shadow-[0_0_12px_rgba(229,50,87,0.5)]"
                                : "w-2 bg-[#6a3a3c]/50 hover:bg-[#6a3a3c]"
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((value) => Math.min(galleryImages.length - 1, value + 1))}
                        disabled={activeImageIndex === galleryImages.length - 1}
                        className="inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full border border-[#6a3a3c]/60 text-[#d6bcb5] transition-all duration-200 hover:border-[#db4d62] hover:text-[#ff8ca0] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <HiChevronRight />
                      </button>
                    </div>
                  )}
                </div>

                {/* ====== DETAILS SECTION ====== */}
                <div className="animate-slideUp overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-[#4f2224]/40 bg-gradient-to-b from-[#120507] via-[#100507] to-[#090204] p-4 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.4)]" style={{ animationDelay: "0.1s" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h2 className="font-cormorant text-3xl sm:text-4xl md:text-5xl leading-[0.95] text-white">
                          {primaryItem.bouquet.name}
                        </h2>
                      </div>
                      <Link
                        to={`/shops/${primaryItem.bouquet.shop.slug}`}
                        className="mt-1 sm:mt-2 inline-flex items-center gap-1.5 text-lg sm:text-xl md:text-2xl text-[#f3d8cf] transition-colors duration-200 hover:text-[#ff8ca0]"
                      >
                        <HiOutlineSparkles className="text-sm sm:text-base" />
                        {primaryItem.bouquet.shop.name}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-3 flex items-center gap-1.5">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <HiStar
                          key={index}
                          className={`text-base sm:text-lg ${
                            index < Math.round(Number(primaryItem.bouquet.rating))
                              ? "text-[#f1bb67] drop-shadow-[0_0_6px_rgba(241,187,103,0.3)]"
                              : "text-[#5d3e40]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-xs sm:text-sm text-[#e8c6bd]">
                      {primaryItem.bouquet.rating}
                      <span className="text-[#a08c89]"> ({primaryItem.bouquet.reviews_count} reviews)</span>
                    </span>
                  </div>

                  <div className="mt-3 sm:mt-4 flex flex-wrap items-end gap-3">
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#ff3f67]">{formatPrice(String(sizePrice))}</p>
                    {primaryItem.bouquet.old_price ? (
                      <p className="pb-1 text-base sm:text-lg md:text-xl text-[#a08c89] line-through">{formatPrice(primaryItem.bouquet.old_price)}</p>
                    ) : null}
                  </div>

                  <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg leading-7 sm:leading-8 md:leading-9 text-[#d1b0a8]">
                    {primaryItem.bouquet.description ?? "A luxurious bouquet with elegant arrangement and timeless charm."}
                  </p>

                  <div className="mt-4 sm:mt-6 h-px w-full bg-gradient-to-r from-[#4f2224]/40 via-[#4f2224]/20 to-transparent" />

                  {/* Size Selector */}
                  <div className="mt-4 sm:mt-6">
                    <p className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[#f4d5cd]">
                      <HiOutlineSparkles className="text-sm sm:text-base text-[#db4d62]" />
                       {t("cart.bouquetSize")}
                    </p>
                    <div className="mt-2 sm:mt-3 grid gap-2 sm:gap-2.5 grid-cols-2 sm:grid-cols-4">
                      {sizeOptions.map((size) => {
                        const active = selectedSize === size.key;
                        return (
                          <button
                            key={size.key}
                            type="button"
                            onClick={() => {
                              setSelectedSize(size.key);
                              const imageIndex = galleryImages.findIndex((image) => image === size.image);
                              if (imageIndex >= 0) setActiveImageIndex(imageIndex);
                            }}
                            className={`group relative rounded-xl border-2 px-2 sm:px-3 py-2 sm:py-3 text-left transition-all duration-200 ${
                              active
                                ? "border-[#d43f5b] bg-gradient-to-b from-[#2a0c12] to-[#1f0810] shadow-[0_0_20px_rgba(212,63,91,0.2)]"
                                : "border-[#5d2e31]/40 bg-[#0d0405] hover:border-[#5d2e31] hover:bg-[#110608]"
                            }`}
                          >
                            {active && (
                              <div className="absolute right-1 sm:right-2 top-1 sm:top-2 flex h-4 sm:h-5 w-4 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#d43f5b] to-[#ff6a82] shadow-[0_0_10px_rgba(212,63,91,0.4)]">
                                <HiCheck className="text-[8px] sm:text-[10px] text-white" />
                              </div>
                            )}
                            <p className={`text-sm sm:text-lg font-medium transition-colors duration-200 ${active ? "text-white" : "text-white/80"}`}>
                              {size.label}
                            </p>
                            <p className={`mt-0.5 text-[10px] sm:text-sm transition-colors duration-200 ${active ? "text-[#ff8ca0]" : "text-[#d8b8af]"}`}>
                              {formatPrice(size.price)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="mt-4 sm:mt-5">
                    <p className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[#f4d5cd]">
                      <HiOutlineSparkles className="text-sm sm:text-base text-[#db4d62]" />
                       {t("cart.addons")}
                    </p>
                    <div className="mt-2 sm:mt-3 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                      {addonOptions.map((addon) => {
                        const selected = selectedAddons.includes(addon.id);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() =>
                              setSelectedAddons((prev) =>
                                prev.includes(addon.id)
                                  ? prev.filter((id) => id !== addon.id)
                                  : [...prev, addon.id],
                              )
                            }
                            className={`group relative overflow-hidden rounded-[1.35rem] border-2 p-3 text-left transition-all duration-300 ${
                              selected
                                ? "border-[#d43f5b] bg-[linear-gradient(180deg,#2a0c12,#1f0810)] shadow-[0_0_28px_rgba(212,63,91,0.22)]"
                                : "border-[#5d2e31]/40 bg-[linear-gradient(180deg,#140608,#0d0405)] hover:-translate-y-1 hover:border-[#8f4450] hover:bg-[#110608]"
                            }`}
                          >
                            {selected && (
                              <div className="absolute right-2 top-2 flex h-4 sm:h-5 w-4 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#d43f5b] to-[#ff6a82] shadow-[0_0_10px_rgba(212,63,91,0.4)]">
                                <HiCheck className="text-[8px] text-white" />
                              </div>
                            )}
                            <div className="relative mb-2 sm:mb-3 overflow-hidden rounded-[1rem]">
                              <img loading="lazy" decoding="async" src={addon.image} alt={addon.name} className="h-24 sm:h-28 w-full object-cover transition duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#140608] via-transparent to-transparent" />
                              <span className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 rounded-full border border-white/10 bg-black/35 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[10px] uppercase tracking-[0.16em] text-[#ffe1da] backdrop-blur">
                                Add-on
                              </span>
                            </div>
                            <p className={`text-xs sm:text-sm font-semibold transition-colors duration-200 ${selected ? "text-white" : "text-white/80"}`}>
                              {addon.name}
                            </p>
                            <p className={`mt-1 text-[10px] sm:text-xs transition-colors duration-200 ${selected ? "text-[#ff8ca0]" : "text-[#d8b8af]"}`}>
                              +{formatPrice(addon.price)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="mt-4 sm:mt-6 overflow-hidden rounded-xl border border-[#8a303f]/50 bg-gradient-to-b from-[#25090f] to-[#1b0610] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mt-2 sm:mt-3 space-y-1.5 border-[#8a303f]/20">
                      <div className="flex justify-between text-xs sm:text-sm text-[#d8b2aa]">
                        <span>{t("cart.subtotal")}</span>
                        <span>{formatPrice(String(sizePrice * quantity))}</span>
                      </div>
                      {selectedAddons.length > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm text-[#d8b2aa]">
                           <span>{t("cart.addonsLabel")} (+{selectedAddons.length})</span>
                          <span>+{formatPrice(String(addonsTotal * quantity))}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-[#8a303f]/20 pt-1.5 text-base sm:text-lg font-bold text-white">
                         <span>{t("cart.total")}</span>
                        <span className="text-[#ff3f67]">{formatPrice(String(finalPrice))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 sm:mt-5 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={proceedToDelivery}
                      className="group/btn relative inline-flex h-12 sm:h-14 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-4 sm:px-5 text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(143,18,32,0.35)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(143,18,32,0.5)] hover:brightness-110"
                    >
                      <HiShoppingBag className="text-base sm:text-lg transition-transform duration-300 group-hover/btn:scale-110" />
                       {t("cart.continueToDelivery")}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFromCart}
                      className="group/btn inline-flex h-12 sm:h-14 items-center justify-center gap-2 rounded-xl border border-[#a43c44] bg-[#1d090b] px-4 sm:px-5 text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-[#f1c4bb] transition-all duration-300 hover:border-[#dc5a67] hover:bg-[#2a0d12]"
                    >
                      <HiTrash className="text-sm sm:text-base transition-transform duration-300 group-hover/btn:scale-110" />
                      {t("cart.removeFromCart")}
                    </button>
                    <Link
                      to={`/shops/${primaryItem.bouquet.shop.slug}`}
                      className="group/btn inline-flex h-12 sm:h-14 items-center justify-center gap-2 rounded-xl border border-[#7f5a3b]/60 bg-[#110608] px-4 sm:px-5 text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-[#f0cfa5] transition-all duration-300 hover:border-[#7f5a3b] hover:bg-[#1a0c10]"
                    >
                      <HiOutlineSparkles className="text-sm sm:text-base transition-transform duration-300 group-hover/btn:scale-110" />
                       {t("cart.viewShop")}
                    </Link>
                  </div>
                </div>
              </div>

              {/* ========== REVIEWS SECTION ========== */}
              <div
                className="animate-slideUp mt-4 sm:mt-6 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-[#4f2224]/40 bg-gradient-to-b from-[#1b080a] via-[#140609] to-[#0c0304] p-4 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.4)]"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                   <p className="font-cormorant text-2xl sm:text-3xl md:text-4xl text-white">{t("cart.whatCustomersSay")}</p>
                  {reviews.length > 3 && (
                    <Link
                      to={`/bouquets/${primaryItem?.bouquet.id}/reviews`}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#ff8ca0] transition-colors duration-200 hover:text-[#ff6b7f]"
                    >
                      View all ({reviews.length})
                      <HiArrowRight />
                    </Link>
                  )}
                </div>

                <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 md:grid-cols-4">
                  {/* Rating summary */}
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[#633336]/50 bg-gradient-to-b from-[#120607] to-[#0d0405] p-4 sm:p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                      {averageRating ? averageRating.toFixed(1) : "0.0"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <HiStar
                          key={index}
                          className={`text-xs sm:text-sm ${
                            index < Math.round(averageRating)
                              ? "text-[#f1bb67] drop-shadow-[0_0_4px_rgba(241,187,103,0.3)]"
                              : "text-[#5d3e40]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] sm:text-xs text-[#c3a39b]">
                      Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {reviewsQuery.isLoading ? (
                    <div className="md:col-span-3">
                      <ReviewsPanelSkeleton count={3} />
                    </div>
                  ) : null}

                  {!reviewsQuery.isLoading && topReviews.length
                    ? topReviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-xl border border-[#633336]/30 bg-gradient-to-b from-[#120607] to-[#0d0405] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-200 hover:border-[#633336]/60"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full border border-[#633336]/30 bg-gradient-to-br from-[#2a0f13] to-[#1a080b] text-xs sm:text-sm font-semibold text-[#f3b0b4]">
                              {review.user.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-white">{review.user.full_name}</p>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <HiStar
                                    key={index}
                                    className={`text-[10px] sm:text-xs ${
                                      index < review.rating
                                        ? "text-[#f1bb67]"
                                        : "text-[#5d3e40]"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-[#c3a39b]">
                            {review.text || "Great bouquet and delivery."}
                          </p>
                        </div>
                      ))
                    : null}

                  {!reviewsQuery.isLoading && !topReviews.length ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-[#633336]/30 bg-[#120607] p-5 sm:p-6 text-xs sm:text-sm text-[#c3a39b] md:col-span-3">
                      Hozircha bu bouquet uchun review yo'q.
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Cart;
