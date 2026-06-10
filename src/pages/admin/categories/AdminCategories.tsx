import { useMemo, useState, type ChangeEvent } from "react";
import { Drawer } from "@mui/material";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  HiOutlineArrowUpTray,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineSquares2X2,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useAdminCategories, useCreateAdminCategory, useUpdateAdminCategory } from "../../../hooks/useAdmin";
import { useUploadImage } from "../../../hooks/useCatalog";
import type { Category } from "../../../types/catalog";
import bow from "../../../assets/bow.png";

type CategoryFormValues = {
  name: string;
  slug: string;
  image: string;
  is_active: boolean;
};

const defaultValues: CategoryFormValues = {
  name: "",
  slug: "",
  image: "",
  is_active: true,
};

function AdminCategories() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const createCategoryMutation = useCreateAdminCategory();
  const updateCategoryMutation = useUpdateAdminCategory();
  const uploadImageMutation = useUploadImage();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [togglingCategoryIds, setTogglingCategoryIds] = useState<Record<string, boolean>>({});
  const form = useForm<CategoryFormValues>({ defaultValues });
  const imageValue = form.watch("image");

  const activeCount = useMemo(
    () => categories.filter((category) => category.is_active).length,
    [categories],
  );

  const openCreate = () => {
    setEditingCategory(null);
    form.reset(defaultValues);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      image: category.image ?? "",
      is_active: category.is_active,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
    form.reset(defaultValues);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmittingForm) return;
    const image = values.image.trim();
    if (!image) {
      toast.error("Category rasmi upload qilinishi shart");
      return;
    }

    try {
      setIsSubmittingForm(true);
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          categoryId: editingCategory.id,
          payload: {
            name: values.name.trim(),
            slug: values.slug.trim() || undefined,
            image,
            is_active: values.is_active,
          },
        });
        toast.success("Category yangilandi");
      } else {
        await createCategoryMutation.mutateAsync({
          name: values.name.trim(),
          slug: values.slug.trim() || undefined,
          image,
          is_active: values.is_active,
        });
        toast.success("Category qo'shildi");
      }
      closeForm();
    } catch {
      toast.error("Categoryni saqlab bo'lmadi");
    } finally {
      setIsSubmittingForm(false);
    }
  });

  const handleUploadCategoryImage = async (event: ChangeEvent<HTMLInputElement>) => {
    if (uploadImageMutation.isPending) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadImageMutation.mutateAsync(file);
      form.setValue("image", uploaded.url, { shouldDirty: true });
      toast.success("Rasm yuklandi");
    } catch {
      toast.error("Rasmni yuklab bo'lmadi");
    } finally {
      event.target.value = "";
    }
  };

  const toggleActive = async (category: Category) => {
    if (togglingCategoryIds[category.id]) return;
    try {
      setTogglingCategoryIds((prev) => ({ ...prev, [category.id]: true }));
      await updateCategoryMutation.mutateAsync({
        categoryId: category.id,
        payload: { is_active: !category.is_active },
      });
      toast.success("Category holati yangilandi");
    } catch {
      toast.error("Category holatini yangilab bo'lmadi");
    } finally {
      setTogglingCategoryIds((prev) => ({ ...prev, [category.id]: false }));
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-6 sm:p-8">
        <img loading="lazy" decoding="async"
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
           />
        <div className="flex flex-col items-center gap-4">
          <div className="w-full">
            <p className="text-center text-sm uppercase tracking-[0.32em] text-[#d6a89d]">Admin Categories</p>
            <h1 className="mt-3 text-center font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">Categories</h1>
          </div>
          <div className="flex w-full items-center justify-center gap-3">
            <div className="rounded-2xl bg-[#180709] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">Active Categories</p>
              <p className="mt-1 text-3xl font-semibold text-white">{activeCount}</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              disabled={isSubmittingForm}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#9a1828] to-[#c82f45] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(171,34,57,0.34)]"
            >
              <HiOutlinePlus className="text-lg" />
              Add Category
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[1.6rem] border border-[#3d171c] bg-[#160709]" />
          ))
        ) : categories.map((category) => (
          <article
            key={category.id}
            className="overflow-hidden rounded-[1.6rem] border border-[#3d171c]/70 bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <div className="relative h-40">
              {category.image ? (
                <img loading="lazy" decoding="async" src={category.image} alt={category.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#20090c] text-[#f2be7f]">
                  <HiOutlineSquares2X2 className="text-5xl" />
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,2,3,0.85))]" />
              <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${category.is_active ? "bg-[#10241a] text-[#9ef0c2]" : "bg-[#321116] text-[#ffb1bd]"}`}>
                {category.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-cormorant text-4xl text-white">{category.name}</p>
                  <p className="mt-1 truncate text-sm text-[#cbaba4]">{category.slug}</p>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#251007] text-[#f2be7f]">
                  <HiOutlineSparkles />
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(category)}
                  disabled={Boolean(togglingCategoryIds[category.id])}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#4a1d22] bg-[#180709] px-4 text-sm font-semibold text-[#f5dfd9]"
                >
                  <HiOutlinePencilSquare />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(category)}
                  aria-label={`${category.name} statusini o'zgartirish`}
                  disabled={Boolean(togglingCategoryIds[category.id])}
                  className={`group inline-flex h-10 items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition ${
                    category.is_active
                      ? "border-[#2f6d55] bg-[#0f241c] text-[#b9f8d3]"
                      : "border-[#7d3943] bg-[#2b1217] text-[#ffd0d7]"
                  }`}
                >
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full p-1 transition ${
                      category.is_active ? "bg-[#1a4a36]" : "bg-[#4a1a23]"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white shadow transition ${
                        category.is_active ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </span>
                  {category.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Drawer
        anchor="right"
        open={formOpen}
        onClose={closeForm}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 460 },
              maxWidth: "100vw",
              background: "linear-gradient(180deg,#140507 0%,#1b070b 42%,#0d0305 100%)",
              borderLeft: "1px solid #4a1d22",
            },
          },
        }}
      >
        <div className="h-full overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#c79f97]">Category Form</p>
              <h2 className="mt-2 font-cormorant text-4xl text-white">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#4a1d22] bg-[#180709] text-[#f6d7d1]"
            >
              <HiOutlineXMark className="text-xl" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              {...form.register("name")}
              placeholder="Category name"
              className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
            />
            <input
              {...form.register("slug")}
              placeholder="Slug (optional)"
              className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
            />
            <input type="hidden" {...form.register("image")} />
            <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#6d3740] bg-[#180709] px-4 text-sm font-semibold text-[#f7d9d2] transition hover:border-[#b45c69]">
              <HiOutlineArrowUpTray className="text-lg" />
              {uploadImageMutation.isPending ? "Uploading..." : imageValue ? "Change category image" : "Upload category image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadCategoryImage}
                className="hidden"
                disabled={uploadImageMutation.isPending}
              />
            </label>
            {imageValue ? (
              <div className="overflow-hidden rounded-2xl border border-[#4a1d22] bg-[#180709] p-2">
                <img loading="lazy" decoding="async" src={imageValue} alt="Category preview" className="h-44 w-full rounded-xl object-cover" />
              </div>
            ) : null}
            <label className="flex items-center gap-3 rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4 text-[#f5dfd9]">
              <input type="checkbox" {...form.register("is_active")} />
              Active category
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmittingForm || uploadImageMutation.isPending}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#9a1828] to-[#c82f45] px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmittingForm ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#4a1d22] bg-[#180709] px-5 text-sm font-semibold text-[#f5dfd9]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Drawer>
    </div>
  );
}

export default AdminCategories;
