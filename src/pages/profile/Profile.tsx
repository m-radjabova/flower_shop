import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  HiArrowLeftOnRectangle,
  HiTrash,
  HiOutlineGift,
  HiOutlineHeart as HiOutlineHeartCard,
  HiOutlineShoppingBag as HiOutlineShoppingBagCard,
  HiStar,
  HiOutlineCamera,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { changeMyPassword, deleteMyAvatar, getErrorMessage, updateMe, uploadMyAvatar } from "../../api/auth";
import { useFavoriteItems } from "../../hooks/useFavorites";
import useContextPro from "../../hooks/useContextPro";
import {
  useBouquets,
  useCreateAddress,
  useDeleteAddress,
  useMyAddresses,
  useMyOrders,
  useMyReferralSummary,
  useMyReviews,
  useSetPrimaryAddress,
  useUpdateAddress,
} from "../../hooks/useCatalog";
import type { Bouquet, OrderOut } from "../../types/catalog";
import { formatPrice } from "../../utils/catalog";
import { addToCart } from "../../utils/cart";
import { hasAnyRole } from "../../utils/roles";
import {
  clearPreferredCheckoutAddress,
  getPreferredCheckoutAddress,
  isSameCheckoutAddress,
  setPreferredCheckoutAddress,
  type StoredCheckoutAddress,
} from "../../utils/address";
import {
  ProfileDashboardSkeleton,
  RecommendedBouquetSkeleton,
} from "../../components/PageSkeletons";
import AddressesTab from "./components/AddressesTab";
import FavoritesTab from "./components/FavoritesTab";
import OrdersTab from "./components/OrdersTab";
import { getOrderStatusMeta, getRepeatOrderAvailability, type ProfileTab, tabs } from "./components/profileHelpers";
import SettingsTab from "./components/SettingsTab";
import { HiGift } from "react-icons/hi2";

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
  invalidateSize: (options?: { pan?: boolean; animate?: boolean }) => void;
  remove: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
};

type AccountFormValues = {
  full_name: string;
  email: string;
  phone: string;
};

type PasswordFormValues = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type AddressFormValues = {
  title: string;
  address_line: string;
  city: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
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


function buildRepeatBouquet(order: OrderOut, item: OrderOut["items"][number]): Bouquet {
  return {
    id: item.bouquet_id ?? item.id,
    shop_id: order.shop_id,
    category_id: null,
    name: item.bouquet_name,
    slug: item.bouquet_id ?? item.id,
    description: order.note ?? "Reordered from your previous purchase.",
    compound: null,
    price: item.price,
    old_price: null,
    image: item.bouquet_image ?? "/logo2.png",
    images: item.bouquet_image ? [item.bouquet_image] : ["/logo2.png"],
    size: null,
    stock: 99,
    status: "active",
    rating: "0",
    reviews_count: 0,
    created_at: order.created_at,
    updated_at: order.updated_at,
    shop: {
      id: order.shop_id,
      name: "Flower Shop",
      slug: order.shop_id,
      logo: null,
      city: null,
      rating: "0",
      reviews_count: 0,
      status: "active",
    },
    category: null,
  };
}

function Profile() {
  const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_AVATAR_SIZE_BYTES = 6 * 1024 * 1024;
  const {
    state: { user },
    dispatch,
    logout,
  } = useContextPro();

  const ordersQuery = useMyOrders();
  const addressesQuery = useMyAddresses();
  const myReviewsQuery = useMyReviews();
  const referralQuery = useMyReferralSummary();
  const favoriteItems = useFavoriteItems();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setPrimaryAddressMutation = useSetPrimaryAddress();
  const recommendedQuery = useBouquets({ limit: 8 });

  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [recommendedIndex, setRecommendedIndex] = useState(0);
  const [isAvatarSubmitting, setIsAvatarSubmitting] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<string>("");
  const [avatarError, setAvatarError] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [preferredCheckoutAddress, setPreferredCheckoutAddressState] = useState<StoredCheckoutAddress | null>(() => getPreferredCheckoutAddress());
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const accountForm = useForm<AccountFormValues>({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
    },
  });
  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });
  const addressForm = useForm<AddressFormValues>({
    defaultValues: {
      title: "",
      address_line: "",
      city: "",
      notes: "",
      latitude: null,
      longitude: null,
    },
  });
  const addressLatitude = addressForm.watch("latitude");
  const addressLongitude = addressForm.watch("longitude");

  const orders = ordersQuery.data ?? [];
  const addresses = addressesQuery.data ?? [];
  const myReviewsCount = myReviewsQuery.data?.length ?? 0;
  const referralSummary = referralQuery.data;
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
    if (user?.avatar_url?.trim()) done += 25;
    return done;
  }, [user?.full_name, user?.email, user?.phone, user?.avatar_url]);

  const userInitials = user?.full_name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") ?? "U";

  const firstName = user?.full_name?.split(/\s+/)[0] ?? "Guest";
  const canOpenAdminDashboard = hasAnyRole(user, ["admin"]);
  const referralLink = useMemo(() => {
    if (!referralSummary?.referral_code || typeof window === "undefined") return "";
    return `${window.location.origin}/register?ref=${referralSummary.referral_code}`;
  }, [referralSummary?.referral_code]);

  useEffect(() => {
    accountForm.reset({
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
  }, [accountForm, user?.full_name, user?.email, user?.phone]);

  useEffect(() => {
    if (!selectedAvatarFile) {
      setAvatarPreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedAvatarFile);
    setAvatarPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedAvatarFile]);

  const resetAvatarSelection = () => {
    setSelectedAvatarFile(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAvatarSelect = (file: File | null) => {
    if (!file) return;

    setAvatarStatus("");
    setAvatarError("");

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      const message = "Faqat JPG, PNG, WEBP yoki GIF rasm yuklash mumkin";
      setAvatarError(message);
      toast.error(message);
      resetAvatarSelection();
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      const message = "Avatar hajmi 6MB dan oshmasligi kerak";
      setAvatarError(message);
      toast.error(message);
      resetAvatarSelection();
      return;
    }

    setSelectedAvatarFile(file);
    setAvatarStatus("Preview tayyor. Tasdiqlasangiz upload qilinadi.");
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) return;

    setIsAvatarSubmitting(true);
    setAvatarStatus("Avatar yuklanmoqda...");
    try {
      const updatedUser = await uploadMyAvatar(selectedAvatarFile);
      dispatch({ type: "SET_USER", payload: updatedUser });
      resetAvatarSelection();
      setAvatarStatus("Avatar muvaffaqiyatli yangilandi");
      toast.success("Avatar yangilandi");
    } catch (error) {
      const message = getErrorMessage(error, "Avatar yuklashda xatolik");
      setAvatarStatus("");
      setAvatarError(message);
      toast.error(message);
    } finally {
      setIsAvatarSubmitting(false);
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarError("");
    setIsAvatarSubmitting(true);
    setAvatarStatus("Avatar o'chirilmoqda...");
    try {
      const updatedUser = await deleteMyAvatar();
      dispatch({ type: "SET_USER", payload: updatedUser });
      setAvatarStatus("Avatar o'chirildi");
      toast.success("Avatar o'chirildi");
    } catch (error) {
      const message = getErrorMessage(error, "Avatarni o'chirib bo'lmadi");
      setAvatarStatus("");
      setAvatarError(message);
      toast.error(message);
    } finally {
      setIsAvatarSubmitting(false);
    }
  };

  const handleInviteFriends = async () => {
    if (!referralLink) {
      toast.info("Referral link tayyor emas");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Muslima Boutique Referral",
          text: "Sign up with my referral link and after your first order we both get a $10 bonus.",
          url: referralLink,
        });
        return;
      }

      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link nusxalandi");
    } catch {
      toast.error("Referral linkni ulashib bo'lmadi");
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralSummary?.referral_code) {
      toast.info("Referral code hali tayyor emas");
      return;
    }

    try {
      await navigator.clipboard.writeText(referralSummary.referral_code);
      toast.success("Referral code nusxalandi");
    } catch {
      toast.error("Referral code nusxalanmadi");
    }
  };

  const handleAccountSave = accountForm.handleSubmit(async (values) => {
    if (!values.full_name.trim() || !values.email.trim()) {
      toast.error("Full name va email majburiy");
      return;
    }

    try {
      const updatedUser = await updateMe({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
      });
      dispatch({ type: "SET_USER", payload: updatedUser });
      toast.success("Profil ma'lumotlari saqlandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Profilni saqlab bo'lmadi"));
    }
  });

  const handlePasswordSave = passwordForm.handleSubmit(async (values) => {
    if (!values.current_password || !values.new_password || !values.confirm_password) {
      toast.error("Parol maydonlarini to'liq to'ldiring");
      return;
    }

    if (values.new_password.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }

    if (values.new_password !== values.confirm_password) {
      toast.error("Yangi parollar mos emas");
      return;
    }

    try {
      await changeMyPassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      passwordForm.reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      toast.success("Parol muvaffaqiyatli yangilandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Parolni yangilab bo'lmadi"));
    }
  });

  const handleRepeatOrder = (order: OrderOut) => {
    const repeatAvailability = getRepeatOrderAvailability(order.created_at);

    if (!repeatAvailability.canRepeat) {
      toast.info("Repeat order faqat buyurtmadan keyingi 2 soat ichida mumkin");
      return;
    }

    const firstItem = order.items[0];

    if (!firstItem) {
      toast.info("Bu orderda qayta qo'shish uchun mahsulot topilmadi");
      return;
    }

    addToCart(buildRepeatBouquet(order, firstItem), firstItem.quantity);
    if (order.items.length > 1) {
      toast.success(`${firstItem.bouquet_name} cartga qo'shildi. Cart hozircha bitta bouquet bilan ishlaydi.`);
      return;
    }
    toast.success(`${firstItem.bouquet_name} cartga qo'shildi`);
  };

  const resetAddressForm = () => {
    addressForm.reset({ title: "", address_line: "", city: "", notes: "", latitude: null, longitude: null });
    setEditingAddressId(null);
  };

  const handleAddressSubmit = addressForm.handleSubmit(async (values) => {
    if (!values.title.trim() || !values.address_line.trim()) {
      toast.error("Title va address majburiy");
      return;
    }
    try {
      if (editingAddressId) {
        await updateAddressMutation.mutateAsync({
          addressId: editingAddressId,
          payload: {
            title: values.title.trim(),
            address_line: values.address_line.trim(),
            city: values.city.trim() || undefined,
            notes: values.notes.trim() || undefined,
            latitude: values.latitude ?? undefined,
            longitude: values.longitude ?? undefined,
          },
        });
        toast.success("Address yangilandi");
      } else {
        await createAddressMutation.mutateAsync({
          title: values.title.trim(),
          address_line: values.address_line.trim(),
          city: values.city.trim() || undefined,
          notes: values.notes.trim() || undefined,
          latitude: values.latitude ?? undefined,
          longitude: values.longitude ?? undefined,
          is_primary: addresses.length === 0,
        });
        toast.success("Address qo'shildi");
      }
      resetAddressForm();
    } catch (error) {
      toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Address saqlanmadi");
    }
  });

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
    if (activeTab !== "addresses" || !mapHostRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: number | null = null;

    const setupMap = async () => {
      try {
        await injectLeafletAssets();
        if (cancelled || !window.L || !mapHostRef.current) return;

        const initial: [number, number] = [
          addressLatitude ?? TASHKENT_COORDS[0],
          addressLongitude ?? TASHKENT_COORDS[1],
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

        const refreshMapSize = () => {
          map.invalidateSize({ pan: false, animate: false });
        };

        window.requestAnimationFrame(() => {
          if (!cancelled) refreshMapSize();
        });

        resizeTimer = window.setTimeout(() => {
          if (!cancelled) refreshMapSize();
        }, 180);

        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            refreshMapSize();
          });
          resizeObserver.observe(mapHostRef.current);
        }

        map.on("click", async ({ latlng }) => {
          const coords: [number, number] = [latlng.lat, latlng.lng];
          marker.setLatLng(coords);
          addressForm.setValue("latitude", coords[0]);
          addressForm.setValue("longitude", coords[1]);
          setIsResolvingAddress(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = (await res.json()) as { display_name?: string; address?: { city?: string; town?: string; village?: string } };
            if (data.display_name) {
              addressForm.setValue("address_line", data.display_name);
              if (data.address?.city ?? data.address?.town ?? data.address?.village) {
                addressForm.setValue("city", data.address?.city ?? data.address?.town ?? data.address?.village ?? "");
              }
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
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [activeTab, addressForm, addressLatitude, addressLongitude]);

  const renderCenterContent = () => {
    if (activeTab === "orders") {
      return (
        <OrdersTab
          expandedOrderId={expandedOrderId}
          isLoading={isOrdersLoading}
          onRepeatOrder={handleRepeatOrder}
          onToggleExpanded={(orderId) => setExpandedOrderId((current) => current === orderId ? null : orderId)}
          orders={orders}
        />
      );
    }

    if (activeTab === "favorites") {
      return <FavoritesTab favoriteItems={favoriteItems} />;
    }

    if (activeTab === "addresses") {
      return (
        <AddressesTab
          addresses={addresses}
          createPending={createAddressMutation.isPending}
          editingAddressId={editingAddressId}
          isAddressesLoading={isAddressesLoading}
          isResolvingAddress={isResolvingAddress}
          isSameCheckoutAddress={isSameCheckoutAddress}
          mapHostRef={mapHostRef}
          addressForm={addressForm}
          onAddressSubmit={handleAddressSubmit}
          onDeleteAddress={async (address) => {
            await deleteAddressMutation.mutateAsync(address.id);
            if (isSameCheckoutAddress(address, preferredCheckoutAddress)) {
              clearPreferredCheckoutAddress();
              setPreferredCheckoutAddressState(null);
            }
            toast.success("Address o'chirildi");
            if (editingAddressId === address.id) resetAddressForm();
          }}
          onEditAddress={(address) => {
            setEditingAddressId(address.id);
            addressForm.reset({
              title: address.title,
              address_line: address.address_line,
              city: address.city ?? "",
              notes: address.notes ?? "",
              latitude: address.latitude ?? null,
              longitude: address.longitude ?? null,
            });
          }}
          onResetAddressForm={resetAddressForm}
          onSetCheckoutAddress={(address) => {
            setPreferredCheckoutAddress(address);
            setPreferredCheckoutAddressState(getPreferredCheckoutAddress());
            toast.success("Checkout uchun address tanlandi");
          }}
          onSetPrimaryAddress={async (addressId) => {
            await setPrimaryAddressMutation.mutateAsync(addressId);
            toast.success("Primary address o'rnatildi");
          }}
          preferredCheckoutAddress={preferredCheckoutAddress}
          updatePending={updateAddressMutation.isPending}
        />
      );
    }

    if (activeTab === "settings") {
      return (
        <SettingsTab
          accountForm={accountForm}
          onAccountSave={handleAccountSave}
          onManageAddresses={() => setActiveTab("addresses")}
          onPasswordSave={handlePasswordSave}
          onResetAccountForm={() => accountForm.reset({
            full_name: user?.full_name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
          })}
          passwordForm={passwordForm}
          profileCompletion={profileCompletion}
        />
      );
    }

    if (isOrdersLoading || isReviewsLoading) {
      return <ProfileDashboardSkeleton />;
    }

    return (
      <>
        <section className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
          <h1 className="font-cormorant text-[4.1rem] leading-none text-[#fff2ee] sm:text-[4.7rem]">Hello, {firstName} <span className="text-[2.7rem] sm:text-[3.1rem]">👋</span></h1>
          <p className="mt-2 text-base text-[#d8beb8] sm:text-lg">Welcome back! Here's what's happening with your account today.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                value: orders.length,
                hoverText: `${orders.length} Orders`,
                icon: <HiOutlineShoppingBagCard />,
                iconClassName: "bg-[#251007] text-[#e8b478]",
              },
              {
                value: favoriteItems.length,
                hoverText: `${favoriteItems.length} Favorites`,
                icon: <HiOutlineHeartCard />,
                iconClassName: "bg-[#21080f] text-[#f0b38f]",
              },
              {
                value: myReviewsCount,
                hoverText: `${myReviewsCount} Reviews`,
                icon: <HiStar />,
                iconClassName: "bg-[#1c0b07] text-[#e8b478]",
              },
              {
                value: 3,
                hoverText: "3 Gift Cards",
                icon: <HiOutlineGift />,
                iconClassName: "bg-[#251007] text-[#e8b478]",
              },
            ].map((stat) => (
              <div
                key={stat.hoverText}
                className="group relative flex min-h-[100px] items-center justify-center overflow-visible rounded-[1.6rem] border border-[#3a171c] bg-[linear-gradient(180deg,rgba(24,7,9,0.98),rgba(15,4,6,0.96))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#6a3941]"
              >
                <span
                  className={`inline-flex h-20 w-20 items-center justify-center rounded-[2rem] text-6xl shadow-[0_20px_40px_rgba(0,0,0,0.22)] transition-transform duration-300 group-hover:scale-105 ${stat.iconClassName}`}
                >
                  {stat.icon}
                </span>

                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-xl border border-[#6a4349] bg-[rgba(40,12,18,0.98)] px-4 py-2 text-sm font-medium text-[#f7dfd9] opacity-0 shadow-[0_14px_32px_rgba(0,0,0,0.28)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {stat.hoverText}
                </div>
              </div>
            ))}
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
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex flex-1 items-start gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#3a1016] text-3xl text-[#ff5f79]"><HiGift /></span>
              <div className="flex-1">
                <p className="font-cormorant text-5xl text-white">Give $10, Get $10</p>
                <p className="text-[#d5b2ac]">Invite your friends and both get bonus after first order.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-[#2a0e14] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#bc8e8d]">Bonus balance</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {referralSummary ? formatPrice(referralSummary.bonus_balance) : "$0.00"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#2a0e14] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#bc8e8d]">Successful</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{referralSummary?.successful_referrals ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-[#2a0e14] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#bc8e8d]">Pending</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{referralSummary?.pending_referrals ?? 0}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-[#220b10] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#bc8e8d]">Your referral code</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold tracking-[0.18em] text-[#ffe4dd]">
                      {referralSummary?.referral_code ?? "Loading..."}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyReferralCode}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-[#3a1419] px-3 text-sm font-semibold text-[#ffd9d2]"
                    >
                      Copy code
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-[#caa49d]">
                    Share link: <span className="break-all text-[#f7ddd7]">{referralLink || "Preparing link..."}</span>
                  </p>
                </div>
                {referralSummary?.referred_friends.length ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-[#220b10] px-4 py-3">
                    <p className="text-sm font-semibold text-white">Recent invited friends</p>
                    <div className="mt-3 space-y-2">
                      {referralSummary.referred_friends.map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#2d1015] px-3 py-2">
                          <div>
                            <p className="font-medium text-[#fff1ed]">{friend.full_name}</p>
                            <p className="text-sm text-[#caa49d]">{friend.email}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${friend.reward_granted ? "bg-[#143424] text-[#9ef0c2]" : "bg-[#3a2610] text-[#ffd59a]"}`}>
                            {friend.reward_granted ? "Rewarded" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={handleInviteFriends} className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-6 font-semibold text-white">
              Invite Friends
            </button>
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

          {canOpenAdminDashboard ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <Link
                to="/admin"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#8b5b3d] bg-[#1a0a0c] font-semibold text-[#f3c890] transition hover:border-[#c98f61] hover:bg-[#221013]"
              >
                Open Admin Dashboard
              </Link>
            </div>
          ) : null}

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative mx-auto h-24 w-24 shrink-0 sm:mx-0 sm:h-20 sm:w-20">
                {avatarPreviewUrl ? (
                  <img src={avatarPreviewUrl} alt="Avatar preview" className="h-24 w-24 rounded-full object-cover ring-2 ring-[#ff7f93] sm:h-20 sm:w-20" />
                ) : user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="h-24 w-24 rounded-full object-cover sm:h-20 sm:w-20" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2f1015] text-3xl font-bold sm:h-20 sm:w-20 sm:text-2xl">{userInitials}</div>
                )}
                {isAvatarSubmitting ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-xs font-semibold text-white">
                    Loading...
                  </div>
                ) : null}
                <button type="button" disabled={isAvatarSubmitting} onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#af2338] text-white shadow-[0_8px_20px_rgba(175,35,56,0.35)] disabled:opacity-60 sm:h-8 sm:w-8"><HiOutlineCamera /></button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatarSelect(event.target.files?.[0] ?? null)} />
              </div>
              <div className="min-w-0 flex-1 text-center sm:pt-0.5 sm:text-left">
                <div>
                  <p className="font-cormorant text-[3rem] leading-[0.92] text-white sm:text-[3.35rem]">{user?.full_name}</p>
                </div>

                <div className="mt-2 space-y-1 text-[#dcc0bb]">
                  <p className="truncate text-base sm:text-[1.02rem]">{user?.email}</p>
                  <p className="text-base sm:text-[1.02rem]">{user?.phone ?? "+998 __ ___ __ __"}</p>
                  <p className="text-base sm:text-[1.02rem]">Tashkent, Uzbekistan</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.82rem] uppercase tracking-[0.18em] text-[#bfa19a] sm:justify-start">
                  <span>JPG, PNG, WEBP, GIF</span>
                  <span className="hidden h-1 w-1 rounded-full bg-[#7d5652] sm:block" />
                  <span>Max 6MB</span>
                </div>

                {selectedAvatarFile ? (
                  <p className="mt-2 text-sm text-[#f7ddd7]">
                    Tanlangan fayl: {selectedAvatarFile.name}
                  </p>
                ) : null}
                {avatarStatus ? <p className="mt-2 rounded-xl border border-[#23543d] bg-[#10291e] px-3 py-2 text-sm text-[#9ef0c2]">{avatarStatus}</p> : null}
                {avatarError ? <p className="mt-2 rounded-xl border border-[#6f2d39] bg-[#2c0f15] px-3 py-2 text-sm text-[#ff9eae]">{avatarError}</p> : null}
                {selectedAvatarFile ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={isAvatarSubmitting}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#a31528] px-5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(163,21,40,0.22)] transition hover:brightness-105 disabled:opacity-60"
                    >
                      Save avatar
                    </button>
                    <button
                      type="button"
                      onClick={resetAvatarSelection}
                      disabled={isAvatarSubmitting}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-transparent px-4 text-sm font-medium text-[#ffd4cd] transition hover:bg-white/[0.04] disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : user?.avatar_url ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isAvatarSubmitting}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#a31528] px-5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(163,21,40,0.22)] transition hover:brightness-105 disabled:opacity-60"
                    >
                      Change avatar
                    </button>
                    <button
                      type="button"
                      onClick={handleAvatarDelete}
                      disabled={isAvatarSubmitting}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-1 text-sm font-medium text-[#cfa7a1] transition hover:text-[#ffd4cd] disabled:opacity-60"
                    >
                      <HiTrash />
                      Remove avatar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isAvatarSubmitting}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#a31528] px-5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(163,21,40,0.22)] transition hover:brightness-105 disabled:opacity-60"
                  >
                    Upload avatar
                  </button>
                )}
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

    </main>
  );
}

export default Profile;
