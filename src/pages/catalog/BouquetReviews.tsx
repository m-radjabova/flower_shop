import { Link, useParams } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import NotFound from "../../components/NotFound";
import { BouquetReviewsHeroSkeleton } from "../../components/PageSkeletons";
import ReviewSection from "../../components/catalog/ReviewSection";
import { useBouquet } from "../../hooks/useCatalog";

function BouquetReviews() {
  const { bouquetId } = useParams();
  const { data: bouquet, isLoading, isError } = useBouquet(bouquetId);

  if (isLoading) {
    return <BouquetReviewsHeroSkeleton />;
  }

  if (isError || !bouquet) {
    return <NotFound />;
  }

  return (
    <main className="min-h-screen bg-[#070102] text-[#fff6f4]">
      <section className="px-4 pb-8 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Link
            to={`/bouquets/${bouquet.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#6d3430] bg-[#170809]/80 px-4 py-2 text-sm font-semibold text-[#f5d6cd] transition hover:border-[#bd756c] hover:text-white"
          >
            <HiArrowLeft />
            Back to bouquet
          </Link>
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#63302d] bg-[#140708]">
            <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[18rem_1fr]">
              <img
                src={bouquet.image}
                alt={bouquet.name}
                className="h-72 w-full rounded-[1.4rem] object-cover"
              />
              <div className="flex flex-col justify-center">
                <p className="text-sm uppercase tracking-[0.22em] text-[#b58e86]">All bouquet reviews</p>
                <h1 className="mt-2 font-cormorant text-5xl font-semibold leading-none text-white sm:text-7xl">
                  {bouquet.name}
                </h1>
                <p className="mt-4 max-w-2xl leading-8 text-[#d7b8b0]">
                  Bu sahifada aynan shu gul uchun yozilgan barcha approved reviewlar ko'rinadi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ReviewSection bouquet={bouquet} mode="full" />
    </main>
  );
}

export default BouquetReviews;
