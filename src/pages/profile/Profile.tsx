import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowLeftOnRectangle,
  HiGift,
  HiOutlineGift,
  HiOutlineHeart as HiOutlineHeartCard,
  HiOutlineShoppingBag as HiOutlineShoppingBagCard,
  HiStar,
  HiOutlineBell,
  HiOutlineCamera,
  HiOutlineCog6Tooth,
  HiOutlineHeart,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiOutlineUser,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { useFavoriteItems } from "../../hooks/useFavorites";
import useContextPro from "../../hooks/useContextPro";
import {
  useBouquets,
  useCreateAddress,
  useDeleteAddress,
  useMyAddresses,
  useMyOrders,
  useMyReviews,
  useSetPrimaryAddress,
  useUpdateAddress,
  useUploadImage,
} from "../../hooks/useCatalog";
import type { AddressOut, OrderOut } from "../../types/catalog";
import { formatPrice } from "../../utils/catalog";
import { addToCart } from "../../utils/cart";
import { removeFavoriteBouquet } from "../../utils/favorites";
import {
  clearPreferredCheckoutAddress,
  getPreferredCheckoutAddress,
  isSameCheckoutAddress,
  setPreferredCheckoutAddress,
} from "../../utils/address";
import {
  AddressCardsSkeleton,
  OrdersListSkeleton,
  ProfileDashboardSkeleton,
  RecommendedBouquetSkeleton,
} from "../../components/PageSkeletons";

const AVATAR_STORAGE_KEY = "flower-shop-profile-avatar";
const TASHKENT_COORDS: [number, number] = [41.3111, 69.2797];

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

type ProfileTab = "profile" | "orders" | "favorites" | "addresses" | "notifications" | "settings";

const tabs: Array<{ key: ProfileTab; label: string; icon: React.ReactNode }> = [
  { key: "profile", label: "My Profile", icon: <HiOutlineUser /> },
  { key: "orders", label: "My Orders", icon: <HiOutlineShoppingBag /> },
  { key: "favorites", label: "My Favorites", icon: <HiOutlineHeart /> },
  { key: "addresses", label: "My Addresses", icon: <HiOutlineMapPin /> },
  { key: "notifications", label: "Notifications", icon: <HiOutlineBell /> },
  { key: "settings", label: "Settings", icon: <HiOutlineCog6Tooth /> },
];

function getStoredAvatar(userId: string | undefined) {
  if (!userId || typeof window === "undefined") return "";
  return window.localStorage.getItem(`${AVATAR_STORAGE_KEY}:${userId}`) ?? "";
}

function setStoredAvatar(userId: string | undefined, url: string) {
  if (!userId || typeof window === "undefined") return;
  window.localStorage.setItem(`${AVATAR_STORAGE_KEY}:${userId}`, url);
}

function getOrderStatusMeta(status: OrderOut["status"]) {
  switch (status) {
    case "new":
      return { label: "New", className: "border-[#6b4f2f] bg-[#2a1b0e] text-[#f7cf9d]" };
    case "accepted":
      return { label: "Accepted", className: "border-[#4b5a73] bg-[#121c2d] text-[#a8c8ff]" };
    case "preparing":
      return { label: "Preparing", className: "border-[#7b5832] bg-[#2d1a0f] text-[#ffcf8c]" };
    case "delivering":
      return { label: "Delivering", className: "border-[#35626b] bg-[#10252a] text-[#8fe7ff]" };
    case "delivered":
      return { label: "Delivered", className: "border-[#2f6a4f] bg-[#10231a] text-[#9ef0c2]" };
    case "cancelled":
      return { label: "Cancelled", className: "border-[#7a3542] bg-[#2a0f14] text-[#ff9eae]" };
    default:
      return { label: status, className: "border-[#704447] bg-[#2a1014] text-[#f4d8d2]" };
  }
}

function getPaymentStatusMeta(status: OrderOut["payment_status"]) {
  switch (status) {
    case "paid":
      return { label: "Paid", className: "text-[#9ef0c2]" };
    case "pending":
      return { label: "Pending", className: "text-[#ffd39a]" };
    case "failed":
      return { label: "Failed", className: "text-[#ff9eae]" };
    default:
      return { label: status, className: "text-[#f4d8d2]" };
  }
}

function Profile() {
  const {
    state: { user },
    logout,
  } = useContextPro();

  const ordersQuery = useMyOrders();
  const addressesQuery = useMyAddresses();
  const myReviewsQuery = useMyReviews();
  const favoriteItems = useFavoriteItems();
  const uploadImage = useUploadImage();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setPrimaryAddressMutation = useSetPrimaryAddress();
  const recommendedQuery = useBouquets({ limit: 8 });

  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [avatarUrl, setAvatarUrl] = useState(() => getStoredAvatar(user?.id));
  const [recommendedIndex, setRecommendedIndex] = useState(0);
  const [addressForm, setAddressForm] = useState({
    title: "",
    address_line: "",
    city: "",
    notes: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [preferredCheckoutAddress, setPreferredCheckoutAddressState] = useState(() => getPreferredCheckoutAddress());
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);

  const orders = ordersQuery.data ?? [];
  const addresses = addressesQuery.data ?? [];
  const myReviewsCount = myReviewsQuery.data?.length ?? 0;
  const recommendedBouquets = recommendedQuery.data ?? [];
  const safeRecommendedIndex = recommendedBouquets.length
    ? recommendedIndex % recommendedBouquets.length
    : 0;
  const activeRecommended = recommendedBouquets[safeRecommendedIndex];
  const isOrdersLoading = ordersQuery.isLoading;
  const isAddressesLoading = addressesQuery.isLoading;
  const isReviewsLoading = myReviewsQuery.isLoading;

  const profileCompletion = useMemo(() => {
    let done = 0;
    if (user?.full_name?.trim()) done += 25;
    if (user?.email?.trim()) done += 25;
    if (user?.phone?.trim()) done += 25;
    if (avatarUrl) done += 25;
    return done;
  }, [user?.full_name, user?.email, user?.phone, avatarUrl]);

  const userInitials = user?.full_name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") ?? "U";

  const firstName = user?.full_name?.split(/\s+/)[0] ?? "Guest";

  const handleAvatarChange = async (file: File | null) => {
    if (!file || !user?.id) return;
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      setAvatarUrl(uploaded.url);
      setStoredAvatar(user.id, uploaded.url);
      toast.success("Avatar yangilandi");
    } catch {
      toast.error("Avatar yuklashda xatolik");
    }
  };

  const resetAddressForm = () => {
    setAddressForm({ title: "", address_line: "", city: "", notes: "", latitude: null, longitude: null });
    setEditingAddressId(null);
  };

  const handleAddressSubmit = async () => {
    if (!addressForm.title.trim() || !addressForm.address_line.trim()) {
      toast.error("Title va address majburiy");
      return;
    }
    try {
      if (editingAddressId) {
        await updateAddressMutation.mutateAsync({
          addressId: editingAddressId,
          payload: {
            title: addressForm.title.trim(),
            address_line: addressForm.address_line.trim(),
            city: addressForm.city.trim() || undefined,
            notes: addressForm.notes.trim() || undefined,
            latitude: addressForm.latitude ?? undefined,
            longitude: addressForm.longitude ?? undefined,
          },
        });
        toast.success("Address yangilandi");
      } else {
        await createAddressMutation.mutateAsync({
          title: addressForm.title.trim(),
          address_line: addressForm.address_line.trim(),
          city: addressForm.city.trim() || undefined,
          notes: addressForm.notes.trim() || undefined,
          latitude: addressForm.latitude ?? undefined,
          longitude: addressForm.longitude ?? undefined,
          is_primary: addresses.length === 0,
        });
        toast.success("Address qo'shildi");
      }
      resetAddressForm();
    } catch (error) {
      toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Address saqlanmadi");
    }
  };

  useEffect(() => {
    if (recommendedBouquets.length <= 1) return;
    const timer = window.setInterval(() => {
      setRecommendedIndex((prev) => (prev + 1) % recommendedBouquets.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [recommendedBouquets.length]);

  useEffect(() => {
    const syncPreferredAddress = () => setPreferredCheckoutAddressState(getPreferredCheckoutAddress());
    window.addEventListener("storage", syncPreferredAddress);
    return () => window.removeEventListener("storage", syncPreferredAddress);
  }, []);

  useEffect(() => {
    if (!mapOpen || !mapHostRef.current) return;
    let cancelled = false;

    const setupMap = async () => {
      try {
        await injectLeafletAssets();
        if (cancelled || !window.L || !mapHostRef.current) return;

        const initial: [number, number] = [
          addressForm.latitude ?? TASHKENT_COORDS[0],
          addressForm.longitude ?? TASHKENT_COORDS[1],
        ];
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
          setAddressForm((prev) => ({ ...prev, latitude: coords[0], longitude: coords[1] }));
          setIsResolvingAddress(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = (await res.json()) as { display_name?: string; address?: { city?: string; town?: string; village?: string } };
            if (data.display_name) {
              setAddressForm((prev) => ({
                ...prev,
                address_line: data.display_name ?? prev.address_line,
                city: data.address?.city ?? data.address?.town ?? data.address?.village ?? prev.city,
              }));
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
  }, [mapOpen, addressForm.latitude, addressForm.longitude]);

  const renderCenterContent = () => {
    if (activeTab === "orders") {
      return (
        <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <p className="font-cormorant text-4xl text-white">My Orders</p>
          {isOrdersLoading ? (
            <OrdersListSkeleton />
          ) : (
            <div className="mt-4 space-y-3">
            {!orders.length ? <p className="text-[#d8beb8]">Hozircha order yo'q.</p> : null}
            {orders.map((order) => (
              <article key={order.id} className="flex items-center justify-between rounded-xl bg-[#120607] p-3">
                <div>
                  <p className="text-sm text-[#d7b7b0]">Order #{order.id.slice(0, 8)}</p>
                  <p className="font-semibold text-white">{order.items[0]?.bouquet_name ?? "Bouquet"}</p>
                  <p className="text-sm text-[#bc9892]">{order.items.reduce((acc, item) => acc + item.quantity, 0)} item(s)</p>
                  <p className={`mt-1 text-xs ${getPaymentStatusMeta(order.payment_status).className}`}>
                    Payment: {getPaymentStatusMeta(order.payment_status).label}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`rounded-full border px-2 py-1 text-xs uppercase ${getOrderStatusMeta(order.status).className}`}>
                    {getOrderStatusMeta(order.status).label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatPrice(order.total_price)}</p>
                </div>
              </article>
            ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "favorites") {
      return (
        <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <p className="font-cormorant text-4xl text-white">My Favorites</p>
          <p className="mt-2 text-[#d8beb8]">Sizda {favoriteItems.length} ta saqlangan bouquet bor.</p>
          <div className="mt-4 space-y-3">
            {!favoriteItems.length ? <p className="text-[#d8beb8]">Hozircha favorites yo'q.</p> : null}
            {favoriteItems.map((item) => (
              <article key={item.id} className="flex items-center justify-between rounded-xl bg-[#120607] p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.bouquet.image}
                    alt={item.bouquet.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white">{item.bouquet.name}</p>
                    <p className="text-sm text-[#c9a59e]">{item.bouquet.shop.name}</p>
                    <p className="text-lg font-semibold text-[#ffe0b3]">{formatPrice(item.bouquet.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(item.bouquet);
                      toast.success(`${item.bouquet.name} cartga qo'shildi`);
                    }}
                    className="rounded-lg bg-[#2a1b0f] px-3 py-1.5 text-sm text-[#ffd59a]"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeFavoriteBouquet(item.id);
                      toast.info(`${item.bouquet.name} favoritesdan olib tashlandi`);
                    }}
                    className="rounded-lg bg-[#3a1116] px-3 py-1.5 text-sm text-[#ffb1bd]"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "addresses") {
      return (
        <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <p className="font-cormorant text-4xl text-white">My Addresses</p>
          <p className="mt-2 text-[#d8beb8]">Address qo'shing, tahrirlang, o'chiring va primary qilib belgilang.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={addressForm.title}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Title (Home, Office...)"
              className="h-11 rounded-xl bg-[#1f0a0d] px-3 text-white outline-none"
            />
            <input
              value={addressForm.city}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="City"
              className="h-11 rounded-xl bg-[#1f0a0d] px-3 text-white outline-none"
            />
          </div>
          <input
            value={addressForm.address_line}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, address_line: event.target.value }))}
            placeholder="Address line"
            className="mt-3 h-11 w-full rounded-xl bg-[#1f0a0d] px-3 text-white outline-none"
          />
          <div className="mt-2 flex items-center justify-between rounded-xl bg-[#1f0a0d] px-3 py-2 text-sm text-[#e7c8c0]">
            <span>
              {addressForm.latitude && addressForm.longitude
                ? `Pin: ${addressForm.latitude.toFixed(5)}, ${addressForm.longitude.toFixed(5)}`
                : "Map pin tanlanmagan"}
            </span>
            <button type="button" onClick={() => setMapOpen(true)} className="rounded-lg bg-[#3a161b] px-3 py-1 text-[#ffd3ca]">
              Pick from map
            </button>
          </div>
          <textarea
            value={addressForm.notes}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Notes"
            className="mt-3 min-h-20 w-full rounded-xl bg-[#1f0a0d] px-3 py-2 text-white outline-none"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleAddressSubmit}
              disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-5 font-semibold text-white disabled:opacity-60"
            >
              {editingAddressId ? "Update Address" : "Add Address"}
            </button>
            {editingAddressId ? (
              <button type="button" onClick={resetAddressForm} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2a0f12] px-5 text-[#f3d6d0]">
                Cancel
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {isAddressesLoading ? <AddressCardsSkeleton /> : null}
            {!isAddressesLoading && !addresses.length ? <p className="text-[#d8beb8]">Hozircha address yo'q.</p> : null}
            {!isAddressesLoading && addresses.map((address: AddressOut) => (
              <article key={address.id} className="rounded-xl bg-[#16080a] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {address.title}{" "}
                      {address.is_primary ? (
                        <span className="ml-2 rounded-full bg-[#3a1d0f] px-2 py-0.5 text-xs text-[#ffd59a]">Primary</span>
                      ) : null}
                      {isSameCheckoutAddress(address, preferredCheckoutAddress) ? (
                        <span className="ml-2 rounded-full bg-[#10241a] px-2 py-0.5 text-xs text-[#9ef0c2]">Checkout</span>
                      ) : null}
                    </p>
                    <p className="text-[#e0c1ba]">{address.address_line}</p>
                    <p className="text-sm text-[#c4a39b]">{address.city ?? "City not set"}</p>
                    {address.notes ? <p className="mt-1 text-sm text-[#b7948d]">{address.notes}</p> : null}
                    {address.latitude !== null && address.longitude !== null ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-[#4b2326]">
                        <iframe
                          title={`${address.title} map preview`}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${address.longitude - 0.01}%2C${address.latitude - 0.01}%2C${address.longitude + 0.01}%2C${address.latitude + 0.01}&layer=mapnik&marker=${address.latitude}%2C${address.longitude}`}
                          className="h-32 w-full"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-[#4b2326] bg-[#120607] px-3 py-3 text-sm text-[#c4a39b]">
                        Map pin hali qo'yilmagan.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(address.id);
                        setAddressForm({
                          title: address.title,
                          address_line: address.address_line,
                          city: address.city ?? "",
                          notes: address.notes ?? "",
                          latitude: address.latitude ?? null,
                          longitude: address.longitude ?? null,
                        });
                      }}
                      className="rounded-lg bg-[#2a0f12] px-3 py-1 text-sm text-[#f3d6d0]"
                    >
                      Edit
                    </button>
                    {!address.is_primary ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await setPrimaryAddressMutation.mutateAsync(address.id);
                          toast.success("Primary address o'rnatildi");
                        }}
                        className="rounded-lg bg-[#2a1b0f] px-3 py-1 text-sm text-[#ffd59a]"
                      >
                        Set Primary
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setPreferredCheckoutAddress(address);
                        setPreferredCheckoutAddressState(getPreferredCheckoutAddress());
                        toast.success("Checkout uchun address tanlandi");
                      }}
                      className={`rounded-lg px-3 py-1 text-sm ${
                        isSameCheckoutAddress(address, preferredCheckoutAddress)
                          ? "bg-[#1c5038] text-white"
                          : "bg-[#10241a] text-[#9ef0c2]"
                      }`}
                    >
                      {isSameCheckoutAddress(address, preferredCheckoutAddress) ? "Selected for checkout" : "Use for checkout"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteAddressMutation.mutateAsync(address.id);
                        if (isSameCheckoutAddress(address, preferredCheckoutAddress)) {
                          clearPreferredCheckoutAddress();
                          setPreferredCheckoutAddressState(null);
                        }
                        toast.success("Address o'chirildi");
                        if (editingAddressId === address.id) resetAddressForm();
                      }}
                      className="rounded-lg bg-[#3a1116] px-3 py-1 text-sm text-[#ffb1bd]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "notifications") {
      return (
        <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <p className="font-cormorant text-4xl text-white">Notifications</p>
          <p className="mt-3 text-[#d8beb8]">Notification sozlamalari yaqin orada qo'shiladi.</p>
        </div>
      );
    }

    if (activeTab === "settings") {
      return (
        <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <p className="font-cormorant text-4xl text-white">Settings</p>
          <p className="mt-3 text-[#d8beb8]">Account settings bo'limi shu yerda bo'ladi.</p>
        </div>
      );
    }

    if (isOrdersLoading || isReviewsLoading) {
      return <ProfileDashboardSkeleton />;
    }

    return (
      <>
        <section className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <h1 className="font-cormorant text-6xl leading-none text-[#fff2ee]">Hello, {firstName} <span className="text-4xl">👋</span></h1>
          <p className="mt-2 text-lg text-[#d8beb8]">Welcome back! Here's what's happening with your account today.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-[#130708] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-18 w-18 items-center justify-center rounded-2xl bg-[#251007] text-4xl text-[#e8b478]">
                  <HiOutlineShoppingBagCard />
                </span>
                <div>
                  <p className="text-5xl font-semibold leading-none text-white">{orders.length}</p>
                  <p className="mt-1 text-2xl text-[#f1ddd8]">Orders</p>
                  <p className="text-lg text-[#b9958f]">Total Orders</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-[#130708] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-18 w-18 items-center justify-center rounded-2xl bg-[#21080f] text-4xl text-[#f0b38f]">
                  <HiOutlineHeartCard />
                </span>
                <div>
                  <p className="text-5xl font-semibold leading-none text-white">{favoriteItems.length}</p>
                  <p className="mt-1 text-2xl text-[#f1ddd8]">Favorites</p>
                  <p className="text-lg text-[#b9958f]">Saved Bouquets</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-[#130708] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-18 w-18 items-center justify-center rounded-2xl bg-[#1c0b07] text-4xl text-[#e8b478]">
                  <HiStar />
                </span>
                <div>
                  <p className="text-5xl font-semibold leading-none text-white">{myReviewsCount}</p>
                  <p className="mt-1 text-2xl text-[#f1ddd8]">Reviews</p>
                  <p className="text-lg text-[#b9958f]">Your Reviews</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-[#130708] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-18 w-18 items-center justify-center rounded-2xl bg-[#251007] text-4xl text-[#e8b478]">
                  <HiOutlineGift />
                </span>
                <div>
                  <p className="text-5xl font-semibold leading-none text-white">3</p>
                  <p className="mt-1 text-2xl text-[#f1ddd8]">Gift Cards</p>
                  <p className="text-lg text-[#b9958f]">Available</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <div className="flex items-center justify-between">
            <p className="font-cormorant text-4xl text-white">Recent Orders</p>
            <button type="button" onClick={() => setActiveTab("orders")} className="text-sm font-semibold text-[#ff6d84]">View All Orders</button>
          </div>
          <div className="mt-4 space-y-3">
            {!orders.length ? <p className="text-[#d8beb8]">Hozircha order yo'q.</p> : null}
            {orders.slice(0, 4).map((order) => (
              <article key={order.id} className="flex items-center justify-between rounded-xl bg-[#130708] p-3">
                <div className="flex items-center gap-3">
                  {order.items[0]?.bouquet_image ? (
                    <img
                      src={order.items[0].bouquet_image}
                      alt={order.items[0]?.bouquet_name ?? "Bouquet"}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#2a1014] text-xs text-[#d7b7b0]">
                      No image
                    </div>
                  )}
                  <div>
                  <p className="font-semibold text-white">{order.items[0]?.bouquet_name ?? "Bouquet"}</p>
                  <p className="text-sm text-[#c9a59e]">Order #{order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`inline-flex rounded-full border px-2 py-1 text-xs uppercase ${getOrderStatusMeta(order.status).className}`}>
                    {getOrderStatusMeta(order.status).label}
                  </p>
                  <p className="text-2xl font-semibold text-white">{formatPrice(order.total_price)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] bg-[linear-gradient(90deg,rgba(67,8,16,0.95),rgba(30,5,9,0.96))] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#3a1016] text-3xl text-[#ff5f79]"><HiGift /></span>
              <div>
                <p className="font-cormorant text-5xl text-white">Give $10, Get $10</p>
                <p className="text-[#d5b2ac]">Invite your friends and both get bonus after first order.</p>
              </div>
            </div>
            <button type="button" className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-6 font-semibold text-white">Invite Friends</button>
          </div>
        </section>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-transparent px-4 pb-14 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[250px_1fr_380px]">
        <aside className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-4">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-[#5a101a] text-white" : "text-[#f0d2cd] hover:bg-white/[0.06]"}`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-xl font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <button type="button" onClick={logout} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7485] to-[#df5065] text-lg font-semibold text-white">
              <HiArrowLeftOnRectangle /> Log Out
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-[#120607] p-4">
            <p className="font-cormorant text-4xl text-white">Need Help?</p>
            <p className="mt-2 text-[#d2b0aa]">Our support team is here to help you.</p>
            <button type="button" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2e0f13] font-semibold text-[#ffe3dd]">Contact Support</button>
          </div>
        </aside>

        <section className="space-y-5">{renderCenterContent()}</section>

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-5">
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-24 shrink-0">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-24 w-24 rounded-full object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2f1015] text-3xl font-bold">{userInitials}</div>}
                <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#af2338] text-white"><HiOutlineCamera /></button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)} />
              </div>
              <div>
                <p className="font-cormorant text-5xl leading-none text-white">{user?.full_name}</p>
                <p className="mt-2 text-[#d8beb8]">{user?.email}</p>
                <p className="text-[#d8beb8]">{user?.phone ?? "+998 __ ___ __ __"}</p>
                <p className="text-[#d8beb8]">Tashkent, Uzbekistan</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-5">
            <div className="flex items-center justify-between">
              <p className="font-cormorant text-4xl text-white">Account Completion</p>
              <p className="text-[#ceb1aa]">{profileCompletion}% Complete</p>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-[#35161a]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#ff4c6f] to-[#c7233f]" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-3 text-[#d8beb8]">Complete your profile to get personalized recommendations.</p>
            <button type="button" onClick={() => setActiveTab("profile")} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] font-semibold text-white">Complete Profile</button>
          </div>
          <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(52,8,16,0.96),rgba(18,4,6,0.96))] p-5">
            <div className="flex items-center justify-between">
              <p className="font-cormorant text-4xl text-[#f3d9a8]">Recommended Bouquets</p>
              <div className="flex items-center gap-1.5">
                {recommendedBouquets.slice(0, 5).map((bouquet, index) => (
                  <button
                    key={bouquet.id}
                    type="button"
                    onClick={() => setRecommendedIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      index === safeRecommendedIndex ? "bg-[#ff6580]" : "bg-[#6f3942]"
                    }`}
                    aria-label={`Show ${bouquet.name}`}
                  />
                ))}
              </div>
            </div>

            {recommendedQuery.isLoading ? <RecommendedBouquetSkeleton /> : null}

            {!recommendedQuery.isLoading && activeRecommended ? (
              <article className="mt-4 overflow-hidden rounded-xl bg-[#20090d]">
                <img
                  src={activeRecommended.image}
                  alt={activeRecommended.name}
                  className="h-44 w-full object-cover"
                />
                <div className="p-4">
                  <p className="font-cormorant text-3xl text-white">{activeRecommended.name}</p>
                  <p className="text-[#dfbcb1]">{activeRecommended.shop.name}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-3xl font-semibold text-[#ffe0b3]">
                      {formatPrice(activeRecommended.price)}
                    </p>
                    <Link
                      to={`/bouquets/${activeRecommended.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#3a1612] px-4 text-sm font-semibold text-[#ffe0b3]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </article>
            ) : null}

            {!recommendedQuery.isLoading && !activeRecommended ? (
              <div className="mt-4 rounded-xl bg-[#20090d] p-4 text-[#e8c5bb]">
                Tavsiya etiladigan bouquetlar hozircha yo'q.
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {mapOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[#100507] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-cormorant text-3xl text-white">Address Picker</p>
              <button type="button" onClick={() => setMapOpen(false)} className="rounded-full bg-[#2a0f12] px-3 py-1 text-[#ffd9d2]">
                Close
              </button>
            </div>
            <div ref={mapHostRef} className="h-[420px] w-full overflow-hidden rounded-xl" />
            <div className="mt-3 flex items-center justify-between text-sm text-[#cfafa8]">
              <span>Xaritada bosib manzil tanlang.</span>
              {isResolvingAddress ? <span>Address aniqlanmoqda...</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default Profile;
