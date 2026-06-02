import { useMemo, useState, type ChangeEvent } from "react";
import { Drawer } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  HiOutlineArrowUpTray,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useCategories } from "../../hooks/useCatalog";
import {
  useCreateBouquet,
  useDeleteBouquet,
  useManagedBouquets,
  useMyShops,
  useUpdateBouquet,
  useUploadImage,
} from "../../hooks/useCatalog";
import type { Bouquet, BouquetAddonOption, BouquetCreatePayload, BouquetSizeKey, BouquetSizeOption } from "../../types/catalog";
import { formatPrice } from "../../utils/catalog";
import { getBouquetSizeOptions, SIZE_ORDER } from "../../utils/bouquetOptions";
import bow from "../../assets/bow.png";

type SizeField = {
  enabled: boolean;
  price: string;
  image: string;
};

type AddonField = {
  id: string;
  name: string;
  price: string;
  image: string;
};

type BouquetFormValues = {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  compound: string;
  old_price: string;
  stock: number;
  status: "active" | "inactive" | "sold_out";
  size_fields: Record<BouquetSizeKey, SizeField>;
  addon_fields: [AddonField, AddonField, AddonField];
};

const createSizeFields = (): Record<BouquetSizeKey, SizeField> => ({
  small: { enabled: false, price: "", image: "" },
  medium: { enabled: false, price: "", image: "" },
  large: { enabled: false, price: "", image: "" },
  premium: { enabled: false, price: "", image: "" },
});

const createAddonFields = (): [AddonField, AddonField, AddonField] => ([
  { id: "addon_1", name: "", price: "", image: "" },
  { id: "addon_2", name: "", price: "", image: "" },
  { id: "addon_3", name: "", price: "", image: "" },
]);

const defaultValues: BouquetFormValues = {
  category_id: "",
  name: "",
  slug: "",
  description: "",
  compound: "",
  old_price: "",
  stock: 0,
  status: "active",
  size_fields: createSizeFields(),
  addon_fields: createAddonFields(),
};

function mapBouquetToFormValues(bouquet: Bouquet): BouquetFormValues {
  const sizeFields = createSizeFields();
  const sizeOptions = getBouquetSizeOptions(bouquet);

  sizeOptions.forEach((option) => {
    sizeFields[option.key] = {
      enabled: true,
      price: option.price,
      image: option.image,
    };
  });

  const addonFields = createAddonFields();
  (bouquet.addon_options ?? []).slice(0, 3).forEach((addon, index) => {
    addonFields[index] = {
      id: addon.id,
      name: addon.name,
      price: addon.price,
      image: addon.image,
    };
  });

  return {
    category_id: bouquet.category_id ?? "",
    name: bouquet.name,
    slug: bouquet.slug,
    description: bouquet.description ?? "",
    compound: bouquet.compound ?? "",
    old_price: bouquet.old_price ?? "",
    stock: bouquet.stock,
    status: bouquet.status,
    size_fields: sizeFields,
    addon_fields: addonFields,
  };
}

function OwnerBouquets() {
  const { t } = useTranslation();
  const { data: shops = [] } = useMyShops();
  const selectedShopId = shops[0]?.id;
  const { data: bouquets = [], isLoading } = useManagedBouquets(selectedShopId);
  const { data: categories = [] } = useCategories();
  const createBouquetMutation = useCreateBouquet();
  const updateBouquetMutation = useUpdateBouquet();
  const deleteBouquetMutation = useDeleteBouquet();
  const uploadImageMutation = useUploadImage();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBouquet, setEditingBouquet] = useState<Bouquet | null>(null);
  const [deletingBouquet, setDeletingBouquet] = useState<Bouquet | null>(null);
  const form = useForm<BouquetFormValues>({ defaultValues });
  const sizeFields = form.watch("size_fields");
  const addonFields = form.watch("addon_fields");
  const sizeLabels = useMemo(
    () => ({
      small: t("owner.sizeSmall"),
      medium: t("owner.sizeMedium"),
      large: t("owner.sizeLarge"),
      premium: t("owner.sizePremium"),
    }),
    [t],
  );

  const activeCount = useMemo(() => bouquets.filter((bouquet) => bouquet.status === "active").length, [bouquets]);

  const openCreate = () => {
    setEditingBouquet(null);
    form.reset(defaultValues);
    setFormOpen(true);
  };

  const openEdit = (bouquet: Bouquet) => {
    setEditingBouquet(bouquet);
    form.reset(mapBouquetToFormValues(bouquet));
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingBouquet(null);
    setFormOpen(false);
    form.reset(defaultValues);
  };

  const handleUploadSizeImage = async (sizeKey: BouquetSizeKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadImageMutation.isPending) return;
    try {
      const uploaded = await uploadImageMutation.mutateAsync(file);
      form.setValue(`size_fields.${sizeKey}.image`, uploaded.url, { shouldDirty: true });
      form.setValue(`size_fields.${sizeKey}.enabled`, true, { shouldDirty: true });
      toast.success(`${sizeLabels[sizeKey]} ${t("owner.imageUploaded")}`);
    } catch {
      toast.error(t("owner.imageUploadError"));
    } finally {
      event.target.value = "";
    }
  };

  const handleUploadAddonImage = async (index: 0 | 1 | 2, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadImageMutation.isPending) return;
    try {
      const uploaded = await uploadImageMutation.mutateAsync(file);
      form.setValue(`addon_fields.${index}.image`, uploaded.url, { shouldDirty: true });
      toast.success(`${t("owner.addOn")} ${index + 1} ${t("owner.imageUploaded")}`);
    } catch {
      toast.error(t("owner.imageUploadError"));
    } finally {
      event.target.value = "";
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedShopId) {
      toast.error(t("owner.shopNotFound"));
      return;
    }

    const enabledSizeOptions = SIZE_ORDER
      .filter((key) => values.size_fields[key].enabled)
      .map((key) => ({
        key,
        label: sizeLabels[key],
        price: values.size_fields[key].price.trim(),
        image: values.size_fields[key].image.trim(),
      }));

    if (!enabledSizeOptions.length) {
      toast.error(t("owner.chooseAtLeastOneSize"));
      return;
    }

    const invalidSize = enabledSizeOptions.find((option) => !option.price || !option.image);
    if (invalidSize) {
      toast.error(t("owner.sizeRequiresPriceImage", { size: invalidSize.label }));
      return;
    }

    const sizeOptions: BouquetSizeOption[] = enabledSizeOptions;

    const enteredAddons = values.addon_fields
      .map((addon, index) => ({
        id: (addon.id || `addon_${index + 1}`).trim().toLowerCase().replace(/\s+/g, "_"),
        name: addon.name.trim(),
        price: addon.price.trim(),
        image: addon.image.trim(),
      }))
      .filter((addon) => addon.name || addon.price || addon.image);

    const invalidAddon = enteredAddons.find((addon) => !addon.name || !addon.price || !addon.image);
    if (invalidAddon) {
      toast.error(t("owner.addOnRequiresFields"));
      return;
    }

    const addonOptions: BouquetAddonOption[] = enteredAddons;

    const defaultSize = sizeOptions.find((item) => item.key === "medium") ?? sizeOptions[0];
    const payload: BouquetCreatePayload = {
      shop_id: selectedShopId,
      category_id: values.category_id || null,
      name: values.name.trim(),
      slug: values.slug.trim() || undefined,
      description: values.description.trim() || undefined,
      compound: values.compound.trim() || undefined,
      price: defaultSize.price,
      old_price: values.old_price.trim() || null,
      size: sizeOptions.map((item) => item.label).join(", "),
      size_options: sizeOptions,
      addon_options: addonOptions,
      stock: Number(values.stock),
      status: values.status,
      image: defaultSize.image,
      images: sizeOptions.map((item) => item.image),
    };

    try {
      if (editingBouquet) {
        await updateBouquetMutation.mutateAsync({
          bouquetId: editingBouquet.id,
          payload: {
            category_id: payload.category_id,
            name: payload.name,
            slug: payload.slug,
            description: payload.description,
            compound: payload.compound,
            price: payload.price,
            old_price: payload.old_price,
            size: payload.size,
            size_options: payload.size_options,
            addon_options: payload.addon_options,
            stock: payload.stock,
            status: payload.status,
            image: payload.image,
            images: payload.images,
          },
        });
        toast.success(t("owner.bouquetUpdated"));
      } else {
        await createBouquetMutation.mutateAsync(payload);
        toast.success(t("owner.bouquetCreated"));
      }
      closeForm();
    } catch {
      toast.error(t("owner.bouquetSaveError"));
    }
  });

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
            <p className="mt-2 text-[#d8b7b0]">{t("owner.bouquetsControlDesc")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#180709] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.activeBouquets")}</p>
              <p className="mt-1 text-3xl font-semibold text-white">{activeCount}</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#9a1828] to-[#c82f45] px-5 text-sm font-semibold text-white"
            >
              <HiOutlinePlus className="text-lg" />
              {t("owner.addBouquet")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-[1.6rem] border border-[#3d171c] bg-[#160709]" />
          ))
        ) : bouquets.map((bouquet) => {
          const sizeOptions = getBouquetSizeOptions(bouquet);
          return (
            <article key={bouquet.id} className="overflow-hidden rounded-[1.6rem] border border-[#3d171c]/70 bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))]">
              <div className="relative h-52">
                <img src={bouquet.image} alt={bouquet.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,2,3,0.85))]" />
                <span className="absolute right-4 top-4 rounded-full bg-[#120607] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d9d2]">
                  {bouquet.status}
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
                  <button type="button" onClick={() => openEdit(bouquet)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#4a1d22] bg-[#180709] px-4 text-sm font-semibold text-[#f5dfd9]">
                    <HiOutlinePencilSquare />
                    {t("owner.edit")}
                  </button>
                  <button type="button" onClick={() => setDeletingBouquet(bouquet)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#6d3740] bg-[#220c10] px-4 text-sm font-semibold text-[#f6d7d1]">
                    <HiOutlineTrash />
                    {t("owner.delete")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <Drawer
        anchor="right"
        open={formOpen}
        onClose={closeForm}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 680 },
              maxWidth: "100vw",
              background: "linear-gradient(180deg,#140507 0%,#1b070b 42%,#0d0305 100%)",
              borderLeft: "1px solid #4a1d22",
            },
          },
        }}
      >
        <form onSubmit={onSubmit} className="flex h-full flex-col text-[#fff6f4]">
          <div className="flex items-center justify-between border-b border-[#4a1d22] px-5 py-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#d2a9a2]">{t("owner.bouquetEditor")}</p>
              <h2 className="mt-1 font-cormorant text-4xl text-white">{editingBouquet ? t("owner.editBouquet") : t("owner.newBouquet")}</h2>
            </div>
            <button type="button" onClick={closeForm} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#4a1d22] text-white">
              <HiOutlineXMark />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.name")}</span>
              <input {...form.register("name", { required: true })} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.category")}</span>
                <select {...form.register("category_id")} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none">
                  <option value="">{t("owner.noCategory")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.slug")}</span>
                <input {...form.register("slug")} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.description")}</span>
              <textarea {...form.register("description")} rows={3} className="w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-white outline-none" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.compound")}</span>
              <textarea {...form.register("compound")} rows={3} className="w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-white outline-none" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.oldPrice")}</span>
                <input {...form.register("old_price")} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" placeholder={t("owner.optional")} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.stock")}</span>
                <input type="number" {...form.register("stock", { valueAsNumber: true })} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.status")}</span>
              <select {...form.register("status")} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none">
                <option value="active">{t("owner.active")}</option>
                <option value="inactive">{t("owner.inactive")}</option>
                <option value="sold_out">{t("owner.soldOut")}</option>
              </select>
            </label>

            <section className="rounded-[1.4rem] border border-[#4a1d22] bg-[#180709] p-4">
              <div>
                <p className="text-base font-semibold text-[#f0d7d1]">{t("owner.bouquetSizes")}</p>
                <p className="mt-1 text-sm text-[#caa29a]">{t("owner.bouquetSizesDesc")}</p>
              </div>

              <div className="mt-4 space-y-4">
                {SIZE_ORDER.map((sizeKey) => {
                  const sizeField = sizeFields[sizeKey];
                  return (
                    <div key={sizeKey} className={`rounded-2xl border border-[#4a1d22] bg-[#120607] p-4 transition ${sizeField.enabled ? "opacity-100" : "opacity-75"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-3 text-white">
                          <input
                            type="checkbox"
                            checked={sizeField.enabled}
                            onChange={(event) => {
                              form.setValue(`size_fields.${sizeKey}.enabled`, event.target.checked, { shouldDirty: true });
                              if (!event.target.checked) {
                                form.setValue(`size_fields.${sizeKey}.price`, "", { shouldDirty: true });
                                form.setValue(`size_fields.${sizeKey}.image`, "", { shouldDirty: true });
                              }
                            }}
                            className="h-4 w-4 rounded border-[#8c4651] bg-[#180709]"
                          />
                          <span className="text-lg font-semibold">{sizeLabels[sizeKey]}</span>
                        </label>
                        {sizeField.image ? (
                          <img src={sizeField.image} alt={sizeLabels[sizeKey]} className="h-14 w-14 rounded-2xl object-cover" />
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                        <input
                          {...form.register(`size_fields.${sizeKey}.price`)}
                          disabled={!sizeField.enabled}
                          placeholder={t("owner.sizePricePlaceholder", {
                            size: sizeLabels[sizeKey],
                            price:
                              sizeKey === "small"
                                ? "72.00"
                                : sizeKey === "medium"
                                  ? "85.00"
                                  : sizeKey === "large"
                                    ? "110.00"
                                    : "140.00",
                          })}
                          className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <label className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#8c4651] px-4 text-sm font-semibold ${sizeField.enabled ? "cursor-pointer bg-[#2a1015] text-[#f3c4cb]" : "cursor-not-allowed bg-[#1a0b0e] text-[#8f6d71]"}`}>
                          <HiOutlineArrowUpTray />
                          {t("owner.uploadImage")}
                          <input type="file" accept="image/*" className="hidden" disabled={!sizeField.enabled} onChange={(event) => handleUploadSizeImage(sizeKey, event)} />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.4rem] border border-[#4a1d22] bg-[#180709] p-4">
              <div>
                <p className="text-base font-semibold text-[#f0d7d1]">{t("owner.addOns")}</p>
                <p className="mt-1 text-sm text-[#caa29a]">{t("owner.addOnsDesc")}</p>
              </div>

              <div className="mt-4 space-y-4">
                {[0, 1, 2].map((index) => {
                  const addon = addonFields[index as 0 | 1 | 2];
                  return (
                    <div key={index} className="rounded-2xl border border-[#4a1d22] bg-[#120607] p-4">
                      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.7fr_auto]">
                        <input
                          {...form.register(`addon_fields.${index as 0 | 1 | 2}.name`)}
                          placeholder={index === 0 ? t("owner.exampleChocolateBox") : index === 1 ? t("owner.exampleFruitBasket") : t("owner.exampleGreetingCard")}
                          className="h-12 rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                        />
                        <input
                          {...form.register(`addon_fields.${index as 0 | 1 | 2}.price`)}
                          placeholder={index === 0 ? t("owner.examplePrice12") : index === 1 ? t("owner.examplePrice15") : t("owner.examplePrice4")}
                          className="h-12 rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                        />
                        <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#8c4651] bg-[#2a1015] px-4 text-sm font-semibold text-[#f3c4cb]">
                          <HiOutlineArrowUpTray />
                          {t("owner.uploadImage")}
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUploadAddonImage(index as 0 | 1 | 2, event)} />
                        </label>
                      </div>
                      {addon.image ? (
                        <img src={addon.image} alt={addon.name || t("owner.addonAlt", { index: index + 1 })} className="mt-3 h-28 w-full rounded-2xl object-cover" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="border-t border-[#4a1d22] px-5 py-4">
            <button
              type="submit"
              disabled={createBouquetMutation.isPending || updateBouquetMutation.isPending}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-6 text-base font-semibold text-white disabled:opacity-60"
            >
              {createBouquetMutation.isPending || updateBouquetMutation.isPending ? t("owner.saving") : editingBouquet ? t("owner.updateBouquet") : t("owner.createBouquet")}
            </button>
          </div>
        </form>
      </Drawer>

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
