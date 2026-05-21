import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
import { Link, useNavigate } from "react-router-dom";
import {
  HiArrowRight,
  HiHeart,
  HiOutlineGift,
  HiOutlineHeart,
  HiOutlineSparkles,
  HiOutlineShoppingBag,
  HiStar,
} from "react-icons/hi2";
import { LuCakeSlice, LuFlower2 } from "react-icons/lu";
import { TbRings } from "react-icons/tb";
import type { Bouquet, Category } from "../../types/catalog";
import { useFavoriteIds } from "../../hooks/useFavorites";
import { formatPrice, getBouquetImages, isNewBouquet } from "../../utils/catalog";
import { toggleFavoriteBouquet } from "../../utils/favorites";
import { HomeCategoriesSkeleton } from "../PageSkeletons";

const categoryIcons = {
  roses: LuFlower2,
  birthday: LuCakeSlice,
  anniversary: HiHeart,
  wedding: TbRings,
  "new-baby": HiOutlineSparkles,
  "get-well-soon": HiOutlineHeart,
};

function getCategoryIcon(slug: string) {
  return categoryIcons[slug as keyof typeof categoryIcons] ?? HiOutlineGift;
}

interface BouquetSectionProps {
  bouquets: Bouquet[];
  categories: Category[];
  isLoading: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

function BouquetSection({
  bouquets,
  categories,
  isLoading,
  selectedCategoryId,
  onSelectCategory,
}: BouquetSectionProps) {
  const navigate = useNavigate();
  const favoriteIds = useFavoriteIds();

  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-10"
    >
      <div id="categories" className="scroll-mt-28 rounded-[2rem] sm:px-6 sm:py-8">
        <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-6 md:grid">
          <div className="h-px bg-[#5b2524]" />
          <h2 className="font-cormorant text-[3rem] italic leading-none text-[#f1ddd3] lg:text-[4.25rem]">
            New Arrivals
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div className="h-px flex-1 bg-[#5b2524]" />
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#f1d5cb] transition hover:text-white"
            >
              View all
              <HiArrowRight className="text-[#cb5c57]" />
            </button>
          </div>
        </div>

        <div className="md:hidden">
          <h2 className="text-center font-cormorant text-[2.2rem] italic leading-none text-[#f1ddd3] sm:text-[3rem]">
            New Arrivals
          </h2>
        </div>

        {isLoading ? (
          <HomeCategoriesSkeleton />
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.slug);
                const active = selectedCategoryId === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(active ? null : category.id)}
                    className="group flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1"
                  >
                    <span
                      className={`inline-flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border transition-all duration-300 sm:h-[6.25rem] sm:w-[6.25rem] ${
                        active
                          ? "border-[#cf6c61] bg-[radial-gradient(circle_at_top,rgba(108,21,24,0.98),rgba(45,8,10,0.98))] text-[#ff9b88] shadow-[0_18px_38px_rgba(114,24,29,0.32)]"
                          : "border-[#6d2c2b] bg-[radial-gradient(circle_at_top,rgba(64,14,16,0.92),rgba(28,8,9,0.98))] text-[#e18974] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] group-hover:border-[#a2524b] group-hover:text-[#f1a08c]"
                      }`}
                    >
                      <Icon size={36} />
                    </span>
                    <p
                      className={`mt-3 text-base font-medium leading-snug transition-colors ${
                        active ? "text-[#fff2eb]" : "text-[#e3cec8] group-hover:text-white"
                      }`}
                    >
                      {category.name}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end md:hidden">
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#f1d5cb] transition hover:text-white"
              >
                View all
                <HiArrowRight className="text-[#cb5c57]" />
              </button>
            </div>

            <div id="bouquets" className="scroll-mt-28" />

            {bouquets.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3">
            {bouquets.map((bouquet) => {
              const bouquetImages = getBouquetImages(bouquet);
              const previewImages = bouquetImages.slice(1, 4);
              const isFavorite = favoriteIds.has(bouquet.id);
              const showNewBadge = isNewBouquet(bouquet.created_at);

              return (
              <article
                key={bouquet.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/bouquets/${bouquet.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/bouquets/${bouquet.id}`);
                  }
                }}
                className="group relative overflow-hidden rounded-[1.9rem] border border-[#5f2825] bg-[linear-gradient(180deg,#1a0c0c_0%,#140809_100%)] shadow-[0_22px_55px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#8d423d] hover:shadow-[0_28px_65px_rgba(0,0,0,0.38)]"
              >
                <div className="relative overflow-hidden">
                  {showNewBadge ? (
                    <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#ffc5ba]/35 bg-[#dd3045] px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(221,48,69,0.35)]">
                      <HiOutlineSparkles />
                      New
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      const added = toggleFavoriteBouquet(bouquet);
                      toast.success(
                        added
                          ? `${bouquet.name} favoritesga qo'shildi`
                          : `${bouquet.name} favoritesdan olib tashlandi`,
                      );
                    }}
                    className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#8c6158] bg-[#19090a]/88 text-[#f6dacf] shadow-[0_10px_25px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-transform duration-200 hover:scale-105"
                  >
                    {isFavorite ? <HiHeart size={20} className="text-[#ff5b72]" /> : <HiOutlineHeart size={20} />}
                  </button>

                  <div className="overflow-hidden border-b border-[#41201d] bg-[#2b1012]">
                    <Link to={`/bouquets/${bouquet.id}`} aria-label={`${bouquet.name} detail page`}>
                      <img
                        src={bouquet.image}
                        alt={bouquet.name}
                        className="aspect-[4/5] h-[350px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                  </div>
                  {previewImages.length > 0 ? (
                    <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                      {previewImages.map((image, index) => (
                        <img
                          key={image}
                          src={image}
                          alt={`${bouquet.name} preview ${index + 2}`}
                          className="h-12 w-12 rounded-2xl border border-white/35 object-cover shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="px-4 pb-4 pt-3">
                  <Link
                    to={`/bouquets/${bouquet.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="font-cormorant text-[1.85rem] leading-none text-[#f8ede6] transition hover:text-[#ffb4a4] sm:text-[2rem]"
                  >
                    {bouquet.name}
                  </Link>
                  <Link
                    to={`/shops/${bouquet.shop.slug}`}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-2 block text-lg font-medium text-[#b99a92] transition hover:text-[#ffe1d8]"
                  >
                    {bouquet.shop.name}
                  </Link>

                  <div className="mt-3 flex items-center gap-2 text-[1rem] text-[#dfb18f]">
                    <HiStar className="text-[1.05rem]" />
                    <span className="font-semibold">{bouquet.rating}</span>
                    <span className="text-[#b08d86]">({bouquet.reviews_count})</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[2.15rem] font-bold leading-none text-white">
                      {formatPrice(bouquet.price)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      addToCart(bouquet);
                      toast.success(`${bouquet.name} cartga qo'shildi`);
                    }}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[0.85rem] border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-base font-semibold uppercase tracking-[0.08em] text-white shadow-[0_16px_34px_rgba(143,18,32,0.35)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_20px_40px_rgba(187,36,53,0.4)] active:scale-[0.985]"
                  >
                    <HiOutlineShoppingBag className="text-base" />
                    Add to cart
                  </button>
                </div>
              </article>
              );
            })}
            </div>
            ) : (
              <div className="mt-8 rounded-[1.6rem] border border-dashed border-[#623535] bg-[#150809] px-6 py-12 text-center">
                <p className="font-cormorant text-4xl text-[#fff0ea]">No bouquets found</p>
                <p className="mt-3 text-sm leading-7 text-[#caaba5]">
                  No bouquets match your current filters. Choose another category to explore more arrangements.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectCategory(null)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#764342] bg-[#1b0b0c] px-5 py-3 text-sm font-semibold text-[#f5ddd6] transition hover:border-[#bd786f] hover:text-white"
                >
                  View all bouquets
                  <HiArrowRight />
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            to="/bouquets"
            className="group inline-flex h-13 items-center justify-center gap-3 rounded-2xl border border-[#d15a5f]/40 bg-[#180708]/82 px-7 text-sm font-extrabold uppercase tracking-[0.14em] text-[#fff0ea] shadow-[0_16px_38px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-[#ff8a8f]/60 hover:bg-[#2a0b0e]"
          >
            View all bouquets
            <HiArrowRight className="transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BouquetSection;
