import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowUpTray,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlinePhoto,
  HiOutlineTag,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineArchiveBox,
  HiOutlineEye,
  HiOutlinePlusCircle,
  HiOutlineInformationCircle,
  HiOutlineRocketLaunch,
  HiOutlineCubeTransparent,
} from "react-icons/hi2";
import {
  useBouquet,
  useCategories,
  useCreateBouquet,
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

type DeleteImagePrompt =
  | { type: "size"; sizeKey: BouquetSizeKey; label: string }
  | { type: "addon"; index: 0 | 1 | 2; label: string };

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
const ADDON_INDEXES = [0, 1, 2] as const;

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function blockNegativeNumberInput(event: ReactKeyboardEvent<HTMLInputElement>) {
  if (event.key === "-" || event.key === "Minus") {
    event.preventDefault();
  }
}

function normalizeNonNegativeValue(value: string) {
  return value.replace(/-/g, "");
}

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

function OwnerBouquetEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bouquetId } = useParams();
  const isEditMode = Boolean(bouquetId);
  const { data: shops = [] } = useMyShops();
  const selectedShopId = shops[0]?.id;
  const { data: categories = [] } = useCategories();
  const { data: bouquet, isLoading: isBouquetLoading, isError: isBouquetError } = useBouquet(bouquetId);
  const createBouquetMutation = useCreateBouquet();
  const updateBouquetMutation = useUpdateBouquet();
  const uploadImageMutation = useUploadImage();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty, dirtyFields },
  } = useForm<BouquetFormValues>({ defaultValues });
  const sizeFields = useWatch({ control, name: "size_fields" }) ?? createSizeFields();
  const addonFields = useWatch({ control, name: "addon_fields" }) ?? createAddonFields();
  const bouquetName = useWatch({ control, name: "name" }) ?? "";
  const bouquetDescription = useWatch({ control, name: "description" }) ?? "";
  const bouquetStatus = useWatch({ control, name: "status" }) ?? "active";
  const slugValue = useWatch({ control, name: "slug" }) ?? "";
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [deleteImagePrompt, setDeleteImagePrompt] = useState<DeleteImagePrompt | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const previousAutoSlugRef = useRef("");
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const sizeLabels = useMemo(
    () => ({
      small: t("owner.sizeSmall"),
      medium: t("owner.sizeMedium"),
      large: t("owner.sizeLarge"),
      premium: t("owner.sizePremium"),
    }),
    [t],
  );
  const statusLabels = useMemo(
    () => ({
      active: t("owner.active"),
      inactive: t("owner.inactive"),
      sold_out: t("owner.soldOut"),
    }),
    [t],
  );
  const changedFieldsCount = useMemo(
    () => Object.keys(dirtyFields).length,
    [dirtyFields],
  );
  const initialValues = useMemo(
    () => (isEditMode && bouquet ? mapBouquetToFormValues(bouquet) : defaultValues),
    [bouquet, isEditMode],
  );

  useEffect(() => {
    reset(initialValues);
    previousAutoSlugRef.current = initialValues.slug;
  }, [initialValues, reset]);

  useEffect(() => {
    const nextSlug = createSlug(bouquetName);
    const currentSlug = slugValue.trim();
    const shouldAutoUpdate =
      !dirtyFields.slug
      || currentSlug === ""
      || currentSlug === previousAutoSlugRef.current;

    if (!shouldAutoUpdate || currentSlug === nextSlug) {
      if (!dirtyFields.slug) {
        previousAutoSlugRef.current = currentSlug;
      }
      return;
    }

    setValue("slug", nextSlug, { shouldDirty: false });
    previousAutoSlugRef.current = nextSlug;
  }, [bouquetName, dirtyFields.slug, setValue, slugValue]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (nextPath === currentPath) return;

      event.preventDefault();
      pendingNavigationRef.current = () => navigate(nextPath);
      setConfirmLeaveOpen(true);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [isDirty, navigate]);

  const closeLeaveDialog = () => {
    pendingNavigationRef.current = null;
    setConfirmLeaveOpen(false);
  };

  const confirmLeave = () => {
    const proceed = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setConfirmLeaveOpen(false);
    proceed?.();
  };

  const buildSizePricePlaceholder = (sizeLabel: string, priceExample: string) => {
    return t("owner.sizePricePlaceholder", {
      size: sizeLabel,
      price: priceExample,
    });
  };

  const enabledSizeOptions = useMemo(
    () => SIZE_ORDER.filter((key) => sizeFields[key].enabled).map((key) => ({
      key,
      label: sizeLabels[key],
      price: sizeFields[key].price.trim(),
      image: sizeFields[key].image.trim(),
    })),
    [sizeFields, sizeLabels],
  );

  const enteredAddons = useMemo(
    () => addonFields
      .map((addon, index) => ({
        id: (addon.id || `addon_${index + 1}`).trim().toLowerCase().replace(/\s+/g, "_"),
        name: addon.name.trim(),
        price: addon.price.trim(),
        image: addon.image.trim(),
      }))
      .filter((addon) => addon.name || addon.price || addon.image),
    [addonFields],
  );

  const isSaving = createBouquetMutation.isPending || updateBouquetMutation.isPending;

  const handleUploadSizeImage = async (sizeKey: BouquetSizeKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadImageMutation.isPending) return;
    try {
      const uploaded = await uploadImageMutation.mutateAsync(file);
      setValue(`size_fields.${sizeKey}.image`, uploaded.url, { shouldDirty: true });
      setValue(`size_fields.${sizeKey}.enabled`, true, { shouldDirty: true });
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
      setValue(`addon_fields.${index}.image`, uploaded.url, { shouldDirty: true });
      toast.success(`${t("owner.addOn")} ${index + 1} ${t("owner.imageUploaded")}`);
    } catch {
      toast.error(t("owner.imageUploadError"));
    } finally {
      event.target.value = "";
    }
  };

  const handleNonNegativeInput = (event: ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeNonNegativeValue(event.target.value);
    if (normalized !== event.target.value) {
      event.target.value = normalized;
    }
  };

  const requestRemoveSizeImage = (sizeKey: BouquetSizeKey) => {
    setDeleteImagePrompt({ type: "size", sizeKey, label: sizeLabels[sizeKey] });
  };

  const requestRemoveAddonImage = (index: 0 | 1 | 2) => {
    setDeleteImagePrompt({ type: "addon", index, label: `${t("owner.addOn")} ${index + 1}` });
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedShopId) {
      toast.error(t("owner.shopNotFound"));
      return;
    }

    const sizeOptions = SIZE_ORDER
      .filter((key) => values.size_fields[key].enabled)
      .map((key) => ({
        key,
        label: sizeLabels[key],
        price: values.size_fields[key].price.trim(),
        image: values.size_fields[key].image.trim(),
      }));

    if (!sizeOptions.length) {
      toast.error(t("owner.chooseAtLeastOneSize"));
      return;
    }

    const invalidSize = sizeOptions.find((option) => !option.price || !option.image);
    if (invalidSize) {
      toast.error(t("owner.sizeRequiresPriceImage", { size: invalidSize.label }));
      return;
    }

    const addonOptions = values.addon_fields
      .map((addon, index) => ({
        id: (addon.id || `addon_${index + 1}`).trim().toLowerCase().replace(/\s+/g, "_"),
        name: addon.name.trim(),
        price: addon.price.trim(),
        image: addon.image.trim(),
      }))
      .filter((addon) => addon.name || addon.price || addon.image);

    const invalidAddon = addonOptions.find((addon) => !addon.name || !addon.price || !addon.image);
    if (invalidAddon) {
      toast.error(t("owner.addOnRequiresFields"));
      return;
    }

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
      size_options: sizeOptions as BouquetSizeOption[],
      addon_options: addonOptions as BouquetAddonOption[],
      stock: Number(values.stock),
      status: values.status,
      image: defaultSize.image,
      images: sizeOptions.map((item) => item.image),
    };

    try {
      if (isEditMode && bouquetId) {
        await updateBouquetMutation.mutateAsync({
          bouquetId,
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

      navigate("/owner/bouquets");
    } catch {
      toast.error(t("owner.bouquetSaveError"));
    }
  });

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void onSubmit();
      }

      if (event.key === "Escape" && deleteImagePrompt) {
        setDeleteImagePrompt(null);
      }

      if (event.key === "Escape" && confirmResetOpen) {
        setConfirmResetOpen(false);
      }

      if (event.key === "Escape" && confirmLeaveOpen) {
        closeLeaveDialog();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [confirmLeaveOpen, confirmResetOpen, deleteImagePrompt, onSubmit]);

  const confirmDeleteImage = () => {
    if (!deleteImagePrompt) return;

    if (deleteImagePrompt.type === "size") {
      setValue(`size_fields.${deleteImagePrompt.sizeKey}.image`, "", { shouldDirty: true });
    } else {
      setValue(`addon_fields.${deleteImagePrompt.index}.image`, "", { shouldDirty: true });
    }

    setDeleteImagePrompt(null);
    toast.success(t("owner.imageRemoved"));
  };

  const confirmResetForm = () => {
    reset(initialValues);
    previousAutoSlugRef.current = initialValues.slug;
    setConfirmResetOpen(false);
    toast.success(t("owner.formResetSuccess"));
  };

  const renderStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.15em]";
    switch (status) {
      case "active":
        return <span className={`${baseClasses} bg-emerald-950/60 text-emerald-300 border border-emerald-700/50`}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {statusLabels.active}
        </span>;
      case "inactive":
        return <span className={`${baseClasses} bg-amber-950/60 text-amber-300 border border-amber-700/50`}>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {statusLabels.inactive}
        </span>;
      case "sold_out":
        return <span className={`${baseClasses} bg-rose-950/60 text-rose-300 border border-rose-700/50`}>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          {statusLabels.sold_out}
        </span>;
      default:
        return null;
    }
  };

  if (!selectedShopId) {
    return (
      <div className="mx-auto max-w-lg mt-12 rounded-[2rem] border border-dashed border-[#4a1d22] bg-[linear-gradient(180deg,rgba(25,7,9,0.96),rgba(14,4,6,0.98))] px-8 py-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2a1015]">
          <HiOutlineRocketLaunch className="text-2xl text-[#ffcad0]" />
        </div>
        <p className="text-sm uppercase tracking-[0.26em] text-[#d6a89d]">{t("owner.ownerPanel")}</p>
        <h2 className="mt-3 font-cormorant text-4xl text-white">{t("owner.noBouquetAccess")}</h2>
        <p className="mt-3 text-sm text-[#cfaaa2]">{t("owner.shopRequired")}</p>
        <Link
          to="/owner"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl border border-[#5d2830] px-5 text-sm font-semibold text-white transition hover:bg-[#2a1015]"
        >
          <HiOutlineArrowLeft className="text-lg" />
          {t("owner.backToDashboard")}
        </Link>
      </div>
    );
  }

  if (isEditMode && isBouquetLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="h-[32rem] animate-pulse rounded-[2rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(25,7,9,0.96),rgba(14,4,6,0.98))]" />
      </div>
    );
  }

  if (isEditMode && (isBouquetError || !bouquet)) {
    return (
      <div className="mx-auto max-w-lg mt-12 rounded-[2rem] border border-[#4a1d22] bg-[linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-8 text-center">
        <p className="text-sm uppercase tracking-[0.26em] text-[#d6a89d]">{t("owner.bouquetEditor")}</p>
        <h1 className="mt-3 font-cormorant text-4xl text-white">{t("owner.bouquetNotFound")}</h1>
        <Link
          to="/owner/bouquets"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl border border-[#5d2830] px-5 text-sm font-semibold text-white transition hover:bg-[#2a1015]"
        >
          <HiOutlineArrowLeft className="text-lg" />
          {t("owner.backToBouquets")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {/* ===== HERO HEADER ===== */}
      <header className="relative overflow-hidden rounded-[2rem] border border-[#3d171c]/60 bg-[linear-gradient(135deg,rgba(31,8,11,0.97),rgba(14,4,6,0.99))] px-6 py-8 sm:px-8 sm:py-10">
        {/* Decorative bow */}
        <img loading="lazy" decoding="async"
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-0 hidden w-44 rotate-12 opacity-25 lg:block"
        />
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#8f1220]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-[#bb2435]/10 blur-3xl" />

        <Link
          to="/owner/bouquets"
          className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-[#542129]/80 bg-[#180709]/70 px-3.5 text-xs font-semibold text-[#f8e0da] transition hover:border-[#73404a] hover:bg-[#220c10]"
        >
          <HiOutlineArrowLeft className="text-base" />
          {t("owner.backToBouquets")}
        </Link>

        <div className="relative mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-[#d6a89d]">{t("owner.bouquetEditor")}</p>
            <h1 className="mt-3 font-cormorant text-5xl leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
              {isEditMode ? t("owner.editBouquet") : t("owner.newBouquet")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#d8b7b0]">
              {isEditMode ? t("owner.editBouquetPageDesc") : t("owner.createBouquetPageDesc")}
            </p>
          </div>

          {/* Stats cards */}
          <div className="flex gap-3">
            <div className="rounded-2xl border border-[#4a1d22]/70 bg-[#180709]/80 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#c79f97]">
                <HiOutlineCubeTransparent className="text-sm" />
                {t("owner.selectedSizes")}
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {enabledSizeOptions.length}
                <span className="ml-1 text-sm font-normal text-[#c79f97]">/4</span>
              </p>
            </div>
            <div className="rounded-2xl border border-[#4a1d22]/70 bg-[#180709]/80 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#c79f97]">
                <HiOutlinePlusCircle className="text-sm" />
                {t("owner.selectedAddons")}
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {enteredAddons.length}
                <span className="ml-1 text-sm font-normal text-[#c79f97]">/3</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN FORM ===== */}
      <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---- Left Column ---- */}
        <div className="space-y-8">
          {/* ===== SECTION: Basic Info ===== */}
          <section className="group rounded-[1.8rem] border border-[#3d171c]/60 bg-[linear-gradient(180deg,rgba(25,7,9,0.97),rgba(14,4,6,0.99))] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a1015] text-[#ffcad0]">
                <HiOutlineDocumentText className="text-xl" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#f0d7d1]">{t("owner.basicInfoTitle")}</h2>
                <p className="mt-0.5 text-xs text-[#caa29a]">{t("owner.basicInfoDesc")}</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                  <HiOutlineSparkles className="text-[#f0bcc1]" />
                  {t("owner.name")}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  {...register("name", { required: true })}
                  className="h-12 w-full rounded-xl border border-[#4a1d22]/80 bg-[#180709]/90 px-4 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:bg-[#1f0a0d] focus:ring-2 focus:ring-[#bb2435]/20"
                />
              </div>

              {/* Category + Slug */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                    <HiOutlineTag className="text-[#f0bcc1]" />
                    {t("owner.category")}
                  </label>
                  <select
                    {...register("category_id")}
                    className="h-12 w-full rounded-xl border border-[#4a1d22]/80 bg-[#180709]/90 px-4 text-sm text-white outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:bg-[#1f0a0d] focus:ring-2 focus:ring-[#bb2435]/20"
                  >
                    <option value="" className="bg-[#180709]">{t("owner.noCategory")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className="bg-[#180709]">{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                    <HiOutlinePhoto className="text-[#f0bcc1]" />
                    {t("owner.slug")}
                  </label>
                  <input
                    {...register("slug")}
                    className="h-12 w-full rounded-xl border border-[#4a1d22]/80 bg-[#180709]/90 px-4 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:bg-[#1f0a0d] focus:ring-2 focus:ring-[#bb2435]/20"
                  />
                  <p className="mt-2 flex items-center gap-1 text-xs text-[#b8948d]">
                    <HiOutlineEye className="text-[10px]" />
                    {t("owner.slugPreviewLabel")}: <span className="font-mono text-[#f3dbd6]">/bouquets/{slugValue.trim() || t("owner.slugPreviewPlaceholder")}</span>
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                  <HiOutlineDocumentText className="text-[#f0bcc1]" />
                  {t("owner.description")}
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#4a1d22]/80 bg-[#180709]/90 px-4 py-3 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:bg-[#1f0a0d] focus:ring-2 focus:ring-[#bb2435]/20"
                />
              </div>

              {/* Compound */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                  <HiOutlineSparkles className="text-[#f0bcc1]" />
                  {t("owner.compound")}
                </label>
                <textarea
                  {...register("compound")}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#4a1d22]/80 bg-[#180709]/90 px-4 py-3 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:bg-[#1f0a0d] focus:ring-2 focus:ring-[#bb2435]/20"
                />
              </div>

              {/* Old Price + Stock */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                    <HiOutlineCurrencyDollar className="text-[#f0bcc1]" />
                    {t("owner.oldPrice")}
                  </label>
                  <input
                    {...register("old_price")}
                    inputMode="decimal"
                    onKeyDown={blockNegativeNumberInput}
                    onInput={handleNonNegativeInput}
                    placeholder={t("owner.optional")}
                    className="h-12 w-full rounded-xl border border-[#4a1d22]/80 bg-[#180709]/90 px-4 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:bg-[#1f0a0d] focus:ring-2 focus:ring-[#bb2435]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                    <HiOutlineArchiveBox className="text-[#f0bcc1]" />
                    {t("owner.stock")}
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...register("stock", {
                      valueAsNumber: true,
                      min: 0,
                      setValueAs: (value) => {
                        const parsed = Number(value);
                        if (Number.isNaN(parsed)) return 0;
                        return Math.max(0, parsed);
                      },
                    })}
                    onKeyDown={blockNegativeNumberInput}
                    onInput={handleNonNegativeInput}
                    className="h-12 w-full rounded-xl border border-[#4a1d22]/80 bg-[#180709]/90 px-4 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:bg-[#1f0a0d] focus:ring-2 focus:ring-[#bb2435]/20"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#e8cac4]">
                  <HiOutlineCheckBadge className="text-[#f0bcc1]" />
                  {t("owner.status")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["active", "inactive", "sold_out"] as const).map((status) => {
                    const isSelected = bouquetStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setValue("status", status, { shouldDirty: true })}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 ${
                          isSelected
                            ? status === "active"
                              ? "border-emerald-700 bg-emerald-950/60 text-emerald-300 shadow-[inset_0_0_12px_rgba(52,211,153,0.08)]"
                              : status === "inactive"
                                ? "border-amber-700 bg-amber-950/60 text-amber-300 shadow-[inset_0_0_12px_rgba(251,191,36,0.08)]"
                                : "border-rose-700 bg-rose-950/60 text-rose-300 shadow-[inset_0_0_12px_rgba(244,63,94,0.08)]"
                            : "border-[#4a1d22]/70 bg-[#180709]/70 text-[#c79f97] hover:border-[#5d2830] hover:bg-[#1f0a0d]"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isSelected
                            ? status === "active" ? "bg-emerald-400" : status === "inactive" ? "bg-amber-400" : "bg-rose-400"
                            : "bg-[#8f6d71]"
                        }`} />
                        {statusLabels[status]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ===== SECTION: Sizes ===== */}
          <section className="group rounded-[1.8rem] border border-[#3d171c]/60 bg-[linear-gradient(180deg,rgba(25,7,9,0.97),rgba(14,4,6,0.99))] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a1015] text-[#ffcad0]">
                <HiOutlineCubeTransparent className="text-xl" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#f0d7d1]">{t("owner.bouquetSizes")}</h2>
                <p className="mt-0.5 text-xs text-[#caa29a]">{t("owner.bouquetSizesDesc")}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SIZE_ORDER.map((sizeKey) => {
                const sizeField = sizeFields[sizeKey];
                const isEnabled = sizeField.enabled;
                const sizeIcons: Record<string, string> = {
                  small: "text-base",
                  medium: "text-lg",
                  large: "text-xl",
                  premium: "text-2xl",
                };
                return (
                  <div
                    key={sizeKey}
                    className={`group/card relative overflow-hidden rounded-xl border transition-all duration-300 ${
                      isEnabled
                        ? "border-[#4a1d22] bg-[linear-gradient(135deg,rgba(25,7,9,0.95),rgba(18,6,7,0.98))] shadow-[inset_0_0_20px_rgba(139,18,32,0.05)]"
                        : "border-[#3d171c]/50 bg-[#120607]/70 opacity-60"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-[#4a1d22]/30 px-4 py-3.5">
                      <label className="flex cursor-pointer items-center gap-3">
                        <div className={`relative flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200 ${
                          isEnabled
                            ? "border-[#bb2435] bg-[#bb2435]/20"
                            : "border-[#5d2830] bg-transparent"
                        }`}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(event) => {
                              setValue(`size_fields.${sizeKey}.enabled`, event.target.checked, { shouldDirty: true });
                              if (!event.target.checked) {
                                setValue(`size_fields.${sizeKey}.price`, "", { shouldDirty: true });
                                setValue(`size_fields.${sizeKey}.image`, "", { shouldDirty: true });
                              }
                            }}
                            className="peer sr-only"
                          />
                          {isEnabled && (
                            <HiOutlineCheckBadge className="text-sm text-[#bb2435]" />
                          )}
                        </div>
                        <span className={`font-semibold transition-colors ${sizeIcons[sizeKey]} ${isEnabled ? "text-white" : "text-[#8f6d71]"}`}>
                          {sizeLabels[sizeKey]}
                        </span>
                      </label>
                      {sizeField.image ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#4a1d22]/50">
                          <img loading="lazy" decoding="async" src={sizeField.image} alt={sizeLabels[sizeKey]} className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                    </div>

                    {/* Body */}
                    <div className="space-y-3 p-4">
                      <input
                        {...register(`size_fields.${sizeKey}.price`)}
                        inputMode="decimal"
                        disabled={!isEnabled}
                        onKeyDown={blockNegativeNumberInput}
                        onInput={handleNonNegativeInput}
                        placeholder={buildSizePricePlaceholder(
                          sizeLabels[sizeKey],
                          sizeKey === "small" ? "72.00"
                            : sizeKey === "medium" ? "85.00"
                              : sizeKey === "large" ? "110.00"
                                : "140.00",
                        )}
                        className={`h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all duration-200 ${
                          isEnabled
                            ? "border-[#4a1d22]/70 bg-[#180709]/80 text-white placeholder-[#8f6d71] focus:border-[#bb2435]/80 focus:ring-2 focus:ring-[#bb2435]/20"
                            : "cursor-not-allowed border-[#3d171c]/40 bg-[#0d0405] text-[#6d4a4a] placeholder-[#4d2a2a]"
                        }`}
                      />
                      <label className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                        isEnabled
                          ? "cursor-pointer border-[#4a1d22]/70 bg-[#180709]/80 text-[#f3c4cb] hover:bg-[#220c10] hover:border-[#5d2830]"
                          : "cursor-not-allowed border-[#3d171c]/40 bg-[#0d0405] text-[#6d4a4a]"
                      }`}>
                        <HiOutlineArrowUpTray className="text-base" />
                          {t("owner.uploadImage")}
                        <input type="file" accept="image/*" className="hidden" disabled={!isEnabled} onChange={(event) => handleUploadSizeImage(sizeKey, event)} />
                      </label>
                      {isEnabled ? (
                        sizeField.image ? (
                          <div className="rounded-lg border border-[#4a1d22]/50 bg-[#140607] p-3">
                            <div className="mb-3 flex items-center gap-3">
                              <img loading="lazy" decoding="async" src={sizeField.image} alt={sizeLabels[sizeKey]} className="h-14 w-14 rounded-lg object-cover" />
                              <p className="text-xs leading-5 text-[#c9a49d]">{t("owner.imageReadyHint")}</p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#5d2830] bg-[#180709] px-4 text-xs font-semibold text-[#f3c4cb] transition-all duration-200 hover:bg-[#220c10] hover:border-[#73404a]">
                                <HiOutlineArrowUpTray className="text-sm" />
                                {t("owner.replaceImage")}
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUploadSizeImage(sizeKey, event)} />
                              </label>
                              <button
                                type="button"
                                onClick={() => requestRemoveSizeImage(sizeKey)}
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#5d2830] bg-transparent px-4 text-xs font-semibold text-[#d8a7ac] transition-all duration-200 hover:bg-[#220c10] hover:text-white"
                              >
                                {t("owner.removeImage")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs leading-5 text-[#9f7c77]">{t("owner.sizeImageHint")}</p>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ===== SECTION: Add-ons ===== */}
          <section className="group rounded-[1.8rem] border border-[#3d171c]/60 bg-[linear-gradient(180deg,rgba(25,7,9,0.97),rgba(14,4,6,0.99))] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a1015] text-[#ffcad0]">
                <HiOutlinePlusCircle className="text-xl" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#f0d7d1]">{t("owner.addOns")}</h2>
                <p className="mt-0.5 text-xs text-[#caa29a]">{t("owner.addOnsDesc")}</p>
              </div>
            </div>

            <div className="space-y-4">
              {ADDON_INDEXES.map((index) => {
                const addon = addonFields[index];
                const hasContent = addon.name || addon.price || addon.image;
                return (
                  <div
                    key={index}
                    className={`rounded-xl border transition-all duration-300 ${
                      hasContent
                        ? "border-[#4a1d22] bg-[linear-gradient(135deg,rgba(25,7,9,0.95),rgba(18,6,7,0.98))]"
                        : "border-[#3d171c]/40 bg-[#120607]/50"
                    }`}
                  >
                    {/* Addon header */}
                    <div className="flex items-center gap-3 border-b border-[#4a1d22]/20 px-4 py-2.5">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        hasContent
                          ? "bg-[#bb2435]/20 text-[#bb2435]"
                          : "bg-[#4a1d22]/20 text-[#8f6d71]"
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#caa29a]">
                        {t("owner.addOn")} {index + 1}
                      </span>
                      {addon.image ? (
                        <div className="ml-auto h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[#4a1d22]/40">
                          <img loading="lazy" decoding="async" src={addon.image} alt={addon.name || ""} className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                    </div>

                    {/* Addon body */}
                    <div className="space-y-3 p-4">
                      <div className="grid gap-3 sm:grid-cols-[1fr_0.6fr_auto]">
                        <input
                          {...register(`addon_fields.${index}.name`)}
                          placeholder={
                            index === 0 ? t("owner.exampleChocolateBox")
                              : index === 1 ? t("owner.exampleFruitBasket")
                                : t("owner.exampleGreetingCard")
                          }
                          className="h-11 rounded-lg border border-[#4a1d22]/70 bg-[#180709]/80 px-3.5 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:ring-2 focus:ring-[#bb2435]/20"
                        />
                        <input
                          {...register(`addon_fields.${index}.price`)}
                          inputMode="decimal"
                          onKeyDown={blockNegativeNumberInput}
                          onInput={handleNonNegativeInput}
                          placeholder={
                            index === 0 ? t("owner.examplePrice12")
                              : index === 1 ? t("owner.examplePrice15")
                                : t("owner.examplePrice4")
                          }
                          className="h-11 rounded-lg border border-[#4a1d22]/70 bg-[#180709]/80 px-3.5 text-sm text-white placeholder-[#8f6d71] outline-none transition-all duration-200 focus:border-[#bb2435]/80 focus:ring-2 focus:ring-[#bb2435]/20"
                        />
                        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#4a1d22]/70 bg-[#180709]/80 px-4 text-sm font-semibold text-[#f3c4cb] transition-all duration-200 hover:bg-[#220c10] hover:border-[#5d2830]">
                          <HiOutlineArrowUpTray className="text-base" />
                          <span className="hidden sm:inline">{t("owner.uploadImage")}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUploadAddonImage(index, event)} />
                        </label>
                      </div>
                      {addon.image ? (
                        <div className="rounded-lg border border-[#4a1d22]/40 bg-[#140607] p-3">
                          <div className="overflow-hidden rounded-lg border border-[#4a1d22]/40">
                            <img loading="lazy" decoding="async"
                              src={addon.image}
                              alt={addon.name || t("owner.addonAlt", { index: index + 1 })}
                              className="h-32 w-full object-cover"
                            />
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#5d2830] bg-[#180709] px-4 text-xs font-semibold text-[#f3c4cb] transition-all duration-200 hover:bg-[#220c10] hover:border-[#73404a]">
                              <HiOutlineArrowUpTray className="text-sm" />
                              {t("owner.replaceImage")}
                              <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUploadAddonImage(index, event)} />
                            </label>
                            <button
                              type="button"
                              onClick={() => requestRemoveAddonImage(index)}
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#5d2830] bg-transparent px-4 text-xs font-semibold text-[#d8a7ac] transition-all duration-200 hover:bg-[#220c10] hover:text-white"
                            >
                              {t("owner.removeImage")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs leading-5 text-[#9f7c77]">{t("owner.addonImageHint")}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add-on hint */}
            {enteredAddons.length === 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-[#4a1d22]/40 bg-[#180709]/50 px-4 py-3">
                <HiOutlineInformationCircle className="text-sm text-[#b8948d]" />
                <p className="text-xs text-[#b8948d]">{t("owner.addOnsHint")}</p>
              </div>
            )}
          </section>
        </div>

        {/* ---- Right Column: Preview & Actions ---- */}
        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          {/* ===== PREVIEW CARD ===== */}
          <section className="overflow-hidden rounded-[1.8rem] border border-[#3d171c]/60 bg-[linear-gradient(180deg,rgba(25,7,9,0.97),rgba(14,4,6,0.99))]">
            {/* Preview image */}
            <div className="relative h-56">
              {enabledSizeOptions[0]?.image ? (
                <img loading="lazy" decoding="async" src={enabledSizeOptions[0].image} alt={bouquetName || t("owner.newBouquet")} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top,rgba(179,60,86,0.25),transparent_60%),linear-gradient(180deg,#220a0e,#100406)]">
                  <HiOutlineSparkles className="text-4xl text-[#f0bcc1]/60" />
                  <span className="text-xs uppercase tracking-[0.25em] text-[#b8948d]">{t("owner.previewPlaceholder")}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(9,2,3,0.9))]" />

              {/* Status badge */}
              <div className="absolute right-4 top-4">
                {renderStatusBadge(bouquetStatus)}
              </div>

              {/* Size badge */}
              {enabledSizeOptions.length > 0 && (
                <div className="absolute bottom-4 left-4 flex gap-1.5">
                  {enabledSizeOptions.map((opt) => (
                    <span key={opt.key} className="rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white/80 backdrop-blur-sm">
                      {opt.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preview details */}
            <div className="space-y-4 p-5">
              <div>
                <h3 className="font-cormorant text-3xl leading-tight text-white">
                  {bouquetName || <span className="italic text-[#8f6d71]">{t("owner.newBouquet")}</span>}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#cfaaa2]">
                  {bouquetDescription || <span className="italic text-[#8f6d71]">{t("owner.editorPreviewHint")}</span>}
                </p>
              </div>

              {/* Size price list */}
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[#b8948d]">{t("owner.availableSizes")}</p>
                <div className="space-y-2">
                  {enabledSizeOptions.length ? (
                    enabledSizeOptions.map((option) => (
                      <div
                        key={option.key}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#4a1d22]/50 bg-[#180709]/70 px-4 py-3 transition-colors hover:bg-[#1f0a0d]"
                      >
                        <span className="flex items-center gap-2 text-sm text-[#f2d6cf]">
                          <HiOutlineTag className="text-[10px] text-[#b8948d]" />
                          {option.label}
                        </span>
                        <span className="font-semibold text-white">
                          {option.price ? formatPrice(option.price) : <span className="text-[#8f6d71]">—</span>}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#4a1d22]/40 px-4 py-5 text-center text-sm text-[#c8a39b]">
                      {t("owner.previewSizeHint")}
                    </div>
                  )}
                </div>
              </div>

              {/* Tips box */}
              <div className="rounded-xl border border-[#4a1d22]/40 bg-[linear-gradient(135deg,rgba(20,6,8,0.95),rgba(14,4,6,0.98))] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2b1015] text-[#ffcad0]">
                    <HiOutlineRocketLaunch className="text-lg" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t("owner.editorTipsTitle")}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#d0aba4]">{t("owner.editorTipsDesc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== ACTION BUTTONS ===== */}
          <div className="rounded-xl border border-[#4a1d22]/60 bg-[linear-gradient(180deg,rgba(25,7,9,0.95),rgba(14,4,6,0.99))] p-4">
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-6 text-base font-semibold text-white shadow-[0_4px_20px_rgba(139,18,32,0.3)] transition-all duration-200 hover:from-[#a31526] hover:to-[#d42a3e] hover:shadow-[0_6px_28px_rgba(139,18,32,0.45)] active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none"
              >
                {isSaving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("owner.saving")}
                  </>
                ) : (
                  <>
                    <HiOutlineRocketLaunch className="text-lg" />
                    {isEditMode ? t("owner.updateBouquet") : t("owner.createBouquet")}
                  </>
                )}
              </button>
              <Link
                to="/owner/bouquets"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#5d2830]/70 px-6 text-sm font-semibold text-[#f5dfd9] transition-all duration-200 hover:bg-[#2a1015] hover:border-[#73404a] active:scale-[0.98]"
              >
                <HiOutlineArrowLeft className="text-base" />
                {t("owner.cancel")}
              </Link>
            </div>
          </div>

          {/* ===== KEYBOARD SHORTCUTS ===== */}
          <div className="rounded-xl border border-[#4a1d22]/30 bg-[#180709]/50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8948d]">{t("owner.shortcutsTitle")}</p>
            <div className="mt-2 space-y-1.5 text-xs text-[#d0aba4]">
              <div className="flex items-center gap-2">
                <kbd className="rounded border border-[#4a1d22]/50 bg-[#120607] px-1.5 py-0.5 text-[10px] text-[#f0d7d1]">⌘S</kbd>
                <span>{t("owner.shortcutSave")}</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border border-[#4a1d22]/50 bg-[#120607] px-1.5 py-0.5 text-[10px] text-[#f0d7d1]">Esc</kbd>
                <span>{t("owner.shortcutClose")}</span>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {/* ===== STICKY SAVE BAR ===== */}
      <div
        className={`sticky bottom-6 z-30 mx-auto w-full max-w-2xl transition-all duration-500 ${
          isDirty
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-12 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#6d3740]/80 bg-[linear-gradient(135deg,rgba(33,10,14,0.98),rgba(20,6,8,0.96))] px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#d2a9a2]">{t("owner.unsavedChanges")}</p>
              <p className="mt-0.5 text-sm text-[#f3dbd6]">
                {changedFieldsCount} {t("owner.unsavedChangesText")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#6b3a3c]/70 px-4 text-xs font-semibold text-[#f1d5cb] transition-all duration-200 hover:bg-[#2a1015] active:scale-[0.97]"
            >
              {t("owner.reset")}
            </button>
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8f1220] via-[#b81f35] to-[#d93f57] px-5 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(139,18,32,0.35)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(139,18,32,0.5)] active:scale-[0.97] disabled:opacity-50"
            >
              {isSaving ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <HiOutlineRocketLaunch className="text-base" />
              )}
              {isSaving ? t("owner.saving") : t("owner.saveNow")}
            </button>
          </div>
        </div>
      </div>

      {/* ===== LEAVE CONFIRMATION MODAL ===== */}
      {confirmLeaveOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg animate-[fadeIn_0.2s_ease-out] rounded-[1.8rem] border border-[#643335]/80 bg-[linear-gradient(180deg,#180709,#100507)] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d2a9a2]">{t("owner.unsavedChanges")}</p>
                <h3 className="mt-2 font-cormorant text-4xl text-white">{t("owner.leaveEditorTitle")}</h3>
              </div>
              <button
                type="button"
                onClick={closeLeaveDialog}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#4a1d22]/70 text-white transition-all duration-200 hover:bg-[#2a1015]"
              >
                <HiOutlineXMark />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#ddb8b0]">{t("owner.leaveEditorDesc")}</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeLeaveDialog}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#6b3a3c]/70 px-5 text-sm font-semibold text-[#f1d5cb] transition-all duration-200 hover:bg-[#2a1015]"
              >
                {t("owner.stayHere")}
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] via-[#b81f35] to-[#d93f57] px-5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,18,32,0.3)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(139,18,32,0.45)]"
              >
                {t("owner.leaveWithoutSaving")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteImagePrompt ? (
        <div className="fixed inset-0 z-[135] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.8rem] border border-[#643335]/80 bg-[linear-gradient(180deg,#180709,#100507)] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d2a9a2]">{t("owner.removeImage")}</p>
                <h3 className="mt-2 font-cormorant text-4xl text-white">{t("owner.deleteImageTitle")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteImagePrompt(null)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#4a1d22]/70 text-white transition-all duration-200 hover:bg-[#2a1015]"
              >
                <HiOutlineXMark />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#ddb8b0]">
              {t("owner.deleteImageDesc", { target: deleteImagePrompt.label })}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteImagePrompt(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#6b3a3c]/70 px-5 text-sm font-semibold text-[#f1d5cb] transition-all duration-200 hover:bg-[#2a1015]"
              >
                {t("owner.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteImage}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] via-[#b81f35] to-[#d93f57] px-5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,18,32,0.3)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(139,18,32,0.45)]"
              >
                {t("owner.yesRemove")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmResetOpen ? (
        <div className="fixed inset-0 z-[136] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.8rem] border border-[#643335]/80 bg-[linear-gradient(180deg,#180709,#100507)] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d2a9a2]">{t("owner.reset")}</p>
                <h3 className="mt-2 font-cormorant text-4xl text-white">{t("owner.resetFormTitle")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#4a1d22]/70 text-white transition-all duration-200 hover:bg-[#2a1015]"
              >
                <HiOutlineXMark />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#ddb8b0]">{t("owner.resetFormDesc")}</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#6b3a3c]/70 px-5 text-sm font-semibold text-[#f1d5cb] transition-all duration-200 hover:bg-[#2a1015]"
              >
                {t("owner.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmResetForm}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] via-[#b81f35] to-[#d93f57] px-5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,18,32,0.3)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(139,18,32,0.45)]"
              >
                {t("owner.yesReset")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OwnerBouquetEditor;
