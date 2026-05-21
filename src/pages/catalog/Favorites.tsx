import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
import {
  HiHeart,
  HiOutlineBars3BottomLeft,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineSquares2X2,
  HiStar,
} from "react-icons/hi2";
import { useFavoriteItems } from "../../hooks/useFavorites";
import { formatPrice } from "../../utils/catalog";
import { removeFavoriteBouquet } from "../../utils/favorites";

type SortValue = "recent" | "priceAsc" | "priceDesc" | "ratingDesc";

function Favorites() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const { register, watch } = useForm<{ sortBy: SortValue }>({
    defaultValues: { sortBy: "recent" },
  });
  const sortBy = watch("sortBy");
  const favoriteItems = useFavoriteItems();

  const sortedFavorites = useMemo(() => {
    const list = [...favoriteItems];

    switch (sortBy) {
      case "priceAsc":
        list.sort((a, b) => Number(a.bouquet.price) - Number(b.bouquet.price));
        break;
      case "priceDesc":
        list.sort((a, b) => Number(b.bouquet.price) - Number(a.bouquet.price));
        break;
      case "ratingDesc":
        list.sort((a, b) => Number(b.bouquet.rating) - Number(a.bouquet.rating));
        break;
      case "recent":
      default:
        list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }

    return list;
  }, [favoriteItems, sortBy]);

  return (
    <main className="min-h-screen overflow-hidden bg-transparent text-[#fff6f4]">
      <section className="relative min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="relative z-10 mx-auto max-w-[1320px]">
          <div className="text-center">
            <h1 className="font-cormorant text-6xl text-[#fff3ee] sm:text-7xl">My Favorites</h1>
            <p className="mt-3 text-lg text-[#d8beb8]">Your most loved bouquets, all in one place.</p>
          </div>

          <div className="mt-10 rounded-[2rem] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#7b3a36] bg-transparent px-5 py-3 text-[#f8d9d2]">
                <HiHeart className="text-[#ff6077]" />
                <span className="text-lg font-semibold">{favoriteItems.length} items</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl border border-[#61312d] bg-transparent p-1">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                      view === "grid" ? "bg-[#2b1012]/65 text-[#ffd5ce]" : "text-[#ab8a82] hover:text-white"
                    }`}
                  >
                    <HiOutlineSquares2X2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                      view === "list" ? "bg-[#2b1012]/65 text-[#ffd5ce]" : "text-[#ab8a82] hover:text-white"
                    }`}
                  >
                    <HiOutlineBars3BottomLeft />
                  </button>
                </div>

                <select
                  {...register("sortBy")}
                  className="h-12 rounded-2xl border border-[#61312d] bg-transparent px-4 text-[#f8d9d2] outline-none transition focus:border-[#b56961]"
                >
                  <option value="recent">Recently Added</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="ratingDesc">Top Rated</option>
                </select>
              </div>
            </div>

            {sortedFavorites.length ? (
              <div
                className={`mt-6 grid gap-5 ${
                  view === "grid" ? "md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"
                }`}
              >
                {sortedFavorites.map((item) => {
                  const bouquet = item.bouquet;

                  return (
                    <article
                      key={item.id}
                      className={`group relative overflow-hidden rounded-[1.5rem] border border-[#5f2825] bg-transparent ${
                        view === "list" ? "grid gap-4 p-4 md:grid-cols-[280px_1fr_auto]" : "flex h-full flex-col"
                      }`}
                    >
                      <Link to={`/bouquets/${bouquet.id}`} className={view === "list" ? "" : "block"}>
                        <img
                          src={bouquet.image}
                          alt={bouquet.name}
                          className={`object-cover transition duration-500 group-hover:scale-105 ${
                            view === "list"
                              ? "h-52 w-full rounded-[1.1rem] md:h-full"
                              : "h-[260px] w-full border-b border-[#3e1d1b]"
                          }`}
                        />
                      </Link>

                      <div className={view === "list" ? "flex flex-col justify-center" : "flex flex-1 flex-col p-5"}>
                        <Link
                          to={`/bouquets/${bouquet.id}`}
                          className="h-[5rem] overflow-hidden font-cormorant text-[2.75rem] leading-[0.9] text-white transition hover:text-[#ffb7ab] sm:h-[5.6rem] sm:text-5xl"
                        >
                          {bouquet.name}
                        </Link>
                        <Link
                          to={`/shops/${bouquet.shop.slug}`}
                          className="mt-2 block text-lg text-[#c8a8a0] transition hover:text-[#f4d5ce]"
                        >
                          {bouquet.shop.name}
                        </Link>
                        <div className="mt-3 flex items-center gap-2 text-[#f2b15e]">
                          <HiStar />
                          <span className="font-semibold">{bouquet.rating}</span>
                          <span className="text-[#ad8b84]">({bouquet.reviews_count})</span>
                        </div>
                        <p className="mt-4 text-[2.65rem] font-bold leading-none text-white">{formatPrice(bouquet.price)}</p>
                        {view === "grid" ? (
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(bouquet);
                              toast.success(`${bouquet.name} cartga qo'shildi`);
                            }}
                            className="mt-10 inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-base font-semibold uppercase tracking-[0.08em] text-white"
                          >
                            <HiOutlineShoppingBag />
                            Add to cart
                          </button>
                        ) : null}
                      </div>

                      <div className={view === "list" ? "flex flex-col justify-between py-2" : "px-5 pb-5"}>
                        <button
                          type="button"
                          onClick={() => {
                            removeFavoriteBouquet(item.id);
                            toast.info(`${bouquet.name} favoritesdan olib tashlandi`);
                          }}
                          className={`inline-flex items-center justify-center rounded-full border border-[#8a4e49] bg-transparent text-[#ffd5ce] transition hover:border-[#ff6f7f] hover:text-[#ff6077] ${
                            view === "list" ? "h-11 w-11 self-end" : "absolute right-4 top-4 h-11 w-11"
                          }`}
                        >
                          <HiOutlineHeart />
                        </button>

                        {view === "list" ? (
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(bouquet);
                              toast.success(`${bouquet.name} cartga qo'shildi`);
                            }}
                            className="mt-10 inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white md:mt-0"
                          >
                            <HiOutlineShoppingBag />
                            Add to cart
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#74403a] bg-transparent p-10 text-center">
                <HiOutlineHeart className="mx-auto text-5xl text-[#c88f88]" />
                <h2 className="mt-4 font-cormorant text-5xl text-[#fff3ed]">No favorites yet</h2>
                <p className="mt-2 text-[#c9aba4]">Save bouquets you love and they will appear here.</p>
                <Link
                  to="/#bouquets"
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white"
                >
                  Explore bouquets
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Favorites;
