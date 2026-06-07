import { useMemo, useState } from "react";
import { HiOutlineBuildingStorefront, HiOutlineMagnifyingGlass, HiOutlineMapPin, HiOutlinePhone, HiOutlineSparkles, HiXMark } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useAdminShops, useUpdateShop } from "../../../hooks/useCatalog";
import AdminSearchPanel from "../components/AdminSearchPanel";
import { useDebounce } from "../../../hooks/useDebounce";
import bow from "../../../assets/bow.png";
import ShopFeatureBadges from "../../../components/shops/ShopFeatureBadges";
import ShopVerifiedBadge from "../../../components/shops/ShopVerifiedBadge";

const statusTone: Record<"pending" | "active" | "blocked", string> = {
  pending: "border-[#7f5a3b] bg-[#2a160b] text-[#f2c98d]",
  active: "border-[#2f6d55] bg-[#0f241c] text-[#91e2b9]",
  blocked: "border-[#7d3943] bg-[#2b1217] text-[#f1a2af]",
};

function AdminShops() {
  const { data: shops = [], isLoading } = useAdminShops();
  const updateShopMutation = useUpdateShop();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 450);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "active" | "blocked">("all");
  const [submittingStatus, setSubmittingStatus] = useState<Record<string, boolean>>({});
  const [blockTargetShop, setBlockTargetShop] = useState<{ id: string; name: string } | null>(null);

  const pendingCount = shops.filter((shop) => shop.status === "pending").length;
  const activeCount = shops.filter((shop) => shop.status === "active").length;
  const blockedCount = shops.filter((shop) => shop.status === "blocked").length;
  const filteredShops = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    return shops.filter((shop) => {
      const matchesStatus = statusFilter === "all" ? true : shop.status === statusFilter;
      const matchesQuery = query
        ? [shop.name, shop.owner.full_name, shop.city ?? "", shop.address].join(" ").toLowerCase().includes(query)
        : true;
      return matchesStatus && matchesQuery;
    });
  }, [debouncedSearch, shops, statusFilter]);

  const handleStatusChange = async (shopId: string, status: "pending" | "active" | "blocked") => {
    if (submittingStatus[shopId]) return;
    try {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: true }));
      await updateShopMutation.mutateAsync({ shopId, payload: { status } });
      toast.success(`Shop status updated to ${status}`);
    } catch {
      toast.error("Shop statusni yangilab bo'lmadi");
    } finally {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  const handleVerificationChange = async (shopId: string, isVerified: boolean) => {
    if (submittingStatus[shopId]) return;
    try {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: true }));
      await updateShopMutation.mutateAsync({ shopId, payload: { is_verified: isVerified } });
      toast.success(isVerified ? "Shop verified" : "Verification removed");
    } catch {
      toast.error("Verification yangilanmadi");
    } finally {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  const handlePremiumChange = async (shopId: string, isPremium: boolean) => {
    if (submittingStatus[shopId]) return;
    try {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: true }));
      await updateShopMutation.mutateAsync({ shopId, payload: { is_premium: isPremium } });
      toast.success(isPremium ? "Premium enabled" : "Premium removed");
    } catch {
      toast.error("Premium holati yangilanmadi");
    } finally {
      setSubmittingStatus((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  const handleConfirmBlock = async () => {
    if (!blockTargetShop) return;
    await handleStatusChange(blockTargetShop.id, "blocked");
    setBlockTargetShop(null);
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-6 sm:p-8">
        <img
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
           />
        <p className="text-center text-sm uppercase tracking-[0.32em] text-[#d6a89d]">Admin Panel</p>
        <div className="mt-3 flex flex-col items-center gap-4">
          <div className="w-full">
            <h1 className="text-center font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">Shops Control</h1>
          </div>
          <div className="grid w-full max-w-xl grid-cols-3 gap-3">
            {[
              { label: "Pending", value: pendingCount },
              { label: "Active", value: activeCount },
              { label: "Blocked", value: blockedCount },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-center">
                <p className="text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#c79f97]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <AdminSearchPanel defaultOpen={Boolean(search) || statusFilter !== "all"}>
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-[#4a1d22] bg-[#180709] px-4">
              <HiOutlineMagnifyingGlass className="text-xl text-[#d3a49d]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search shops, owners, cities..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#8e6d68]"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="h-12 rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </AdminSearchPanel>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-60 animate-pulse rounded-[1.8rem] border border-[#3d171c] bg-[#160709]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredShops.map((shop) => (
            <article
              key={shop.id}
              className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#251007] text-3xl text-[#f2be7f]">
                    <HiOutlineBuildingStorefront />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-cormorant text-3xl text-white">{shop.name}</h2>
                      {shop.is_verified ? <ShopVerifiedBadge /> : null}
                    </div>
                    <ShopFeatureBadges shop={shop} className="mt-2" />
                    <p className="text-sm text-[#d8b1aa]">{shop.owner.full_name}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${statusTone[shop.status]}`}>
                  {shop.status}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-[#eed8d3]">
                <div className="flex items-center gap-2">
                  <HiOutlineMapPin className="text-[#f2be7f]" />
                  <span>{shop.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlinePhone className="text-[#f2be7f]" />
                  <span>{shop.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineSparkles className="text-[#f2be7f]" />
                  <span>{shop.city ?? "No city"} · Rating {shop.rating} · Reviews {shop.reviews_count}</span>
                </div>
              </div>

              <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#cfa8a0]">
                {shop.description ?? "Shop description kiritilmagan."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {shop.status !== "active" ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(shop.id, "active")}
                    disabled={Boolean(submittingStatus[shop.id])}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#2a7a58] to-[#41a978] px-5 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingStatus[shop.id] ? "Saving..." : "Approve"}
                  </button>
                ) : null}
                {shop.status !== "blocked" ? (
                  <button
                    type="button"
                    onClick={() => setBlockTargetShop({ id: shop.id, name: shop.name })}
                    disabled={Boolean(submittingStatus[shop.id])}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] transition hover:border-[#b45c69] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingStatus[shop.id] ? "Saving..." : "Block"}
                  </button>
                ) : null}
                {shop.status === "blocked" ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(shop.id, "pending")}
                    disabled={Boolean(submittingStatus[shop.id])}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#7f5a3b] bg-[#2a160b] px-5 text-sm font-semibold text-[#f2c98d] transition hover:border-[#b88758] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingStatus[shop.id] ? "Saving..." : "Back to Pending"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleVerificationChange(shop.id, !shop.is_verified)}
                  disabled={Boolean(submittingStatus[shop.id])}
                  className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    shop.is_verified
                      ? "border-[#3f6fb2] bg-[#10213b] text-[#c5ddff] hover:border-[#5f92dc]"
                      : "border-[#3d4f73] bg-[#101722] text-[#d3e2ff] hover:border-[#5b79ac]"
                  }`}
                >
                  {shop.is_verified ? "Remove Verify" : "Verify Shop"}
                </button>
                <button
                  type="button"
                  onClick={() => handlePremiumChange(shop.id, !shop.is_premium)}
                  disabled={Boolean(submittingStatus[shop.id])}
                  className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    shop.is_premium
                      ? "border-[#58bfe7] bg-[#0d2230] text-[#cdefff] hover:border-[#7fd9ff]"
                      : "border-[#38556a] bg-[#0d161f] text-[#d2e6f5] hover:border-[#5b86a5]"
                  }`}
                >
                  {shop.is_premium ? "Remove Premium" : "Make Premium"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {blockTargetShop ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#643335] bg-[#100507] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#c79f97]">Security Confirmation</p>
                <h3 className="mt-2 font-cormorant text-3xl leading-tight text-white">Block this shop?</h3>
              </div>
              <button
                type="button"
                onClick={() => setBlockTargetShop(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#714243] text-[#f6d6ce]"
                aria-label="Close confirmation modal"
              >
                <HiXMark />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#ddb8b0]">
              Siz rostan ham <span className="font-semibold text-white">{blockTargetShop.name}</span> do‘konini bloklamoqchimisiz?
              Bu amal shop faoliyatini to‘xtatadi.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockTargetShop(null)}
                disabled={Boolean(submittingStatus[blockTargetShop.id])}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#6b3a3c] bg-transparent px-5 text-sm font-semibold text-[#f1d5cb] transition hover:border-[#8e4d50] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={Boolean(submittingStatus[blockTargetShop.id])}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] transition hover:border-[#b45c69] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingStatus[blockTargetShop.id] ? "Blocking..." : "Yes, block"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminShops;
