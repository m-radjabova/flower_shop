import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  HiCheckCircle,
  HiChevronDown,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiXMark,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlinePencilSquare,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiHome,
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
import { getBouquetAddonOptions, getBouquetImageForSize, getBouquetSizeOptions } from "../../utils/bouquetOptions";
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
  invalidateSize: (options?: { pan?: boolean; animate?: boolean }) => void;
  remove: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
};

const TASHKENT_COORDS: [number, number] = [41.3111, 69.2797];
const UZBEKISTAN_VIEWBOX = "55.996627,45.590118,73.1479,37.172257";

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

interface SearchLocationResult {
  lat: string;
  lon: string;
  display_name: string;
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
      address: "",
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
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<SearchLocationResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const leafletMarkerRef = useRef<LeafletMarker | null>(null);
  const didHydrateAddressRef = useRef(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const primaryItem = items[0] ?? null;
  const sizeOptions = primaryItem ? getBouquetSizeOptions(primaryItem.bouquet) : [];
  const addonOptions = primaryItem ? getBouquetAddonOptions(primaryItem.bouquet) : [];

  const selectedSize = searchParams.get("size") ?? "";
  const selectedAddons = (searchParams.get("addons") ?? "")
    .split(",")
    .map((addon) => addon.trim())
    .filter(Boolean);

  const selectedSizeOption = sizeOptions.find((item) => item.key === selectedSize) ?? sizeOptions[0] ?? null;
  const unitPriceWithoutAddons = Number(selectedSizeOption?.price ?? primaryItem?.bouquet.price ?? 0);
  const selectedAddonOptions = addonOptions.filter((item) => selectedAddons.includes(item.id));
  const addonsTotal = selectedAddonOptions.reduce((acc, item) => acc + Number(item.price), 0);
  const unitPrice = unitPriceWithoutAddons + addonsTotal;
  const quantity = primaryItem?.quantity ?? 0;
  const finalPrice = unitPrice * quantity;

  const address = watch("address");
  const notes = watch("note");
  const selectedSavedAddress = addressesQuery.data?.find((item) => item.id === selectedAddressId) ?? null;
  const preferredAddress = getPreferredCheckoutAddress();

  const applyLocationSelection = async (nextLatitude: number, nextLongitude: number, fallbackAddress?: string) => {
    const coords: [number, number] = [Number(nextLatitude.toFixed(6)), Number(nextLongitude.toFixed(6))];
    setSelectedCoords(coords);
    leafletMarkerRef.current?.setLatLng(coords);
    setIsResolvingAddress(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}`);
      const data = (await res.json()) as { display_name?: string };
      setValue("address", data.display_name || fallbackAddress || `${coords[0]}, ${coords[1]}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } catch {
      setValue("address", fallbackAddress || `${coords[0]}, ${coords[1]}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast.error("Addressni aniqlab bo'lmadi");
    } finally {
      setIsResolvingAddress(false);
    }
  };

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
        leafletMarkerRef.current = marker;

        map.on("click", async ({ latlng }) => {
          const coords: [number, number] = [latlng.lat, latlng.lng];
          marker.setLatLng(coords);
          map.setView(coords, 15);
          void applyLocationSelection(coords[0], coords[1]);
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
      leafletMarkerRef.current = null;
    };
  }, [mapOpen, selectedCoords]);

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) {
      toast.error("Qidirish uchun address yozing");
      return;
    }

    try {
      setIsSearchingLocation(true);
      const params = new URLSearchParams({
        format: "jsonv2",
        q: locationQuery.trim(),
        limit: "5",
        countrycodes: "uz",
        bounded: "1",
        viewbox: UZBEKISTAN_VIEWBOX,
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      const data = (await res.json()) as SearchLocationResult[];
      const uniqueResults = Array.from(
        new Map(data.map((item) => [`${item.lat}:${item.lon}:${item.display_name}`, item])).values(),
      );
      setLocationResults(uniqueResults);
      if (!uniqueResults.length) {
        toast.error("Mos location topilmadi");
      }
    } catch {
      toast.error("Location qidirib bo'lmadi");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Brauzer geolocationni qo'llamaydi");
      return;
    }

    try {
      setIsLocatingUser(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const coords: [number, number] = [
        Number(position.coords.latitude.toFixed(6)),
        Number(position.coords.longitude.toFixed(6)),
      ];
      leafletMapRef.current?.setView(coords, 15);
      leafletMarkerRef.current?.setLatLng(coords);
      await applyLocationSelection(coords[0], coords[1], "Current location");
      setLocationQuery("Current location");
      setLocationResults([]);
    } catch {
      toast.error("Hozirgi joylashuvni olib bo'lmadi");
    } finally {
      setIsLocatingUser(false);
    }
  };

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
            bouquet_image: getBouquetImageForSize(primaryItem.bouquet, selectedSizeOption?.key),
            selected_size: selectedSizeOption ?? undefined,
            selected_addons: selectedAddonOptions,
            price: String(unitPrice.toFixed(2)),
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
      <main className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-12 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
        {/* Decorative bg elements */}
        <div className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-[#8f1220]/10 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 top-80 h-96 w-96 rounded-full bg-[#6b1d2a]/8 blur-[120px]" />

        <div className="relative mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-[#5d2b2f]/60 bg-[linear-gradient(150deg,rgba(28,10,13,0.94),rgba(15,6,8,0.94))] p-8 text-center shadow-[0_20px_60px_rgba(8,3,4,0.6)] backdrop-blur-sm">
            {/* Glow accent */}
            <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#ce4a60]/5 to-transparent opacity-50" />

            <div className="relative">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#5d2b2f]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.8),rgba(15,6,8,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <HiOutlineShoppingBag className="text-3xl text-[#ce4a60]" />
              </div>

              <p className="font-cormorant text-5xl text-white">Savatcha bo'sh</p>
              <p className="mt-3 text-[#d8b5ad]">Avval bouquet tanlab keyin delivery ma'lumotlarini kiriting.</p>

              <Link
                to="/bouquets"
                className="group relative mt-8 inline-flex h-13 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#ce4a60]/30 bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] px-8 font-semibold uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(206,74,96,0.25)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(206,74,96,0.4)] hover:brightness-110"
              >
                <span className="relative z-10">Bouquets ko'rish</span>
                <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-12 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
      {/* Decorative background orbs */}
      <div className="pointer-events-none fixed -left-48 top-1/4 h-[500px] w-[500px] rounded-full bg-[#8f1220]/8 blur-[130px]" />
      <div className="pointer-events-none fixed -right-48 top-1/3 h-[400px] w-[400px] rounded-full bg-[#6b1d2a]/6 blur-[120px]" />
      <div className="pointer-events-none fixed left-1/3 top-[60%] h-[350px] w-[350px] rounded-full bg-[#5d1a24]/5 blur-[100px]" />

      <div className="relative mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[1.2fr_0.8fr]">

        {/* ==================== LEFT – FORM ==================== */}
        <form onSubmit={handleSubmit(onSubmit)} className="relative overflow-hidden rounded-[1.8rem] border border-[#4f2224]/60 bg-[linear-gradient(160deg,#120507,#090204_70%)] p-6 shadow-[0_20px_60px_rgba(8,3,4,0.5)] sm:p-8 backdrop-blur-sm">
          {/* Top gradient glow */}
          <div className="pointer-events-none absolute -inset-1 rounded-[1.8rem] bg-gradient-to-br from-[#ce4a60]/5 via-transparent to-transparent opacity-40" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.6),rgba(15,6,8,0.7))]">
                <HiOutlineTruck className="text-lg text-[#ce4a60]" />
              </div>
              <div>
                <p className="font-cormorant text-4xl text-white sm:text-5xl">Delivery Information</p>
                <p className="mt-1 text-[#d8b2aa]">Saqlangan addressni tanlang yoki yangi manzil qo'lda yozib, xaritadan pin qo'ying.</p>
              </div>
            </div>

            {/* ===== Saved Addresses ===== */}
            <section className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-[#643034]/60 bg-[linear-gradient(145deg,rgba(34,11,14,0.92),rgba(16,6,8,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ce4a60]/5 blur-[40px]" />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#643034]/50 bg-[linear-gradient(135deg,rgba(34,11,14,0.5),rgba(16,6,8,0.6))]">
                    <HiHome className="text-sm text-[#d8b2aa]" />
                  </div>
                  <div>
                    <p className="font-cormorant text-2xl text-white">Saved Addresses</p>
                    <p className="text-sm text-[#d2ada5]">Profilingizdagi addresslar. Bir bosishda checkout uchun tanlang.</p>
                  </div>
                </div>
                {selectedSavedAddress ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#31553f]/50 bg-[linear-gradient(135deg,#10261a,#0b1f13)] px-3 py-1 text-sm text-[#a8f2c8] shadow-[0_2px_10px_rgba(16,38,26,0.3)]">
                    <HiCheckCircle className="text-xs" />
                    {selectedSavedAddress.title}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 space-y-2.5">
                {addressesQuery.isLoading ? <AddressCardsSkeleton count={2} /> : null}
                {!addressesQuery.isLoading && !(addressesQuery.data?.length ?? 0) ? (
                  <div className="rounded-2xl border border-dashed border-[#5f2f33]/60 bg-[#140709]/60 px-5 py-5 text-sm text-[#cca7a0]">
                    Hozircha saved address yo'q. Pastdagi form orqali yangi manzil kiriting.
                  </div>
                ) : null}
                {!addressesQuery.isLoading &&
                  addressesQuery.data?.map((savedAddress) => {
                    const selected = savedAddress.id === selectedAddressId;
                    return (
                      <button
                        key={savedAddress.id}
                        type="button"
                        onClick={() => applySavedAddress(savedAddress)}
                        className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                          selected
                            ? "border-[#4f8c69]/70 bg-[linear-gradient(135deg,rgba(16,37,27,0.96),rgba(14,18,16,0.98))] shadow-[0_18px_48px_rgba(12,35,22,0.28)]"
                            : "border-[#5c2c31]/50 bg-[linear-gradient(145deg,rgba(25,9,11,0.9),rgba(16,6,8,0.95))] hover:border-[#8d4d53]/60 hover:bg-[linear-gradient(145deg,rgba(33,11,14,0.93),rgba(19,7,9,0.98))]"
                        }`}
                      >
                        {selected && (
                          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#4f8c69]/10 blur-[30px]" />
                        )}
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-white">{savedAddress.title}</p>
                              {savedAddress.is_primary ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#3a1d0f,#4a2515)] px-2.5 py-0.5 text-xs text-[#ffd59a] shadow-[0_2px_8px_rgba(58,29,15,0.3)]">
                                  <HiCheckCircle className="text-[10px]" />
                                  Primary
                                </span>
                              ) : null}
                              {selected ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#205437,#2a6b4a)] px-2.5 py-0.5 text-xs text-[#dfffea] shadow-[0_2px_8px_rgba(32,84,55,0.3)]">
                                  <HiCheckCircle className="text-[10px]" />
                                  Selected
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#eed7d1]">{savedAddress.address_line}</p>
                            <p className="text-sm text-[#be9a93]">{savedAddress.city ?? "City not set"}</p>
                            {savedAddress.notes ? (
                              <p className="mt-1 truncate text-sm text-[#a8857e]">{savedAddress.notes}</p>
                            ) : null}
                          </div>
                          <span
                            className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-all duration-300 ${
                              selected
                                ? "scale-110 border-[#72d79d]/70 bg-[#2d7b52] text-white shadow-[0_0_15px_rgba(45,123,82,0.4)]"
                                : "border-[#7f4d54]/50 text-[#d7b0a8] group-hover:border-[#c9808b]/60 group-hover:bg-[#1f0d10]"
                            }`}
                          >
                            {selected ? (
                              <HiCheckCircle className="text-sm" />
                            ) : (
                              <HiOutlineMapPin className="text-sm" />
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>

            {/* ===== Delivery Address ===== */}
            <div className="mt-5 space-y-4">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#623234]/60 bg-[linear-gradient(145deg,rgba(27,10,13,0.96),rgba(13,5,7,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="pointer-events-none absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-[#623234]/8 blur-[40px]" />

                <div className="relative flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#623234]/50 bg-[linear-gradient(135deg,rgba(27,10,13,0.5),rgba(13,5,7,0.6))]">
                      <HiOutlineMapPin className="text-sm text-[#d8b2aa]" />
                    </div>
                    <div>
                      <p className="font-cormorant text-2xl text-white">Delivery Address</p>
                      <p className="text-sm text-[#cfaaa2]">Xohlasangiz qo'lda kiriting, xohlasangiz mapdan tanlang.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#7f4a4e]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] px-4 py-2 text-sm text-[#f7ddd7] transition-all duration-300 hover:border-[#ce4a60]/40 hover:bg-[linear-gradient(135deg,#1a0a0d,#220e12)] hover:shadow-[0_4px_16px_rgba(206,74,96,0.15)]"
                  >
                    <HiOutlineMapPin className="shrink-0 text-base transition-colors group-hover:text-[#ce4a60]" />
                    <span className="hidden sm:inline">Pick from map</span>
                    <span className="sm:hidden">Map</span>
                    <HiChevronDown className="shrink-0 text-xs transition-transform group-hover:translate-y-0.5" />
                  </button>
                </div>

                <div className="relative mt-4 space-y-3">
                  {/* Current Address Display */}
                  <div className="rounded-2xl border border-[#4c2528]/50 bg-[linear-gradient(135deg,#120607,#18080b)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#b78e88]">
                      <HiOutlineMapPin className="text-xs" />
                      Current address
                    </p>
                    <p className="mt-2 text-base leading-6 text-white">{address || "Address tanlanmagan"}</p>
                    <p className="mt-2 flex items-center gap-1 text-sm text-[#c9a39c]">
                      {selectedCoords ? (
                        <>
                          <span className="inline-flex h-2 w-2 rounded-full bg-[#72d79d] shadow-[0_0_6px_rgba(114,215,157,0.4)]" />
                          Pin: {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                        </>
                      ) : (
                        <>
                          <span className="inline-flex h-2 w-2 rounded-full bg-[#5c2c31]" />
                          Pin hali tanlanmagan
                        </>
                      )}
                    </p>
                  </div>

                  {/* Address Input */}
                  <label className="relative block">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <HiOutlineMapPin className="text-[#b08d86]" />
                    </div>
                    <input
                      {...addressField}
                      placeholder="Write full address"
                      className="h-13 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-4 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)]"
                      onChange={(event) => {
                        addressField.onChange(event);
                        setSelectedAddressId(null);
                      }}
                    />
                  </label>

                  {/* Date & Time */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="group relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineCalendarDays className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                      </div>
                      <input
                        type="date"
                        {...register("deliveryDate")}
                        className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] [color-scheme:dark]"
                      />
                    </label>
                    <label className="group relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineClock className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                      </div>
                      <input
                        type="time"
                        {...register("deliveryTime")}
                        className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] [color-scheme:dark]"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ===== Contact Details ===== */}
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#623234]/60 bg-[linear-gradient(145deg,rgba(23,9,11,0.96),rgba(13,5,7,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="pointer-events-none absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-[#623234]/8 blur-[40px]" />

                <div className="relative flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#623234]/50 bg-[linear-gradient(135deg,rgba(23,9,11,0.5),rgba(13,5,7,0.6))]">
                    <HiOutlineUser className="text-sm text-[#d8b2aa]" />
                  </div>
                  <div>
                    <p className="font-cormorant text-2xl text-white">Contact Details</p>
                    <p className="text-sm text-[#cfaaa2]">Buyurtmachi haqida ma'lumot</p>
                  </div>
                </div>

                <div className="relative mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="group relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineUser className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                      </div>
                      <input
                        {...register("customerName")}
                        placeholder="Customer name"
                        className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)]"
                      />
                    </label>
                    <label className="group relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlinePhone className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                      </div>
                      <input
                        {...register("phone")}
                        placeholder="Phone"
                        className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)]"
                      />
                    </label>
                    <label className="group relative block sm:col-span-2">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineEnvelope className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                      </div>
                      <input
                        {...register("email")}
                        placeholder="Email"
                        className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)]"
                      />
                    </label>
                  </div>

                  {/* Delivery & Payment Selects */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="group relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineTruck className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                      </div>
                      <select
                        {...register("deliveryMethod")}
                        className="h-12 w-full appearance-none rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-10 text-white transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)]"
                      >
                        <option value="express" className="bg-[#0d0507]">
                          🚀 Express
                        </option>
                        <option value="standard" className="bg-[#0d0507]">
                          📦 Standard
                        </option>
                        <option value="pickup" className="bg-[#0d0507]">
                          🏪 Pickup
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <HiChevronDown className="text-xs text-[#b08d86]" />
                      </div>
                    </label>
                    <label className="group relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineCreditCard className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                      </div>
                      <select
                        {...register("paymentMethod")}
                        className="h-12 w-full appearance-none rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-10 text-white transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)]"
                      >
                        <option value="cash" className="bg-[#0d0507]">
                          💵 Cash
                        </option>
                        <option value="card" className="bg-[#0d0507]">
                          💳 Card
                        </option>
                        <option value="online" className="bg-[#0d0507]">
                          🌐 Online
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <HiChevronDown className="text-xs text-[#b08d86]" />
                      </div>
                    </label>
                  </div>

                  {/* Note */}
                  <label className="group relative block">
                    <div className="pointer-events-none absolute left-0 top-3 flex items-start pl-3.5 pt-0.5">
                      <HiOutlinePencilSquare className="text-[#b08d86] transition-colors group-focus-within:text-[#ce4a60]" />
                    </div>
                    <textarea
                      {...register("note")}
                      placeholder="Delivery note, entrance, floor, receiver details..."
                      className="min-h-24 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 py-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)]"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* ===== Action Buttons ===== */}
            <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                to="/cart"
                className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl border border-[#7f5a3b]/40 bg-[linear-gradient(135deg,#110608,#1a0b0d)] text-lg font-semibold uppercase tracking-[0.08em] text-[#f0cfa5] transition-all duration-300 hover:border-[#f0cfa5]/30 hover:shadow-[0_4px_20px_rgba(240,207,165,0.08)]"
              >
                <span className="relative z-10 flex items-center gap-2">← Back to order</span>
                <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#ce4a60]/30 bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] text-lg font-semibold uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(206,74,96,0.25)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(206,74,96,0.4)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {createOrder.isPending ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <HiOutlineShoppingBag className="text-xl" />
                      Place order
                    </>
                  )}
                </span>
                <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          </div>
        </form>

        {/* ==================== RIGHT – ORDER SUMMARY ==================== */}
        <aside className="space-y-6">
          {/* Order Summary Card */}
          <div className="relative overflow-hidden rounded-[1.8rem] border border-[#4f2224]/60 bg-[linear-gradient(160deg,#1b080a,#0c0304_75%)] shadow-[0_20px_60px_rgba(8,3,4,0.4)] backdrop-blur-sm">
            <div className="pointer-events-none absolute -inset-1 rounded-[1.8rem] bg-gradient-to-br from-[#ce4a60]/5 via-transparent to-transparent opacity-30" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#ce4a60]/8 blur-[50px]" />

            <div className="relative p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.6),rgba(15,6,8,0.7))]">
                  <HiOutlineShoppingBag className="text-lg text-[#ce4a60]" />
                </div>
                <p className="font-cormorant text-3xl text-white">Order Summary</p>
              </div>

              {/* Bouquet Info */}
              <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.5),rgba(15,6,8,0.5))] p-4">
                <div className="flex items-start gap-4">
                  {primaryItem.bouquet.image && (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#4f2224]/30">
                      <img
                        src={getBouquetImageForSize(primaryItem.bouquet, selectedSizeOption?.key)}
                        alt={primaryItem.bouquet.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-[#f3d8cf]">{primaryItem.bouquet.name}</p>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#d1b0a8]">Size</span>
                        <span className="flex items-center gap-1 text-white">
                          <span
                            className={`inline-flex h-2 w-2 rounded-full ${
                              selectedSize === "small"
                                ? "bg-[#72d79d]"
                                : selectedSize === "medium"
                                  ? "bg-[#f0cfa5]"
                                  : selectedSize === "large"
                                    ? "bg-[#ce4a60]"
                                    : "bg-[#b8860b]"
                            }`}
                          />
                          {selectedSizeOption?.label ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#d1b0a8]">Quantity</span>
                        <span className="text-white">× {quantity}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#d1b0a8]">Add-ons</span>
                        <span className="text-white">
                          {selectedAddons.length ? (
                            <span className="flex flex-wrap justify-end gap-1">
                              {selectedAddonOptions.map((a) => (
                                  <span
                                    key={a.id}
                                    className="inline-flex items-center gap-0.5 rounded-full bg-[#25090f]/80 px-2 py-0.5 text-[11px] text-[#f0cfa5]"
                                  >
                                    {a.name}
                                    +{formatPrice(a.price)}
                                  </span>
                                ))}
                            </span>
                          ) : (
                            <span className="text-[#a8857e]">No</span>
                          )}
                        </span>
                      </div>
                      {selectedAddonOptions.length ? (
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          {selectedAddonOptions.map((addon) => (
                            <div key={addon.id} className="overflow-hidden rounded-xl border border-[#4f2224]/50 bg-[#140608]">
                              <img
                                src={addon.image}
                                alt={addon.name}
                                className="h-16 w-full object-cover"
                              />
                              <div className="px-2 py-1.5">
                                <p className="truncate text-[10px] font-semibold text-[#f4d7d1]">{addon.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Delivery */}
              <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#8a303f]/50 bg-[linear-gradient(135deg,rgba(37,9,15,0.95),rgba(25,6,10,0.95))] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#ce4a60]/5 to-transparent opacity-30" />

                <p className="text-sm text-[#ff7d8d]">🚀 Express delivery available in Tashkent</p>
                <p className="mt-1 text-sm text-[#d8b2aa]">Order within 2h 15m</p>

                <div className="relative mt-3">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#a06a72]">Total</p>
                  <p className="mt-0.5 text-4xl font-bold text-white">{formatPrice(String(finalPrice))}</p>

                  <div className="mt-3 flex items-center justify-center gap-3 text-xs text-[#a06a72]">
                    <span>Unit: {formatPrice(String(unitPriceWithoutAddons))}</span>
                    <span className="h-3 w-px bg-[#4f2224]/50" />
                    <span>Addons: {formatPrice(String(addonsTotal))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Preview Card */}
          <div className="overflow-hidden rounded-[1.8rem] border border-[#4f2224]/60 bg-[linear-gradient(160deg,#19080a,#0c0304_75%)] shadow-[0_20px_60px_rgba(8,3,4,0.4)] backdrop-blur-sm">
            {/* Header */}
            <div className="relative border-b border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(216,78,101,0.18),transparent_58%)] p-6">
              <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-[#ce4a60]/8 blur-[40px]" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(25,9,11,0.5),rgba(13,5,7,0.6))]">
                    <HiOutlineMapPin className="text-sm text-[#d8b2aa]" />
                  </div>
                  <div>
                    <p className="font-cormorant text-2xl text-white">Delivery Preview</p>
                    <p className="text-sm text-[#d5b0a8]">Tanlangan manzil va izoh</p>
                  </div>
                </div>
                {(selectedSavedAddress?.title ?? preferredAddress?.title) ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#355740]/40 bg-[linear-gradient(135deg,#10261a,#0b1f13)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#b4f1cb] shadow-[0_2px_10px_rgba(16,38,26,0.3)]">
                    <HiCheckCircle className="text-[10px]" />
                    {selectedSavedAddress?.title ?? preferredAddress?.title}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Map Preview */}
              {selectedCoords ? (
                <div className="group relative overflow-hidden rounded-2xl border border-[#4b2326]/50 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-white/[0.03]" />
                  <iframe
                    title="Checkout map preview"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedCoords[1] - 0.01}%2C${selectedCoords[0] - 0.01}%2C${selectedCoords[1] + 0.01}%2C${selectedCoords[0] + 0.01}&layer=mapnik&marker=${selectedCoords[0]}%2C${selectedCoords[1]}`}
                    className="h-48 w-full transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 z-10 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
                    📍 Pin location
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-dashed border-[#5c2c31]/50 bg-[linear-gradient(135deg,#130709,#1a0b0e)] px-6 py-10 text-center transition-all duration-300 hover:border-[#7f4a4e]/40">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#5c2c31]/40 bg-[linear-gradient(135deg,#1d0c0f,#14080a)]">
                    <HiOutlineMapPin className="text-xl text-[#c39c95]" />
                  </div>
                  <p className="text-sm text-[#c39c95]">
                    Map pin qo'yilsa bu yerda <br />
                    live preview ko'rinadi.
                  </p>
                </div>
              )}

              {/* Address Info */}
              <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#4b2326]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                <div className="pointer-events-none absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-[#4b2326]/20 blur-[30px]" />

                <div className="relative">
                  <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#b88d86]">
                    <HiCheckCircle className="text-xs text-[#72d79d]" />
                    Selected Address
                  </p>
                  <p className="mt-2 text-lg leading-7 text-white">{address || "Address tanlanmagan"}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSavedAddress?.is_primary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#3a1d0f,#4a2515)] px-2.5 py-1 text-xs text-[#ffd59a] shadow-[0_2px_8px_rgba(58,29,15,0.3)]">
                        <HiCheckCircle className="text-[10px]" />
                        Primary address
                      </span>
                    ) : null}
                    {selectedCoords ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#4b2326]/30 bg-[linear-gradient(135deg,#1f1012,#2d1619)] px-2.5 py-1 text-xs text-[#ddb8b0]">
                        📌 {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                      </span>
                    ) : null}
                  </div>

                  {notes?.trim() ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#4b2326]/30 bg-[#0d0406]/50 px-3 py-2.5">
                      <HiOutlinePencilSquare className="mt-0.5 shrink-0 text-xs text-[#b88d86]" />
                      <p className="text-sm leading-6 text-[#cda79f]">{notes.trim()}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================== MAP MODAL ==================== */}
      {mapOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#643335]/70 bg-[linear-gradient(160deg,#100507,#0a0204)] shadow-[0_30px_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#643335]/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#643335]/40 bg-[linear-gradient(135deg,rgba(16,5,7,0.5),rgba(10,2,4,0.6))]">
                  <HiOutlineMapPin className="text-sm text-[#d8b2aa]" />
                </div>
                <div>
                  <p className="font-cormorant text-2xl text-white">Location Picker</p>
                  <p className="text-sm text-[#cfafa8]">Search qiling yoki hozirgi joylashuvni oling.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#714243]/40 text-[#f6d6ce] transition-all duration-200 hover:border-[#ce4a60]/40 hover:bg-[#ce4a60]/10 hover:text-[#ce4a60]"
              >
                <HiXMark className="text-lg" />
              </button>
            </div>

            <div className="border-b border-[#643335]/30 px-5 py-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <label className="relative block">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <HiOutlineMagnifyingGlass className="text-[#b08d86]" />
                  </div>
                  <input
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleLocationSearch();
                      }
                    }}
                    placeholder="Address yoki joy nomini qidiring"
                    className="h-12 w-full rounded-2xl border border-[#6b3a3c] bg-[#180709] pl-11 pr-4 text-white outline-none placeholder:text-[#8c6666]"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleLocationSearch()}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb]"
                  >
                    {isSearchingLocation ? "Searching..." : "Search"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUseCurrentLocation()}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb]"
                  >
                    {isLocatingUser ? "Locating..." : "My location"}
                  </button>
                </div>
              </div>

              {locationResults.length ? (
                <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                  {locationResults.map((result) => (
                    <button
                      key={`${result.lat}-${result.lon}`}
                      type="button"
                      onClick={() => {
                        const coords: [number, number] = [Number(result.lat), Number(result.lon)];
                        leafletMapRef.current?.setView(coords, 15);
                        leafletMarkerRef.current?.setLatLng(coords);
                        void applyLocationSelection(coords[0], coords[1], result.display_name);
                        setLocationResults([]);
                        setLocationQuery(result.display_name);
                      }}
                      className="block w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-left text-sm text-[#f3dbd6] transition hover:border-[#ce4a60]/40 hover:bg-[#221014]"
                    >
                      <span className="block font-semibold text-white">{locationQuery.trim()}</span>
                      <span className="mt-1 block text-[#d6b2ab]">{result.display_name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Map */}
            <div ref={mapHostRef} className="h-[420px] w-full overflow-hidden border-b border-[#6b3a3c]/30" />

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 text-sm text-[#cfafa8]">
              <span>👆 Xaritada bosib manzil tanlang.</span>
              {isResolvingAddress ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Address aniqlanmoqda...
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default DeliveryCheckout;
