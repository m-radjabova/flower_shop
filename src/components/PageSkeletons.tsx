import { Skeleton, SkeletonText } from "./Skeleton";

export function BouquetGridSkeleton({
  count = 6,
  className = "mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3",
  imageClassName = "aspect-[4/5] w-full",
}: {
  count?: number;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.9rem] border border-[#4f2224] bg-[linear-gradient(180deg,#160809_0%,#0f0506_100%)]"
        >
          <Skeleton className={imageClassName} />
          <div className="space-y-4 px-4 pb-4 pt-4">
            <Skeleton className="h-8 w-3/5 rounded-full" />
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-12 w-full rounded-[0.9rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeCategoriesSkeleton() {
  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <Skeleton className="h-[5.5rem] w-[5.5rem] rounded-full sm:h-[6.25rem] sm:w-[6.25rem]" />
            <Skeleton className="mt-3 h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <BouquetGridSkeleton count={6} />
    </div>
  );
}

export function ProfileDashboardSkeleton() {
  return (
    <>
      <section className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
        <Skeleton className="h-16 w-80 max-w-full rounded-full" />
        <Skeleton className="mt-4 h-6 w-[28rem] max-w-full rounded-full" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl bg-[#130708] p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-18 w-18 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-12 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-11 w-56 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-xl bg-[#130708] p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-full" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
                <Skeleton className="ml-auto h-7 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.6rem] bg-[linear-gradient(90deg,rgba(67,8,16,0.95),rgba(30,5,9,0.96))] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-72 max-w-full rounded-full" />
              <Skeleton className="h-5 w-80 max-w-full rounded-full" />
            </div>
          </div>
          <Skeleton className="h-12 w-44 rounded-xl" />
        </div>
      </section>
    </>
  );
}

export function OrdersListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="flex items-center justify-between rounded-xl bg-[#120607] p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-6 w-20 rounded-full" />
            <Skeleton className="ml-auto h-7 w-24 rounded-full" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function AddressCardsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="rounded-xl bg-[#16080a] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-36 rounded-full" />
              <SkeletonText className="mt-3" lines={3} />
              <Skeleton className="mt-4 h-32 w-full rounded-xl" />
            </div>
            <div className="flex w-28 flex-col gap-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function RecommendedBouquetSkeleton() {
  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-[#20090d]">
      <Skeleton className="h-44 w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-3/4 rounded-full" />
        <Skeleton className="h-5 w-1/2 rounded-full" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070102] text-[#fff6f4]">
      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-10">
        <div className="relative z-10 mx-auto max-w-7xl">
          <Skeleton className="h-11 w-40 rounded-full" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-[#5d2825] bg-[#130708]/90 p-3">
              <Skeleton className="h-[430px] w-full rounded-[1.55rem] sm:h-[560px]" />
              <div className="mt-3 grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-[1.15rem] sm:h-28" />
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="rounded-[2rem] border border-[#63302d] bg-[linear-gradient(145deg,rgba(27,9,10,0.94),rgba(51,15,17,0.88))] p-6 sm:p-8">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-28 rounded-full" />
                  <Skeleton className="h-10 w-36 rounded-full" />
                </div>
                <Skeleton className="mt-6 h-16 w-80 max-w-full rounded-full sm:h-20" />
                <SkeletonText className="mt-5" lines={3} />
                <div className="mt-7 flex gap-3">
                  <Skeleton className="h-12 w-32 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-[#5b2a28] bg-[#120708] p-4">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="mt-3 h-6 w-24 rounded-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="mt-7 h-14 w-full rounded-2xl" />
              </div>
              <div className="mt-5 rounded-[1.7rem] border border-[#61302d] bg-[#130708]/92 p-5">
                <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                  <Skeleton className="h-20 w-20 rounded-3xl" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-9 w-52 rounded-full" />
                    <Skeleton className="h-5 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function ShopDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#070102] text-[#fff6f4]">
      <section className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-10">
        <div className="relative z-10 mx-auto max-w-7xl">
          <Skeleton className="h-11 w-40 rounded-full" />
          <div className="mt-8 overflow-hidden rounded-[2.2rem] border border-[#63302d] bg-[#140708]">
            <div className="relative min-h-[24rem] p-6 sm:p-10">
              <Skeleton className="absolute inset-0 h-full w-full" />
              <div className="relative flex min-h-[24rem] flex-col justify-end">
                <div className="flex flex-wrap items-end gap-5">
                  <Skeleton className="h-24 w-24 rounded-[2rem]" />
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-10 w-28 rounded-full" />
                      <Skeleton className="h-10 w-28 rounded-full" />
                    </div>
                    <Skeleton className="h-16 w-80 max-w-full rounded-full sm:h-20" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <SkeletonText lines={4} />
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className={index > 1 ? "rounded-2xl border border-[#5d2d29] bg-[#100607] p-4 sm:col-span-2" : "rounded-2xl border border-[#5d2d29] bg-[#100607] p-4"}
                    >
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="mt-3 h-4 w-20 rounded-full" />
                      <Skeleton className="mt-2 h-5 w-3/4 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-[1.8rem] border border-[#61302d] bg-[#100607]">
                <Skeleton className="h-[27rem] w-full" />
              </div>
            </div>
          </div>
          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-12 w-72 rounded-full" />
              </div>
              <Skeleton className="h-5 w-36 rounded-full" />
            </div>
            <BouquetGridSkeleton count={3} className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" imageClassName="h-72 w-full" />
          </section>
        </div>
      </section>
    </main>
  );
}

export function ReviewsPanelSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="rounded-[1.6rem] border border-[#5d2d29] bg-[#120708] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <SkeletonText className="mt-4" lines={3} />
          <Skeleton className="mt-4 h-52 w-full rounded-[1.2rem]" />
        </article>
      ))}
    </div>
  );
}

export function BouquetReviewsHeroSkeleton() {
  return (
    <main className="min-h-screen bg-[#070102] text-[#fff6f4]">
      <section className="px-4 pb-8 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="h-11 w-40 rounded-full" />
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#63302d] bg-[#140708]">
            <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[18rem_1fr]">
              <Skeleton className="h-72 w-full rounded-[1.4rem]" />
              <div className="flex flex-col justify-center space-y-4">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-16 w-80 max-w-full rounded-full sm:h-20" />
                <SkeletonText lines={3} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function OwnerOrdersSkeleton() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070102] text-[#fff6f4]">
      <section className="px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(31,8,11,0.92),rgba(17,4,6,0.97))] p-6 sm:p-8">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="mt-4 h-16 w-[32rem] max-w-full rounded-full" />
            <Skeleton className="mt-4 h-5 w-[42rem] max-w-full rounded-full" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:max-w-[38rem]">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-[#5b2a31] bg-[#1a090c]/90 px-4 py-3">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="mt-3 h-8 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.6rem] border border-[#61302d] bg-[#100607] p-4">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="mt-3 h-12 w-full rounded-xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-[#61302d] bg-[#100607] p-4">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-3 h-12 w-full rounded-xl" />
              </div>
              <div className="rounded-[1.6rem] border border-[#61302d] bg-[#100607] p-4">
                <Skeleton className="h-4 w-24 rounded-full" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[1.6rem] border border-[#61302d] bg-[#100607] p-4">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="mt-3 h-10 w-20 rounded-full" />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <article key={index} className="overflow-hidden rounded-[2rem] border border-[#61302d] bg-[#100607]">
                <div className="border-b border-white/6 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-48 rounded-full" />
                      <Skeleton className="h-10 w-72 max-w-full rounded-full" />
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-28 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-36 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full rounded-[1.4rem] lg:w-[230px]" />
                  </div>
                </div>
                <div className="grid gap-5 px-5 py-5 sm:px-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 4 }).map((__, chipIndex) => (
                        <Skeleton key={chipIndex} className="h-24 w-full rounded-2xl" />
                      ))}
                    </div>
                    <Skeleton className="h-40 w-full rounded-2xl" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    {Array.from({ length: 2 }).map((__, itemIndex) => (
                      <div key={itemIndex} className="rounded-[1.4rem] border border-white/6 bg-white/[0.03] p-3">
                        <Skeleton className="h-24 w-full rounded-[1rem]" />
                        <Skeleton className="mt-3 h-5 w-40 rounded-full" />
                        <Skeleton className="mt-2 h-4 w-28 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
