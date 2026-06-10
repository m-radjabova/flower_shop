import {
  HiCalendarDays,
  HiChevronDown,
  HiChevronUp,
  HiClock,
  HiCurrencyDollar,
  HiGift,
  HiOutlineCreditCard,
  HiOutlineShoppingBag,
} from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import GiftMessageCard from "../../../components/orders/GiftMessageCard";
import { OrdersListSkeleton } from "../../../components/PageSkeletons";
import OrderProgress from "../../../components/orders/OrderProgress";
import type { OrderOut } from "../../../types/catalog";
import { formatPrice } from "../../../utils/catalog";
import {
  formatDeliveryMethod,
  formatOrderDate,
  formatPaymentMethod,
  getOrderEtaMeta,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  getRepeatOrderAvailability,
} from "./profileHelpers";

interface OrdersTabProps {
  expandedOrderId: string | null;
  highlightedOrderId: string | null;
  isLoading: boolean;
  onRepeatOrder: (order: OrderOut) => void;
  onToggleExpanded: (orderId: string) => void;
  orders: OrderOut[];
}

const orderFlowSteps = [
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "delivering", label: "Delivering" },
  { key: "delivered", label: "Delivered" },
] as const;

function OrdersTab({ expandedOrderId, highlightedOrderId, isLoading, onRepeatOrder, onToggleExpanded, orders }: OrdersTabProps) {
  const { t } = useTranslation();
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const pendingOrders = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length;
  const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0), 0);

  return (
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-4 sm:p-6">
      <div>
        <p className="font-cormorant text-3xl text-white sm:text-4xl">{t("profile.myOrders")}</p>
        <p className="mt-0.5 text-xs text-[#a08782] sm:mt-1 sm:text-sm">
          {highlightedOrderId ? "Real-time update received" : "Your orders and delivery progress"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.18)] sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b7918a] sm:text-[11px]">{t("profile.orders")}</p>
              <p className="mt-2 text-2xl font-semibold leading-none text-white sm:mt-4 sm:text-[2.75rem]">{totalOrders}</p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#2a1014] text-[#ffb1bd] sm:h-10 sm:w-10">
              <HiOutlineShoppingBag className="text-base sm:text-xl" />
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.18)] sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b7918a] sm:text-[11px]">{t("profile.items")}</p>
              <p className="mt-2 text-2xl font-semibold leading-none text-white sm:mt-4 sm:text-[2.75rem]">{totalItems}</p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#24140b] text-[#ffd59a] sm:h-10 sm:w-10">
              <HiGift className="text-base sm:text-xl" />
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.18)] sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b7918a] sm:text-[11px]">{t("profile.inProgress")}</p>
              <p className="mt-2 text-2xl font-semibold leading-none text-white sm:mt-4 sm:text-[2.75rem]">{pendingOrders}</p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#102118] text-[#9ef0c2] sm:h-10 sm:w-10">
              <HiClock className="text-base sm:text-xl" />
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.18)] sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#b7918a] sm:text-[11px]">{t("profile.totalSpent")}</p>
              <p className="mt-2 whitespace-nowrap text-lg font-semibold leading-none text-white sm:mt-4 sm:text-[2rem] xl:text-[2.15rem]">{formatPrice(String(totalSpent))}</p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#21160d] text-[#f7cf9d] sm:h-10 sm:w-10">
              <HiCurrencyDollar className="text-base sm:text-xl" />
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <OrdersListSkeleton />
      ) : (
        <div className="mt-5 space-y-4">
          {!orders.length ? <p className="text-[#d8beb8]">{t("profile.noOrders")}</p> : null}
          {orders.map((order) => {
            const orderStatus = getOrderStatusMeta(order.status);
            const paymentStatus = getPaymentStatusMeta(order.payment_status);
            const etaStatus = getOrderEtaMeta(order.status, order.created_at);
            const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
            const isExpanded = expandedOrderId === order.id;
            const repeatAvailability = getRepeatOrderAvailability(order.created_at);

            return (
            <article
              key={order.id}
              className={`overflow-hidden rounded-[1.4rem] border bg-[#120607] transition-all duration-300 ${
                highlightedOrderId === order.id
                  ? "border-[#ff8ea3]/60 ring-2 ring-[#ff8ea3]/40 shadow-[0_0_0_1px_rgba(255,142,163,0.18),0_16px_40px_rgba(255,142,163,0.08)]"
                  : "border-white/8"
              }`}
            >
                <div className={`flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:flex-row lg:items-start lg:justify-between ${isExpanded ? "border-b border-white/8" : ""}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#c8a7a0] sm:text-sm">Order #{order.id.slice(0, 8)}</p>
                      {highlightedOrderId === order.id ? (
                        <span className="rounded-full border border-[#ff8ea3]/40 bg-[#ff8ea3]/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] text-[#ffb8c4] sm:px-2.5 sm:py-1 sm:text-[10px]">
                          Live
                        </span>
                      ) : null}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase sm:px-2.5 sm:py-1 sm:text-xs ${orderStatus.className}`}>
                        {orderStatus.label}
                      </span>
                      <span className={`rounded-full bg-[#201113] px-2 py-0.5 text-[10px] uppercase sm:px-2.5 sm:py-1 sm:text-xs ${paymentStatus.className}`}>
                        Payment {paymentStatus.label}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white sm:mt-3 sm:text-2xl">
                      {order.items[0]?.bouquet_name ?? "Bouquet order"}
                      {order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[#ddbdb7] sm:mt-3 sm:gap-2 sm:text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5">
                        <HiCalendarDays className="text-xs text-[#f2c8b6] sm:text-base" />
                        <span>{formatOrderDate(order.created_at)}</span>
                      </span>
                      <span className="rounded-full bg-white/[0.04] px-2 py-1 sm:px-3 sm:py-1.5">{itemCount} item(s)</span>
                      <span className="rounded-full bg-white/[0.04] px-2 py-1 sm:px-3 sm:py-1.5">{formatDeliveryMethod(order.delivery_method)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5">
                        <HiOutlineCreditCard className="text-xs text-[#f2c8b6] sm:text-base" />
                        <span>{formatPaymentMethod(order.payment_method)}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] uppercase sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${etaStatus.className}`}>
                        ETA {etaStatus.hint}
                      </span>
                    </div>
                    <OrderProgress
                      status={order.status}
                      steps={orderFlowSteps}
                      compact
                      className="mt-3 sm:mt-4"
                    />
                  </div>

                  <div className="shrink-0 rounded-2xl border border-[#4a2428] bg-[#1a090c] px-3 py-2 text-left sm:px-4 sm:py-3 lg:min-w-[190px] lg:text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#b7918a] sm:text-xs">Total</p>
                    <p className="mt-0.5 text-xl font-semibold text-white sm:mt-1 sm:text-3xl">{formatPrice(order.total_price)}</p>
                    <p className="mt-0.5 text-xs text-[#c6a19a] sm:mt-1 sm:text-sm">{order.customer_name}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
                  <button
                    type="button"
                    onClick={() => onToggleExpanded(order.id)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-[#f4d7d1] transition hover:bg-white/[0.05] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
                  >
                    {isExpanded ? <HiChevronUp className="text-sm sm:text-base" /> : <HiChevronDown className="text-sm sm:text-base" />}
                    {isExpanded ? t("profile.hideDetails") : t("profile.viewDetails")}
                  </button>
                  <div className="text-right">
                      <button
                      type="button"
                      onClick={() => onRepeatOrder(order)}
                      disabled={!repeatAvailability.canRepeat}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#a31528] px-3 text-xs font-medium text-white shadow-[0_10px_24px_rgba(163,21,40,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#4a1b22] disabled:text-[#c8a3a7] disabled:shadow-none sm:h-10 sm:px-4 sm:text-sm"
                    >
                      {t("profile.repeatOrder")}
                    </button>
                    <p className={`mt-0.5 text-[10px] sm:mt-1 sm:text-xs ${repeatAvailability.canRepeat ? "text-[#bfa19a]" : "text-[#d89aa4]"}`}>
                      {repeatAvailability.helperText}
                    </p>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="grid gap-3 px-4 pb-4 sm:gap-4 sm:px-5 sm:pb-5 xl:grid-cols-[1.25fr_0.75fr]">
                    <div>
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-3 sm:p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8c2ba] sm:text-sm">Order progress</p>
                        <OrderProgress
                          status={order.status}
                          steps={orderFlowSteps}
                          className="mt-3 sm:mt-4"
                        />
                        <p className="mt-2 text-xs text-[#d5b2aa] sm:mt-3 sm:text-sm">
                          {etaStatus.label}: {etaStatus.hint}
                        </p>
                      </div>

                      <div className="mt-3 sm:mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8c2ba] sm:text-sm">{t("profile.items")}</p>
                      <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-2 sm:gap-3 sm:p-3">
                            {item.bouquet_image ? (
                              <img loading="lazy" decoding="async" src={item.bouquet_image} alt={item.bouquet_name} className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16" />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#251014] text-[10px] uppercase tracking-[0.14em] text-[#caa39d] sm:h-16 sm:w-16 sm:text-xs">
                                Item
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white sm:text-base">{item.bouquet_name}</p>
                              <p className="mt-0.5 text-xs text-[#caa39d] sm:mt-1 sm:text-sm">
                                {item.quantity} x {formatPrice(item.price)}
                              </p>
                              {item.selected_size ? (
                                <p className="mt-0.5 text-[10px] text-[#f0cfa5] sm:mt-1 sm:text-xs">Size: {item.selected_size.label}</p>
                              ) : null}
                              {item.selected_addons.length ? (
                                <p className="mt-0.5 text-[10px] text-[#d6b3ab] sm:mt-1 sm:text-xs">
                                  Add-ons: {item.selected_addons.map((addon) => addon.name).join(", ")}
                                </p>
                              ) : null}
                              {item.selected_addons.length ? (
                                <div className="mt-1 flex gap-1.5 sm:mt-2 sm:gap-2">
                                  {item.selected_addons.map((addon) => (
                                    <img loading="lazy" decoding="async"
                                      key={addon.id}
                                      src={addon.image}
                                      alt={addon.name}
                                      className="h-8 w-8 rounded-lg object-cover sm:h-10 sm:w-10"
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <p className="shrink-0 text-right text-base font-semibold text-[#ffe0b3] sm:text-lg">{formatPrice(item.total_price)}</p>
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 sm:p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8c2ba] sm:text-sm">{t("delivery.deliveryInformation")}</p>
                        <p className="mt-2 text-xs text-[#caa39d] sm:mt-3 sm:text-sm">{t("delivery.deliveryAddress")}</p>
                        <p className="mt-0.5 text-sm text-white sm:mt-1 sm:text-base">{order.address?.trim() || t("profile.addressNotShown")}</p>
                        <p className="mt-2 text-xs text-[#caa39d] sm:mt-3 sm:text-sm">{t("delivery.phone")}</p>
                        <p className="mt-0.5 text-sm text-white sm:mt-1 sm:text-base">{order.phone}</p>
                        {order.email ? (
                          <>
                            <p className="mt-2 text-xs text-[#caa39d] sm:mt-3 sm:text-sm">Email</p>
                            <p className="mt-0.5 break-all text-sm text-white sm:mt-1 sm:text-base">{order.email}</p>
                          </>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 sm:p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8c2ba] sm:text-sm">Notes & Payment</p>
                        <div className="mt-2 space-y-2 text-sm text-white sm:mt-3 sm:space-y-3 sm:text-base">
                          <div>
                            <p className="text-xs text-[#caa39d] sm:text-sm">Payment status</p>
                            <p className={paymentStatus.className}>{paymentStatus.label}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#caa39d] sm:text-sm">Payment method</p>
                            <p>{formatPaymentMethod(order.payment_method)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#caa39d] sm:text-sm">Customer note</p>
                            <p>{order.note?.trim() || "Izoh qoldirilmagan"}</p>
                          </div>
                          {order.gift_message?.trim() ? <GiftMessageCard message={order.gift_message} compact /> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrdersTab;
