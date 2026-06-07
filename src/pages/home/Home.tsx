import { useState } from "react";
import AboutSection from "../../components/home/AboutSection";
import BouquetSection from "../../components/home/BouquetSection";
import OccasionSection from "../../components/home/OccasionSection";
// import ContactSection from "../../components/home/ContactSection";
import Hero from "../../components/home/Hero";
import { useBouquets, useCategories } from "../../hooks/useCatalog";

const OCCASION_SEARCH_TERMS = {
  birthday: "birthday",
  anniversary: "anniversary",
  wedding: "wedding",
  newBaby: "new baby",
  getWell: "get well",
  romantic: "romantic",
} as const;

function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<
    "birthday" | "anniversary" | "wedding" | "newBaby" | "getWell" | "romantic" | null
  >(null);

  const categoriesQuery = useCategories();
  const bouquetsQuery = useBouquets({
    categoryId: selectedCategoryId ?? undefined,
    search: selectedOccasion ? OCCASION_SEARCH_TERMS[selectedOccasion] : undefined,
    limit: 6,
  });

  return (
    <div className="relative">
      <Hero />
      <AboutSection />
      <OccasionSection
        selectedOccasion={selectedOccasion}
        onSelectOccasion={setSelectedOccasion}
      />
      <BouquetSection
        bouquets={bouquetsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        isLoading={bouquetsQuery.isLoading || categoriesQuery.isLoading}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        selectedOccasion={selectedOccasion}
        onClearOccasion={() => setSelectedOccasion(null)}
      />
      {/* <ContactSection /> */}
    </div>
  );
}

export default Home;
