import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  HiCheckCircle,
  HiChevronDown,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiXMark,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import useContextPro from "../../hooks/useContextPro";
import { useCreateOrder, useMyAddresses } from "../../hooks/useCatalog";
import { useCartItems } from "../../hooks/useCart";
import { AddressCardsSkeleton } from "../../components/PageSkeletons";
import {
  formatCheckoutAddress,
  getPreferredCheckoutAddress,
  isSameCheckoutAddress,
  setPreferredCheckoutAddress,
} from "../../utils/address";
import { formatPrice } from "../../utils/catalog";
import { removeManyFromCart } from "../../utils/cart";
import { toApiPhone } from "../../utils/phone";
import type { AddressOut } from "../../types/catalog";

declare global {
  interface Window {
    L?: {
      map: (el: HTMLElement) => LeafletMap;
      tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
      marker: (latlng: [number, number], options?: Record<string, unknown>) => LeafletMarker;
      icon: (options: Record<string, unknown>) => unknown;
    };
  }
}

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap;
  on: (event: string, callback: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
};

const TASHKENT_COORDS: [number, number] = [41.3111, 69.2797];

const sizeOptions = [
  { id: "small", label: "Small", multiplier: 0.85 },
  { id: "medium", label: "Medium", multiplier: 1 },
  { id: "large", label: "Large", multiplier: 1.3 },
  { id: "premium", label: "Premium", multiplier: 1.65 },
] as const;

const addonOptions = [
  { id: "greeting", label: "Greeting Card", price: 4 },
  { id: "chocolate", label: "Chocolates", price: 12 },
  { id: "basket", label: "Fruity Basket", price: 15 },
] as const;

function injectLeafletAssets() {
  const cssId = "leaflet-css";
  const jsId = "leaflet-js";

  if (!document.getElementById(cssId)) {
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  if (window.L) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(jsId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet load error")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = jsId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet load error"));
    document.body.appendChild(script);
  });
}

interface CheckoutFormValues {
  customerName: string;
  phone: string;
  email: string;
  deliveryMethod: string;
  address: string;
  paymentMethod: string;
  deliveryDate: string;
  deliveryTime: string;
  note: string;
}

function DeliveryCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const items = useCartItems();
  const createOrder = useCreateOrder();
  const addressesQuery = useMyAddresses();
  const {
    state: { user },
  } = useContextPro();

  const { register, handleSubmit, setValue, watch } = useForm<CheckoutFormValues>({
    defaultValues: {
      customerName: user?.full_name ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      deliveryMethod: "express",
      address: "Tashkent, Uzbekistan",
      paymentMethod: "cash",
      deliveryDate: "",
      deliveryTime: "",
      note: "",
    },
  });
  const addressField = register("address");

  const [mapOpen, setMapOpen] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const didHydrateAddressRef = useRef(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const primaryItem = items[0] ?? null;

  const selectedSize = (searchParams.get("size") as (typeof sizeOptions)[number]["id"] | null) ?? "medium";
  const selectedAddons = (searchParams.get("addons") ?? "")
    .split(",")
    .map((addon) => addon.trim())
    .filter(Boolean);

  const basePrice = Number(primaryItem?.bouquet.price ?? 0);
  const sizeMultiplier = sizeOptions.find((item) => item.id === selectedSize)?.multiplier ?? 1;
  const unitPrice = basePrice * sizeMultiplier;
  const addonsTotal = addonOptions.filter((item) => selectedAddons.includes(item.id)).reduce((acc, item) => acc + item.price, 0);
  const quantity = primaryItem?.quantity ?? 0;
  const finalPrice = (unitPrice + addonsTotal) * quantity;

  const address = watch("address");
  const notes = watch("note");
  const selectedSavedAddress = addressesQuery.data?.find((item) => item.id === selectedAddressId) ?? null;
  const preferredAddress = getPreferredCheckoutAddress();

  useEffect(() => {
    if (didHydrateAddressRef.current) return;

    const preferred = getPreferredCheckoutAddress();
    if (preferred?.address_line) {
      const formatted = formatCheckoutAddress(preferred);
      setValue("address", formatted || preferred.address_line, {
        shouldValidate: true,
        shouldDirty: false,
      });
      if (preferred.latitude !== null && preferred.latitude !== undefined && preferred.longitude !== null && preferred.longitude !== undefined) {
        setSelectedCoords([preferred.latitude, preferred.longitude]);
      }
      const matchedAddress = addressesQuery.data?.find((item) => isSameCheckoutAddress(item, preferred));
      if (matchedAddress) {
        setSelectedAddressId(matchedAddress.id);
      }
      didHydrateAddressRef.current = true;
      return;
    }

    const primaryAddress = addressesQuery.data?.find((item) => item.is_primary);
    if (!primaryAddress) return;

    setValue("address", [primaryAddress.address_line, primaryAddress.city].filter(Boolean).join(", "), {
      shouldValidate: true,
      shouldDirty: false,
    });
    if (primaryAddress.latitude !== null && primaryAddress.longitude !== null) {
      setSelectedCoords([primaryAddress.latitude, primaryAddress.longitude]);
    }
    setSelectedAddressId(primaryAddress.id);
    didHydrateAddressRef.current = true;
  }, [addressesQuery.data, setValue]);

  const applySavedAddress = (savedAddress: AddressOut) => {
    setSelectedAddressId(savedAddress.id);
    setValue("address", [savedAddress.address_line, savedAddress.city].filter(Boolean).join(", "), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("note", savedAddress.notes ?? "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    if (savedAddress.latitude !== null && savedAddress.longitude !== null) {
      setSelectedCoords([savedAddress.latitude, savedAddress.longitude]);
    } else {
      setSelectedCoords(null);
    }
    setPreferredCheckoutAddress(savedAddress);
    toast.success("Address checkout uchun tanlandi");
  };

  useEffect(() => {
    if (!mapOpen || !mapHostRef.current) return;

    let cancelled = false;

    const setupMap = async () => {
      try {
        await injectLeafletAssets();
        if (cancelled || !window.L || !mapHostRef.current) return;

        const initial = selectedCoords ?? TASHKENT_COORDS;
        const map = window.L.map(mapHostRef.current).setView(initial, 12);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const marker = window.L.marker(initial, {
          icon: window.L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          }),
        }).addTo(map);

        leafletMapRef.current = map;

        map.on("click", async ({ latlng }) => {
          const coords: [number, number] = [latlng.lat, latlng.lng];
          marker.setLatLng(coords);
          setSelectedCoords(coords);
          setIsResolvingAddress(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = (await res.json()) as { display_name?: string };
            if (data.display_name) {
              setValue("address", data.display_name, { shouldValidate: true, shouldDirty: true });
            }
          } finally {
            setIsResolvingAddress(false);
          }
        });
      } catch {
        toast.error("Xarita yuklanmadi");
      }
    };

    setupMap();

    return () => {
      cancelled = true;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [mapOpen, selectedCoords, setValue]);

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!primaryItem) return toast.error("Cart bo'sh");
    if (!values.customerName.trim() || !values.phone.trim() || !values.address.trim()) {
      return toast.error("Ism, telefon va manzil majburiy");
    }

    try {
      await createOrder.mutateAsync({
        shop_id: primaryItem.bouquet.shop_id,
        customer_name: values.customerName.trim(),
        phone: toApiPhone(values.phone),
        email: values.email.trim() || undefined,
        delivery_method: values.deliveryMethod,
        address: values.address.trim(),
        payment_method: values.paymentMethod,
        note: [
          values.note.trim(),
          `Size: ${selectedSize}`,
          selectedAddons.length ? `Addons: ${selectedAddons.join(", ")}` : "",
          values.deliveryDate ? `Date: ${values.deliveryDate}` : "",
          values.deliveryTime ? `Time: ${values.deliveryTime}` : "",
          selectedCoords ? `Coords: ${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        items: [
          {
            bouquet_id: primaryItem.bouquet.id,
            bouquet_name: primaryItem.bouquet.name,
            bouquet_image: primaryItem.bouquet.image,
            price: String((unitPrice + addonsTotal).toFixed(2)),
            quantity: primaryItem.quantity,
          },
        ],
      });
      removeManyFromCart([primaryItem.id]);
      toast.success("Order yuborildi");
      navigate("/bouquets", { replace: true });
    } catch {
      toast.error("Order yuborilmadi");
    }
  };

  if (!primaryItem) {
    return (
      <main className="min-h-screen bg-transparent px-4 pb-12 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#5d2b2f] bg-[linear-gradient(150deg,rgba(28,10,13,0.94),rgba(15,6,8,0.94))] p-8 text-center">
          <p className="font-cormorant text-5xl">Savatcha bo'sh</p>
          <p className="mt-3 text-[#d8b5ad]">Avval bouquet tanlab keyin delivery ma'lumotlarini kiriting.</p>
          <Link to="/bouquets" className="mt-6 inline-flex h-12 items-center justify-center rounded-xl border border-[#ce4a60] bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] px-6 font-semibold uppercase tracking-[0.08em] text-white">
            Bouquets ko'rish
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pb-12 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-[1.6rem] border border-[#4f2224] bg-[linear-gradient(160deg,#120507,#090204_70%)] p-5 sm:p-6">
          <p className="font-cormorant text-4xl text-white sm:text-5xl">Delivery Information</p>
          <p className="mt-2 text-[#d8b2aa]">Saqlangan addressni tanlang yoki yangi manzilni qo'lda yozib, xaritadan pin qo'ying.</p>

          <section className="mt-5 rounded-[1.4rem] border border-[#643034] bg-[linear-gradient(145deg,rgba(34,11,14,0.92),rgba(16,6,8,0.96))] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-cormorant text-3xl text-white">Saved Addresses</p>
                <p className="text-sm text-[#d2ada5]">Profilingizdagi addresslar shu yerda. Bir bosishda checkout uchun tanlang.</p>
              </div>
              {selectedSavedAddress ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#31553f] bg-[#10261a] px-3 py-1 text-sm text-[#a8f2c8]">
                  <HiCheckCircle />
                  {selectedSavedAddress.title}
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3">
              {addressesQuery.isLoading ? <AddressCardsSkeleton count={2} /> : null}
              {!addressesQuery.isLoading && !(addressesQuery.data?.length ?? 0) ? (
                <div className="rounded-2xl border border-dashed border-[#5f2f33] bg-[#140709] px-4 py-4 text-sm text-[#cca7a0]">
                  Hozircha saved address yo'q. Pastdagi form orqali yangi manzil kiriting.
                </div>
              ) : null}
              {!addressesQuery.isLoading && addressesQuery.data?.map((savedAddress) => {
                const selected = savedAddress.id === selectedAddressId;
                return (
                  <button
                    key={savedAddress.id}
                    type="button"
                    onClick={() => applySavedAddress(savedAddress)}
                    className={`group rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-[#4f8c69] bg-[linear-gradient(135deg,rgba(16,37,27,0.96),rgba(14,18,16,0.98))] shadow-[0_18px_48px_rgba(12,35,22,0.28)]"
                        : "border-[#5c2c31] bg-[linear-gradient(145deg,rgba(25,9,11,0.9),rgba(16,6,8,0.95))] hover:border-[#8d4d53] hover:bg-[linear-gradient(145deg,rgba(33,11,14,0.93),rgba(19,7,9,0.98))]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{savedAddress.title}</p>
                          {savedAddress.is_primary ? (
                            <span className="rounded-full bg-[#3a1d0f] px-2 py-0.5 text-xs text-[#ffd59a]">Primary</span>
                          ) : null}
                          {selected ? (
                            <span className="rounded-full bg-[#205437] px-2 py-0.5 text-xs text-[#dfffea]">Selected</span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#eed7d1]">{savedAddress.address_line}</p>
                        <p className="text-sm text-[#be9a93]">{savedAddress.city ?? "City not set"}</p>
                        {savedAddress.notes ? <p className="mt-1 text-sm text-[#a8857e]">{savedAddress.notes}</p> : null}
                      </div>
                      <span
                        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                          selected
                            ? "border-[#72d79d] bg-[#2d7b52] text-white"
                            : "border-[#7f4d54] text-[#d7b0a8] group-hover:border-[#c9808b]"
                        }`}
                      >
                        {selected ? <HiCheckCircle /> : <HiOutlineMapPin />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-5 space-y-3 text-[#d6b7af]">
            <div className="rounded-[1.4rem] border border-[#623234] bg-[linear-gradient(145deg,rgba(27,10,13,0.96),rgba(13,5,7,0.96))] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-cormorant text-3xl text-white">Delivery Address</p>
                  <p className="text-sm text-[#cfaaa2]">Xohlasangiz qo'lda kiriting, xohlasangiz mapdan tanlang.</p>
                </div>
                <button type="button" onClick={() => setMapOpen(true)} className="inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-[#7f4a4e] bg-[#120607] px-4 py-2 text-left text-[#f7ddd7]">
                  <HiOutlineMapPin className="shrink-0" />
                  <span>Pick from map</span>
                  <HiChevronDown className="shrink-0" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#4c2528] bg-[#120607] p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#b78e88]">Current address</p>
                  <p className="mt-2 text-base leading-6 text-white">{address || "Address tanlanmagan"}</p>
                  <p className="mt-2 text-sm text-[#c9a39c]">
                    {selectedCoords
                      ? `Pin: ${selectedCoords[0].toFixed(5)}, ${selectedCoords[1].toFixed(5)}`
                      : "Pin hali tanlanmagan"}
                  </p>
                </div>
                <label className="relative block sm:col-span-2">
                  <input
                    {...addressField}
                    placeholder="Write full address"
                    className="h-13 w-full rounded-xl border border-[#623234] bg-[#120607] px-4 text-white"
                    onChange={(event) => {
                      addressField.onChange(event);
                      setSelectedAddressId(null);
                    }}
                  />
                </label>
                <label className="relative block">
                  <HiOutlineCalendarDays className="absolute left-3 top-3.5 text-[#b08d86]" />
                  <input type="date" {...register("deliveryDate")} className="h-12 w-full rounded-xl border border-[#623234] bg-[#120607] pl-10 pr-3" />
                </label>
                <label className="relative block">
                  <HiOutlineClock className="absolute left-3 top-3.5 text-[#b08d86]" />
                  <input type="time" {...register("deliveryTime")} className="h-12 w-full rounded-xl border border-[#623234] bg-[#120607] pl-10 pr-3" />
                </label>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-[#623234] bg-[linear-gradient(145deg,rgba(23,9,11,0.96),rgba(13,5,7,0.96))] p-4">
              <p className="font-cormorant text-3xl text-white">Contact Details</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input {...register("customerName")} placeholder="Customer name" className="h-12 w-full rounded-xl border border-[#623234] bg-[#120607] px-3" />
                <input {...register("phone")} placeholder="Phone" className="h-12 w-full rounded-xl border border-[#623234] bg-[#120607] px-3" />
                <input {...register("email")} placeholder="Email" className="h-12 w-full rounded-xl border border-[#623234] bg-[#120607] px-3 sm:col-span-2" />
                <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                  <select {...register("deliveryMethod")} className="h-12 rounded-xl border border-[#623234] bg-[#120607] px-3">
                    <option value="express">Express</option>
                    <option value="standard">Standard</option>
                    <option value="pickup">Pickup</option>
                  </select>
                  <select {...register("paymentMethod")} className="h-12 rounded-xl border border-[#623234] bg-[#120607] px-3">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <textarea {...register("note")} placeholder="Delivery note, entrance, floor, receiver details..." className="min-h-24 w-full rounded-xl border border-[#623234] bg-[#120607] px-3 py-2 sm:col-span-2" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/cart" className="inline-flex h-14 items-center justify-center rounded-xl border border-[#7f5a3b] bg-[#110608] text-lg font-semibold uppercase tracking-[0.08em] text-[#f0cfa5]">Back to order</Link>
            <button type="submit" disabled={createOrder.isPending} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-[#c03b47] bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] text-lg font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-60"><HiOutlineShoppingBag /> {createOrder.isPending ? "Yuborilmoqda..." : "Place order"}</button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] border border-[#4f2224] bg-[linear-gradient(160deg,#1b080a,#0c0304_75%)] p-5">
            <p className="font-cormorant text-4xl text-white">Order Summary</p>
            <p className="mt-3 text-lg text-[#f3d8cf]">{primaryItem.bouquet.name}</p>
            <p className="text-[#d1b0a8]">Size: {selectedSize}</p>
            <p className="text-[#d1b0a8]">Quantity: {quantity}</p>
            <p className="text-[#d1b0a8]">Add-ons: {selectedAddons.length ? selectedAddons.join(", ") : "No"}</p>
            <div className="mt-4 rounded-xl border border-[#8a303f] bg-[#25090f] p-3">
              <p className="text-lg text-[#ff7d8d]">Express delivery available in Tashkent</p>
              <p className="text-[#d8b2aa]">Order within 2h 15m</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatPrice(String(finalPrice))}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-[#4f2224] bg-[linear-gradient(160deg,#19080a,#0c0304_75%)]">
            <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(216,78,101,0.18),transparent_58%)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-cormorant text-4xl text-white">Delivery Preview</p>
                  <p className="text-sm text-[#d5b0a8]">Checkout uchun tanlangan manzil va izoh shu yerda ko'rinadi.</p>
                </div>
                {selectedSavedAddress?.title ?? preferredAddress?.title ? (
                  <span className="rounded-full border border-[#355740] bg-[#10261a] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#b4f1cb]">
                    {selectedSavedAddress?.title ?? preferredAddress?.title}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-5">
              {selectedCoords ? (
                <div className="overflow-hidden rounded-2xl border border-[#4b2326]">
                  <iframe
                    title="Checkout map preview"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedCoords[1] - 0.01}%2C${selectedCoords[0] - 0.01}%2C${selectedCoords[1] + 0.01}%2C${selectedCoords[0] + 0.01}&layer=mapnik&marker=${selectedCoords[0]}%2C${selectedCoords[1]}`}
                    className="h-48 w-full"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#5c2c31] bg-[#130709] px-4 py-8 text-center text-[#c39c95]">
                  Map pin qo'yilsa bu yerda live preview ko'rinadi.
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-[#4b2326] bg-[#120607] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#b88d86]">Selected Address</p>
                <p className="mt-2 text-lg leading-7 text-white">{address || "Address tanlanmagan"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSavedAddress?.is_primary ? (
                    <span className="rounded-full bg-[#3a1d0f] px-2.5 py-1 text-xs text-[#ffd59a]">Primary address</span>
                  ) : null}
                  {selectedCoords ? (
                    <span className="rounded-full bg-[#1f1012] px-2.5 py-1 text-xs text-[#ddb8b0]">
                      {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                    </span>
                  ) : null}
                </div>
                {notes?.trim() ? <p className="mt-4 text-sm leading-6 text-[#cda79f]">{notes.trim()}</p> : null}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {mapOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[#643335] bg-[#100507] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between"><p className="font-cormorant text-3xl text-white">Location Picker</p><button type="button" onClick={() => setMapOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#714243] text-[#f6d6ce]"><HiXMark /></button></div>
            <div ref={mapHostRef} className="h-[420px] w-full overflow-hidden rounded-xl border border-[#6b3a3c]" />
            <div className="mt-3 flex items-center justify-between text-sm text-[#cfafa8]"><span>Xaritada bosib manzil tanlang.</span>{isResolvingAddress ? <span>Address aniqlanmoqda...</span> : null}</div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default DeliveryCheckout;
