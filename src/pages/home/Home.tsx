import { useState } from "react";
import AboutSection from "../../components/home/AboutSection";
import BouquetSection from "../../components/home/BouquetSection";
// import ContactSection from "../../components/home/ContactSection";
import Hero from "../../components/home/Hero";
import { useBouquets, useCategories } from "../../hooks/useCatalog";

function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const categoriesQuery = useCategories();
  const bouquetsQuery = useBouquets({
    categoryId: selectedCategoryId ?? undefined,
    limit: 6,
  });

  return (
    <div className="relative">
      <Hero />
      <AboutSection />
      <BouquetSection
        bouquets={bouquetsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        isLoading={bouquetsQuery.isLoading || categoriesQuery.isLoading}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />
      {/* <ContactSection /> */}
    </div>
  );
}

export default Home;
