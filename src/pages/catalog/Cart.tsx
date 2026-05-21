import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiHeart,
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiMinus,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiPlus,
  HiStar,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { useReviews } from "../../hooks/useCatalog";
import { useCartItems } from "../../hooks/useCart";
import { useFavoriteIds } from "../../hooks/useFavorites";
import { ReviewsPanelSkeleton } from "../../components/PageSkeletons";
import { formatPrice, getBouquetImages } from "../../utils/catalog";
import { removeManyFromCart, updateCartItemQuantity } from "../../utils/cart";
import { toggleFavoriteBouquet } from "../../utils/favorites";

const sizeOptions = [
  { id: "small", label: "Small", multiplier: 0.85 },
  { id: "medium", label: "Medium", multiplier: 1 },
  { id: "large", label: "Large", multiplier: 1.3 },
  { id: "premium", label: "Premium", multiplier: 1.65 },
] as const;

const addonOptions = [
  { id: "greeting", label: "Greeting Card", price: 4 },
  { id: "chocolate", label: "Chocolates", price: 12 },
  { id: "basket", label: "Fruity Basket", price: 15 },
] as const;

function Cart() {
  const navigate = useNavigate();
  const items = useCartItems();
  const favoriteIds = useFavoriteIds();

  const [selectedSize, setSelectedSize] = useState<(typeof sizeOptions)[number]["id"]>("medium");
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

  useEffect(() => {
    setActiveImageIndex(0);
  }, [primaryItem?.id]);

  const activeImage = galleryImages[activeImageIndex] ?? primaryItem?.bouquet.image ?? "";

  const basePrice = Number(primaryItem?.bouquet.price ?? 0);
  const sizeMultiplier = sizeOptions.find((item) => item.id === selectedSize)?.multiplier ?? 1;
  const sizePrice = basePrice * sizeMultiplier;
  const addonsTotal = addonOptions.filter((item) => selectedAddons.includes(item.id)).reduce((acc, item) => acc + item.price, 0);
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
    params.set("size", selectedSize);
    if (selectedAddons.length) {
      params.set("addons", selectedAddons.join(","));
    }
    navigate(`/delivery?${params.toString()}`);
  };

  const isFavorite = primaryItem ? favoriteIds.has(primaryItem.bouquet.id) : false;

  return (
    <main className="min-h-screen overflow-hidden bg-transparent text-[#fff6f4]">
      <section className="relative px-4 pb-12 pt-28 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_14%,rgba(190,18,41,0.18),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(151,14,26,0.10),transparent_34%)]" />
        <div className="relative mx-auto max-w-[1500px]">
          {!primaryItem ? (
            <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-[#7d4943] bg-[linear-gradient(180deg,rgba(23,8,10,0.95),rgba(12,4,6,0.96))] px-5 py-12 sm:px-8 sm:py-14">
              <div className="relative mx-auto max-w-3xl rounded-[1.7rem] border border-[#5d2b2f] bg-[linear-gradient(150deg,rgba(28,10,13,0.94),rgba(15,6,8,0.94))] p-7 text-center sm:p-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#a2555d] bg-[#2a0f13]">
                  <HiOutlineShoppingBag className="text-4xl text-[#f3b0b4]" />
                </div>

                <p className="mt-6 font-cormorant text-5xl leading-none text-[#ffe7e0] sm:text-6xl">Savatingiz hozircha bo'sh</p>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#d8b5ad] sm:text-lg sm:leading-8">
                  Eng chiroyli kompozitsiyalar sizni kutmoqda. O'zingiz yoki yaqinlaringiz uchun nafis bouquet tanlab, bir necha daqiqada
                  buyurtma qiling.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to="/bouquets"
                    className="inline-flex h-14 min-w-[220px] items-center justify-center rounded-xl border border-[#ce4a60] bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] px-7 text-sm font-semibold uppercase tracking-[0.1em] text-white"
                  >
                    Bouquets ko'rish
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex h-14 min-w-[220px] items-center justify-center rounded-xl border border-[#7d5558] bg-[#15090b] px-7 text-sm font-semibold uppercase tracking-[0.08em] text-[#f1c4bb]"
                  >
                    Bosh sahifaga qaytish
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.6rem] border border-[#4f2224] bg-[linear-gradient(160deg,#120507,#090204_70%)] p-4">
                  <div className="grid gap-4 md:grid-cols-[100px_1fr]">
                    <div className="space-y-3">
                      {galleryImages.map((image, index) => (
                        <button key={`${image}-${index}`} type="button" onClick={() => setActiveImageIndex(index)} className={`overflow-hidden rounded-xl border p-1 ${index === activeImageIndex ? "border-[#db4d62]" : "border-[#5f2b2d]"}`}>
                          <img src={image} alt="thumb" className="h-24 w-full rounded-lg object-cover" />
                        </button>
                      ))}
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-[#5f2b2d] bg-[#0d0405]">
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
                        className={`absolute right-4 top-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border bg-black/30 ${
                          isFavorite
                            ? "border-[#ff6a82] text-[#ff6a82]"
                            : "border-[#ba8a63] text-[#f2d5ba]"
                        }`}
                      >
                        {isFavorite ? <HiHeart size={24} /> : <HiOutlineHeart size={24} />}
                      </button>
                      <img src={activeImage} alt={primaryItem.bouquet.name} className="h-[620px] w-full object-cover" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-5 text-[#d6bcb5]">
                    <button type="button" onClick={() => setActiveImageIndex((value) => Math.max(0, value - 1))} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#6a3a3c]"><HiChevronLeft /></button>
                    <div className="flex gap-2">{galleryImages.map((_, index) => <span key={index} className={`h-2.5 w-2.5 rounded-full ${index === activeImageIndex ? "bg-[#e53257]" : "bg-[#6a3a3c]"}`} />)}</div>
                    <button type="button" onClick={() => setActiveImageIndex((value) => Math.min(galleryImages.length - 1, value + 1))} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#6a3a3c]"><HiChevronRight /></button>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-[#4f2224] bg-[linear-gradient(160deg,#120507,#090204_70%)] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-cormorant text-4xl leading-[0.95] text-white sm:text-5xl">{primaryItem.bouquet.name}</h2>
                    <span className="rounded-lg border border-[#7d5b3f] px-3 py-1 text-sm text-[#f0cfa5]">Bestseller</span>
                  </div>
                  <p className="mt-2 text-xl text-[#f3d8cf] sm:text-2xl">{primaryItem.bouquet.shop.name}</p>
                  <div className="mt-2 flex items-center gap-2 text-[#f1bb67]">{Array.from({ length: 5 }).map((_, index) => <HiStar key={index} className={index < Math.round(Number(primaryItem.bouquet.rating)) ? "" : "opacity-35"} />)}<span className="ml-1 text-base text-[#e8c6bd]">{primaryItem.bouquet.rating} ({primaryItem.bouquet.reviews_count} reviews)</span></div>
                  <div className="mt-4 flex flex-wrap items-end gap-3"><p className="text-4xl font-semibold text-[#ff3f67] sm:text-5xl">{formatPrice(String(sizePrice))}</p><p className="pb-1 text-xl text-[#a08c89] line-through sm:text-2xl">{formatPrice(String(basePrice * 1.18))}</p></div>
                  <p className="mt-4 text-lg leading-8 text-[#d1b0a8] sm:text-xl sm:leading-9">{primaryItem.bouquet.description ?? "A luxurious bouquet with elegant arrangement and timeless charm."}</p>

                  <p className="mt-5 text-2xl font-semibold text-[#f4d5cd]">Bouquet Size</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">{sizeOptions.map((size) => { const active = selectedSize === size.id; return <button key={size.id} type="button" onClick={() => setSelectedSize(size.id)} className={`relative rounded-2xl border px-3 py-3 text-left ${active ? "border-[#d43f5b] bg-[#2a0c12]" : "border-[#5d2e31] bg-[#0d0405]"}`}>{active ? <HiCheck className="absolute right-2 top-2 text-[#ff7890]" /> : null}<p className="text-xl text-white">{size.label}</p><p className="mt-1 text-lg text-[#d8b8af]">{formatPrice(String(basePrice * size.multiplier))}</p></button>; })}</div>

                  <p className="mt-5 text-2xl font-semibold text-[#f4d5cd]">Add-ons</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">{addonOptions.map((addon) => { const selected = selectedAddons.includes(addon.id); return <button key={addon.id} type="button" onClick={() => setSelectedAddons((prev) => prev.includes(addon.id) ? prev.filter((id) => id !== addon.id) : [...prev, addon.id])} className={`rounded-xl border px-3 py-3 text-left ${selected ? "border-[#d43f5b] bg-[#2a0c12]" : "border-[#5d2e31] bg-[#0d0405]"}`}><p className="text-lg text-white">{addon.label}</p><p className="text-base text-[#d8b8af]">{formatPrice(String(addon.price))}</p></button>; })}</div>

                  <p className="mt-5 text-2xl font-semibold text-[#f4d5cd]">Quantity</p>
                  <div className="mt-3 inline-flex items-center rounded-xl border border-[#5d2e31] bg-[#0d0405]"><button type="button" onClick={() => updateCartItemQuantity(primaryItem.id, primaryItem.quantity - 1)} className="inline-flex h-12 w-12 items-center justify-center"><HiMinus /></button><span className="inline-flex h-12 min-w-16 items-center justify-center border-x border-[#5d2e31] px-3 text-2xl">{primaryItem.quantity}</span><button type="button" onClick={() => updateCartItemQuantity(primaryItem.id, primaryItem.quantity + 1)} className="inline-flex h-12 w-12 items-center justify-center"><HiPlus /></button></div>

                  <div className="mt-6 rounded-xl border border-[#8a303f] bg-[#25090f] p-3">
                    <p className="text-lg text-[#ff7d8d]">Delivery keyingi bosqichda to'ldiriladi</p>
                    <p className="text-[#d8b2aa]">Faqat order parametrlari shu sahifada</p>
                    <p className="mt-1 text-2xl font-semibold text-white">Total: {formatPrice(String(finalPrice))}</p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={proceedToDelivery} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-lg font-semibold uppercase tracking-[0.08em] text-white"><HiOutlineShoppingBag /> Continue to delivery</button><Link to={`/shops/${primaryItem.bouquet.shop.slug}`} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-[#7f5a3b] bg-[#110608] text-lg font-semibold uppercase tracking-[0.08em] text-[#f0cfa5]"><HiOutlineSparkles /> View shop</Link></div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-[#4f2224] bg-[linear-gradient(160deg,#1b080a,#0c0304_75%)] p-5">
                <p className="font-cormorant text-4xl text-white">What Customers Say</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-[#633336] bg-[#120607] p-4">
                    <p className="text-5xl font-semibold">{averageRating ? averageRating.toFixed(1) : "0.0"}</p>
                    <p className="text-[#c3a39b]">Based on {reviews.length} reviews</p>
                  </div>
                  {reviewsQuery.isLoading ? (
                    <div className="md:col-span-3">
                      <ReviewsPanelSkeleton count={3} />
                    </div>
                  ) : null}
                  {!reviewsQuery.isLoading && topReviews.length
                    ? topReviews.map((review) => (
                        <div key={review.id} className="rounded-xl border border-[#633336] bg-[#120607] p-4">
                          <p className="font-semibold">{review.user.full_name}</p>
                          <p className="text-[#f1bb67]">
                            {"★".repeat(review.rating)}
                            <span className="opacity-35">{"★".repeat(Math.max(0, 5 - review.rating))}</span>
                          </p>
                          <p className="text-[#c3a39b]">{review.text || "Great bouquet and delivery."}</p>
                        </div>
                      ))
                    : null}
                  {!reviewsQuery.isLoading && !topReviews.length ? (
                    <div className="rounded-xl border border-[#633336] bg-[#120607] p-4 text-[#c3a39b] md:col-span-3">
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
