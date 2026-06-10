import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaInstagram, FaTelegramPlane } from "react-icons/fa";
import { HiOutlineHeart, HiOutlineShoppingBag, HiTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import type { Bouquet } from "../../../types/catalog";
import { formatPrice } from "../../../utils/catalog";
import { addToCart } from "../../../utils/cart";
import { removeFavoriteBouquet } from "../../../utils/favorites";
import { normalizeInstagramLink, normalizeTelegramLink } from "../../../utils/social";

interface FavoriteItem {
  id: string;
  bouquet: Bouquet;
}

interface FavoritesTabProps {
  favoriteItems: FavoriteItem[];
}

function FavoritesTab({ favoriteItems }: FavoritesTabProps) {
  const { t } = useTranslation(undefined, { keyPrefix: "profile" });

  return (
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="font-cormorant text-3xl text-white sm:text-4xl">{t("myFavoritesTab")}</p>
          <p className="mt-1 text-sm text-[#d8beb8]">
            {favoriteItems.length} {t("favoritesCount")}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/8 bg-[#140709] px-3 py-2 sm:px-4 sm:py-3 sm:gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2a0f14] text-[#ff9fb0] sm:h-11 sm:w-11">
            <HiOutlineHeart className="text-base sm:text-xl" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#b7918a] sm:text-xs">{t("savedBouquets")}</p>
            <p className="mt-0.5 text-xl font-semibold text-white sm:mt-1 sm:text-2xl">{favoriteItems.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
        {!favoriteItems.length ? <p className="text-sm text-[#d8beb8]">{t("noFavorites")}</p> : null}
        {favoriteItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(20,7,9,0.96),rgba(14,4,6,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            {(() => {
              const shopInstagramUrl = item.bouquet.shop.instagram ? normalizeInstagramLink(item.bouquet.shop.instagram) : "";
              const shopTelegramUrl = item.bouquet.shop.telegram ? normalizeTelegramLink(item.bouquet.shop.telegram) : "";
              return (
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <img loading="lazy" decoding="async"
                  src={item.bouquet.image}
                  alt={item.bouquet.name}
                  className="h-20 w-20 shrink-0 rounded-[1.2rem] object-cover ring-1 ring-white/8 sm:h-24 sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p className="text-lg font-semibold text-white sm:text-2xl">{item.bouquet.name}</p>
                    <span className="rounded-full bg-[#2b1115] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#ffb4bc] sm:px-2.5 sm:py-1 sm:text-xs">
                      {t("favorite")}
                    </span>
                  </div>
                  <Link to={`/shops/${item.bouquet.shop.slug}`} className="mt-0.5 inline-block text-sm text-[#d6ada6] transition hover:text-[#f4d7d1] sm:mt-1 sm:text-base">
                    {item.bouquet.shop.name}
                  </Link>
                  {shopInstagramUrl || shopTelegramUrl ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                      {shopInstagramUrl ? (
                        <a
                          href={shopInstagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#f1d5cf] sm:px-3 sm:py-1.5 sm:text-[11px]"
                        >
                          <FaInstagram className="text-xs" />
                          IG
                        </a>
                      ) : null}
                      {shopTelegramUrl ? (
                        <a
                          href={shopTelegramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#f1d5cf] sm:px-3 sm:py-1.5 sm:text-[11px]"
                        >
                          <FaTelegramPlane className="text-xs" />
                          TG
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#c8a39b] sm:mt-3 sm:gap-2 sm:text-sm">
                    <span className="rounded-full bg-white/[0.04] px-2 py-1 sm:px-3 sm:py-1.5">
                      {item.bouquet.category?.name ?? t("signature")}
                    </span>
                    <span className="rounded-full bg-white/[0.04] px-2 py-1 sm:px-3 sm:py-1.5">
                      {item.bouquet.reviews_count} {t("reviews")}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[#ffe0b3] sm:mt-4 sm:text-3xl">{formatPrice(item.bouquet.price)}</p>
                </div>
              </div>

              <div className="flex gap-2 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(item.bouquet);
                    toast.success(`${item.bouquet.name} ${t("addedToCart")}`);
                  }}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#2a1b0f] px-3 text-xs font-medium text-[#ffd59a] transition hover:bg-[#352113] sm:h-11 sm:min-w-[160px] sm:px-4 sm:text-sm"
                >
                  <HiOutlineShoppingBag className="mr-1.5 text-sm sm:mr-2 sm:text-base" />
                  {t("addToCart")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeFavoriteBouquet(item.id);
                    toast.info(`${item.bouquet.name} ${t("removedFromFavorites")}`);
                  }}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#3a1116] px-3 text-xs font-medium text-[#ffb1bd] transition hover:bg-[#4a151d] sm:h-11 sm:min-w-[160px] sm:px-4 sm:text-sm"
                >
                  <HiTrash className="mr-1.5 text-sm sm:mr-2 sm:text-base" />
                  {t("remove")}
                </button>
              </div>
            </div>
              );
            })()}
          </article>
        ))}
      </div>
    </div>
  );
}

export default FavoritesTab;
