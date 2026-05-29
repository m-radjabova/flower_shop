import { useMemo } from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { HiOutlineCheckBadge, HiOutlineClock } from "react-icons/hi2";
import { useAdminShops, useUpdateShop } from "../../../hooks/useCatalog";
import bow from "../../../assets/bow.png";

function AdminApplications() {
  const { data: shops = [], isLoading } = useAdminShops();
  const updateShopMutation = useUpdateShop();
  const [submittingStatus, setSubmittingStatus] = useState<Record<string, boolean>>({});

  const pendingShops = useMemo(() => shops.filter((shop) => shop.status === "pending"), [shops]);
  const reviewedShops = useMemo(() => shops.filter((shop) => shop.status !== "pending"), [shops]);

  const updateStatus = async (shopId: string, status: "active" | "blocked") => {
    if (submittingStatus[shopId]) return;
    try {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: true }));
      await updateShopMutation.mutateAsync({ shopId, payload: { status } });
      toast.success(`Application ${status === "active" ? "approved" : "blocked"}`);
    } catch {
      toast.error("Arizani yangilab bo'lmadi");
    } finally {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: false }));
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
        <h1 className="mt-3 text-center font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">Shop Applications</h1>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a160b] text-2xl text-[#f2c98d]">
              <HiOutlineClock />
            </span>
            <div>
              <p className="font-cormorant text-4xl text-white">Pending Applications</p>
              <p className="text-sm text-[#cbaba4]">Tasdiq kutayotgan shoplar.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-[1.6rem] border border-[#3d171c] bg-[#160709]" />
              ))
            ) : pendingShops.length ? pendingShops.map((shop) => (
              <article key={shop.id} className="rounded-[1.6rem] border border-[#4a1d22] bg-[#180709] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-cormorant text-3xl text-white">{shop.name}</p>
                    <p className="mt-1 text-sm text-[#d7b4ad]">{shop.owner.full_name} · {shop.owner.email}</p>
                    <p className="mt-3 text-sm text-[#efd8d2]">{shop.address}</p>
                  </div>
                  <span className="rounded-full bg-[#2a160b] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f2c98d]">
                    Pending
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => updateStatus(shop.id, "active")}
                    disabled={Boolean(submittingStatus[shop.id])}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2a7a58] to-[#41a978] px-5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submittingStatus[shop.id] ? "Saving..." : "Approve Shop"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(shop.id, "blocked")}
                    disabled={Boolean(submittingStatus[shop.id])}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] disabled:opacity-60"
                  >
                    {submittingStatus[shop.id] ? "Saving..." : "Reject / Block"}
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
              <p className="text-sm text-[#cbaba4]">Ko'rib chiqilgan shoplar.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {reviewedShops.slice(0, 6).map((shop) => (
              <div key={shop.id} className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{shop.name}</p>
                    <p className="truncate text-sm text-[#cfaaa2]">{shop.owner.full_name}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${shop.status === "active" ? "bg-[#10241a] text-[#9ef0c2]" : "bg-[#321116] text-[#ffb1bd]"}`}>
                    {shop.status}
                  </span>
                </div>
              </div>
            ))}

            {!reviewedShops.length ? (
              <div className="rounded-2xl border border-dashed border-[#4a1d22] bg-[#180709] px-4 py-10 text-center text-sm text-[#cfaaa2]">
                Ko'rib chiqilgan shoplar hali yo'q.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminApplications;
