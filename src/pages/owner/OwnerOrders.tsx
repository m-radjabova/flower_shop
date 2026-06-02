import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  HiCalendarDays,
  HiChevronDown,
  HiChevronUp,
  HiOutlineCreditCard,
  HiOutlineMagnifyingGlass,
  HiOutlinePhone,
  HiOutlineTruck,
  HiOutlineXMark,
  HiOutlineFunnel,
  HiOutlineArrowUpTray,
  HiOutlineArrowDownTray,
  HiOutlineMapPin,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineCheckBadge,
  HiOutlineFire,
  HiOutlineClock,
  HiOutlineBuildingStorefront,
  HiArrowRight,
  HiOutlineDocumentText,
  HiOutlineCube,
  HiOutlineGiftTop,
} from "react-icons/hi2";
import { OrdersListSkeleton, OwnerOrdersSkeleton } from "../../components/PageSkeletons";
import OrderProgress from "../../components/orders/OrderProgress";
import { useMyShops, useShopOrders, useUpdateOrderStatus } from "../../hooks/useCatalog";
import { useOrderRealtime } from "../../hooks/useOrderRealtime";
import { toast } from "react-toastify";
import { formatPrice } from "../../utils/catalog";
import {
  formatDeliveryMethod,
  formatOrderDate,
  formatPaymentMethod,
  getOrderEtaMeta,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "../profile/components/profileHelpers";
import { useDebounce } from "../../hooks/useDebounce";
import bow from "../../assets/bow.png";
import type { OrderOut } from "../../types/catalog";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseLegacyOrderMeta(note: string | null) {
  const fallback = { size: "-", addons: [] as string[] };
  if (!note) return fallback;

  const parts = note.split("|").map((part) => part.trim());
  const sizePart = parts.find((part) => part.toLowerCase().startsWith("size:"));
  const addonsPart = parts.find((part) => part.toLowerCase().startsWith("addons:"));

  return {
    size: sizePart ? sizePart.replace(/^size:\s*/i, "") : "-",
    addons: addonsPart
      ? addonsPart
          .replace(/^addons:\s*/i, "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  };
}

type SortKey = "date_desc" | "date_asc" | "price_desc" | "price_asc";
type DatePreset = "all" | "today" | "week" | "month";

const statusColorMap: Record<string, string> = {
  all: "bg-white/50",
  new: "bg-amber-400",
  accepted: "bg-blue-400",
  preparing: "bg-violet-400",
  delivering: "bg-orange-400",
  delivered: "bg-emerald-400",
  cancelled: "bg-red-400",
};

function getDateRange(preset: DatePreset): { from: string; to: string } | null {
  if (preset === "all") return null;
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;

  if (preset === "today") {
    from = to;
  } else if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    from = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    from = d.toISOString().slice(0, 10);
  }
  return { from, to };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function OwnerOrders() {
  const { data: shops = [], isLoading: isShopsLoading } = useMyShops();
  const { register, watch, setValue } = useForm<{ selectedShopId: string }>({
    defaultValues: { selectedShopId: "" },
  });
  const selectedShopId = watch("selectedShopId");

  /* ---- filter state ---- */
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 350);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderOut["status"]>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date_desc");
  const [showFilters, setShowFilters] = useState(false);

  const activeShopId = selectedShopId || shops[0]?.id || "";
  const activeShop = shops.find((shop) => shop.id === activeShopId) ?? shops[0] ?? null;
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null);
  const recentOrderTimeoutRef = useRef<number | null>(null);
  useOrderRealtime({
    scope: "shop",
    shopId: activeShopId,
    enabled: Boolean(activeShopId),
    onEvent: ({ event, order }) => {
      if (recentOrderTimeoutRef.current !== null) {
        window.clearTimeout(recentOrderTimeoutRef.current);
      }
      setRecentOrderId(order.id);
      recentOrderTimeoutRef.current = window.setTimeout(() => {
        setRecentOrderId((current) => (current === order.id ? null : current));
        recentOrderTimeoutRef.current = null;
      }, 3500);

      if (event === "order.created") {
        toast.info(t("owner.newOrderToast", { id: order.id.slice(0, 8) }));
        return;
      }

      toast.success(t("owner.orderUpdatedToast", { id: order.id.slice(0, 8) }));
    },
  });
  const ordersQuery = useShopOrders(activeShopId);
  const updateOrderStatus = useUpdateOrderStatus();
  const { t } = useTranslation();
  const sortOptions = useMemo(
    () => [
      { value: "date_desc" as const, label: t("owner.sortNewest") },
      { value: "date_asc" as const, label: t("owner.sortOldest") },
      { value: "price_desc" as const, label: t("owner.sortPriceHigh") },
      { value: "price_asc" as const, label: t("owner.sortPriceLow") },
    ],
    [t],
  );
  const datePresets = useMemo(
    () => [
      { key: "all" as const, label: t("owner.all") },
      { key: "today" as const, label: t("owner.today") },
      { key: "week" as const, label: t("owner.thisWeek") },
      { key: "month" as const, label: t("owner.thisMonth") },
    ],
    [t],
  );
  const orderStatusOptions = useMemo(
    () => [
      { value: "all" as const, label: t("owner.all") },
      { value: "new" as const, label: t("owner.new") },
      { value: "accepted" as const, label: t("owner.accepted") },
      { value: "preparing" as const, label: t("owner.preparing") },
      { value: "delivering" as const, label: t("owner.delivering") },
      { value: "delivered" as const, label: t("owner.deliveredDone") },
      { value: "cancelled" as const, label: t("owner.cancelled") },
    ],
    [t],
  );
  const getNextOwnerAction = (status: OrderOut["status"]) => {
    switch (status) {
      case "new":
        return { label: t("owner.acceptOrder"), icon: "✅", status: "accepted" as const };
      case "accepted":
        return { label: t("owner.startPreparing"), icon: "🎀", status: "preparing" as const };
      case "preparing":
        return { label: t("owner.sendCourier"), icon: "🚚", status: "delivering" as const };
      case "delivering":
        return { label: t("owner.deliveredDone"), icon: "🎉", status: "delivered" as const };
      default:
        return null;
    }
  };
  const localizedOrderFlowSteps = useMemo(
    () => [
      { key: "new" as const, label: t("owner.new") },
      { key: "accepted" as const, label: t("owner.accepted") },
      { key: "preparing" as const, label: t("owner.preparing") },
      { key: "delivering" as const, label: t("owner.delivering") },
      { key: "delivered" as const, label: t("owner.deliveredDone") },
    ],
    [t],
  );
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const detailRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ---- helpers ---- */
  function toggleExpanded(orderId: string) {
    setExpandedMap((current) => {
      const willExpand = !current[orderId];
      if (willExpand) {
        window.setTimeout(() => {
          detailRefs.current[orderId]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 120);
      }
      return { ...current, [orderId]: willExpand };
    });
  }

  function clearAllFilters() {
    setSearchText("");
    setStatusFilter("all");
    setDatePreset("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setPaymentFilter("all");
    setDeliveryFilter("all");
    setSortBy("date_desc");
  }

  function handleAdvanceOrder(orderId: string, nextStatus: OrderOut["status"]) {
    if (submittingOrderId === orderId) return;

    setSubmittingOrderId(orderId);
    updateOrderStatus.mutate(
      { orderId, payload: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(nextStatus === "delivered" ? t("owner.orderCompleted") : t("owner.orderStatusUpdated"));
        },
        onError: () => {
          toast.error(t("orderSendFailed"));
        },
        onSettled: () => {
          setSubmittingOrderId((current) => (current === orderId ? null : current));
        },
      },
    );
  }

  useEffect(() => {
    if (!selectedShopId && shops[0]?.id) {
      setValue("selectedShopId", shops[0].id);
    }
  }, [selectedShopId, setValue, shops]);

  useEffect(() => {
    return () => {
      if (recentOrderTimeoutRef.current !== null) {
        window.clearTimeout(recentOrderTimeoutRef.current);
      }
    };
  }, []);

  /* ---- derived data ---- */
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const uniquePaymentMethods = useMemo(
    () => Array.from(new Set(orders.map((o) => o.payment_method))).filter(Boolean),
    [orders],
  );
  const uniqueDeliveryMethods = useMemo(
    () => Array.from(new Set(orders.map((o) => o.delivery_method))).filter(Boolean),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    const dateRange =
      datePreset === "all" && !customDateFrom && !customDateTo
        ? null
        : datePreset !== "all"
          ? getDateRange(datePreset)
          : { from: customDateFrom, to: customDateTo };

    return orders
      .filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        if (paymentFilter !== "all" && order.payment_method !== paymentFilter) return false;
        if (deliveryFilter !== "all" && order.delivery_method !== deliveryFilter) return false;
        if (dateRange) {
          const orderDate = order.created_at.slice(0, 10);
          if (dateRange.from && orderDate < dateRange.from) return false;
          if (dateRange.to && orderDate > dateRange.to) return false;
        }
        if (!normalizedSearch) return true;
        const searchableText = [
          order.id,
          order.customer_name,
          order.phone,
          order.email ?? "",
          order.address ?? "",
          order.delivery_method,
          order.payment_method,
          order.note ?? "",
          ...order.items.map((item) => item.bouquet_name),
        ]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(normalizedSearch);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date_desc":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "date_asc":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "price_desc":
            return Number(b.total_price) - Number(a.total_price);
          case "price_asc":
            return Number(a.total_price) - Number(b.total_price);
          default:
            return 0;
        }
      });
  }, [orders, debouncedSearch, statusFilter, datePreset, customDateFrom, customDateTo, paymentFilter, deliveryFilter, sortBy]);

  const totals = useMemo(() => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((acc, order) => acc + Number(order.total_price), 0);
    const newOrders = orders.filter((order) => order.status === "new").length;
    const deliveringOrders = orders.filter(
      (order) =>
        order.status === "accepted" || order.status === "preparing" || order.status === "delivering",
    ).length;
    const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
    const averageOrderValue = totalOrders ? totalAmount / totalOrders : 0;

    return { totalOrders, totalAmount, newOrders, deliveringOrders, deliveredOrders, averageOrderValue };
  }, [orders]);

  const orderStatusCounts = useMemo(
    () =>
      orderStatusOptions.map((option) => ({
        ...option,
        count:
          option.value === "all"
            ? orders.length
            : orders.filter((order) => order.status === option.value).length,
      })),
    [orders, orderStatusOptions],
  );

  /* active filter chips */
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];

    if (statusFilter !== "all") {
      const opt = orderStatusOptions.find((o) => o.value === statusFilter);
      chips.push({
        key: "status",
        label: t("owner.filterStatus", { value: opt?.label ?? statusFilter }),
        onClear: () => setStatusFilter("all"),
      });
    }
    if (datePreset !== "all") {
      const p = datePresets.find((d) => d.key === datePreset);
      chips.push({
        key: "date",
        label: t("owner.filterDate", { value: p?.label ?? datePreset }),
        onClear: () => {
          setDatePreset("all");
          setCustomDateFrom("");
          setCustomDateTo("");
        },
      });
    }
    if (customDateFrom || customDateTo) {
      chips.push({
        key: "custom-date",
        label: t("owner.filterDateRange", { from: customDateFrom || "...", to: customDateTo || "..." }),
        onClear: () => {
          setCustomDateFrom("");
          setCustomDateTo("");
          setDatePreset("all");
        },
      });
    }
    if (paymentFilter !== "all") {
      chips.push({
        key: "payment",
        label: t("owner.filterPayment", { value: formatPaymentMethod(paymentFilter) }),
        onClear: () => setPaymentFilter("all"),
      });
    }
    if (deliveryFilter !== "all") {
      chips.push({
        key: "delivery",
        label: t("owner.filterDelivery", { value: formatDeliveryMethod(deliveryFilter) }),
        onClear: () => setDeliveryFilter("all"),
      });
    }
    if (sortBy !== "date_desc") {
      const s = sortOptions.find((o) => o.value === sortBy);
      chips.push({
        key: "sort",
        label: t("owner.filterSort", { value: s?.label ?? sortBy }),
        onClear: () => setSortBy("date_desc"),
      });
    }
    return chips;
  }, [
    statusFilter,
    datePreset,
    customDateFrom,
    customDateTo,
    paymentFilter,
    deliveryFilter,
    sortBy,
    t,
    orderStatusOptions,
    datePresets,
    sortOptions,
  ]);

  const advancedFilterCount = [datePreset !== "all", paymentFilter !== "all", deliveryFilter !== "all", sortBy !== "date_desc"].filter(Boolean).length;

  /* ---- render ---- */
  if (isShopsLoading) return <OwnerOrdersSkeleton />;

  return (
    <div className="mx-auto max-w-7xl text-[#fff6f4]">
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden rounded-[2.2rem] border border-[#4d1f25] bg-[linear-gradient(180deg,rgba(31,8,11,0.92),rgba(17,4,6,0.97))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:p-8">
        <img
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
        />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-[#d6a89d]">{t("owner.ownerPanel")}</p>
            <h1 className="mt-3 font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">{t("owner.ordersControl")}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#e2c6bf] sm:text-base">{t("owner.ordersControlDesc")}</p>
          </div>

          {/* Quick stats in header */}
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[38rem]">
            <div className="rounded-2xl border border-[#5b2a31] bg-[#1a090c]/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <HiOutlineShoppingBag className="text-base text-[#ff8ea3]" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.orders")}</p>
              </div>
              <p className="mt-1 text-3xl font-semibold text-white">{totals.totalOrders}</p>
            </div>
            <div className="rounded-2xl border border-[#5b2a31] bg-[#1a090c]/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <HiOutlineCurrencyDollar className="text-base text-[#4ade80]" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.revenue")}</p>
              </div>
              <p className="mt-1 text-3xl font-semibold text-white">
                {formatPrice(String(totals.totalAmount))}
              </p>
            </div>
            <div className="rounded-2xl border border-[#5b2a31] bg-[#1a090c]/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <HiOutlineCurrencyDollar className="text-base text-[#e8a956]" />
                <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.avgOrder")}</p>
              </div>
              <p className="mt-1 text-3xl font-semibold text-white">
                {formatPrice(String(totals.averageOrderValue))}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!shops.length ? (
        <div className="mt-6 rounded-3xl border border-dashed border-[#74403a] bg-[#130708]/90 p-10 text-center text-[#f4d5ce]">
          <HiOutlineBuildingStorefront className="mx-auto mb-4 text-5xl text-[#7d5550]" />
          <p className="text-lg font-medium">{t("owner.noShopsYet")}</p>
          <p className="mt-2 text-sm text-[#9f6f68]">{t("owner.contactAdmin")}</p>
        </div>
      ) : (
        <>
          {/* ============ SHOP SELECTOR + SEARCH BAR ============ */}
          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_2fr]">
            {/* Shop selector */}
            <div className="rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
              <label className="flex items-center gap-2 text-sm text-[#d1afa7]">
                <HiOutlineBuildingStorefront className="text-base" />
                {t("owner.shop")}
              </label>
              {shops.length > 1 ? (
                <select
                  {...register("selectedShopId")}
                  className="mt-2 h-12 w-full rounded-xl border border-[#64302d] bg-[#090304]/88 px-4 text-white outline-none transition focus:border-[#ff8ea3]"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-2 flex h-12 items-center rounded-xl border border-[#64302d] bg-[#090304]/88 px-4 text-lg font-semibold text-white">
                  {activeShop?.name ?? t("owner.shopNotFound")}
                </div>
              )}
            </div>

            {/* Main search bar */}
            <div className="rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
              <label className="flex items-center gap-2 text-sm text-[#d1afa7]">
                <HiOutlineMagnifyingGlass className="text-base" />
                {t("owner.searchOrders")}
              </label>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#64302d] bg-[#090304]/88 px-4 transition focus-within:border-[#ff8ea3] focus-within:shadow-[0_0_0_3px_rgba(255,142,163,0.1)]">
                <HiOutlineMagnifyingGlass className="shrink-0 text-lg text-[#9f6f68]" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t("owner.searchOrdersPlaceholder")}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#9f6f68]"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText("")}
                    className="shrink-0 rounded-lg p-1 text-[#9f6f68] transition hover:bg-white/10 hover:text-white"
                    aria-label={t("owner.clearSearch")}
                  >
                    <HiOutlineXMark className="text-lg" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-[#7d5550]">
                {t("owner.searchOrdersHint")}
              </p>
            </div>
          </div>

          {/* ============ STATUS FILTER TABS ============ */}
          <div className="mt-4 rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#d1afa7]">{t("owner.orderStatus")}</p>
              <span className="text-xs text-[#7d5550]">
                {filteredOrders.length} / {orders.length} {t("owner.results")}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {orderStatusCounts.map((option) => {
                const isActive = statusFilter === option.value;
                const dotColor = statusColorMap[option.value] ?? "bg-white/50";
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border-[#ff8ea3] bg-[#ff8ea3]/15 text-white shadow-[0_4px_20px_rgba(255,142,163,0.15)]"
                        : "border-[#5f2b2d] bg-[#120607] text-[#d8bbb4] hover:border-[#7f4145] hover:bg-[#1a090c] hover:text-white"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                    {option.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive ? "bg-white/15 text-white" : "bg-white/5 text-[#a07a74]"
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============ ADVANCED FILTERS TOGGLE + SORT ============ */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                showFilters
                  ? "border-[#ff8ea3] bg-[#ff8ea3]/12 text-white"
                  : "border-[#5f2b2d] bg-[#120607] text-[#d8bbb4] hover:border-[#7f4145] hover:text-white"
              }`}
            >
              <HiOutlineFunnel className="text-base" />
              {t("owner.advancedFilters")}
              {advancedFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff8ea3] text-[10px] font-bold text-white">
                  {advancedFilterCount}
                </span>
              )}
              {showFilters ? (
                <HiChevronUp className="text-sm" />
              ) : (
                <HiChevronDown className="text-sm" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7d5550]">{t("owner.sortBy")}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-10 rounded-xl border border-[#64302d] bg-[#090304]/88 px-3 text-sm text-white outline-none transition focus:border-[#ff8ea3]"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {sortBy.includes("desc") ? (
                <HiOutlineArrowDownTray className="text-sm text-[#9f6f68]" />
              ) : (
                <HiOutlineArrowUpTray className="text-sm text-[#9f6f68]" />
              )}
            </div>
          </div>

          {/* ============ ADVANCED FILTERS PANEL ============ */}
          <div
            className={`grid transition-[max-height,opacity] duration-400 ease-out ${
              showFilters ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            
            <div className="min-h-0 overflow-hidden">
              <div className="mt-4 grid gap-4 rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:grid-cols-3">
                {/* Date filter */}
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.byDate")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {datePresets.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          setDatePreset(preset.key);
                          setCustomDateFrom("");
                          setCustomDateTo("");
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          datePreset === preset.key && !customDateFrom && !customDateTo
                            ? "border-[#ff8ea3] bg-[#ff8ea3]/12 text-white"
                            : "border-[#5f2b2d] bg-[#120607] text-[#c7a49e] hover:border-[#7f4145]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.16em] text-[#7d5550]">{t("owner.from")}</label>
                      <input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => {
                          setCustomDateFrom(e.target.value);
                          if (e.target.value || customDateTo) setDatePreset("all");
                        }}
                        className="mt-1 h-9 w-full rounded-lg border border-[#64302d] bg-[#090304]/88 px-2 text-xs text-white outline-none transition focus:border-[#ff8ea3]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.16em] text-[#7d5550]">{t("owner.to")}</label>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => {
                          setCustomDateTo(e.target.value);
                          if (e.target.value || customDateFrom) setDatePreset("all");
                        }}
                        className="mt-1 h-9 w-full rounded-lg border border-[#64302d] bg-[#090304]/88 px-2 text-xs text-white outline-none transition focus:border-[#ff8ea3]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment method filter */}
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.paymentMethod")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentFilter("all")}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        paymentFilter === "all"
                          ? "border-[#ff8ea3] bg-[#ff8ea3]/12 text-white"
                          : "border-[#5f2b2d] bg-[#120607] text-[#c7a49e] hover:border-[#7f4145]"
                      }`}
                    >
                      {t("owner.all")}
                    </button>
                    {uniquePaymentMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentFilter(method)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          paymentFilter === method
                            ? "border-[#ff8ea3] bg-[#ff8ea3]/12 text-white"
                            : "border-[#5f2b2d] bg-[#120607] text-[#c7a49e] hover:border-[#7f4145]"
                        }`}
                      >
                        <HiOutlineCreditCard className="text-xs" />
                        {formatPaymentMethod(method)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery method filter */}
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.deliveryMethod")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryFilter("all")}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        deliveryFilter === "all"
                          ? "border-[#ff8ea3] bg-[#ff8ea3]/12 text-white"
                          : "border-[#5f2b2d] bg-[#120607] text-[#c7a49e] hover:border-[#7f4145]"
                      }`}
                    >
                      {t("owner.all")}
                    </button>
                    {uniqueDeliveryMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setDeliveryFilter(method)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          deliveryFilter === method
                            ? "border-[#ff8ea3] bg-[#ff8ea3]/12 text-white"
                            : "border-[#5f2b2d] bg-[#120607] text-[#c7a49e] hover:border-[#7f4145]"
                        }`}
                      >
                        <HiOutlineTruck className="text-xs" />
                        {formatDeliveryMethod(method)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============ ACTIVE FILTER CHIPS ============ */}
          {activeFilterChips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#7d5550]">{t("owner.activeFilters")}:</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#64302d] bg-[#1a090c] px-3 py-1.5 text-xs text-[#d8bbb4] transition hover:border-[#ff8ea3] hover:text-white"
                >
                  {chip.label}
                  <HiOutlineXMark className="text-xs" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-1 text-xs font-medium text-[#ff8ea3] underline-offset-2 transition hover:underline"
              >
                {t("owner.clearAllFilters")}
              </button>
            </div>
          )}

          {/* ============ STATS CARDS ============ */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="group relative overflow-hidden rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-[#8d5258] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff8ea3]/10">
                  <HiOutlineShoppingBag className="text-xl text-[#ff8ea3]" />
                </div>
                <span className="text-xs text-[#7d5550]">{t("owner.total")}</span>
              </div>
              <p className="mt-4 text-3xl font-bold text-white">{totals.totalOrders}</p>
              <p className="mt-1 text-sm text-[#9f7771]">{t("owner.ordersCount")}</p>
            </div>

            <div className="group relative overflow-hidden rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-[#8d6832] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7cf9d]/10">
                  <HiOutlineFire className="text-xl text-[#f7cf9d]" />
                </div>
                <span className="text-xs text-[#7d5550]">
                  {totals.totalOrders > 0 ? `${Math.round((totals.newOrders / totals.totalOrders) * 100)}%` : "0%"}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-white">{totals.newOrders}</p>
              <p className="mt-1 text-sm text-[#9f7771]">{t("owner.newOrders")}</p>
            </div>

            <div className="group relative overflow-hidden rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-[#8d5258] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#a8c8ff]/10">
                  <HiOutlineTruck className="text-xl text-[#a8c8ff]" />
                </div>
                <span className="text-xs text-[#7d5550]">
                  {totals.totalOrders > 0 ? `${Math.round((totals.deliveringOrders / totals.totalOrders) * 100)}%` : "0%"}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-white">{totals.deliveringOrders}</p>
              <p className="mt-1 text-sm text-[#9f7771]">{t("owner.inProgress")}</p>
            </div>

            <div className="group relative overflow-hidden rounded-[1.6rem] border border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.96),rgba(10,3,4,0.98))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-[#2f6a4f] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9ef0c2]/10">
                  <HiOutlineCheckBadge className="text-xl text-[#9ef0c2]" />
                </div>
                <span className="text-xs text-[#7d5550]">
                  {totals.totalOrders > 0 ? `${Math.round((totals.deliveredOrders / totals.totalOrders) * 100)}%` : "0%"}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-white">{totals.deliveredOrders}</p>
              <p className="mt-1 text-sm text-[#9f7771]">{t("owner.deliveredDone")}</p>
            </div>
          </div>

          {/* ============ ORDERS LIST ============ */}
          {ordersQuery.isLoading ? (
            <OrdersListSkeleton />
          ) : (
            <div className="mt-6 space-y-5">
              {filteredOrders.length ? (
                filteredOrders.map((order) => {
                  const orderStatus = getOrderStatusMeta(order.status);
                  const paymentStatus = getPaymentStatusMeta(order.payment_status);
                  const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
                  const firstItem = order.items[0];
                  const meta = parseLegacyOrderMeta(order.note);
                  const selectedSize = firstItem?.selected_size?.label ?? meta.size;
                  const selectedAddons = order.items.length
                    ? Array.from(
                        new Set(
                          order.items.flatMap((item) =>
                            item.selected_addons?.length
                              ? item.selected_addons.map(
                                  (addon) => `${addon.name} (+${formatPrice(addon.price)})`,
                                )
                              : [],
                          ),
                        ),
                      )
                    : [];
                  const legacyAddons = meta.addons;
                  const addonsSummary = selectedAddons.length ? selectedAddons : legacyAddons;
                  const hasAddress = Boolean(order.address?.trim());
                  const hasNote = Boolean(order.note?.trim());
                  const isExpanded = expandedMap[order.id];
                  const isNewOrder = order.status === "new";
                  const nextAction = getNextOwnerAction(order.status);
                  const etaStatus = getOrderEtaMeta(order.status, order.created_at);
                  const isSubmittingThisOrder = submittingOrderId === order.id;
                  return (
                    <article
                      key={order.id}
                      className={`relative overflow-hidden rounded-[2rem] border shadow-[0_24px_60px_rgba(0,0,0,0.2)] transition-all duration-300 ${
                        recentOrderId === order.id ? "ring-2 ring-[#ff8ea3] ring-offset-0 animate-pulse" : ""
                      } ${
                        isNewOrder
                          ? "border-[#8d5258] bg-[linear-gradient(180deg,rgba(44,13,17,0.98),rgba(18,5,7,0.99))] ring-1 ring-[#ffb36b]/30"
                          : "border-[#61302d] bg-[linear-gradient(180deg,rgba(16,6,7,0.97),rgba(10,3,4,0.99))]"
                      }`}
                    >
                      {/* New order glow */}
                      {isNewOrder && (
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,179,107,0.08),transparent_60%)]" />
                      )}

                      {/* ============ COLLAPSED HEADER ============ */}
                      <button
                        type="button"
                        onClick={() => toggleExpanded(order.id)}
                        className="relative z-10 block w-full border-b border-white/6 px-6 py-5 text-left transition hover:bg-white/[0.02]"
                        aria-expanded={isExpanded}
                      >
                        {/* Top row: badges + expand */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#724046] bg-[#170709] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#f1d0c8]">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs uppercase ${orderStatus.className}`}>
                            {orderStatus.label}
                          </span>
                          <span className="rounded-full border border-transparent bg-[#201113] px-3 py-1 text-xs uppercase text-[#d8b5b0]">
                            {paymentStatus.label}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs uppercase ${etaStatus.className}`}>
                            {etaStatus.hint}
                          </span>
                          {isNewOrder && (
                            <span className="ml-1 flex items-center gap-1 rounded-full border border-[#d8a05d] bg-[#3a2310] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd59a]">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ffd59a]" />
                              {t("owner.new")}
                            </span>
                          )}
                        </div>

                        {/* Main row: customer + price + expand */}
                        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-2xl font-bold text-white sm:text-[1.7rem]">
                              {order.customer_name}
                            </h2>
                            <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#ddbdb7]">
                              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5">
                                <HiOutlinePhone className="text-base text-[#f2c8b6]" />
                                {order.phone}
                              </span>
                              {order.email && (
                                <span className="rounded-full bg-white/[0.04] px-3 py-1.5">{order.email}</span>
                              )}
                              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5">
                                <HiCalendarDays className="text-base text-[#f2c8b6]" />
                                {formatOrderDate(order.created_at)}
                              </span>
                              {hasAddress && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5">
                                  <HiOutlineMapPin className="text-base text-[#f2c8b6]" />
                                  {order.address!.length > 30 ? order.address!.slice(0, 30) + "..." : order.address}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Price block */}
                            <div className="rounded-[1.4rem] border border-[#5f2d31] bg-[#1a090c] px-5 py-3 text-right">
                              <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.total")}</p>
                              <p className="mt-1 text-2xl font-bold text-white">{formatPrice(order.total_price)}</p>
                              <p className="mt-0.5 text-xs text-[#c6a19a]">{totalQty} {t("owner.items")}</p>
                            </div>

                            {/* Expand button */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5f2d31] bg-[#160709] text-[#dfb7ac] transition-all duration-200 hover:border-[#ff8ea3] hover:text-white">
                              {isExpanded ? (
                                <HiChevronUp className="text-xl" />
                              ) : (
                                <HiChevronDown className="text-xl" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* ============ EXPANDED DETAILS ============ */}
                      <div
                        ref={(node) => {
                          detailRefs.current[order.id] = node;
                        }}
                        className={`grid transition-[max-height,opacity] duration-500 ease-out ${
                          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="px-6 pb-6 pt-2">
                            {/* ── PROGRESS SECTION ── */}
                            <div className="rounded-[1.4rem] border border-[#5a292c] bg-gradient-to-br from-[#180a0c] to-[#120607] p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff8ea3]/10">
                                    <HiOutlineClock className="text-lg text-[#ff8ea3]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white">{t("owner.orderProcess")}</p>
                                    <p className="text-xs text-[#9f7771]">{t("owner.manageStatus")}</p>
                                  </div>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs uppercase ${orderStatus.className}`}>
                                  {orderStatus.label}
                                </span>
                              </div>

                              <div className="mt-5">
                                <OrderProgress
                                  status={order.status}
                                  steps={localizedOrderFlowSteps as unknown as Array<{ key: "new" | "accepted" | "preparing" | "delivering" | "delivered"; label: string }>}
                                />
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                                <p className="text-sm text-[#d5b2aa]">
                                  {etaStatus.label}: <span className="font-medium text-white">{etaStatus.hint}</span>
                                </p>
                                {nextAction && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceOrder(order.id, nextAction.status)}
                                    disabled={isSubmittingThisOrder}
                                    className="inline-flex h-11 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#ff8ea3] to-[#d94b63] px-6 text-sm font-bold text-white shadow-[0_10px_30px_rgba(217,75,99,0.3)] transition-all duration-200 hover:shadow-[0_14px_40px_rgba(217,75,99,0.4)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isSubmittingThisOrder ? (
                                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                      <>
                                        <span>{nextAction.icon}</span>
                                        <span>{nextAction.label}</span>
                                        <HiArrowRight className="text-sm" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* ── ORDER DETAILS GRID ── */}
                            <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                              {/* Left column */}
                              <div className="space-y-4">
                                {/* Delivery & Payment info */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-2xl border border-[#5a292c] bg-[#140607] p-4">
                                    <div className="flex items-center gap-2">
                                      <HiOutlineTruck className="text-base text-[#a8c8ff]" />
                                      <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.deliveryMethod")}</p>
                                    </div>
                                    <p className="mt-2 text-lg font-semibold text-white">
                                      {formatDeliveryMethod(order.delivery_method)}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[#5a292c] bg-[#140607] p-4">
                                    <div className="flex items-center gap-2">
                                      <HiOutlineCreditCard className="text-base text-[#f7cf9d]" />
                                      <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.paymentMethod")}</p>
                                    </div>
                                    <p className="mt-2 text-lg font-semibold text-white">
                                      {formatPaymentMethod(order.payment_method)}
                                    </p>
                                    <p className={`mt-1 text-sm font-medium ${paymentStatus.className}`}>
                                      {paymentStatus.label}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[#5a292c] bg-[#140607] p-4">
                                    <div className="flex items-center gap-2">
                                      <HiOutlineCube className="text-base text-[#c8a8ff]" />
                                      <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.size")}</p>
                                    </div>
                                    <p className="mt-2 text-lg font-semibold text-white">{selectedSize}</p>
                                  </div>
                                  <div className="rounded-2xl border border-[#5a292c] bg-[#140607] p-4">
                                    <div className="flex items-center gap-2">
                                      <HiOutlineUserGroup className="text-base text-[#ff8ea3]" />
                                      <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.customer")}</p>
                                    </div>
                                    <p className="mt-2 text-lg font-semibold text-white">{order.customer_name}</p>
                                    <p className="mt-0.5 text-sm text-[#b08a84]">{order.phone}</p>
                                  </div>
                                </div>

                                {/* Delivery info */}
                                <div className="rounded-2xl border border-[#5a292c] bg-[#140607] p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <HiOutlineMapPin className="text-base text-[#ff8ea3]" />
                                    <p className="text-sm uppercase tracking-[0.2em] text-[#b7918a]">{t("owner.addressAndNote")}</p>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                                      <p className="text-xs uppercase tracking-[0.18em] text-[#7d5550]">{t("owner.address")}</p>
                                      <p className="mt-2 text-sm leading-6 text-white">
                                        {hasAddress ? order.address : t("owner.notProvided")}
                                      </p>
                                    </div>
                                    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                                      <p className="text-xs uppercase tracking-[0.18em] text-[#7d5550]">{t("owner.note")}</p>
                                      <p className="mt-2 text-sm leading-6 text-white">
                                        {hasNote ? order.note : t("owner.none")}
                                      </p>
                                    </div>
                                  </div>
                                  {(addonsSummary.length > 0 || totalQty > 0) && (
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      {addonsSummary.length > 0 && (
                                        <div className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                                          <div className="flex items-center gap-1.5">
                                            <HiOutlineGiftTop className="text-xs text-[#f7cf9d]" />
                                            <p className="text-xs uppercase tracking-[0.18em] text-[#7d5550]">{t("owner.addons")}</p>
                                          </div>
                                          <p className="mt-2 text-sm leading-6 text-white">
                                            {addonsSummary.join(", ")}
                                          </p>
                                        </div>
                                      )}
                                      <div className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                                        <p className="text-xs uppercase tracking-[0.18em] text-[#7d5550]">{t("owner.totalQuantity")}</p>
                                        <p className="mt-2 text-sm leading-6 text-white">{totalQty} {t("owner.qty")}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right column */}
                              <div className="space-y-4">
                                {/* Items */}
                                <div className="rounded-2xl border border-[#5a292c] bg-[#140607] p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <HiOutlineShoppingBag className="text-base text-[#ff8ea3]" />
                                      <p className="text-sm font-semibold text-white">{t("owner.items")}</p>
                                    </div>
                                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#b08a84]">
                                      {order.items.length} {t("owner.itemCountSuffix")}
                                    </span>
                                  </div>
                                  <div className="mt-4 space-y-3">
                                    {order.items.map((item) => {
                                      const itemAddons = item.selected_addons?.length
                                        ? item.selected_addons.map((addon) => addon.name).join(", ")
                                        : null;
                                      return (
                                        <div
                                          key={item.id}
                                          className="flex gap-3 rounded-[1.2rem] border border-white/6 bg-white/[0.03] p-3 transition hover:bg-white/[0.05]"
                                        >
                                          {item.bouquet_image ? (
                                            <img
                                              src={item.bouquet_image}
                                              alt={item.bouquet_name}
                                              className="h-20 w-20 shrink-0 rounded-[0.8rem] object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[0.8rem] bg-[#241014] text-[10px] uppercase tracking-wider text-[#caa39d]">
                                              {t("owner.noImage")}
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                              <p className="truncate text-sm font-semibold text-white">
                                                {item.bouquet_name}
                                              </p>
                                              <p className="shrink-0 text-sm font-bold text-[#ffe0b3]">
                                                {formatPrice(item.total_price)}
                                              </p>
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-[#b08a84]">
                                              <span className="rounded-md bg-white/5 px-2 py-1">
                                                {t("owner.qty")}: {item.quantity}
                                              </span>
                                              <span className="rounded-md bg-white/5 px-2 py-1">
                                                {t("owner.size")}: {item.selected_size?.label ?? selectedSize}
                                              </span>
                                              <span className="rounded-md bg-white/5 px-2 py-1">
                                                {t("owner.price")}: {formatPrice(item.price)}
                                              </span>
                                            </div>
                                            {itemAddons && (
                                              <p className="mt-1.5 text-xs text-[#9f7771]">
                                                + {itemAddons}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Summary */}
                                <div className="rounded-2xl border border-[#5a292c] bg-[#140607] p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <HiOutlineDocumentText className="text-base text-[#f2c8b6]" />
                                    <p className="text-sm font-semibold text-white">{t("owner.summary")}</p>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#7d5550]">{t("owner.orderId")}</p>
                                      <p className="mt-1.5 truncate font-mono text-xs text-white">{order.id}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#7d5550]">{t("owner.updated")}</p>
                                      <p className="mt-1.5 text-xs text-white">{formatOrderDate(order.updated_at)}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-3">
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#7d5550]">{t("owner.created")}</p>
                                      <p className="mt-1.5 text-xs text-white">{formatOrderDate(order.created_at)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-[#74403a] bg-[#130708]/90 p-12 text-center">
                  <HiOutlineMagnifyingGlass className="mx-auto text-5xl text-[#7d5550]" />
                  <p className="mt-5 text-xl font-medium text-[#f4d5ce]">{t("owner.noOrdersFound")}</p>
                  <p className="mt-2 text-sm text-[#9f6f68]">
                    {orders.length ? t("owner.adjustFilters") : t("owner.noOrdersYet")}
                  </p>
                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ff8ea3] bg-[#ff8ea3]/12 px-6 py-3 text-sm font-medium text-white transition hover:bg-[#ff8ea3]/20"
                    >
                      <HiOutlineXMark className="text-sm" />
                      {t("owner.clearFilters")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OwnerOrders;
