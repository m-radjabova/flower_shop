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
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-cormorant text-4xl text-white">{t("myFavoritesTab")}</p>
          <p className="mt-2 text-[#d8beb8]">
            {favoriteItems.length} {t("favoritesCount")}
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-[#140709] px-4 py-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a0f14] text-[#ff9fb0]">
            <HiOutlineHeart className="text-xl" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#b7918a]">{t("savedBouquets")}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{favoriteItems.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {!favoriteItems.length ? <p className="text-[#d8beb8]">{t("noFavorites")}</p> : null}
        {favoriteItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(20,7,9,0.96),rgba(14,4,6,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            {(() => {
              const shopInstagramUrl = item.bouquet.shop.instagram ? normalizeInstagramLink(item.bouquet.shop.instagram) : "";
              const shopTelegramUrl = item.bouquet.shop.telegram ? normalizeTelegramLink(item.bouquet.shop.telegram) : "";
              return (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={item.bouquet.image}
                  alt={item.bouquet.name}
                  className="h-24 w-24 rounded-[1.2rem] object-cover ring-1 ring-white/8"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-2xl font-semibold text-white">{item.bouquet.name}</p>
                    <span className="rounded-full bg-[#2b1115] px-2.5 py-1 text-xs uppercase tracking-[0.18em] text-[#ffb4bc]">
                      {t("favorite")}
                    </span>
                  </div>
                  <Link to={`/shops/${item.bouquet.shop.slug}`} className="mt-1 inline-block text-base text-[#d6ada6] transition hover:text-[#f4d7d1]">
                    {item.bouquet.shop.name}
                  </Link>
                  {shopInstagramUrl || shopTelegramUrl ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {shopInstagramUrl ? (
                        <a
                          href={shopInstagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[#f1d5cf]"
                        >
                          <FaInstagram />
                          IG
                        </a>
                      ) : null}
                      {shopTelegramUrl ? (
                        <a
                          href={shopTelegramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[#f1d5cf]"
                        >
                          <FaTelegramPlane />
                          TG
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#c8a39b]">
                    <span className="rounded-full bg-white/[0.04] px-3 py-1.5">
                      {item.bouquet.category?.name ?? t("signature")}
                    </span>
                    <span className="rounded-full bg-white/[0.04] px-3 py-1.5">
                      {item.bouquet.reviews_count} {t("reviews")}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-[#ffe0b3]">{formatPrice(item.bouquet.price)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(item.bouquet);
                    toast.success(`${item.bouquet.name} ${t("addedToCart")}`);
                  }}
                  className="inline-flex h-11 min-w-[160px] items-center justify-center rounded-xl bg-[#2a1b0f] px-4 text-sm font-medium text-[#ffd59a] transition hover:bg-[#352113]"
                >
                  <HiOutlineShoppingBag className="mr-2 text-base" />
                  {t("addToCart")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeFavoriteBouquet(item.id);
                    toast.info(`${item.bouquet.name} ${t("removedFromFavorites")}`);
                  }}
                  className="inline-flex h-11 min-w-[160px] items-center justify-center rounded-xl bg-[#3a1116] px-4 text-sm font-medium text-[#ffb1bd] transition hover:bg-[#4a151d]"
                >
                  <HiTrash className="mr-2 text-base" />
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
