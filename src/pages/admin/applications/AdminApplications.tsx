import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { HiOutlineCheckBadge, HiOutlineClock, HiOutlineXMark } from "react-icons/hi2";
import { useReviewShopApplication, useShopApplications } from "../../../hooks/useCatalog";
import type { ShopApplicationWithUser } from "../../../types/catalog";
import bow from "../../../assets/bow.png";

type ReviewTarget = {
  application: ShopApplicationWithUser;
  status: "approved" | "rejected";
};

function formatDecisionDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AdminApplications() {
  const { data: applications = [], isLoading } = useShopApplications();
  const reviewApplicationMutation = useReviewShopApplication();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [adminComment, setAdminComment] = useState("");

  const pendingApplications = useMemo(
    () => applications.filter((application) => application.status === "pending"),
    [applications],
  );
  const reviewedApplications = useMemo(
    () => applications.filter((application) => application.status !== "pending"),
    [applications],
  );

  const openReviewModal = (application: ShopApplicationWithUser, status: "approved" | "rejected") => {
    setReviewTarget({ application, status });
    setAdminComment(application.admin_comment ?? "");
  };

  const closeReviewModal = () => {
    setReviewTarget(null);
    setAdminComment("");
  };

  const confirmReview = async () => {
    if (!reviewTarget || reviewApplicationMutation.isPending) return;
    try {
      await reviewApplicationMutation.mutateAsync({
        applicationId: reviewTarget.application.id,
        payload: {
          status: reviewTarget.status,
          admin_comment: adminComment.trim() || undefined,
        },
      });
      toast.success(reviewTarget.status === "approved" ? "Ariza tasdiqlandi" : "Ariza rad etildi");
      closeReviewModal();
    } catch {
      toast.error("Arizani yangilab bo'lmadi");
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-6 sm:p-8">
        <img
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
        />
        <p className="text-center text-sm uppercase tracking-[0.32em] text-[#d6a89d]">Admin Applications</p>
        <h1 className="mt-3 text-center font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">Seller Requests</h1>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a160b] text-2xl text-[#f2c98d]">
              <HiOutlineClock />
            </span>
            <div>
              <p className="font-cormorant text-4xl text-white">Pending Applications</p>
              <p className="text-sm text-[#cbaba4]">Tasdiq kutayotgan yangi seller arizalari.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-52 animate-pulse rounded-[1.6rem] border border-[#3d171c] bg-[#160709]" />
              ))
            ) : pendingApplications.length ? pendingApplications.map((application) => (
              <article key={application.id} className="rounded-[1.6rem] border border-[#4a1d22] bg-[#180709] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-cormorant text-3xl text-white">{application.shop_name}</p>
                    <p className="mt-1 text-sm text-[#d7b4ad]">
                      {application.user.full_name} · {application.user.email}
                    </p>
                    <p className="mt-2 text-sm text-[#efd8d2]">{application.phone}</p>
                    <p className="mt-2 text-sm text-[#efd8d2]">{application.address}</p>
                    <p className="mt-3 text-sm leading-6 text-[#cfaaa2]">
                      {application.description ?? "Izoh qoldirilmagan."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#f4d7d1]">
                      {application.city ? <span className="rounded-full bg-[#2a1015] px-3 py-1">{application.city}</span> : null}
                      {application.instagram ? <span className="rounded-full bg-[#2a1015] px-3 py-1">{application.instagram}</span> : null}
                      {application.telegram ? <span className="rounded-full bg-[#2a1015] px-3 py-1">{application.telegram}</span> : null}
                    </div>
                  </div>
                  <span className="rounded-full bg-[#2a160b] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f2c98d]">
                    Pending
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openReviewModal(application, "approved")}
                    disabled={reviewApplicationMutation.isPending}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2a7a58] to-[#41a978] px-5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Approve Seller
                  </button>
                  <button
                    type="button"
                    onClick={() => openReviewModal(application, "rejected")}
                    disabled={reviewApplicationMutation.isPending}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </article>
            )) : (
              <div className="rounded-[1.6rem] border border-dashed border-[#4a1d22] bg-[#180709] px-5 py-12 text-center text-[#cfaaa2]">
                Hozircha pending ariza yo'q.
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
              <p className="font-cormorant text-4xl text-white">Reviewed</p>
              <p className="text-sm text-[#cbaba4]">Ko'rib chiqilgan seller arizalari.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {reviewedApplications.slice(0, 8).map((application) => (
              <div key={application.id} className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{application.shop_name}</p>
                    <p className="truncate text-sm text-[#cfaaa2]">{application.user.full_name}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${application.status === "approved" ? "bg-[#10241a] text-[#9ef0c2]" : "bg-[#321116] text-[#ffb1bd]"}`}>
                    {application.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#b9968f]">
                  <span>Decision Time</span>
                  <span className="h-1 w-1 rounded-full bg-[#7d5652]" />
                  <span>{formatDecisionDate(application.updated_at)}</span>
                </div>
                {application.admin_comment ? (
                  <p className="mt-3 text-sm leading-6 text-[#d8b7b0]">{application.admin_comment}</p>
                ) : null}
              </div>
            ))}

            {!reviewedApplications.length ? (
              <div className="rounded-2xl border border-dashed border-[#4a1d22] bg-[#180709] px-4 py-10 text-center text-sm text-[#cfaaa2]">
                Ko'rib chiqilgan arizalar hali yo'q.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      {reviewTarget ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#643335] bg-[#100507] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#c79f97]">Application Review</p>
                <h3 className="mt-2 font-cormorant text-3xl leading-tight text-white">
                  {reviewTarget.status === "approved" ? "Approve this seller?" : "Reject this seller?"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#714243] text-[#f6d6ce]"
                aria-label="Close review modal"
              >
                <HiOutlineXMark />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#4a1d22] bg-[#180709] p-4">
              <p className="font-semibold text-white">{reviewTarget.application.shop_name}</p>
              <p className="mt-1 text-sm text-[#d8b7b0]">{reviewTarget.application.user.full_name}</p>
              <p className="mt-2 text-sm text-[#ecd8d2]">{reviewTarget.application.address}</p>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm text-[#e6c6c0]">Admin comment</span>
              <textarea
                value={adminComment}
                onChange={(event) => setAdminComment(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-white outline-none"
                placeholder={reviewTarget.status === "approved" ? "Optional welcome note..." : "Reject reason or requested fixes..."}
              />
            </label>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={reviewApplicationMutation.isPending}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#6b3a3c] bg-transparent px-5 text-sm font-semibold text-[#f1d5cb] transition hover:border-[#8e4d50] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReview}
                disabled={reviewApplicationMutation.isPending}
                className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  reviewTarget.status === "approved"
                    ? "bg-gradient-to-r from-[#2a7a58] to-[#41a978]"
                    : "border border-[#8c4651] bg-[#2a1015] text-[#f3c4cb]"
                }`}
              >
                {reviewApplicationMutation.isPending
                  ? "Saving..."
                  : reviewTarget.status === "approved"
                    ? "Yes, approve"
                    : "Yes, reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminApplications;
