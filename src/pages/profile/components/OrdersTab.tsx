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
import { OrdersListSkeleton } from "../../../components/PageSkeletons";
import type { OrderOut } from "../../../types/catalog";
import { formatPrice } from "../../../utils/catalog";
import {
  formatDeliveryMethod,
  formatOrderDate,
  formatPaymentMethod,
  getOrderStatusMeta,
  getPaymentStatusMeta,
  getRepeatOrderAvailability,
} from "./profileHelpers";

interface OrdersTabProps {
  expandedOrderId: string | null;
  isLoading: boolean;
  onRepeatOrder: (order: OrderOut) => void;
  onToggleExpanded: (orderId: string) => void;
  orders: OrderOut[];
}

function OrdersTab({ expandedOrderId, isLoading, onRepeatOrder, onToggleExpanded, orders }: OrdersTabProps) {
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const pendingOrders = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length;
  const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0), 0);

  return (
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
      <div>
        <p className="font-cormorant text-4xl text-white">My Orders</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-5 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#b7918a]">Orders</p>
              <p className="mt-4 text-[2.75rem] font-semibold leading-none text-white">{totalOrders}</p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2a1014] text-[#ffb1bd]">
              <HiOutlineShoppingBag className="text-xl" />
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-5 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#b7918a]">Items</p>
              <p className="mt-4 text-[2.75rem] font-semibold leading-none text-white">{totalItems}</p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#24140b] text-[#ffd59a]">
              <HiGift className="text-xl" />
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-5 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#b7918a]">In Progress</p>
              <p className="mt-4 text-[2.75rem] font-semibold leading-none text-white">{pendingOrders}</p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#102118] text-[#9ef0c2]">
              <HiClock className="text-xl" />
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(28,9,12,0.96),rgba(17,5,7,0.98))] px-5 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#b7918a]">Total Spent</p>
              <p className="mt-4 whitespace-nowrap text-[2rem] font-semibold leading-none text-white xl:text-[2.15rem]">{formatPrice(String(totalSpent))}</p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#21160d] text-[#f7cf9d]">
              <HiCurrencyDollar className="text-xl" />
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <OrdersListSkeleton />
      ) : (
        <div className="mt-5 space-y-4">
          {!orders.length ? <p className="text-[#d8beb8]">Hozircha order yo'q.</p> : null}
          {orders.map((order) => {
            const orderStatus = getOrderStatusMeta(order.status);
            const paymentStatus = getPaymentStatusMeta(order.payment_status);
            const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
            const isExpanded = expandedOrderId === order.id;
            const repeatAvailability = getRepeatOrderAvailability(order.created_at);

            return (
              <article key={order.id} className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[#120607]">
                <div className={`flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between ${isExpanded ? "border-b border-white/8" : ""}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#c8a7a0]">Order #{order.id.slice(0, 8)}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-xs uppercase ${orderStatus.className}`}>
                        {orderStatus.label}
                      </span>
                      <span className={`rounded-full bg-[#201113] px-2.5 py-1 text-xs uppercase ${paymentStatus.className}`}>
                        Payment {paymentStatus.label}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {order.items[0]?.bouquet_name ?? "Bouquet order"}
                      {order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#ddbdb7]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5">
                        <HiCalendarDays className="text-base text-[#f2c8b6]" />
                        {formatOrderDate(order.created_at)}
                      </span>
                      <span className="rounded-full bg-white/[0.04] px-3 py-1.5">{itemCount} item(s)</span>
                      <span className="rounded-full bg-white/[0.04] px-3 py-1.5">{formatDeliveryMethod(order.delivery_method)}</span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5">
                        <HiOutlineCreditCard className="text-base text-[#f2c8b6]" />
                        {formatPaymentMethod(order.payment_method)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#4a2428] bg-[#1a090c] px-4 py-3 text-left lg:min-w-[190px] lg:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#b7918a]">Total</p>
                    <p className="mt-1 text-3xl font-semibold text-white">{formatPrice(order.total_price)}</p>
                    <p className="mt-1 text-sm text-[#c6a19a]">{order.customer_name}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => onToggleExpanded(order.id)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-[#f4d7d1] transition hover:bg-white/[0.05]"
                  >
                    {isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                    {isExpanded ? "Hide details" : "View details"}
                  </button>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => onRepeatOrder(order)}
                      disabled={!repeatAvailability.canRepeat}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#a31528] px-4 text-sm font-medium text-white shadow-[0_10px_24px_rgba(163,21,40,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#4a1b22] disabled:text-[#c8a3a7] disabled:shadow-none"
                    >
                      Repeat order
                    </button>
                    <p className={`mt-1 text-xs ${repeatAvailability.canRepeat ? "text-[#bfa19a]" : "text-[#d89aa4]"}`}>
                      {repeatAvailability.helperText}
                    </p>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="grid gap-4 px-5 pb-5 xl:grid-cols-[1.25fr_0.75fr]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8c2ba]">Items</p>
                      <div className="mt-3 space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                            {item.bouquet_image ? (
                              <img src={item.bouquet_image} alt={item.bouquet_name} className="h-16 w-16 rounded-xl object-cover" />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#251014] text-xs uppercase tracking-[0.14em] text-[#caa39d]">
                                Item
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-base font-semibold text-white">{item.bouquet_name}</p>
                              <p className="mt-1 text-sm text-[#caa39d]">
                                {item.quantity} x {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="text-right text-lg font-semibold text-[#ffe0b3]">{formatPrice(item.total_price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8c2ba]">Delivery</p>
                        <p className="mt-3 text-sm text-[#caa39d]">Address</p>
                        <p className="mt-1 text-base text-white">{order.address?.trim() || "Address ko'rsatilmagan"}</p>
                        <p className="mt-3 text-sm text-[#caa39d]">Phone</p>
                        <p className="mt-1 text-base text-white">{order.phone}</p>
                        {order.email ? (
                          <>
                            <p className="mt-3 text-sm text-[#caa39d]">Email</p>
                            <p className="mt-1 text-base break-all text-white">{order.email}</p>
                          </>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e8c2ba]">Notes & Payment</p>
                        <div className="mt-3 space-y-3 text-base text-white">
                          <div>
                            <p className="text-sm text-[#caa39d]">Payment status</p>
                            <p className={paymentStatus.className}>{paymentStatus.label}</p>
                          </div>
                          <div>
                            <p className="text-sm text-[#caa39d]">Payment method</p>
                            <p>{formatPaymentMethod(order.payment_method)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-[#caa39d]">Customer note</p>
                            <p>{order.note?.trim() || "Izoh qoldirilmagan"}</p>
                          </div>
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
