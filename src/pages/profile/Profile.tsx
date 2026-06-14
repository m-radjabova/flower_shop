import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  useMyLatestShopApplication,
  useMyReviews,
  useSetPrimaryAddress,
  useUpdateAddress,
} from "../../hooks/useCatalog";
import { useMyImportantDates } from "../../hooks/useImportantDates";
import type { Bouquet, OrderOut } from "../../types/catalog";
import { formatPrice } from "../../utils/catalog";
import { CART_AUTH_REQUIRED_MESSAGE, CART_SINGLE_BOUQUET_MESSAGE, addToCart } from "../../utils/cart";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DETAIL_MAP_ZOOM,
  normalizeCoordinates,
  reverseGeocode,
} from "../../utils/location";
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
import ImportantDatesPanel, { UpcomingImportantDatesCard } from "./components/ImportantDatesPanel";
import { getOrderStatusMeta, getRepeatOrderAvailability, getTabs, type ProfileTab } from "./components/profileHelpers";
import SettingsTab from "./components/SettingsTab";
import { HiGift } from "react-icons/hi2";

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
  remove?: () => void;
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
    size_options: item.selected_size ? [item.selected_size] : [],
    addon_options: item.selected_addons ?? [],
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
      instagram: null,
      telegram: null,
      rating: "0",
      reviews_count: 0,
      is_verified: false,
      status: "active",
    },
    category: null,
  };
}

function Profile() {
  const { t } = useTranslation();
  const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_AVATAR_SIZE_BYTES = 6 * 1024 * 1024;
  const {
    state: { user },
    dispatch,
    logout,
  } = useContextPro();
  const isOwnerAccount = hasAnyRole(user, ["owner"]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const shouldLoadProfileDashboard = !isOwnerAccount && activeTab === "profile";
  const shouldLoadOrders = !isOwnerAccount && (activeTab === "profile" || activeTab === "orders");
  const shouldLoadAddresses = !isOwnerAccount && activeTab === "addresses";
  const shouldLoadImportantDates = !isOwnerAccount && (activeTab === "profile" || activeTab === "settings");
  const shouldLoadReviews = !isOwnerAccount && activeTab === "profile";
  const shouldLoadReferral = !isOwnerAccount && activeTab === "profile";
  const shouldLoadLatestShopApplication = !isOwnerAccount;

  const ordersQuery = useMyOrders({ enabled: shouldLoadOrders });
  const addressesQuery = useMyAddresses({ enabled: shouldLoadAddresses });
  const importantDatesQuery = useMyImportantDates({ enabled: shouldLoadImportantDates });
  const myReviewsQuery = useMyReviews({ enabled: shouldLoadReviews });
  const referralQuery = useMyReferralSummary({ enabled: shouldLoadReferral });
  const favoriteItems = useFavoriteItems();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setPrimaryAddressMutation = useSetPrimaryAddress();
  const recommendedQuery = useBouquets({ limit: 8 });
  const [recommendedIndex, setRecommendedIndex] = useState(0);
  const [isAvatarSubmitting, setIsAvatarSubmitting] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<string>("");
  const [avatarError, setAvatarError] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [preferredCheckoutAddress, setPreferredCheckoutAddressState] = useState<StoredCheckoutAddress | null>(() => getPreferredCheckoutAddress());
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const orderSnapshotRef = useRef<Record<string, string>>({});
  const highlightTimeoutRef = useRef<number | null>(null);
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

  const tabsMemo = useMemo(() => getTabs(t), [t]);
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
  const visibleTabs = isOwnerAccount ? tabsMemo.filter((tab) => tab.key === "settings") : tabsMemo;

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);
  const importantDates = useMemo(() => importantDatesQuery.data ?? [], [importantDatesQuery.data]);
  const myReviewsCount = myReviewsQuery.data?.length ?? 0;
  const referralSummary = referralQuery.data;
  const latestShopApplicationQuery = useMyLatestShopApplication({ enabled: shouldLoadLatestShopApplication });
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
  const canOpenOwnerDashboard = isOwnerAccount;
  const latestShopApplication = latestShopApplicationQuery.data;
  const referralLink = useMemo(() => {
    if (!referralSummary?.referral_code || typeof window === "undefined") return "";
    return `${window.location.origin}/register?ref=${referralSummary.referral_code}`;
  }, [referralSummary?.referral_code]);
  const referralRewardAmount = referralSummary?.reward_amount ?? "$10.00";
  const referralJourney = [
    {
      title: t("profile.referralStepShareTitle"),
      description: t("profile.referralStepShareDesc"),
    },
    {
      title: t("profile.referralStepRegisterTitle"),
      description: t("profile.referralStepRegisterDesc"),
    },
    {
      title: t("profile.referralStepRewardTitle"),
      description: t("profile.referralStepRewardDesc"),
    },
  ];

  useEffect(() => {
    const nextSnapshot = Object.fromEntries(
      orders.map((order) => [order.id, `${order.updated_at}|${order.status}|${order.payment_status}`]),
    );

    if (Object.keys(orderSnapshotRef.current).length > 0) {
      const changedOrder = orders.find((order) => orderSnapshotRef.current[order.id] !== nextSnapshot[order.id]);
      if (changedOrder) {
        setHighlightedOrderId(changedOrder.id);
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          setHighlightedOrderId((current) => (current === changedOrder.id ? null : current));
          highlightTimeoutRef.current = null;
        }, 3500);
      }
    }

    orderSnapshotRef.current = nextSnapshot;
  }, [orders]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    accountForm.reset({
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
  }, [accountForm, user?.full_name, user?.email, user?.phone]);

  useEffect(() => {
    if (isOwnerAccount) {
      setActiveTab("settings");
    }
  }, [isOwnerAccount]);

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
      const message = t("profile.avatarTypeError");
      setAvatarError(message);
      toast.error(message);
      resetAvatarSelection();
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      const message = t("profile.avatarSizeError");
      setAvatarError(message);
      toast.error(message);
      resetAvatarSelection();
      return;
    }

    setSelectedAvatarFile(file);
    setAvatarStatus(t("profile.avatarReady"));
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) return;

    setIsAvatarSubmitting(true);
    setAvatarStatus(t("profile.avatarUploading"));
    try {
      const updatedUser = await uploadMyAvatar(selectedAvatarFile);
      dispatch({ type: "SET_USER", payload: updatedUser });
      resetAvatarSelection();
      setAvatarStatus(t("profile.avatarUploaded"));
      toast.success(t("profile.avatarUploaded"));
    } catch (error) {
      const message = getErrorMessage(error, t("profile.avatarUploadError"));
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
    setAvatarStatus(t("profile.avatarDeleting"));
    try {
      const updatedUser = await deleteMyAvatar();
      dispatch({ type: "SET_USER", payload: updatedUser });
      setAvatarStatus(t("profile.avatarDeleted"));
      toast.success(t("profile.avatarDeleted"));
    } catch (error) {
      const message = getErrorMessage(error, t("profile.avatarDeleteError"));
      setAvatarStatus("");
      setAvatarError(message);
      toast.error(message);
    } finally {
      setIsAvatarSubmitting(false);
    }
  };

  const handleInviteFriends = async () => {
    if (!referralLink) {
      toast.info(t("profile.referralNotReady"));
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: t("profile.referralTitle"),
          text: t("profile.referralShareText"),
          url: referralLink,
        });
        return;
      }

      await navigator.clipboard.writeText(referralLink);
      toast.success(t("profile.referralLinkCopied"));
    } catch {
      toast.error(t("profile.referralLinkError"));
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralSummary?.referral_code) {
      toast.info(t("profile.referralNotReady"));
      return;
    }

    try {
      await navigator.clipboard.writeText(referralSummary.referral_code);
      toast.success(t("profile.referralCodeCopied"));
    } catch {
      toast.error(t("profile.referralCodeError"));
    }
  };

  const handleAccountSave = accountForm.handleSubmit(async (values) => {
    if (!values.full_name.trim() || !values.email.trim()) {
      toast.error(t("profile.profileRequired"));
      return;
    }

    try {
      const updatedUser = await updateMe({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
      });
      dispatch({ type: "SET_USER", payload: updatedUser });
      toast.success(t("profile.profileSaved"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("profile.profileSaveError")));
    }
  });

  const handlePasswordSave = passwordForm.handleSubmit(async (values) => {
    if (!values.current_password || !values.new_password || !values.confirm_password) {
      toast.error(t("profile.passwordFieldsRequired"));
      return;
    }

    if (values.new_password.length < 6) {
      toast.error(t("profile.newPasswordPlaceholder"));
      return;
    }

    if (values.new_password !== values.confirm_password) {
      toast.error(t("profile.passwordMismatch"));
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
      toast.success(t("profile.passwordUpdated"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("profile.passwordUpdateError")));
    }
  });

  const handleRepeatOrder = (order: OrderOut) => {
    const repeatAvailability = getRepeatOrderAvailability(order.created_at);

    if (!repeatAvailability.canRepeat) {
      toast.info(t("profile.repeatOrderExpired"));
      return;
    }

    const firstItem = order.items[0];

    if (!firstItem) {
      toast.info(t("profile.repeatOrderEmpty"));
      return;
    }

    const result = addToCart(buildRepeatBouquet(order, firstItem), firstItem.quantity);
    if (!result.ok) {
      toast.info(result.reason === "auth_required" ? CART_AUTH_REQUIRED_MESSAGE : CART_SINGLE_BOUQUET_MESSAGE);
      return;
    }
    if (order.items.length > 1) {
      toast.success(t("profile.repeatOrderMultiple", { name: firstItem.bouquet_name }));
      return;
    }
    toast.success(t("profile.repeatOrderAdded", { name: firstItem.bouquet_name }));
  };

  const resetAddressForm = () => {
    addressForm.reset({ title: "", address_line: "", city: "", notes: "", latitude: null, longitude: null });
    setEditingAddressId(null);
  };

  const handleAddressSubmit = addressForm.handleSubmit(async (values) => {
    if (!values.title.trim() || !values.address_line.trim()) {
      toast.error(t("profile.addressFieldsRequired"));
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
        toast.success(t("profile.addressUpdated"));
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
        toast.success(t("profile.addressAdded"));
      }
      resetAddressForm();
    } catch (error) {
      toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? t("profile.addressSaveError"));
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

        const hasSelectedCoordinates = addressLatitude !== null && addressLongitude !== null;
        const initial: [number, number] = hasSelectedCoordinates
          ? [addressLatitude, addressLongitude]
          : DEFAULT_MAP_CENTER;
        const map = window.L.map(mapHostRef.current).setView(initial, hasSelectedCoordinates ? 12 : DEFAULT_MAP_ZOOM);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        let marker = hasSelectedCoordinates
          ? window.L.marker(initial, {
            icon: window.L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            }),
          }).addTo(map)
          : null;

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
          const coords = normalizeCoordinates(latlng.lat, latlng.lng);
          if (!marker && window.L) {
            marker = window.L.marker(coords, {
              icon: window.L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
              }),
            }).addTo(map);
          } else {
            marker?.setLatLng(coords);
          }
          map.setView(coords, DETAIL_MAP_ZOOM);
          addressForm.setValue("latitude", coords[0]);
          addressForm.setValue("longitude", coords[1]);
          setIsResolvingAddress(true);
          try {
            const data = await reverseGeocode(coords[0], coords[1]);
            if (data.displayName) {
              addressForm.setValue("address_line", data.displayName);
              if (data.city) {
                addressForm.setValue("city", data.city);
              }
            }
          } finally {
            setIsResolvingAddress(false);
          }
        });
      } catch {
      toast.error(t("profile.mapLoadError"));
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
  }, [activeTab, addressForm, addressLatitude, addressLongitude, t]);

  const renderCenterContent = () => {
    if (isOwnerAccount) {
      return (
        <div className="space-y-5">
          <SettingsTab
            accountForm={accountForm}
            canManageAddresses={!isOwnerAccount}
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
        </div>
      );
    }

    if (activeTab === "settings") {
      return (
        <div className="space-y-5">
          <SettingsTab
            accountForm={accountForm}
            canManageAddresses
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
          <ImportantDatesPanel
            dates={importantDates}
            isLoading={importantDatesQuery.isLoading}
          />
        </div>
      );
    }

    if (activeTab === "orders") {
      return (
        <OrdersTab
          expandedOrderId={expandedOrderId}
          highlightedOrderId={highlightedOrderId}
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
            toast.success(t("profile.addressDeleted"));
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
            toast.success(t("profile.selectedForCheckout"));
          }}
          onSetPrimaryAddress={async (addressId) => {
            await setPrimaryAddressMutation.mutateAsync(addressId);
            toast.success(t("profile.primaryLabel"));
          }}
          preferredCheckoutAddress={preferredCheckoutAddress}
          updatePending={updateAddressMutation.isPending}
        />
      );
    }

    if (shouldLoadProfileDashboard && (isOrdersLoading || isReviewsLoading)) {
      return <ProfileDashboardSkeleton />;
    }

    return (
      <div className="space-y-5">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0a0f] via-[#200e14] to-[#15080c] p-4 sm:p-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff4d6d]/5 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#c7233f]/5 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-4xl">👋</span>
              <h1 className="font-cormorant text-[1.8rem] leading-tight text-white sm:text-[3.5rem]">
                Hello, {firstName}
              </h1>
            </div>
            <p className="mt-1 max-w-lg text-sm text-[#c4a39b] sm:mt-2 sm:text-lg">
              Welcome back! Here's what's happening with your account today.
            </p>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 sm:grid-cols-4">
              {[
                {
                  value: orders.length,
                  label: "Orders",
                  icon: <HiOutlineShoppingBagCard className="text-xl" />,
                  gradient: "from-[#2a1014] to-[#1a0809]",
                  iconBg: "bg-[#3a161c]",
                  iconText: "text-[#ff8fa3]",
                },
                {
                  value: favoriteItems.length,
                  label: "Favorites",
                  icon: <HiOutlineHeartCard className="text-xl" />,
                  gradient: "from-[#1a0f14] to-[#12080c]",
                  iconBg: "bg-[#2d1422]",
                  iconText: "text-[#e88bdf]",
                },
                {
                  value: myReviewsCount,
                  label: "Reviews",
                  icon: <HiStar className="text-xl" />,
                  gradient: "from-[#1c1408] to-[#120d05]",
                  iconBg: "bg-[#2e200c]",
                  iconText: "text-[#ffc56b]",
                },
                {
                  value: referralSummary?.successful_referrals ?? 0,
                  label: "Referrals",
                  icon: <HiOutlineGift className="text-xl" />,
                  gradient: "from-[#0c1a14] to-[#081210]",
                  iconBg: "bg-[#122a1e]",
                  iconText: "text-[#6beba3]",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b ${stat.gradient} border border-white/5 p-3 transition-all duration-300 hover:border-white/10 hover:shadow-lg sm:p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#a08782] sm:mt-1 sm:text-xs">{stat.label}</p>
                    </div>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconText} transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11`}>
                      {stat.icon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <UpcomingImportantDatesCard
          dates={importantDates}
          onManageClick={() => setActiveTab("settings")}
        />

        {/* Recent Orders */}
        <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a0a0f] to-[#120609] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-cormorant text-2xl text-white sm:text-3xl">{t("profile.recentOrders")}</h2>
              <p className="mt-0.5 text-xs text-[#a08782] sm:mt-1 sm:text-sm">{t("profile.recentOrdersSubtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className="shrink-0 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-[#ff8fa3] transition-colors hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm"
            >
              {t("profile.viewAllOrders")}
            </button>
          </div>
          <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
            {!orders.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center">
                <HiOutlineShoppingBagCard className="text-4xl text-[#5a3a3e]" />
                <p className="mt-3 text-[#a08782]">{t("profile.noOrders")}</p>
              </div>
            ) : null}
            {orders.slice(0, 4).map((order, index) => (
              <article
                key={order.id}
                className={`group flex items-center justify-between rounded-2xl border bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04] ${
                  highlightedOrderId === order.id
                    ? "border-[#ff8ea3]/40 ring-2 ring-[#ff8ea3]/25 shadow-[0_0_0_1px_rgba(255,142,163,0.14)]"
                    : "border-white/5"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {order.items[0]?.bouquet_image ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                      <img loading="lazy" decoding="async"
                        src={order.items[0].bouquet_image}
                        alt={order.items[0]?.bouquet_name ?? "Bouquet"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-xs text-[#8f6d68]">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{order.items[0]?.bouquet_name ?? "Bouquet"}</p>
                    <p className="mt-0.5 text-sm text-[#a08782]">#{order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`hidden rounded-full border px-2.5 py-1 text-xs uppercase sm:inline-block ${getOrderStatusMeta(order.status).className}`}>
                    {getOrderStatusMeta(order.status).label}
                  </span>
                  <p className="text-right text-lg font-bold text-white">{formatPrice(order.total_price)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Referral Section – Redesigned */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1c0910] via-[#1a0b13] to-[#12060a] p-0">
          {/* ── Hero Banner ── */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#c7233f] via-[#e8344f] to-[#ff4d6d] px-6 py-8 sm:px-10 sm:py-10">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
            <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#ff4d6d]/20 to-transparent" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl text-white shadow-lg shadow-black/10 backdrop-blur-sm">
                  <HiGift />
                </span>
                <div>
                  <h2 className="font-cormorant text-3xl font-bold text-white sm:text-4xl">{t("profile.referralTitle")}</h2>
                  <p className="mt-1 max-w-md text-sm text-white/80 sm:text-base">
                    {t("profile.referralDesc")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInviteFriends}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-8 font-semibold text-[#c7233f] shadow-lg shadow-black/10 transition-all duration-300 hover:shadow-xl hover:brightness-110 active:scale-[0.97]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {t("profile.shareInviteLink")}
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="space-y-5 p-6 sm:p-8">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#1e1018] to-[#160a10] p-4 transition-all duration-300 hover:border-[#ff6d84]/20 hover:shadow-lg hover:shadow-[#ff6d84]/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a1018] text-[#ff6d84] transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {referralSummary ? formatPrice(referralSummary.bonus_balance) : "$0.00"}
                    </p>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#8f6d68]">{t("profile.bonusBalance")}</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#0f1a15] to-[#0a1210] p-4 transition-all duration-300 hover:border-[#6beba3]/20 hover:shadow-lg hover:shadow-[#6beba3]/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#122a1e] text-[#6beba3] transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-white">{referralSummary?.successful_referrals ?? 0}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#8f6d68]">{t("profile.successful")}</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#1a1408] to-[#120f05] p-4 transition-all duration-300 hover:border-[#ffd59a]/20 hover:shadow-lg hover:shadow-[#ffd59a]/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e200c] text-[#ffc56b] transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-white">{referralSummary?.pending_referrals ?? 0}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#8f6d68]">{t("profile.pending")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Code & Link */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a08782]">{t("profile.yourReferralCode")}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="rounded-xl bg-gradient-to-r from-[#2a1018] to-[#1e0c12] px-5 py-2.5 font-mono text-xl font-bold tracking-[0.15em] text-[#ffe0dd] ring-1 ring-white/10">
                      {referralSummary?.referral_code ?? "········"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReferralCode}
                      className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-[#ff8fa3] transition-all hover:bg-white/10 active:scale-95"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      {t("profile.copyCode")}
                    </button>
                  </div>
                  <p className="mt-3 break-all text-xs text-[#6b5050]">
                    {referralLink || t("profile.preparingLink")}
                  </p>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{t("profile.howItWorks")}</p>
                <span className="rounded-full bg-gradient-to-r from-[#c7233f]/20 to-[#ff4d6d]/10 px-3 py-1 text-xs font-semibold text-[#ff8fa3] ring-1 ring-[#ff4d6d]/20">
                  {t("profile.rewardAmountEach", { amount: referralRewardAmount })}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {referralJourney.map((step, index) => (
                  <div key={step.title} className="relative">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c7233f] to-[#ff4d6d] text-sm font-bold text-white shadow-md shadow-[#c7233f]/20">
                        {index + 1}
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm font-semibold text-white">{step.title.replace(/^\d+\.\s*/, "")}</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#a08782]">{step.description}</p>
                      </div>
                    </div>
                    {index < referralJourney.length - 1 && (
                      <div className="absolute left-4 top-8 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[#ff4d6d]/30 to-transparent md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invited Friends */}
            {referralSummary?.referred_friends.length ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{t("profile.invitedFriends")}</p>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                      {referralSummary.referred_friends.length}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]">
                    <span className="flex items-center gap-1.5 rounded-full bg-[#2a160b] px-2.5 py-1 text-[#ffd59a]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ffd59a]" /> {t("profile.pendingLabel")}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-[#10231a] px-2.5 py-1 text-[#9ef0c2]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9ef0c2]" /> {t("profile.rewarded")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {referralSummary.referred_friends.map((friend) => (
                    <div key={friend.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3a161c] to-[#2a0e14] text-sm font-bold text-white">
                        {friend.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#fff1ed]">{friend.full_name}</p>
                        <p className="truncate text-xs text-[#6b5050]">{friend.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        friend.reward_granted
                          ? "bg-[#143424] text-[#9ef0c2] ring-1 ring-[#2f6a4f]/30"
                          : "bg-[#3a2610] text-[#ffd59a] ring-1 ring-[#7f5a41]/20"
                      }`}>
                        {friend.reward_granted ? `✓ ${t("profile.rewarded")}` : t("profile.pendingLabel")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-transparent px-3 pb-16 pt-32 text-[#fff6f4] sm:px-5 sm:pt-36 lg:px-8 lg:pt-28 xl:px-10">
      <div className="mx-auto max-w-[1500px]">
        {/* Mobile Profile Header */}
        <div className="mb-5 sm:mb-6 xl:hidden">
          <div className="flex items-center gap-3 rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a0a0f] to-[#120609] p-4 sm:p-5">
                <div className="relative shrink-0">
              {avatarPreviewUrl ? (
                <img loading="lazy" decoding="async" src={avatarPreviewUrl} alt="Avatar preview" className="h-16 w-16 rounded-full object-cover ring-2 ring-[#ff6d84]/50 sm:h-20 sm:w-20" />
              ) : user?.avatar_url ? (
                <img loading="lazy" decoding="async" src={user.avatar_url} alt="avatar" className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#3a161c] to-[#2a0e14] text-xl font-bold text-white sm:h-20 sm:w-20 sm:text-2xl">{userInitials}</div>
              )}
              <button
                type="button"
                disabled={isAvatarSubmitting}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#c7233f] to-[#ff4d6d] text-white shadow-lg disabled:opacity-60 sm:h-8 sm:w-8"
              >
                <HiOutlineCamera className="text-xs sm:text-sm" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatarSelect(event.target.files?.[0] ?? null)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-white sm:text-xl">{user?.full_name}</p>
              <p className="truncate text-xs text-[#a08782] sm:text-sm">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#ff8fa3] transition-colors hover:bg-white/10 sm:h-10 sm:w-10">
                <HiArrowLeftOnRectangle className="text-base sm:text-lg" />
              </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        {!isOwnerAccount ? (
        <div className="mb-5 sm:mb-6 xl:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                    active
                      ? "bg-gradient-to-r from-[#c7233f] to-[#ff4d6d] text-white shadow-lg shadow-[#c7233f]/20"
                      : "border border-white/5 bg-white/[0.03] text-[#c4a39b] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-sm sm:text-base">{tab.icon}</span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        ) : null}

        {/* Desktop 3-column layout */}
        <div className={`grid gap-4 sm:gap-6 ${isOwnerAccount ? "xl:grid-cols-[260px_1fr]" : "xl:grid-cols-[260px_1fr_380px]"}`}>
          {/* Left Sidebar - Desktop */}
          <aside className="hidden xl:block">
            <div className="sticky top-28 space-y-5">
              {/* User Card */}
              <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a0a0f] to-[#120609] p-5">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {avatarPreviewUrl ? (
                      <img loading="lazy" decoding="async" src={avatarPreviewUrl} alt="Avatar preview" className="h-24 w-24 rounded-full object-cover ring-2 ring-[#ff6d84]/50" />
                    ) : user?.avatar_url ? (
                      <img loading="lazy" decoding="async" src={user.avatar_url} alt="avatar" className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#3a161c] to-[#2a0e14] text-3xl font-bold text-white">{userInitials}</div>
                    )}
                    <button
                      type="button"
                      disabled={isAvatarSubmitting}
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#c7233f] to-[#ff4d6d] text-white shadow-lg shadow-[#c7233f]/30 transition-transform hover:scale-110 disabled:opacity-60"
                    >
                      <HiOutlineCamera className="text-sm" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatarSelect(event.target.files?.[0] ?? null)} />
                  </div>

                  {isAvatarSubmitting ? (
                    <p className="mt-3 text-xs text-[#a08782]">{t("common.loading")}</p>
                  ) : null}

                  {selectedAvatarFile ? (
                    <p className="mt-3 max-w-full truncate text-sm text-[#c4a39b]">{selectedAvatarFile.name}</p>
                  ) : null}
                  {avatarStatus ? <p className="mt-2 rounded-lg bg-[#123420] px-3 py-1.5 text-xs text-[#9ef0c2]">{avatarStatus}</p> : null}
                  {avatarError ? <p className="mt-2 rounded-lg bg-[#3a1118] px-3 py-1.5 text-xs text-[#ff9eae]">{avatarError}</p> : null}

                  {selectedAvatarFile ? (
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={handleAvatarUpload} disabled={isAvatarSubmitting} className="rounded-lg bg-[#c7233f] px-4 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-60">
                        {t("profile.saveAvatar")}
                      </button>
                      <button type="button" onClick={resetAvatarSelection} disabled={isAvatarSubmitting} className="rounded-lg border border-white/10 px-4 py-1.5 text-xs font-medium text-[#c4a39b] transition hover:bg-white/5 disabled:opacity-60">
                        {t("profile.cancel")}
                      </button>
                    </div>
                  ) : user?.avatar_url ? (
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={isAvatarSubmitting} className="rounded-lg bg-white/5 px-4 py-1.5 text-xs font-medium text-[#c4a39b] transition hover:bg-white/10 disabled:opacity-60">
                        {t("profile.changeAvatar")}
                      </button>
                      <button type="button" onClick={handleAvatarDelete} disabled={isAvatarSubmitting} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[#8f6d68] transition hover:text-[#ff9eae] disabled:opacity-60">
                        <HiTrash className="text-sm" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={isAvatarSubmitting} className="mt-3 rounded-lg bg-white/5 px-4 py-1.5 text-xs font-medium text-[#c4a39b] transition hover:bg-white/10 disabled:opacity-60">
                      {t("profile.uploadAvatar")}
                    </button>
                  )}

                  <p className="mt-3 text-[0.65rem] uppercase tracking-[0.2em] text-[#6b5050]">{t("profile.avatarInfo")}</p>
                </div>
              </div>

              {/* Navigation */}
              {!isOwnerAccount ? (
              <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a0a0f] to-[#120609] p-3">
                <nav className="space-y-1">
                  {visibleTabs.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-gradient-to-r from-[#c7233f]/20 to-[#ff4d6d]/10 text-white shadow-sm"
                            : "text-[#a08782] hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span className={`text-lg ${active ? "text-[#ff6d84]" : ""}`}>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
              ) : null}

              {/* Logout */}
              <button
                type="button"
                onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] py-3 text-sm font-medium text-[#ff8fa3] transition-all duration-200 hover:border-[#ff8fa3]/20 hover:bg-[#ff8fa3]/5"
              >
                <HiArrowLeftOnRectangle />
                {t("profile.logOut")}
              </button>

              {/* Help Card */}
              <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a0a0f] to-[#120609] p-5">
                <h3 className="font-cormorant text-2xl text-white">{t("profile.needHelp")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8f6d68]">
                  {canOpenOwnerDashboard
                    ? t("profile.ownerDashboardHelp")
                    : latestShopApplication?.status === "pending"
                      ? t("profile.sellerPending")
                      : t("profile.sellerDefault")}
                </p>
                {latestShopApplication?.admin_comment ? (
                  <div className="mt-3 rounded-xl border border-[#ff8fa3]/10 bg-[#ff8fa3]/5 px-3 py-2">
                    <p className="text-xs text-[#ff8fa3]">{t("profile.adminComment")} {latestShopApplication.admin_comment}</p>
                  </div>
                ) : null}
                <Link
                  to={canOpenOwnerDashboard ? "/owner/dashboard" : "/shop-application"}
                  className="mt-4 flex items-center justify-center rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  {canOpenOwnerDashboard ? t("profile.openOwnerDashboard") : t("profile.contactSupport")}
                </Link>
              </div>
            </div>
          </aside>

          {/* Center Content */}
          <section className="min-w-0 space-y-5">
            {renderCenterContent()}
          </section>

          {!isOwnerAccount ? (
          <>
          {/* Right Sidebar - Desktop */}
          <aside className="hidden xl:block">
            <div className="sticky top-28 space-y-5">
              {/* Profile Completion */}
              <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a0a0f] to-[#120609] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-cormorant text-2xl text-white">{t("profile.profileCompletion")}</h3>
                  <span className={`text-sm font-semibold ${profileCompletion === 100 ? "text-[#6beba3]" : "text-[#ffc56b]"}`}>
                    {profileCompletion}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c7233f] to-[#ff4d6d] transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-[#8f6d68]">
                  {profileCompletion === 100
                    ? t("profile.profileComplete")
                    : t("profile.profileIncomplete")}
                </p>
                {profileCompletion < 100 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#c7233f] to-[#ff4d6d] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#c7233f]/20 transition-all hover:shadow-xl hover:shadow-[#c7233f]/30"
                  >
                    {t("profile.completeProfile")}
                  </button>
                )}
              </div>

              {/* Recommended Bouquets */}
              <div className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a0a0f] to-[#120609]">
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-cormorant text-2xl text-white">{t("profile.forYou")}</h3>
                    <div className="flex gap-1.5">
                      {recommendedBouquets.slice(0, 5).map((bouquet, index) => (
                        <button
                          key={bouquet.id}
                          type="button"
                          onClick={() => setRecommendedIndex(index)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            index === safeRecommendedIndex ? "w-5 bg-[#ff6d84]" : "w-1.5 bg-white/15"
                          }`}
                          aria-label={t("profile.showBouquet", { name: bouquet.name })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {recommendedQuery.isLoading ? (
                  <div className="p-5">
                    <RecommendedBouquetSkeleton />
                  </div>
                ) : null}

                {!recommendedQuery.isLoading && activeRecommended ? (
                  <div className="p-5 pt-3">
                    <article className="group overflow-hidden rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="relative h-48 overflow-hidden">
                        <img loading="lazy" decoding="async"
                          src={activeRecommended.image}
                          alt={activeRecommended.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="font-cormorant text-2xl text-white">{activeRecommended.name}</p>
                          <p className="text-sm text-white/70">{activeRecommended.shop.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4">
                        <p className="text-xl font-bold text-white">{formatPrice(activeRecommended.price)}</p>
                        <Link
                          to={`/bouquets/${activeRecommended.id}`}
                          className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                        >
                          View →
                        </Link>
                      </div>
                    </article>
                  </div>
                ) : null}

                {!recommendedQuery.isLoading && !activeRecommended ? (
                  <div className="p-5">
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-8 text-center text-sm text-[#8f6d68]">
                      Tavsiya etiladigan bouquetlar yo'q.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
          </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default Profile;
