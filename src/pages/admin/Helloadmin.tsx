import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  HiOutlineBuildingStorefront,
  HiOutlineQueueList,
  HiOutlineSquares2X2,
  HiOutlineUsers,
} from "react-icons/hi2";
import { getShopOrders } from "../../api/catalog";
import { useAdmin } from "./hooks/useAdminData";
import {
  AreaChartPanel,
  BarChartPanel,
  DonutChartPanel,
  GaugeChartPanel,
  LineChartPanel,
  MixedChartPanel,
  RadarChartPanel,
} from "./components/AdminCharts";
import { formatPrice } from "../../utils/catalog";
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

function HelloAdmin() {
  const { user, adminUsersQuery, adminShopsQuery, adminCategoriesQuery } = useAdmin();
  const users = adminUsersQuery.data?.items ?? [];
  const shops = adminShopsQuery.data ?? [];
  const categories = adminCategoriesQuery.data ?? [];

  const orderQueries = useQueries({
    queries: shops.map((shop) => ({
      queryKey: ["orders", "shop", shop.id, "admin-dashboard"],
      queryFn: () => getShopOrders(shop.id),
      staleTime: 1000 * 30,
    })),
  });

  const orders = useMemo(
    () => orderQueries.flatMap((query) => query.data ?? []),
    [orderQueries],
  );

  const dashboardIsLoading =
    adminUsersQuery.isLoading ||
    adminShopsQuery.isLoading ||
    adminCategoriesQuery.isLoading ||
    orderQueries.some((query) => query.isLoading);

  const pendingApplications = shops.filter((shop) => shop.status === "pending");
  const activeShops = shops.filter((shop) => shop.status === "active");
  const blockedShops = shops.filter((shop) => shop.status === "blocked");

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const completionRate = orders.length ? (deliveredOrders / orders.length) * 100 : 0;

  const lastMonths = buildLastMonths(6);
  const monthlyOrders = lastMonths.map((key) => ({
    label: monthLabel(key),
    value: orders.filter((order) => monthKey(order.created_at) === key).length,
  }));
  const monthlyUsers = lastMonths.map((key) => ({
    label: monthLabel(key),
    value: users.filter((userItem) => monthKey(userItem.created_at) === key).length,
  }));
  const monthlyRevenue = lastMonths.map((key) => ({
    label: monthLabel(key),
    value: orders
      .filter((order) => monthKey(order.created_at) === key)
      .reduce((sum, order) => sum + Number(order.total_price ?? 0), 0),
  }));

  const barData = [
    { label: "Users", value: users.length },
    { label: "Shops", value: shops.length },
    { label: "Categories", value: categories.length },
    { label: "Orders", value: orders.length },
  ];

  const roleDistribution = [
    { label: "Admin", value: users.filter((item) => item.role === "admin").length, color: "#ff8a9a" },
    { label: "Owner", value: users.filter((item) => item.role === "owner").length, color: "#f2c98d" },
    { label: "Courier", value: users.filter((item) => item.role === "courier").length, color: "#96e2cf" },
    { label: "Customer", value: users.filter((item) => item.role === "customer").length, color: "#89b9ff" },
  ].filter((item) => item.value > 0);

  const shopDistribution = [
    { label: "Pending", value: pendingApplications.length, color: "#f2c98d" },
    { label: "Active", value: activeShops.length, color: "#91e2b9" },
    { label: "Blocked", value: blockedShops.length, color: "#f1a2af" },
  ].filter((item) => item.value > 0);

  const categoryOrderMap = new Map<string, number>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const label = item.bouquet_name?.split(" ").slice(0, 2).join(" ") || "Other";
      categoryOrderMap.set(label, (categoryOrderMap.get(label) ?? 0) + item.quantity);
    });
  });

  const topCategorySlices = Array.from(categoryOrderMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, value], index) => ({
      label,
      value,
      color: ["#ff8a9a", "#f2c98d", "#91e2b9", "#89b9ff"][index],
    }));

  const radarMetrics = [
    { label: "Users", value: users.length },
    { label: "Orders", value: orders.length },
    { label: "Revenue", value: Math.round(totalRevenue / 100) },
    { label: "Active", value: activeShops.length * 10 },
    { label: "Pending", value: pendingApplications.length * 10 },
  ];

  const mixedData = lastMonths.map((key, index) => ({
    label: monthLabel(key),
    bar: monthlyOrders[index]?.value ?? 0,
    line: Math.round((monthlyRevenue[index]?.value ?? 0) / 100),
  }));

  const platformActivity = lastMonths.map((key, index) => ({
    label: monthLabel(key),
    value: (monthlyOrders[index]?.value ?? 0) + (monthlyUsers[index]?.value ?? 0) + activeShops.length,
  }));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(200,80,97,0.18),transparent_28%),linear-gradient(180deg,rgba(31,8,11,0.9),rgba(17,4,6,0.94))] p-6 sm:p-8">
        <img
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
           />
        <p className="text-center text-sm uppercase tracking-[0.32em] text-[#d6a89d]">Admin Dashboard</p>
        <div className="mt-3 flex flex-col items-center gap-6">
          <div className="max-w-3xl">
            <h1 className="text-center font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">
              Welcome, {user?.full_name?.split(/\s+/)[0] ?? "Admin"}
            </h1>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Users", value: users.length, icon: <HiOutlineUsers /> },
              { label: "Shops", value: shops.length, icon: <HiOutlineBuildingStorefront /> },
              { label: "Categories", value: categories.length, icon: <HiOutlineSquares2X2 /> },
              { label: "Applications", value: pendingApplications.length, icon: <HiOutlineQueueList /> },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#251007] text-2xl text-[#f2be7f]">
                    {card.icon}
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{card.label}</p>
                    <p className="mt-1 text-3xl font-semibold text-white">{dashboardIsLoading ? "..." : card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <MixedChartPanel
            title="Orders + Revenue"
            subtitle="Bar buyurtmalarni, line esa daromad trendini ko'rsatadi"
            data={mixedData}
          />
        </div>
        <div className="xl:col-span-4">
          <GaugeChartPanel
            title="KPI Completion"
            subtitle="Delivered orderlar bo'yicha bajarilish foizi"
            value={completionRate}
          />
        </div>

        <div className="xl:col-span-4">
          <DonutChartPanel
            title="User Roles"
            subtitle="Foydalanuvchi rollari taqsimoti"
            data={roleDistribution}
            centerLabel={String(users.length)}
          />
        </div>
        <div className="xl:col-span-4">
          <DonutChartPanel
            title="Shop Status"
            subtitle="Shoplar holati bo'yicha taqsimot"
            data={shopDistribution}
            centerLabel={String(shops.length)}
          />
        </div>
        <div className="xl:col-span-4">
          <DonutChartPanel
            title="Top Order Mix"
            subtitle="Eng faol bouquet nomlari bo'yicha ulush"
            data={topCategorySlices.length ? topCategorySlices : [{ label: "No data", value: 1, color: "#4a1d22" }]}
            centerLabel={String(orders.length)}
          />
        </div>

        <div className="xl:col-span-7">
          <AreaChartPanel
            title="Platform Activity"
            subtitle="Buyurtma va user oqimi asosidagi activity index"
            data={platformActivity}
          />
        </div>
        <div className="xl:col-span-5">
          <RadarChartPanel
            title="Operational Radar"
            subtitle="Platformadagi asosiy ko'rsatkichlarning taqqoslanishi"
            data={radarMetrics}
          />
        </div>

        <div className="xl:col-span-12">
          <LineChartPanel
            title="User Growth"
            subtitle="Oxirgi 6 oyda yangi foydalanuvchilar"
            data={monthlyUsers}
          />
        </div>
        <div className="xl:col-span-6">
          <BarChartPanel
            title="Monthly Orders"
            subtitle="Oxirgi 6 oy bo'yicha buyurtmalar soni"
            data={monthlyOrders}
            color="#f2c98d"
          />
        </div>
        <div className="xl:col-span-6">
          <BarChartPanel
            title="Platform Volume"
            subtitle="Asosiy obyektlar soni"
            data={barData}
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
          <p className="font-cormorant text-4xl text-white">Revenue Snapshot</p>
          <p className="mt-1 text-sm text-[#caa7a0]">Platform daromadi va hozirgi aktivlik</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#492126] bg-[#180709] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#b7918a]">Total Revenue</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatPrice(String(totalRevenue))}</p>
            </div>
            <div className="rounded-2xl border border-[#492126] bg-[#180709] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#b7918a]">Delivered</p>
              <p className="mt-2 text-3xl font-semibold text-white">{deliveredOrders}</p>
            </div>
            <div className="rounded-2xl border border-[#492126] bg-[#180709] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#b7918a]">Pending Apps</p>
              <p className="mt-2 text-3xl font-semibold text-white">{pendingApplications.length}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
          <p className="font-cormorant text-4xl text-white">Admin Focus</p>
          <div className="mt-5 space-y-3">
            {[
              `${pendingApplications.length} ta shop arizasi ko'rib chiqishni kutyapti.`,
              `${activeShops.length} ta faol shop hozir buyurtma qabul qilmoqda.`,
              `${roleDistribution.find((item) => item.label === "Courier")?.value ?? 0} ta courier role tayyor holatda hisoblanmoqda.`,
            ].map((line) => (
              <div key={line} className="rounded-2xl border border-[#492126] bg-[#180709] px-4 py-4 text-[#efd8d2]">
                {line}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default HelloAdmin;