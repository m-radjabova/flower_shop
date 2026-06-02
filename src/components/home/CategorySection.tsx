import { useTranslation } from "react-i18next";
import {
  HiArrowRight,
  HiHeart,
  HiOutlineGift,
  HiOutlineHeart,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { LuCakeSlice, LuFlower2 } from "react-icons/lu";
import { TbRings } from "react-icons/tb";
import type { Category } from "../../types/catalog";

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

interface CategorySectionProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

function CategorySection({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySectionProps) {
  const { t } = useTranslation();
  return (
    <section
      id="categories"
      className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-10"
    >
      <div className="rounded-[2rem] bg-transparent px-2 py-4 sm:px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="hidden flex-1 md:block">
            <div className="h-px bg-gradient-to-r from-transparent via-[#5b2524] to-[#5b2524]" />
          </div>

          <div className="shrink-0 text-center">
            <h2 className="font-cormorant text-[2.2rem] italic leading-none text-[#f1ddd3] sm:text-[3rem]">
              {t("categorySection.shopByCategory")}
            </h2>
          </div>

          <div className="hidden flex-1 items-center gap-4 md:flex">
            <div className="h-px flex-1 bg-gradient-to-r from-[#5b2524] via-[#5b2524] to-transparent" />
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#f1d5cb] transition hover:text-white"
            >
              View all
              <HiArrowRight className="text-[#cb5c57]" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-y-6 sm:grid-cols-3 md:mt-10 md:grid-cols-4 lg:grid-cols-6">
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

        <div className="mt-8 flex justify-center md:hidden">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="inline-flex items-center gap-2 rounded-full border border-[#7b3534] bg-[#1a0a0b] px-6 py-3 text-sm font-semibold text-[#f2d9d1] transition hover:border-[#b06d62] hover:text-white"
          >
            View all
            <HiArrowRight className="text-[#cb5c57]" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
