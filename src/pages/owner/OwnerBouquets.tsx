import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineTrash,
} from "react-icons/hi2";
import {
  useDeleteBouquet,
  useManagedBouquets,
  useMyShops,
} from "../../hooks/useCatalog";
import type { Bouquet } from "../../types/catalog";
import { formatPrice } from "../../utils/catalog";
import { getBouquetSizeOptions } from "../../utils/bouquetOptions";
import bow from "../../assets/bow.png";

function OwnerBouquets() {
  const { t } = useTranslation();
  const { data: shops = [] } = useMyShops();
  const selectedShopId = shops[0]?.id;
  const { data: bouquets = [], isLoading } = useManagedBouquets(selectedShopId);
  const deleteBouquetMutation = useDeleteBouquet();
  const [deletingBouquet, setDeletingBouquet] = useState<Bouquet | null>(null);
  const statusLabels = useMemo(
    () => ({
      active: t("owner.active"),
      inactive: t("owner.inactive"),
      sold_out: t("owner.soldOut"),
    }),
    [t],
  );
  const activeCount = useMemo(() => bouquets.filter((bouquet) => bouquet.status === "active").length, [bouquets]);

  const handleDeleteBouquet = async () => {
    if (!deletingBouquet || !selectedShopId || deleteBouquetMutation.isPending) return;
    try {
      await deleteBouquetMutation.mutateAsync({ bouquetId: deletingBouquet.id, shopId: selectedShopId });
      toast.success(t("owner.bouquetDeleted"));
      setDeletingBouquet(null);
    } catch {
      toast.error(t("owner.bouquetDeleteError"));
    }
  };

  if (!selectedShopId) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-[#4a1d22] bg-[#180709] px-5 py-16 text-center text-[#cfaaa2]">
        {t("owner.noBouquetAccess")}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-6 sm:p-8">
        <img
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-[#d6a89d]">{t("owner.ownerPanel")}</p>
            <h1 className="mt-3 font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">{t("owner.bouquetsControl")}</h1>
            <p className="mt-2 max-w-2xl text-[#d8b7b0]">{t("owner.bouquetsControlDesc")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#180709] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.activeBouquets")}</p>
              <p className="mt-1 text-3xl font-semibold text-white">{activeCount}</p>
            </div>
            <Link
              to="/owner/bouquets/create"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#9a1828] to-[#c82f45] px-5 text-sm font-semibold text-white"
            >
              <HiOutlinePlus className="text-lg" />
              {t("owner.addBouquet")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-[1.6rem] border border-[#3d171c] bg-[#160709]" />
          ))
        ) : bouquets.length ? bouquets.map((bouquet) => {
          const sizeOptions = getBouquetSizeOptions(bouquet);
          return (
            <article key={bouquet.id} className="overflow-hidden rounded-[1.6rem] border border-[#3d171c]/70 bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))]">
              <div className="relative h-52">
                <img src={bouquet.image} alt={bouquet.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,2,3,0.85))]" />
                <span className="absolute right-4 top-4 rounded-full bg-[#120607] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d9d2]">
                  {statusLabels[bouquet.status]}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-cormorant text-4xl text-white">{bouquet.name}</p>
                    <p className="mt-1 text-sm text-[#cbaba4]">{bouquet.category?.name ?? t("owner.noCategory")}</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#251007] text-[#f2be7f]">
                    <HiOutlineSparkles />
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-[#ecd8d2]">
                  <span>{t("owner.from")} {formatPrice(bouquet.price)}</span>
                  <span>{t("owner.stock")} {bouquet.stock}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#f4d5cd]">
                  {sizeOptions.map((option) => (
                    <span key={option.key} className="rounded-full border border-[#4a1d22] bg-[#180709] px-3 py-1">
                      {option.label}: {formatPrice(option.price)}
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(bouquet.addon_options ?? []).map((addon) => (
                    <div key={addon.id} className="overflow-hidden rounded-2xl border border-[#4a1d22] bg-[#130608]">
                      <img src={addon.image} alt={addon.name} className="h-20 w-full object-cover" />
                      <div className="p-2 text-xs text-[#ddb7af]">
                        <p className="truncate font-semibold text-[#f7ddd5]">{addon.name}</p>
                        <p>+{formatPrice(addon.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#cfaaa2]">{bouquet.description ?? t("owner.noDescriptionShort")}</p>
                <div className="mt-5 flex gap-2">
                  <Link
                    to={`/owner/bouquets/${bouquet.id}/edit`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#4a1d22] bg-[#180709] px-4 text-sm font-semibold text-[#f5dfd9]"
                  >
                    <HiOutlinePencilSquare />
                    {t("owner.edit")}
                  </Link>
                  <button type="button" onClick={() => setDeletingBouquet(bouquet)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#6d3740] bg-[#220c10] px-4 text-sm font-semibold text-[#f6d7d1]">
                    <HiOutlineTrash />
                    {t("owner.delete")}
                  </button>
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="md:col-span-2 xl:col-span-3">
            <div className="rounded-[1.8rem] border border-dashed border-[#4a1d22] bg-[#180709] px-6 py-14 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-[#c79f97]">{t("owner.bouquetsControl")}</p>
              <h2 className="mt-3 font-cormorant text-4xl text-white">{t("owner.noBouquetsYet")}</h2>
              <p className="mt-3 text-[#cfaaa2]">{t("owner.noBouquetsOwnerDesc")}</p>
              <Link
                to="/owner/bouquets/create"
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#9a1828] to-[#c82f45] px-5 text-sm font-semibold text-white"
              >
                <HiOutlinePlus className="text-lg" />
                {t("owner.addBouquet")}
              </Link>
            </div>
          </div>
        )}
      </section>

      {deletingBouquet ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#643335] bg-[#100507] p-5">
            <h3 className="font-cormorant text-3xl text-white">{t("owner.deleteBouquetTitle")}</h3>
            <p className="mt-3 text-sm leading-6 text-[#ddb8b0]">
              <span className="font-semibold text-white">{deletingBouquet.name}</span> {t("owner.deleteBouquetWarning")}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeletingBouquet(null)} className="inline-flex h-11 items-center justify-center rounded-full border border-[#6b3a3c] px-5 text-sm font-semibold text-[#f1d5cb]">
                {t("owner.cancel")}
              </button>
              <button type="button" onClick={handleDeleteBouquet} disabled={deleteBouquetMutation.isPending} className="inline-flex h-11 items-center justify-center rounded-full border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] disabled:opacity-60">
                {deleteBouquetMutation.isPending ? t("owner.deleting") : t("owner.yesDelete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OwnerBouquets;
