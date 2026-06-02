import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { HiOutlineCheckBadge, HiOutlineChatBubbleBottomCenterText, HiOutlineClock, HiOutlineXMark } from "react-icons/hi2";
import { useManagedReviews, useModerateReview, useMyShops } from "../../hooks/useCatalog";
import bow from "../../assets/bow.png";

function OwnerReviews() {
  const { t } = useTranslation();
  const { data: shops = [] } = useMyShops();
  const selectedShopId = shops[0]?.id;
  const { data: reviews = [], isLoading } = useManagedReviews(selectedShopId);
  const moderateReviewMutation = useModerateReview();
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const pendingReviews = useMemo(() => reviews.filter((review) => !review.is_approved), [reviews]);
  const approvedReviews = useMemo(() => reviews.filter((review) => review.is_approved), [reviews]);

  const handleModerate = async (reviewId: string, isApproved: boolean) => {
    if (moderateReviewMutation.isPending) return;
    try {
      setSelectedReviewId(reviewId);
      await moderateReviewMutation.mutateAsync({
        reviewId,
        payload: { is_approved: isApproved },
      });
      toast.success(isApproved ? t("owner.reviewApproved") : t("owner.reviewRejected"));
    } catch {
      toast.error(t("owner.reviewUpdateError"));
    } finally {
      setSelectedReviewId(null);
    }
  };

  if (!selectedShopId) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-[#4a1d22] bg-[#180709] px-5 py-16 text-center text-[#cfaaa2]">
        {t("owner.moderationFor")}
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
        <p className="text-sm uppercase tracking-[0.32em] text-[#d6a89d]">{t("owner.ownerPanel")}</p>
        <h1 className="mt-3 font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">{t("owner.reviewsControl")}</h1>
        <p className="mt-2 text-[#d8b7b0]">{t("owner.reviewsControlDesc")}</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a160b] text-2xl text-[#f2c98d]">
              <HiOutlineClock />
            </span>
            <div>
              <p className="font-cormorant text-4xl text-white">{t("owner.pendingReviewsList")}</p>
              <p className="text-sm text-[#cbaba4]">{t("owner.pendingDesc")}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-[1.6rem] border border-[#3d171c] bg-[#160709]" />
              ))
            ) : pendingReviews.length ? pendingReviews.map((review) => (
              <article key={review.id} className="rounded-[1.6rem] border border-[#4a1d22] bg-[#180709] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{review.user.full_name}</p>
                    <p className="mt-1 text-sm text-[#d7b4ad]">{review.bouquet?.name ?? t("owner.shopReview")} · {review.rating}/5</p>
                    <p className="mt-3 text-sm leading-6 text-[#efd8d2]">{review.text ?? t("owner.noReviewText")}</p>
                  </div>
                  <span className="rounded-full bg-[#2a160b] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f2c98d]">
                    {t("owner.pending")}
                  </span>
                </div>
                {review.image ? <img src={review.image} alt={t("owner.reviewImage")} className="mt-4 h-36 w-full rounded-2xl object-cover" /> : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleModerate(review.id, true)}
                    disabled={selectedReviewId === review.id}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2a7a58] to-[#41a978] px-5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {selectedReviewId === review.id ? t("owner.saving") : t("owner.approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(review.id, false)}
                    disabled={selectedReviewId === review.id}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] disabled:opacity-60"
                  >
                    {t("owner.reject")}
                  </button>
                </div>
              </article>
            )) : (
              <div className="rounded-[1.6rem] border border-dashed border-[#4a1d22] bg-[#180709] px-5 py-12 text-center text-[#cfaaa2]">
                {t("owner.noPendingReviews")}
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f241c] text-2xl text-[#91e2b9]">
              <HiOutlineCheckBadge />
            </span>
            <div>
              <p className="font-cormorant text-4xl text-white">{t("owner.approvedReviewsList")}</p>
              <p className="text-sm text-[#cbaba4]">{t("owner.approvedDesc")}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {approvedReviews.slice(0, 8).map((review) => (
              <div key={review.id} className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{review.user.full_name}</p>
                    <p className="truncate text-sm text-[#cfaaa2]">{review.bouquet?.name ?? t("owner.shopReview")} · {review.rating}/5</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleModerate(review.id, false)}
                    disabled={selectedReviewId === review.id}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#6d3740] bg-[#220c10] text-[#f6d7d1] disabled:opacity-60"
                  >
                    <HiOutlineXMark />
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#d8b7b0]">{review.text ?? t("owner.noReviewText")}</p>
              </div>
            ))}

            {!approvedReviews.length ? (
              <div className="rounded-2xl border border-dashed border-[#4a1d22] bg-[#180709] px-4 py-10 text-center text-sm text-[#cfaaa2]">
                {t("owner.noApprovedReviews")}
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#251007] text-2xl text-[#f2be7f]">
            <HiOutlineChatBubbleBottomCenterText />
          </span>
          <div>
            <p className="font-cormorant text-4xl text-white">{t("owner.moderationPolicy")}</p>
            <p className="text-sm text-[#cbaba4]">{t("owner.moderationDesc")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OwnerReviews;
