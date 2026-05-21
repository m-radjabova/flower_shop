import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addToCart } from "../../utils/cart";
import {
  HiArrowRight,
  HiHeart,
  HiOutlineBars3BottomLeft,
  HiOutlineHeart,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiXMark,
  HiStar,
} from "react-icons/hi2";
import { useCategories, useInfiniteBouquets } from "../../hooks/useCatalog";
import { useDebounce } from "../../hooks/useDebounce";
import { useFavoriteIds } from "../../hooks/useFavorites";
import { formatPrice, getBouquetImages, isNewBouquet } from "../../utils/catalog";
import { toggleFavoriteBouquet } from "../../utils/favorites";
import websiteBackground from "../../assets/bg4k2.png";
import { BouquetGridSkeleton } from "../../components/PageSkeletons";

function BouquetCatalog() {
  const navigate = useNavigate();
  const { register, watch, setValue } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });
  const search = watch("search");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 450);
  const favoriteIds = useFavoriteIds();
  const categoriesQuery = useCategories();
  const bouquetsQuery = useInfiniteBouquets({
    categoryId: selectedCategoryId ?? undefined,
    search: debouncedSearch || undefined,
    limit: 9,
  });

  const bouquets = useMemo(
    () => bouquetsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bouquetsQuery.data],
  );
  const total = bouquetsQuery.data?.pages[0]?.total ?? 0;
  const selectedCategory = categoriesQuery.data?.find(
    (category) => category.id === selectedCategoryId,
  );
  const hasActiveFilters = Boolean(selectedCategoryId || debouncedSearch);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && bouquetsQuery.hasNextPage && !bouquetsQuery.isFetchingNextPage) {
          bouquetsQuery.fetchNextPage();
        }
      },
      { rootMargin: "420px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [bouquetsQuery]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070102] text-[#fff6f4]">
      <img
        src={websiteBackground}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(7,1,2,0.76)_0%,rgba(7,1,2,0.68)_34%,rgba(7,1,2,0.9)_100%)]" />
      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(206,38,60,0.2),transparent_28%),radial-gradient(circle_at_86%_6%,rgba(244,180,145,0.14),transparent_24%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.38em] text-[#d9a184]">
                Full Catalog
              </p>
              <h1 className="mt-2 font-cormorant text-[3.2rem] leading-[0.92] text-[#fff0ea] sm:text-[4.6rem]">
                Find Your Bouquet
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#d7bdb6] sm:text-base">
                Search, filter, and browse every fresh bouquet in one comfortable place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-[#7b3935] bg-[#120607]/76 px-4 py-3 backdrop-blur-md">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#b88d84]">
                  Total
                </p>
                <p className="mt-1 text-2xl font-black text-white">{total}</p>
              </div>
              <div className="rounded-2xl border border-[#7b3935] bg-[#120607]/76 px-4 py-3 backdrop-blur-md">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#b88d84]">
                  Showing
                </p>
                <p className="mt-1 text-2xl font-black text-white">{bouquets.length}</p>
              </div>
              <div className="rounded-2xl border border-[#7b3935] bg-[#120607]/76 px-4 py-3 backdrop-blur-md">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#b88d84]">
                  Category
                </p>
                <p className="mt-1 truncate text-lg font-black text-white">
                  {selectedCategory?.name ?? "All"}
                </p>
              </div>
            </div>
          </div>

          <div className="sticky top-[5.9rem] z-20 mt-7 rounded-[1.4rem] border border-[#7b3935] bg-[#100506]/88 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="relative block">
                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#c88f88]" />
                    <input
                      {...register("search")}
                      placeholder="Search bouquets..."
                      className="h-13 w-full rounded-2xl border border-[#64302d] bg-[#090304]/88 pl-12 pr-12 text-sm font-semibold text-[#fff3ee] outline-none transition placeholder:text-[#9f817a] focus:border-[#d97870]"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setValue("search", "")}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#c9aaa2] transition hover:bg-[#2b1012] hover:text-white"
                        aria-label="Clear search"
                      >
                        <HiXMark />
                      </button>
                    ) : null}
                  </label>

                  <div className="inline-flex rounded-2xl border border-[#64302d] bg-[#090304]/88 p-1">
                    <button
                      type="button"
                      onClick={() => setView("grid")}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                        view === "grid" ? "bg-[#2b1012] text-[#ffd5ce]" : "text-[#ad8d85] hover:text-white"
                      }`}
                      aria-label="Grid view"
                    >
                      <HiOutlineSquares2X2 />
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                        view === "list" ? "bg-[#2b1012] text-[#ffd5ce]" : "text-[#ad8d85] hover:text-white"
                      }`}
                      aria-label="List view"
                    >
                      <HiOutlineBars3BottomLeft />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold uppercase tracking-[0.12em] transition ${
                      selectedCategoryId === null
                        ? "border-[#ff9b91] bg-[#d82d42] text-white"
                        : "border-[#68322f] bg-[#100506] text-[#dfc0b8] hover:border-[#b7655e]"
                    }`}
                  >
                    All
                  </button>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold uppercase tracking-[0.12em] transition ${
                        selectedCategoryId === category.id
                          ? "border-[#ff9b91] bg-[#d82d42] text-white"
                          : "border-[#68322f] bg-[#100506] text-[#dfc0b8] hover:border-[#b7655e]"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-[#64302d] bg-[#090304]/72 p-3 text-sm text-[#d9bcb4] lg:min-w-[220px]">
                <div className="flex items-center justify-between gap-4">
                  <span>Results</span>
                  <span className="font-black text-white">
                    {bouquets.length}/{total}
                  </span>
                </div>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("search", "");
                      setSelectedCategoryId(null);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#70413c] text-xs font-extrabold uppercase tracking-[0.12em] text-[#f1d0c8] transition hover:border-[#c87a72] hover:text-white"
                  >
                    <HiXMark />
                    Clear filters
                  </button>
                ) : (
                  <span className="inline-flex h-10 items-center text-xs font-semibold uppercase tracking-[0.14em] text-[#9f817a]">
                    No filters active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[#c9aaa2]">
            <p>
              {hasActiveFilters ? "Filtered bouquets" : "All bouquets"} sorted by newest first.
            </p>
            <p className="rounded-full border border-[#70413c] bg-[#100506]/70 px-4 py-2 font-semibold text-[#f1d0c8]">
              {selectedCategory?.name ?? "All categories"}
              {debouncedSearch ? ` • "${debouncedSearch}"` : ""}
            </p>
          </div>

          {bouquetsQuery.isLoading ? (
            <BouquetGridSkeleton count={6} className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" imageClassName="h-[300px] w-full" />
          ) : bouquets.length ? (
            <div
              className={`mt-6 grid gap-5 ${
                view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              }`}
            >
              {bouquets.map((bouquet) => {
                const previewImages = getBouquetImages(bouquet).slice(1, 3);
                const isFavorite = favoriteIds.has(bouquet.id);

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
                    className={`group relative overflow-hidden rounded-[1.7rem] border border-[#5f2825] bg-[linear-gradient(180deg,#1a0c0c_0%,#140809_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.32)] transition hover:-translate-y-1 hover:border-[#8d423d] ${
                      view === "list" ? "grid md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]" : ""
                    }`}
                  >
                    <div className="relative overflow-hidden">
                      {isNewBouquet(bouquet.created_at) ? (
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
                        {isFavorite ? (
                          <HiHeart size={20} className="text-[#ff5b72]" />
                        ) : (
                          <HiOutlineHeart size={20} />
                        )}
                      </button>
                      <img
                        src={bouquet.image}
                        alt={bouquet.name}
                        className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
                          view === "list" ? "h-full min-h-[300px]" : "h-[320px]"
                        }`}
                      />
                      {previewImages.length ? (
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

                    <div className="flex flex-col p-5">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {bouquet.category ? (
                            <span className="rounded-full border border-[#76413b] bg-[#210b0d] px-3 py-1 text-xs font-semibold text-[#f1c5ba]">
                              {bouquet.category.name}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#76413b] bg-[#120607] px-3 py-1 text-xs text-[#efc2b8]">
                            <HiStar className="text-[#f2b15e]" />
                            {bouquet.rating} ({bouquet.reviews_count})
                          </span>
                        </div>

                        <Link
                          to={`/bouquets/${bouquet.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-4 block font-cormorant text-[2.35rem] leading-none text-[#fff3ee] transition hover:text-[#ffb7ab]"
                        >
                          {bouquet.name}
                        </Link>
                        <Link
                          to={`/shops/${bouquet.shop.slug}`}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-2 block text-base font-semibold text-[#bfa09a] transition hover:text-[#ffe1d8]"
                        >
                          {bouquet.shop.name}
                        </Link>
                        {view === "list" ? (
                          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d4b8b0]">
                            {bouquet.description ??
                              "A carefully prepared bouquet for warm celebrations and elegant gifts."}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-[2.15rem] font-bold leading-none text-white">
                          {formatPrice(bouquet.price)}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCart(bouquet);
                            toast.success(`${bouquet.name} cartga qo'shildi`);
                          }}
                          className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_16px_34px_rgba(143,18,32,0.35)] transition hover:brightness-105"
                        >
                          <HiOutlineShoppingBag />
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.8rem] border border-dashed border-[#74403a] bg-[#130708]/90 p-10 text-center">
              <HiOutlineMagnifyingGlass className="mx-auto text-5xl text-[#c88f88]" />
              <h2 className="mt-4 font-cormorant text-5xl text-[#fff3ed]">No bouquets found</h2>
              <p className="mt-2 text-[#c9aba4]">Try another search or category.</p>
            </div>
          )}

          <div ref={loadMoreRef} className="h-8" />

          {bouquetsQuery.isFetchingNextPage ? (
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-3 rounded-full border border-[#68322f] bg-[#120607] px-5 py-3 text-sm font-semibold text-[#f1d0c8]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#ff6f80]" />
                Loading more bouquets
              </span>
            </div>
          ) : null}

          {!bouquetsQuery.hasNextPage && bouquets.length ? (
            <div className="mt-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#68322f] px-5 py-3 text-sm font-semibold text-[#c9aaa2]">
                You reached the end
                <HiArrowRight />
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default BouquetCatalog;
