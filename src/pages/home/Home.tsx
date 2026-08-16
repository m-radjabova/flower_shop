import { useState } from "react";
import AboutSection from "../../components/home/AboutSection";
import BouquetSection from "../../components/home/BouquetSection";
import OccasionSection from "../../components/home/OccasionSection";
// import ContactSection from "../../components/home/ContactSection";
import Hero from "../../components/home/Hero";
// import ScrollSnake from "../../components/home/ScrollSnake";
import { useBouquets, useCategories } from "../../hooks/useCatalog";

function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const categoriesQuery = useCategories();
  const bouquetsQuery = useBouquets({
    categoryId: selectedCategoryId ?? undefined,
    limit: 9,
  });

  return (
    <>
      <div className="relative">
        <Hero />
        <AboutSection />
        <OccasionSection
          categories={categoriesQuery.data ?? []}
          isLoading={categoriesQuery.isLoading}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        <BouquetSection
          bouquets={bouquetsQuery.data ?? []}
          categories={categoriesQuery.data ?? []}
          isLoading={bouquetsQuery.isLoading || categoriesQuery.isLoading}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        {/* <ContactSection /> */}
      </div>
    </>
  );
}

export default Home;
