import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { OrdersListSkeleton, OwnerOrdersSkeleton } from "../../components/PageSkeletons";
import { useMyShops, useShopOrders } from "../../hooks/useCatalog";
import { formatPrice } from "../../utils/catalog";

function parseOrderMeta(note: string | null) {
  const fallback = { size: "-", addons: "-" };
  if (!note) return fallback;

  const parts = note.split("|").map((part) => part.trim());
  const sizePart = parts.find((part) => part.toLowerCase().startsWith("size:"));
  const addonsPart = parts.find((part) => part.toLowerCase().startsWith("addons:"));

  return {
    size: sizePart ? sizePart.replace(/^size:\s*/i, "") : "-",
    addons: addonsPart ? addonsPart.replace(/^addons:\s*/i, "") : "-",
  };
}

function OwnerOrders() {
  const { data: shops = [], isLoading: isShopsLoading } = useMyShops();
  const { register, watch, setValue } = useForm<{ selectedShopId: string }>({
    defaultValues: { selectedShopId: "" },
  });
  const selectedShopId = watch("selectedShopId");

  const activeShopId = selectedShopId || shops[0]?.id || "";
  const ordersQuery = useShopOrders(activeShopId);

  useEffect(() => {
    if (!selectedShopId && shops[0]?.id) {
      setValue("selectedShopId", shops[0].id);
    }
  }, [selectedShopId, setValue, shops]);

  const totalOrders = ordersQuery.data?.length ?? 0;
  const totalAmount = useMemo(
    () => (ordersQuery.data ?? []).reduce((acc, order) => acc + Number(order.total_price), 0),
    [ordersQuery.data],
  );

  if (isShopsLoading) return <OwnerOrdersSkeleton />;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070102] text-[#fff6f4]">
      <section className="px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-cormorant text-6xl text-[#fff3ee]">Shop Orders</h1>

          {!shops.length ? (
            <div className="mt-8 rounded-3xl border border-dashed border-[#74403a] bg-[#130708]/90 p-10 text-center text-[#f4d5ce]">
              Sizda hali shop yo'q.
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-[#61302d] bg-[#100607] p-4">
                <label className="text-sm text-[#d1afa7]">Shop</label>
                <select
                  {...register("selectedShopId")}
                  className="mt-2 h-12 w-full rounded-xl border border-[#64302d] bg-[#090304]/88 px-4"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#61302d] bg-[#100607] p-4">
                  <p className="text-sm text-[#d1afa7]">Orders count</p>
                  <p className="mt-2 text-3xl font-bold text-white">{totalOrders}</p>
                </div>
                <div className="rounded-2xl border border-[#61302d] bg-[#100607] p-4">
                  <p className="text-sm text-[#d1afa7]">Total amount</p>
                  <p className="mt-2 text-3xl font-bold text-white">{formatPrice(String(totalAmount))}</p>
                </div>
              </div>

              {ordersQuery.isLoading ? (
                <OrdersListSkeleton />
              ) : (
                <div className="mt-6 space-y-4">
                  {(ordersQuery.data ?? []).map((order) => (
                    <article key={order.id} className="rounded-2xl border border-[#61302d] bg-[#100607] p-5">
                      {(() => {
                        const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
                        const meta = parseOrderMeta(order.note);
                        return (
                          <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-mono text-sm text-[#f6dacf]">{order.id}</p>
                        <p className="rounded-full border border-[#76413b] bg-[#120607] px-3 py-1 text-xs uppercase">{order.status}</p>
                      </div>
                      <p className="mt-3 text-lg text-white">{order.customer_name} · {order.phone}</p>
                      <p className="mt-1 text-sm text-[#d1afa7]">{order.delivery_method} · {order.payment_method}</p>
                      <div className="mt-3 grid gap-2 text-sm text-[#f2d5ce] sm:grid-cols-3">
                        <p className="rounded-lg border border-[#4f2926] bg-[#0f0506] px-3 py-2">Size: <span className="font-semibold">{meta.size}</span></p>
                        <p className="rounded-lg border border-[#4f2926] bg-[#0f0506] px-3 py-2">Quantity: <span className="font-semibold">{totalQty}</span></p>
                        <p className="rounded-lg border border-[#4f2926] bg-[#0f0506] px-3 py-2">Add-ons: <span className="font-semibold">{meta.addons}</span></p>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-white">{formatPrice(order.total_price)}</p>
                          </>
                        );
                      })()}
                    </article>
                  ))}
                  {!ordersQuery.data?.length ? (
                    <div className="rounded-2xl border border-dashed border-[#74403a] bg-[#130708]/90 p-8 text-center text-[#f4d5ce]">
                      Bu shop uchun hali order yo'q.
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default OwnerOrders;
