import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { toast } from "react-toastify";
import {
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineQueueList,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { useManagedBouquets, useManagedReviews, useMyLatestShopApplication, useMyShops, useShopOrders } from "../../hooks/useCatalog";
import { AreaChartPanel, DonutChartPanel, GaugeChartPanel, MixedChartPanel } from "../admin/components/AdminCharts";
import { formatPrice } from "../../utils/catalog";
import { isRecentAdminNote } from "../../utils/adminNote";
import { useOrderRealtime } from "../../hooks/useOrderRealtime";
import bow from "../../assets/bow.png";

function monthKey(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  if (key === "Unknown") return key;
  const [year, month] = key.split("-");
  return `${month}/${year.slice(2)}`;
}

function buildLastMonths(count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function OwnerDashboard() {
  const { t } = useTranslation();
  const [showAdminNote, setShowAdminNote] = useState(false);
  const { data: shops = [] } = useMyShops();
  const { data: latestApplication } = useMyLatestShopApplication();
  const primaryShop = shops[0];
  const primaryShopId = primaryShop?.id;
  useOrderRealtime({
    scope: "shop",
    shopId: primaryShopId,
    enabled: Boolean(primaryShopId),
    onEvent: ({ event, order }) => {
      if (event === "order.created") {
        toast.info(t("owner.newOrderToast", { id: order.id.slice(0, 8) }));
        return;
      }

      toast.success(t("owner.orderUpdatedToast", { id: order.id.slice(0, 8) }));
    },
  });
  const { data: bouquets = [] } = useManagedBouquets(primaryShopId);
  const { data: reviews = [] } = useManagedReviews(primaryShopId);
  const { data: orders = [] } = useShopOrders(primaryShopId);

  const pendingReviews = reviews.filter((review) => !review.is_approved).length;
  const approvedReviews = reviews.filter((review) => review.is_approved).length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const completionRate = orders.length ? (deliveredOrders / orders.length) * 100 : 0;

  const lastMonths = buildLastMonths(6);
  const monthlyOrders = lastMonths.map((key) => ({
    label: monthLabel(key),
    value: orders.filter((order) => monthKey(order.created_at) === key).length,
  }));
  const monthlyRevenue = lastMonths.map((key) => ({
    label: monthLabel(key),
    value: orders
      .filter((order) => monthKey(order.created_at) === key)
      .reduce((sum, order) => sum + Number(order.total_price), 0),
  }));

  const mixedData = lastMonths.map((key, index) => ({
    label: monthLabel(key),
    bar: monthlyOrders[index]?.value ?? 0,
    line: Math.round((monthlyRevenue[index]?.value ?? 0) / 10),
  }));

  const activityData = lastMonths.map((key, index) => ({
    label: monthLabel(key),
    value: (monthlyOrders[index]?.value ?? 0) + Math.round((monthlyRevenue[index]?.value ?? 0) / 100),
  }));

  const bouquetStatusDistribution = [
    { label: t("owner.activeStatus"), value: bouquets.filter((item) => item.status === "active").length, color: "#91e2b9" },
    { label: t("owner.inactiveStatus"), value: bouquets.filter((item) => item.status === "inactive").length, color: "#f2c98d" },
    { label: t("owner.soldOutStatus"), value: bouquets.filter((item) => item.status === "sold_out").length, color: "#f1a2af" },
  ].filter((item) => item.value > 0);

  const reviewDistribution = [
    { label: t("owner.approved"), value: approvedReviews, color: "#91e2b9" },
    { label: t("owner.pending"), value: pendingReviews, color: "#f2c98d" },
  ].filter((item) => item.value > 0);

  const latestDecisionDate = latestApplication?.updated_at
    ? new Intl.DateTimeFormat(i18next.language || "en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(latestApplication.updated_at))
    : null;
  const isRecentNote = isRecentAdminNote(latestApplication?.updated_at);
  const applicationStatusLabel = latestApplication?.status === "approved"
    ? t("owner.approved")
    : latestApplication?.status === "rejected"
      ? t("owner.rejected")
      : t("owner.pending");

  useEffect(() => {
    setShowAdminNote(isRecentNote);
  }, [isRecentNote, latestApplication?.id]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#451920] bg-[linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-6 sm:p-8">
        <img
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
        />
        <p className="text-center text-sm uppercase tracking-[0.32em] text-[#d6a89d]">{t("owner.ownerPanel")}</p>
        <h1 className="mt-3 text-center font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">{t("owner.dashboard")}</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.myShops")}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{shops.length}</p>
          </div>
          <div className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.orders")}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.revenue")}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{formatPrice(String(totalRevenue))}</p>
          </div>
          <div className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.pendingReviews")}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{pendingReviews}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <MixedChartPanel
            title={t("owner.ordersRevenue")}
            subtitle={t("owner.monthlyTrend")}
            data={mixedData}
          />
        </div>
        <div className="xl:col-span-4">
          <GaugeChartPanel
            title={t("owner.deliveryKPI")}
            subtitle={t("owner.deliveredTotal")}
            value={completionRate}
          />
        </div>

        <div className="xl:col-span-6">
          <DonutChartPanel
            title={t("owner.bouquetStatus")}
            subtitle={t("owner.catalogDistribution")}
            data={bouquetStatusDistribution.length ? bouquetStatusDistribution : [{ label: t("owner.noData"), value: 1, color: "#4a1d22" }]}
            centerLabel={String(bouquets.length)}
          />
        </div>
        <div className="xl:col-span-6">
          <DonutChartPanel
            title={t("owner.reviewsPipeline")}
            subtitle={t("owner.moderationFlow")}
            data={reviewDistribution.length ? reviewDistribution : [{ label: t("owner.noData"), value: 1, color: "#4a1d22" }]}
            centerLabel={String(reviews.length)}
          />
        </div>

        <div className="xl:col-span-12">
          <AreaChartPanel
            title={t("owner.activityIndex")}
            subtitle={t("owner.activitySubtitle")}
            data={activityData}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link to="/owner/shop" className="group rounded-[1.6rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-5 transition hover:border-[#7a2a34]">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#251007] text-2xl text-[#f2be7f]">
            <HiOutlineSparkles />
          </span>
          <p className="mt-4 font-cormorant text-4xl text-white">{t("owner.myShop")}</p>
          <p className="mt-2 text-sm text-[#d8b7b0]">{t("owner.myShopDesc")}</p>
        </Link>
        <Link to="/owner/orders" className="group rounded-[1.6rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-5 transition hover:border-[#7a2a34]">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#251007] text-2xl text-[#f2be7f]">
            <HiOutlineQueueList />
          </span>
          <p className="mt-4 font-cormorant text-4xl text-white">{t("owner.ordersLink")}</p>
          <p className="mt-2 text-sm text-[#d8b7b0]">{t("owner.ordersDesc")}</p>
        </Link>
        <Link to="/owner/reviews" className="group rounded-[1.6rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-5 transition hover:border-[#7a2a34]">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#251007] text-2xl text-[#f2be7f]">
            <HiOutlineCheckBadge />
          </span>
          <p className="mt-4 font-cormorant text-4xl text-white">{t("owner.reviewsLink")}</p>
          <p className="mt-2 text-sm text-[#d8b7b0]">{t("owner.reviewsDesc")}</p>
        </Link>
      </section>

      {latestApplication?.admin_comment ? (
        <section
          className={`rounded-[1.8rem] border p-5 transition-all duration-300 ${
            latestApplication.status === "approved"
              ? "border-[#2f6d55] bg-[linear-gradient(180deg,rgba(15,36,28,0.96),rgba(9,22,17,0.98))]"
              : "border-[#7d3943] bg-[linear-gradient(180deg,rgba(43,18,23,0.96),rgba(28,10,14,0.98))]"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/95 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                  <HiOutlineCheckBadge className="text-2xl" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">{t("owner.latestAdminNote")}</p>
                  <h2 className="mt-1 font-cormorant text-4xl text-white">
                    {latestApplication.status === "approved" ? t("owner.approvalMessage") : t("owner.applicationFeedback")}
                  </h2>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/65">
                  {isRecentNote ? t("owner.freshNote") : t("owner.archivedNote")}
                </span>
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/65">
                  {t("owner.privateMessage")}
                </span>
              </div>

              {showAdminNote ? (
                <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">{t("owner.adminNote")}</p>
                    <p className="mt-3 text-white">{latestApplication.admin_comment}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/10 bg-black/10 px-4 py-3">
                    <div className="min-w-0">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">{t("owner.adminNote")}</p>
                    <p className="truncate text-sm text-white/80">
                      {latestApplication.admin_comment}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminNote(true)}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <HiOutlineEye />
                    {t("owner.open")}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-black/10 p-4 lg:w-[220px]">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">{t("owner.updated")}</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                <HiOutlineClock className="text-[#f2be7f]" />
                {latestDecisionDate ?? t("owner.recently")}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/60">{t("owner.status")}</p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">{applicationStatusLabel}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default OwnerDashboard;
