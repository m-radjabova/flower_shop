import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  HiBolt,
  HiClock,
  HiBuildingStorefront,
  HiBanknotes,
  HiOutlineCreditCard as HiCardIcon,
  HiGlobeAlt,
  HiFaceSmile,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import useContextPro from "../../hooks/useContextPro";
import { useCreateOrder, useMyAddresses } from "../../hooks/useCatalog";
import { useCartItems } from "../../hooks/useCart";
import { AddressCardsSkeleton } from "../../components/PageSkeletons";
import GiftMessageCard from "../../components/orders/GiftMessageCard";
import {
  formatCheckoutAddress,
  getPreferredCheckoutAddress,
  isSameCheckoutAddress,
  setPreferredCheckoutAddress,
} from "../../utils/address";
import { formatPrice } from "../../utils/catalog";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DETAIL_MAP_ZOOM,
  getGeolocationErrorReason,
  getCurrentUserCoordinates,
  normalizeCoordinates,
  reverseGeocode,
  searchLocations,
  type SearchLocationResult,
} from "../../utils/location";
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
  remove?: () => void;
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
  giftMessage: string;
}

type CheckoutStep = 1 | 2 | 3;

const GIFT_MESSAGE_QUICK_EMOJIS = ["💖", "🎉", "🌷", "🥰", "✨", "🎁", "🎂", "🌹"];

const GIFT_MESSAGE_EMOJI_GROUPS = [
  {
    key: "love",
    emojis: ["💖", "❤️", "💕", "💘", "💞", "💓", "💗", "💝", "😘", "🥰", "😍", "🤍", "💋", "🫶", "💑", "❣️"],
  },
  {
    key: "celebration",
    emojis: ["🎉", "🎊", "🎂", "🎁", "🥳", "🍰", "🕯️", "✨", "🌟", "🎈", "🍓", "🍫", "🎆", "🎇", "🍾", "🥂"],
  },
  {
    key: "flowers",
    emojis: ["🌷", "🌹", "💐", "🌸", "🌺", "🪻", "🌼", "🌻", "🍀", "☀️", "🕊️", "🎀", "🌿", "🪴", "🍃", "🦋"],
  },
  {
    key: "smiles",
    emojis: ["😊", "😇", "😉", "🤗", "😌", "😁", "😻", "🤩", "😽", "🙌", "👏", "🫰", "🤍", "💫", "🌈", "⭐"],
  },
  {
    key: "wishes",
    emojis: ["🎓", "👑", "🍰", "🎂", "🙏", "🤲", "💌", "📩", "🕊️", "🏆", "💎", "🎶", "☕", "🍬", "🍯", "🧁"],
  },
];

// --- Delivery Method Option ---
interface DeliveryOption {
  value: string;
  labelKey: string;
  descKey: string;
  icon: React.ReactNode;
  badge?: string;
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    value: "express",
    labelKey: "delivery.express",
    descKey: "delivery.expressDesc",
    icon: <HiBolt className="text-lg" />,
    badge: "fast",
  },
  {
    value: "standard",
    labelKey: "delivery.standard",
    descKey: "delivery.standardDesc",
    icon: <HiClock className="text-lg" />,
  },
  {
    value: "pickup",
    labelKey: "delivery.pickup",
    descKey: "delivery.pickupDesc",
    icon: <HiBuildingStorefront className="text-lg" />,
  },
];

// --- Payment Method Option ---
interface PaymentOption {
  value: string;
  labelKey: string;
  descKey: string;
  icon: React.ReactNode;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "cash",
    labelKey: "delivery.cash",
    descKey: "delivery.cashDesc",
    icon: <HiBanknotes className="text-lg" />,
  },
  {
    value: "card",
    labelKey: "delivery.card",
    descKey: "delivery.cardDesc",
    icon: <HiCardIcon className="text-lg" />,
  },
  {
    value: "online",
    labelKey: "delivery.online",
    descKey: "delivery.onlineDesc",
    icon: <HiGlobeAlt className="text-lg" />,
  },
];

// ─── Tailwind CSS keyframe animations ────────────────────────────────────
// These are injected as a <style> tag so we can use custom animations.
const ANIMATION_STYLES = `
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-6px) rotate(1deg); }
  66% { transform: translateY(3px) rotate(-0.5deg); }
}
@keyframes float-slow {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
@keyframes slide-up-fade {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes slide-right-fade {
  0% { opacity: 0; transform: translateX(-10px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes scale-check {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
@keyframes border-glow {
  0%, 100% { border-color: rgba(206,74,96,0.3); }
  50% { border-color: rgba(206,74,96,0.6); }
}
@keyframes gradient-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-float { animation: float 4s ease-in-out infinite; }
.animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
.animate-shimmer { background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
.animate-slide-up { animation: slide-up-fade 0.5s ease-out both; }
.animate-slide-right { animation: slide-right-fade 0.4s ease-out both; }
.animate-scale-check { animation: scale-check 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
.animate-gradient { background-size: 200% 200%; animation: gradient-rotate 4s ease infinite; }

.step-enter { animation: slide-up-fade 0.45s ease-out both; }
.step-delay-1 { animation-delay: 0.05s; }
.step-delay-2 { animation-delay: 0.1s; }
.step-delay-3 { animation-delay: 0.15s; }
.step-delay-4 { animation-delay: 0.2s; }
.step-delay-5 { animation-delay: 0.25s; }
`;

// ─── Animation injector component ────────────────────────────────────────
function AnimationStyles() {
  return <style>{ANIMATION_STYLES}</style>;
}

function DeliveryCheckout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const items = useCartItems();
  const createOrder = useCreateOrder();
  const addressesQuery = useMyAddresses();
  const {
    state: { user },
  } = useContextPro();

  const { register, handleSubmit, setValue, watch, trigger } = useForm<CheckoutFormValues>({
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
      giftMessage: "",
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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const leafletMarkerRef = useRef<LeafletMarker | null>(null);
  const didHydrateAddressRef = useRef(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const giftMessageTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
  const giftMessage = watch("giftMessage");
  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");
  const giftMessageField = register("giftMessage");
  const selectedSavedAddress = addressesQuery.data?.find((item) => item.id === selectedAddressId) ?? null;
  const preferredAddress = getPreferredCheckoutAddress();
  const checkoutSteps = [
    {
      id: 1 as CheckoutStep,
      label: t("delivery.stepAddress"),
      description: t("delivery.stepAddressDesc"),
      icon: HiOutlineMapPin,
    },
    {
      id: 2 as CheckoutStep,
      label: t("delivery.stepContact"),
      description: t("delivery.stepContactDesc"),
      icon: HiOutlineUser,
    },
    {
      id: 3 as CheckoutStep,
      label: t("delivery.stepMessage"),
      description: t("delivery.stepMessageDesc"),
      icon: HiFaceSmile,
    },
  ];
  const currentStepMeta = checkoutSteps.find((step) => step.id === currentStep) ?? checkoutSteps[0];

  const insertGiftEmoji = useCallback((emoji: string) => {
    const textarea = giftMessageTextareaRef.current;
    const selectionStart = textarea?.selectionStart ?? giftMessage.length;
    const selectionEnd = textarea?.selectionEnd ?? giftMessage.length;
    const nextValue = `${giftMessage.slice(0, selectionStart)}${emoji}${giftMessage.slice(selectionEnd)}`;

    setValue("giftMessage", nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });

    requestAnimationFrame(() => {
      const nextCursor = selectionStart + emoji.length;
      giftMessageTextareaRef.current?.focus();
      giftMessageTextareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }, [giftMessage, setValue]);

  const goToNextStep = useCallback(async () => {
    if (currentStep === 1) {
      const isValid = await trigger(["address"]);
      if (!isValid || !watch("address").trim()) {
        toast.error(t("delivery.stepAddressError"));
        return;
      }
    }

    if (currentStep === 2) {
      const isValid = await trigger(["customerName", "phone"]);
      if (!isValid || !watch("customerName").trim() || !watch("phone").trim()) {
        toast.error(t("delivery.stepContactError"));
        return;
      }
    }

    setCurrentStep((prev) => Math.min(3, prev + 1) as CheckoutStep);
  }, [currentStep, t, trigger, watch]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as CheckoutStep);
  }, []);

  const ensureLeafletMarker = useCallback((coords: [number, number]) => {
    if (leafletMarkerRef.current || !leafletMapRef.current || !window.L) return;

    leafletMarkerRef.current = window.L.marker(coords, {
      icon: window.L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      }),
    }).addTo(leafletMapRef.current);
  }, []);

  const applyLocationSelection = useCallback(async (nextLatitude: number, nextLongitude: number, fallbackAddress?: string) => {
    const coords = normalizeCoordinates(nextLatitude, nextLongitude);
    setSelectedCoords(coords);
    ensureLeafletMarker(coords);
    leafletMarkerRef.current?.setLatLng(coords);
    setIsResolvingAddress(true);

    try {
      const data = await reverseGeocode(coords[0], coords[1]);
      setValue("address", data.displayName || fallbackAddress || `${coords[0]}, ${coords[1]}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } catch {
      setValue("address", fallbackAddress || `${coords[0]}, ${coords[1]}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast.error(t("delivery.addressResolveFailed"));
    } finally {
      setIsResolvingAddress(false);
    }
  }, [ensureLeafletMarker, setValue, t]);

  useEffect(() => {
    if (!isEmojiPickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!emojiPickerRef.current?.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEmojiPickerOpen]);

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
    toast.success(t("delivery.addressSelected"));
  };

  useEffect(() => {
    if (!mapOpen || !mapHostRef.current) return;

    let cancelled = false;

    const setupMap = async () => {
      try {
        await injectLeafletAssets();
        if (cancelled || !window.L || !mapHostRef.current) return;

        const hasSelectedCoordinates = Boolean(selectedCoords);
        const initial = selectedCoords ?? DEFAULT_MAP_CENTER;
        const map = window.L.map(mapHostRef.current).setView(initial, hasSelectedCoordinates ? 12 : DEFAULT_MAP_ZOOM);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        leafletMapRef.current = map;
        leafletMarkerRef.current = selectedCoords
          ? window.L.marker(initial, {
            icon: window.L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            }),
          }).addTo(map)
          : null;

        map.on("click", async ({ latlng }) => {
          const coords = normalizeCoordinates(latlng.lat, latlng.lng);
          if (!leafletMarkerRef.current && window.L) {
            leafletMarkerRef.current = window.L.marker(coords, {
              icon: window.L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
              }),
            }).addTo(map);
          } else {
            leafletMarkerRef.current?.setLatLng(coords);
          }
          map.setView(coords, DETAIL_MAP_ZOOM);
          void applyLocationSelection(coords[0], coords[1]);
        });
      } catch {
        toast.error(t("delivery.mapLoadFailed"));
      }
    };

    setupMap();

    return () => {
      cancelled = true;
      leafletMarkerRef.current?.remove?.();
      leafletMarkerRef.current = null;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [applyLocationSelection, mapOpen, selectedCoords, t]);

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) {
      toast.error(t("delivery.enterAddressToSearch"));
      return;
    }

    try {
      setIsSearchingLocation(true);
      const results = await searchLocations(locationQuery.trim());
      setLocationResults(results);
      if (!results.length) {
        toast.error(t("delivery.noLocationsFound"));
      }
    } catch {
      toast.error(t("delivery.locationSearchFailed"));
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t("delivery.geolocationNotSupported"));
      return;
    }

    try {
      setIsLocatingUser(true);
      const coords = await getCurrentUserCoordinates();
      leafletMapRef.current?.setView(coords, DETAIL_MAP_ZOOM);
      ensureLeafletMarker(coords);
      leafletMarkerRef.current?.setLatLng(coords);
      await applyLocationSelection(coords[0], coords[1], t("delivery.currentLocation"));
      setLocationQuery(t("delivery.currentLocation"));
      setLocationResults([]);
    } catch (error) {
      const reason = getGeolocationErrorReason(error);
      const messageKey =
        reason === "permission_denied"
          ? "delivery.currentLocationPermissionDenied"
          : reason === "timeout"
            ? "delivery.currentLocationTimeout"
            : reason === "position_unavailable"
              ? "delivery.currentLocationUnavailable"
              : "delivery.currentLocationFailed";
      toast.error(t(messageKey));
    } finally {
      setIsLocatingUser(false);
    }
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!primaryItem) return toast.error(t("delivery.cartEmpty"));
    if (!values.customerName.trim() || !values.phone.trim() || !values.address.trim()) {
      return toast.error(t("delivery.formRequired"));
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
        gift_message: values.giftMessage.trim() || undefined,
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
      toast.success(t("delivery.orderSent"));
      navigate("/bouquets", { replace: true });
    } catch {
      toast.error(t("delivery.orderFailed"));
    }
  };

  if (!primaryItem) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-12 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
        <AnimationStyles />
        {/* Decorative bg elements */}
        <div className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-[#8f1220]/10 blur-[100px] animate-float-slow" />
        <div className="pointer-events-none absolute -right-32 top-80 h-96 w-96 rounded-full bg-[#6b1d2a]/8 blur-[120px] animate-float" />

        <div className="relative mx-auto max-w-2xl">
          <div className="group relative overflow-hidden rounded-3xl border border-[#5d2b2f]/60 bg-[linear-gradient(150deg,rgba(28,10,13,0.94),rgba(15,6,8,0.94))] p-8 text-center shadow-[0_20px_60px_rgba(8,3,4,0.6)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_30px_80px_rgba(206,74,96,0.12)]">
            {/* Glow accent */}
            <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#ce4a60]/5 to-transparent opacity-50" />
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-[#ce4a60]/3 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#5d2b2f]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.8),rgba(15,6,8,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(206,74,96,0.15)]">
                <HiOutlineShoppingBag className="text-3xl text-[#ce4a60] animate-float" />
              </div>

              <p className="font-cormorant text-5xl text-white">{t("delivery.cartEmpty")}</p>
              <p className="mt-3 text-[#d8b5ad]">{t("delivery.cartEmptyDesc")}</p>

              <Link
                to="/bouquets"
                className="group/btn relative mt-8 inline-flex h-13 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#ce4a60]/30 bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] px-8 font-semibold uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(206,74,96,0.25)] transition-all duration-500 hover:shadow-[0_8px_40px_rgba(206,74,96,0.4)] hover:brightness-110"
              >
                <span className="relative z-10">{t("delivery.browseBouquets")}</span>
                <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-12 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
      <AnimationStyles />
      {/* Decorative background orbs with animation */}
      <div className="pointer-events-none fixed -left-48 top-1/4 h-[500px] w-[500px] rounded-full bg-[#8f1220]/8 blur-[130px] animate-float-slow" />
      <div className="pointer-events-none fixed -right-48 top-1/3 h-[400px] w-[400px] rounded-full bg-[#6b1d2a]/6 blur-[120px] animate-float" />
      <div className="pointer-events-none fixed left-1/3 top-[60%] h-[350px] w-[350px] rounded-full bg-[#5d1a24]/5 blur-[100px] animate-float-slow" />
      <div className="pointer-events-none fixed left-1/4 top-[80%] h-[200px] w-[200px] rounded-full bg-[#ce4a60]/3 blur-[80px] animate-float" />

      <div className="relative mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[1.2fr_0.8fr]">

        {/* ==================== LEFT – FORM ==================== */}
        <form onSubmit={handleSubmit(onSubmit)} className="group/form relative overflow-visible rounded-[1.8rem] border border-[#4f2224]/60 bg-[linear-gradient(160deg,#120507,#090204_70%)] p-6 shadow-[0_20px_60px_rgba(8,3,4,0.5)] sm:p-8 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_25px_80px_rgba(206,74,96,0.06)]">
          {/* Top gradient glow */}
          <div className="pointer-events-none absolute -inset-1 rounded-[1.8rem] bg-gradient-to-br from-[#ce4a60]/5 via-transparent to-transparent opacity-40" />
          <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] bg-gradient-to-br from-[#ce4a60]/2 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover/form:opacity-100" />

          <div className="relative">
            {/* Header */}
            <div className="rounded-[1.5rem] border border-[#5d2b2f]/50 bg-[linear-gradient(145deg,rgba(30,10,13,0.88),rgba(16,6,8,0.92))] p-4 sm:p-5 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.6),rgba(15,6,8,0.7))] transition-all duration-300">
                  <currentStepMeta.icon className="text-lg text-[#ce4a60] animate-float" />
                </div>
                <div>
                  <p className="font-cormorant text-4xl text-white sm:text-5xl transition-all duration-300">{currentStepMeta.label}</p>
                  <p className="mt-1 text-[#d8b2aa]">{currentStepMeta.description}</p>
                </div>
              </div>

              {/* Enhanced Step Progress */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {checkoutSteps.map((step, idx) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (step.id <= currentStep) {
                          setCurrentStep(step.id);
                        }
                      }}
                      style={{ animationDelay: `${idx * 80}ms` }}
                      className={`step-enter rounded-[1.25rem] border px-4 py-3 text-left transition-all duration-300 ${
                        isActive
                          ? "border-[#ce4a60]/60 bg-[linear-gradient(135deg,rgba(206,74,96,0.16),rgba(206,74,96,0.06))] shadow-[0_10px_24px_rgba(206,74,96,0.12)] hover:shadow-[0_14px_32px_rgba(206,74,96,0.18)]"
                          : isCompleted
                            ? "border-[#4f8c69]/45 bg-[linear-gradient(135deg,rgba(16,37,27,0.9),rgba(11,23,17,0.92))] hover:border-[#5dab7c]/50"
                            : "border-[#4f2224]/45 bg-[linear-gradient(145deg,rgba(25,9,11,0.72),rgba(16,6,8,0.82))] hover:border-[#6d3a3e]/50 hover:bg-[linear-gradient(145deg,rgba(33,11,14,0.78),rgba(19,7,9,0.88))]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
                            isActive
                              ? "border-[#ce4a60]/45 bg-[#ce4a60]/12 text-[#ffd7de] shadow-[0_0_12px_rgba(206,74,96,0.15)]"
                              : isCompleted
                                ? "border-[#4f8c69]/45 bg-[#173223] text-[#b8f1d1]"
                                : "border-[#5c2c31]/45 bg-[#16080a] text-[#d1a8a0]"
                          }`}
                        >
                          {isCompleted ? <HiCheckCircle className="text-base animate-scale-check" /> : <step.icon className="text-base" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-[#b88d86]">
                            {t("delivery.stepCounter", { current: step.id, total: checkoutSteps.length })}
                          </p>
                          <p className={`mt-1 font-semibold transition-colors ${isActive || isCompleted ? "text-white" : "text-[#d0aaa2]"}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                      {/* Active step indicator line */}
                      {isActive && (
                        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-[#ce4a60]/20">
                          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#ce4a60] to-[#ff6b7d] animate-shimmer" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ===== Saved Addresses ===== */}
            {currentStep === 1 ? (
            <section className="step-enter step-delay-1 relative mt-6 overflow-hidden rounded-[1.5rem] border border-[#643034]/60 bg-[linear-gradient(145deg,rgba(34,11,14,0.92),rgba(16,6,8,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-500 hover:border-[#7a4145]/60">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ce4a60]/5 blur-[40px] animate-pulse-glow" />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#643034]/50 bg-[linear-gradient(135deg,rgba(34,11,14,0.5),rgba(16,6,8,0.6))]">
                    <HiHome className="text-sm text-[#d8b2aa]" />
                  </div>
                  <div>
                    <p className="font-cormorant text-2xl text-white">{t("delivery.savedAddresses")}</p>
                    <p className="text-sm text-[#d2ada5]">{t("delivery.savedAddressesDesc")}</p>
                  </div>
                </div>
                {selectedSavedAddress ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#31553f]/50 bg-[linear-gradient(135deg,#10261a,#0b1f13)] px-3 py-1 text-sm text-[#a8f2c8] shadow-[0_2px_10px_rgba(16,38,26,0.3)] animate-slide-right">
                    <HiCheckCircle className="text-xs" />
                    {selectedSavedAddress.title}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 space-y-2.5">
                {addressesQuery.isLoading ? <AddressCardsSkeleton count={2} /> : null}
                {!addressesQuery.isLoading && !(addressesQuery.data?.length ?? 0) ? (
                  <div className="rounded-2xl border border-dashed border-[#5f2f33]/60 bg-[#140709]/60 px-5 py-5 text-sm text-[#cca7a0] transition-all duration-300 hover:border-[#7a4145]/40">
                    {t("delivery.noSavedAddresses")}
                  </div>
                ) : null}
                {!addressesQuery.isLoading &&
                  addressesQuery.data?.map((savedAddress, idx) => {
                    const selected = savedAddress.id === selectedAddressId;
                    return (
                      <button
                        key={savedAddress.id}
                        type="button"
                        onClick={() => applySavedAddress(savedAddress)}
                        style={{ animationDelay: `${idx * 60}ms` }}
                        className={`step-enter group/addr relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                          selected
                            ? "border-[#4f8c69]/70 bg-[linear-gradient(135deg,rgba(16,37,27,0.96),rgba(14,18,16,0.98))] shadow-[0_18px_48px_rgba(12,35,22,0.28)]"
                            : "border-[#5c2c31]/50 bg-[linear-gradient(145deg,rgba(25,9,11,0.9),rgba(16,6,8,0.95))] hover:border-[#8d4d53]/60 hover:bg-[linear-gradient(145deg,rgba(33,11,14,0.93),rgba(19,7,9,0.98))] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
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
                                  {t("delivery.primary")}
                                </span>
                              ) : null}
                              {selected ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#205437,#2a6b4a)] px-2.5 py-0.5 text-xs text-[#dfffea] shadow-[0_2px_8px_rgba(32,84,55,0.3)] animate-scale-check">
                                  <HiCheckCircle className="text-[10px]" />
                                  {t("delivery.selected")}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#eed7d1]">{savedAddress.address_line}</p>
                            <p className="text-sm text-[#be9a93]">{savedAddress.city ?? t("delivery.cityNotSet")}</p>
                            {savedAddress.notes ? (
                              <p className="mt-1 truncate text-sm text-[#a8857e]">{savedAddress.notes}</p>
                            ) : null}
                          </div>
                          <span
                            className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-all duration-300 ${
                              selected
                                ? "scale-110 border-[#72d79d]/70 bg-[#2d7b52] text-white shadow-[0_0_15px_rgba(45,123,82,0.4)]"
                                : "border-[#7f4d54]/50 text-[#d7b0a8] group-hover/addr:border-[#c9808b]/60 group-hover/addr:bg-[#1f0d10]"
                            }`}
                          >
                            {selected ? (
                              <HiCheckCircle className="text-sm animate-scale-check" />
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
            ) : null}

            {/* ===== Delivery Address ===== */}
            {currentStep === 1 ? (
            <div className="step-enter step-delay-2 mt-5 space-y-4">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#623234]/60 bg-[linear-gradient(145deg,rgba(27,10,13,0.96),rgba(13,5,7,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-[#7a4145]/60">
                <div className="pointer-events-none absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-[#623234]/8 blur-[40px]" />

                <div className="relative flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#623234]/50 bg-[linear-gradient(135deg,rgba(27,10,13,0.5),rgba(13,5,7,0.6))]">
                      <HiOutlineMapPin className="text-sm text-[#d8b2aa]" />
                    </div>
                    <div>
                      <p className="font-cormorant text-2xl text-white">{t("delivery.deliveryAddress")}</p>
                      <p className="text-sm text-[#cfaaa2]">{t("delivery.deliveryAddressDesc")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="group/mapbtn inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#7f4a4e]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] px-4 py-2 text-sm text-[#f7ddd7] transition-all duration-300 hover:border-[#ce4a60]/40 hover:bg-[linear-gradient(135deg,#1a0a0d,#220e12)] hover:shadow-[0_4px_16px_rgba(206,74,96,0.15)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <HiOutlineMapPin className="shrink-0 text-base transition-all duration-300 group-hover/mapbtn:text-[#ce4a60] group-hover/mapbtn:scale-110" />
                    <span className="hidden sm:inline">{t("delivery.pickFromMap")}</span>
                    <span className="sm:hidden">{t("delivery.map")}</span>
                    <HiChevronDown className="shrink-0 text-xs transition-all duration-300 group-hover/mapbtn:translate-y-0.5 group-hover/mapbtn:rotate-180" />
                  </button>
                </div>

                <div className="relative mt-4 space-y-3">
                  {/* Current Address Display */}
                  <div className="rounded-2xl border border-[#4c2528]/50 bg-[linear-gradient(135deg,#120607,#18080b)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#b78e88]">
                      <HiOutlineMapPin className="text-xs" />
                      {t("delivery.currentAddress")}
                    </p>
                    <p className="mt-2 text-base leading-6 text-white">{address || t("delivery.noAddressSelected")}</p>
                    <p className="mt-2 flex items-center gap-1 text-sm text-[#c9a39c]">
                      {selectedCoords ? (
                        <>
                          <span className="inline-flex h-2 w-2 rounded-full bg-[#72d79d] shadow-[0_0_6px_rgba(114,215,157,0.4)] animate-pulse-glow" />
                          {t("delivery.pinCoordinates")}: {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                        </>
                      ) : (
                        <>
                          <span className="inline-flex h-2 w-2 rounded-full bg-[#5c2c31]" />
                          {t("delivery.pinNotSelected")}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Address Input - Enhanced with floating glow */}
                  <label className="group/input relative block">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <HiOutlineMapPin className="text-[#b08d86] transition-colors duration-300 group-focus-within/input:text-[#ce4a60]" />
                    </div>
                    <input
                      {...addressField}
                      placeholder={t("delivery.writeFullAddress")}
                      className="h-13 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-4 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#7a4145]/50"
                      onChange={(event) => {
                        addressField.onChange(event);
                        setSelectedAddressId(null);
                      }}
                    />
                  </label>

                  {/* Date & Time */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="group/date relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineCalendarDays className="text-[#b08d86] transition-all duration-300 group-focus-within/date:text-[#ce4a60] group-focus-within/date:scale-110" />
                      </div>
                      <input
                        type="date"
                        {...register("deliveryDate")}
                        className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#7a4145]/50 [color-scheme:dark]"
                      />
                    </label>
                    <label className="group/time relative block">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <HiOutlineClock className="text-[#b08d86] transition-all duration-300 group-focus-within/time:text-[#ce4a60] group-focus-within/time:scale-110" />
                      </div>
                      <input
                        type="time"
                        {...register("deliveryTime")}
                        className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#7a4145]/50 [color-scheme:dark]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {/* ===== Contact Details ===== */}
            {currentStep === 2 ? (
            <div className="step-enter step-delay-1 relative mt-6 overflow-visible rounded-[1.5rem] border border-[#623234]/60 bg-[linear-gradient(145deg,rgba(23,9,11,0.96),rgba(13,5,7,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-[#7a4145]/60">
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-[#623234]/8 blur-[40px]" />

              <div className="relative flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#623234]/50 bg-[linear-gradient(135deg,rgba(23,9,11,0.5),rgba(13,5,7,0.6))]">
                  <HiOutlineUser className="text-sm text-[#d8b2aa]" />
                </div>
                <div>
                  <p className="font-cormorant text-2xl text-white">{t("delivery.contactDetails")}</p>
                  <p className="text-sm text-[#cfaaa2]">{t("delivery.contactDetailsDesc")}</p>
                </div>
              </div>

              <div className="relative mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="group/name relative block">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <HiOutlineUser className="text-[#b08d86] transition-all duration-300 group-focus-within/name:text-[#ce4a60]" />
                    </div>
                    <input
                      {...register("customerName")}
                      placeholder={t("delivery.customerName")}
                      className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#7a4145]/50"
                    />
                  </label>
                  <label className="group/phone relative block">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <HiOutlinePhone className="text-[#b08d86] transition-all duration-300 group-focus-within/phone:text-[#ce4a60]" />
                    </div>
                    <input
                      {...register("phone")}
                      placeholder={t("delivery.phone")}
                      className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#7a4145]/50"
                    />
                  </label>
                  <label className="group/email relative block sm:col-span-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <HiOutlineEnvelope className="text-[#b08d86] transition-all duration-300 group-focus-within/email:text-[#ce4a60]" />
                    </div>
                    <input
                      {...register("email")}
                      placeholder={t("delivery.email")}
                      className="h-12 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#7a4145]/50"
                    />
                  </label>
                </div>

                {/* ===== Delivery Method – Radio Cards ===== */}
                <div className="step-enter step-delay-2 pt-2">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#f1c7ce]">
                    <HiOutlineTruck className="text-base" />
                    {t("delivery.deliveryMethodLabel")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {DELIVERY_OPTIONS.map((option) => {
                      const isSelected = deliveryMethod === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`group/opt relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                            isSelected
                              ? "border-[#ce4a60]/60 bg-[linear-gradient(135deg,rgba(206,74,96,0.12),rgba(206,74,96,0.05))] shadow-[0_0_20px_rgba(206,74,96,0.12)] hover:shadow-[0_0_30px_rgba(206,74,96,0.18)]"
                              : "border-[#5c2c31]/40 bg-[linear-gradient(145deg,rgba(25,9,11,0.7),rgba(16,6,8,0.8))] hover:border-[#8d4d53]/50 hover:bg-[linear-gradient(145deg,rgba(33,11,14,0.75),rgba(19,7,9,0.85))] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
                          }`}
                        >
                          <input
                            type="radio"
                            {...register("deliveryMethod")}
                            value={option.value}
                            className="sr-only"
                          />
                          {isSelected && (
                            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#ce4a60]/15 blur-[25px] animate-pulse-glow" />
                          )}
                          <div className="relative flex flex-col items-center text-center gap-2">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
                                isSelected
                                  ? "border-[#ce4a60]/50 bg-[#ce4a60]/15 text-[#ce4a60] shadow-[0_0_15px_rgba(206,74,96,0.15)]"
                                  : "border-[#5c2c31]/40 bg-[linear-gradient(135deg,rgba(34,11,14,0.4),rgba(16,6,8,0.5))] text-[#d8b2aa] group-hover/opt:border-[#8d4d53]/40"
                              }`}
                            >
                              {option.icon}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold transition-colors ${
                                isSelected ? "text-[#f1c7ce]" : "text-white group-hover/opt:text-[#f0d6ce]"
                              }`}>
                                {t(option.labelKey)}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-[#b9918a]">{t(option.descKey)}</p>
                            </div>
                          </div>
                          {/* Selected indicator */}
                          <div
                            className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 ${
                              isSelected
                                ? "scale-100 border-[#ce4a60] bg-[#ce4a60] text-white shadow-[0_0_10px_rgba(206,74,96,0.4)]"
                                : "scale-90 border-[#5c2c31]/50 bg-transparent opacity-0 group-hover/opt:opacity-100"
                            }`}
                          >
                            {isSelected && <HiCheckCircle className="text-[10px] animate-scale-check" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* ===== Payment Method – Radio Cards ===== */}
                <div className="step-enter step-delay-3 pt-2">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#f1c7ce]">
                    <HiOutlineCreditCard className="text-base" />
                    {t("delivery.paymentMethodLabel")}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PAYMENT_OPTIONS.map((option) => {
                      const isSelected = paymentMethod === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`group/opt relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                            isSelected
                              ? "border-[#4f8c69]/60 bg-[linear-gradient(135deg,rgba(79,140,105,0.12),rgba(79,140,105,0.05))] shadow-[0_0_20px_rgba(79,140,105,0.12)] hover:shadow-[0_0_30px_rgba(79,140,105,0.18)]"
                              : "border-[#5c2c31]/40 bg-[linear-gradient(145deg,rgba(25,9,11,0.7),rgba(16,6,8,0.8))] hover:border-[#8d4d53]/50 hover:bg-[linear-gradient(145deg,rgba(33,11,14,0.75),rgba(19,7,9,0.85))] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
                          }`}
                        >
                          <input
                            type="radio"
                            {...register("paymentMethod")}
                            value={option.value}
                            className="sr-only"
                          />
                          {isSelected && (
                            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#4f8c69]/15 blur-[25px] animate-pulse-glow" />
                          )}
                          <div className="relative flex flex-col items-center text-center gap-2">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
                                isSelected
                                  ? "border-[#4f8c69]/50 bg-[#4f8c69]/15 text-[#72d79d] shadow-[0_0_15px_rgba(79,140,105,0.15)]"
                                  : "border-[#5c2c31]/40 bg-[linear-gradient(135deg,rgba(34,11,14,0.4),rgba(16,6,8,0.5))] text-[#d8b2aa] group-hover/opt:border-[#8d4d53]/40"
                              }`}
                            >
                              {option.icon}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold transition-colors ${
                                isSelected ? "text-[#a8f2c8]" : "text-white group-hover/opt:text-[#f0d6ce]"
                              }`}>
                                {t(option.labelKey)}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-[#b9918a]">{t(option.descKey)}</p>
                            </div>
                          </div>
                          {/* Selected indicator */}
                          <div
                            className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 ${
                              isSelected
                                ? "scale-100 border-[#4f8c69] bg-[#4f8c69] text-white shadow-[0_0_10px_rgba(79,140,105,0.4)]"
                                : "scale-90 border-[#5c2c31]/50 bg-transparent opacity-0 group-hover/opt:opacity-100"
                            }`}
                          >
                            {isSelected && <HiCheckCircle className="text-[10px] animate-scale-check" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {/* ===== Gift Message & Notes ===== */}
            {currentStep === 3 ? (
            <div className="step-enter step-delay-1 relative mt-6 overflow-visible rounded-[1.5rem] border border-[#623234]/60 bg-[linear-gradient(145deg,rgba(23,9,11,0.96),rgba(13,5,7,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-[#7a4145]/60">
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-[#623234]/8 blur-[40px] animate-pulse-glow" />

              <div className="relative flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#623234]/50 bg-[linear-gradient(135deg,rgba(23,9,11,0.5),rgba(13,5,7,0.6))]">
                  <HiFaceSmile className="text-sm text-[#d8b2aa]" />
                </div>
                <div>
                  <p className="font-cormorant text-2xl text-white">{t("delivery.writeGiftMessage")}</p>
                  <p className="text-sm text-[#cfaaa2]">{t("delivery.stepMessageDesc")}</p>
                </div>
              </div>

              <div className="relative mt-4 space-y-3">
                {/* Note */}
                <label className="group/note relative block">
                  <div className="pointer-events-none absolute left-0 top-3 flex items-start pl-3.5 pt-0.5">
                    <HiOutlinePencilSquare className="text-[#b08d86] transition-colors duration-300 group-focus-within/note:text-[#ce4a60]" />
                  </div>
                  <textarea
                    {...register("note")}
                    placeholder={t("delivery.deliveryNote")}
                    className="min-h-24 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] pl-10 pr-3 py-3 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#7a4145]/50"
                  />
                </label>

                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ce4a60]/30 bg-[#ce4a60]/8">
                      <span className="text-xs">💌</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1c7ce]">{t("delivery.writeGiftMessage")}</p>
                      <p className="mt-0.5 text-[11px] text-[#b68d87]">{t("delivery.giftMessagePlaceholder")}</p>
                    </div>
                  </div>

                  <div ref={emojiPickerRef} className="relative">
                    <label className="group/gift relative block">
                      <div className="pointer-events-none absolute left-0 top-3 flex items-start pl-3.5 pt-0.5">
                        <HiOutlinePencilSquare className="text-[#b08d86] transition-colors duration-300 group-focus-within/gift:text-[#ce4a60]" />
                      </div>

                      {/* Emoji toggle button */}
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen((current) => !current)}
                        aria-label={t("delivery.openEmojiPicker")}
                        className={`absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                          isEmojiPickerOpen
                            ? "scale-110 border-[#ce4a60]/60 bg-[#341117] text-[#ffd5dc] shadow-[0_0_16px_rgba(206,74,96,0.2)]"
                            : "border-[#6e3941]/40 bg-[#1b0b0e]/80 text-[#c79a92] hover:scale-105 hover:border-[#ce4a60]/45 hover:bg-[#260f14] hover:text-[#ffe7ea] hover:shadow-[0_0_12px_rgba(206,74,96,0.1)]"
                        }`}
                      >
                        <HiFaceSmile />
                      </button>

                      <textarea
                        {...giftMessageField}
                        ref={(element) => {
                          giftMessageField.ref(element);
                          giftMessageTextareaRef.current = element;
                        }}
                        placeholder={`${t("delivery.writeGiftMessage")}...`}
                        className="min-h-28 w-full rounded-xl border border-[#623234]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] py-3 pl-10 pr-16 text-white placeholder:text-[#7d5557] transition-all duration-300 focus:border-[#ce4a60]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] focus:bg-[linear-gradient(135deg,#17080b,#1a0a0d)] hover:border-[#7a4145]/50"
                      />
                    </label>

                    {/* ── Quick emoji row ── */}
                    <div className="step-enter step-delay-2 relative mt-4 overflow-hidden rounded-[1.4rem] border border-[#5c2c31]/35 bg-[linear-gradient(135deg,rgba(26,10,13,0.9),rgba(17,6,8,0.92))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 hover:border-[#7a4145]/40">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#ce4a60]/25 bg-[#ce4a60]/10 text-base text-[#ffd3da] shadow-[0_6px_16px_rgba(206,74,96,0.12)]">
                          <HiFaceSmile />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f1c7ce]">
                            {t("delivery.quickEmojis", { defaultValue: "Quick Emojis" })}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#a8827d]">
                            {t("delivery.clickToInsert", { defaultValue: "Click to insert" })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {GIFT_MESSAGE_QUICK_EMOJIS.map((emoji, index) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertGiftEmoji(emoji)}
                            aria-label={`${t("delivery.addEmoji")} ${emoji}`}
                            className="group/emoji relative inline-flex h-11 min-w-[2.9rem] items-center justify-center rounded-2xl border border-[#7a4248]/45 bg-[linear-gradient(145deg,#201013,#2a1217)] text-[1.45rem] shadow-[0_6px_16px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.04] hover:border-[#ce4a60]/60 hover:bg-[#311419] hover:shadow-[0_10px_22px_rgba(206,74,96,0.2)]"
                            style={{ transitionDelay: `${index * 30}ms` }}
                          >
                            {/* Glow on hover */}
                            <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/emoji:opacity-100 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(206,74,96,0.12),transparent)]" />
                            <span className="relative">{emoji}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsEmojiPickerOpen((current) => !current)}
                          className="group/more relative inline-flex h-11 items-center justify-center rounded-2xl border border-dashed border-[#7a4248]/50 bg-[linear-gradient(145deg,#18090c,#211013)] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d7b1ab] shadow-[0_6px_16px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ce4a60]/55 hover:text-white hover:shadow-[0_10px_22px_rgba(206,74,96,0.14)]"
                        >
                          <span className="relative z-10 flex items-center gap-1.5">
                            <span className={`inline-block transition-transform duration-300 ${isEmojiPickerOpen ? "rotate-45" : ""}`}>
                              <HiFaceSmile className="text-xs" />
                            </span>
                            {isEmojiPickerOpen
                              ? t("delivery.close", { defaultValue: "Close" })
                              : t("delivery.moreEmojis", { defaultValue: "More emojis" })}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* ── Emoji picker dropdown ── */}
                    <div
                      className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-full max-w-[29rem] origin-top-right overflow-hidden rounded-[1.6rem] border border-[#7b3944]/55 bg-[linear-gradient(180deg,rgba(27,10,13,0.98),rgba(17,5,8,0.99))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 sm:w-[29rem] ${
                        isEmojiPickerOpen
                          ? "scale-100 opacity-100 translate-y-0"
                          : "scale-95 opacity-0 translate-y-2 pointer-events-none"
                      }`}
                    >
                      {/* Glow accents */}
                      <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#ce4a60]/10 blur-[50px] animate-pulse-glow" />
                      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#ffd700]/5 blur-[40px]" />

                      <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ce4a60]/25 bg-[#ce4a60]/8">
                              <span className="text-sm">🎨</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1c7ce]">{t("delivery.emojiPickerTitle")}</p>
                              <p className="mt-0.5 text-[11px] text-[#b68d87]">{t("delivery.emojiPickerHint")}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEmojiPickerOpen(false)}
                            aria-label={t("delivery.closeEmojiPicker")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#6e3941]/40 bg-[#1a0b0d] text-[#f2d7da] transition-all duration-200 hover:scale-105 hover:border-[#ce4a60]/50 hover:bg-[#ce4a60]/10 hover:text-white"
                          >
                            <HiXMark className="text-sm" />
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[#5c2c31]/30" />
                          </div>
                        </div>

                        <div className="max-h-[23rem] space-y-5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#5c2c31]/50">
                          {GIFT_MESSAGE_EMOJI_GROUPS.map((group) => (
                            <div key={group.key}>
                              <div className="mb-2.5 flex items-center gap-2">
                                <span className="h-3 w-0.5 rounded-full bg-[#ce4a60]/40" />
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a97d77]">
                                  {t(`delivery.emojiGroups.${group.key}`, { defaultValue: group.key })}
                                </p>
                                <span className="h-px flex-1 bg-gradient-to-r from-[#ce4a60]/10 to-transparent" />
                              </div>
                              <div className="grid grid-cols-7 gap-2">
                                {group.emojis.map((emoji) => (
                                  <button
                                    key={`${group.key}-${emoji}`}
                                    type="button"
                                    onClick={() => insertGiftEmoji(emoji)}
                                    aria-label={`${t("delivery.addEmoji")} ${emoji}`}
                                    className="group/emojibtn relative inline-flex h-12 items-center justify-center rounded-2xl border border-[#754048]/35 bg-[linear-gradient(145deg,#211013,#2c1318)] text-[1.45rem] shadow-[0_6px_14px_rgba(0,0,0,0.16)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.06] hover:border-[#ce4a60]/60 hover:bg-[#34151b] hover:shadow-[0_10px_22px_rgba(206,74,96,0.22)]"
                                  >
                                    <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/emojibtn:opacity-100 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(206,74,96,0.15),transparent)]" />
                                    <span className="relative">{emoji}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bottom hint */}
                        <div className="relative mt-5 flex items-center justify-center gap-2">
                          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ce4a60]/10 to-transparent" />
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#8b6769]">{t("delivery.clickToInsert")}</span>
                          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ce4a60]/10 to-transparent" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gift message preview card */}
                  {giftMessage.trim() ? (
                    <div className="mt-4 step-enter">
                      <GiftMessageCard message={giftMessage} className="mt-0" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            ) : null}

            {/* ===== Action Buttons ===== */}
            <div className="step-enter step-delay-3 relative mt-7 space-y-3">
              <div className="rounded-2xl border border-[#4f2224]/45 bg-[linear-gradient(145deg,rgba(23,8,11,0.8),rgba(12,4,6,0.88))] px-4 py-3 text-sm text-[#d3afa8] transition-all duration-300 hover:border-[#6d3a3e]/50">
                {t("delivery.stepCounter", { current: currentStep, total: checkoutSteps.length })} • {currentStepMeta.label}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentStep === 1 ? (
                  <Link
                    to="/cart"
                    className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl border border-[#7f5a3b]/40 bg-[linear-gradient(135deg,#110608,#1a0b0d)] text-lg font-semibold uppercase tracking-[0.08em] text-[#f0cfa5] transition-all duration-300 hover:border-[#f0cfa5]/30 hover:shadow-[0_4px_20px_rgba(240,207,165,0.08)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center gap-2">{t("delivery.backToOrder")}</span>
                    <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl border border-[#7f5a3b]/40 bg-[linear-gradient(135deg,#110608,#1a0b0d)] text-lg font-semibold uppercase tracking-[0.08em] text-[#f0cfa5] transition-all duration-300 hover:border-[#f0cfa5]/30 hover:shadow-[0_4px_20px_rgba(240,207,165,0.08)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center gap-2">{t("delivery.previousStep")}</span>
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => void goToNextStep()}
                    className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#ce4a60]/30 bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] text-lg font-semibold uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(206,74,96,0.25)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(206,74,96,0.4)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center gap-2">{t("delivery.nextStep")}</span>
                    <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={createOrder.isPending}
                    className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#ce4a60]/30 bg-gradient-to-r from-[#8f1220] via-[#b51c2f] to-[#cb2e45] text-lg font-semibold uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(206,74,96,0.25)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(206,74,96,0.4)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {createOrder.isPending ? (
                        <>
                          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t("delivery.sending")}
                        </>
                      ) : (
                        <>
                          <HiOutlineShoppingBag className="text-xl" />
                          {t("delivery.placeOrder")}
                        </>
                      )}
                    </span>
                    <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* ==================== RIGHT – ORDER SUMMARY ==================== */}
        <aside className="space-y-6">
          {/* Order Summary Card */}
          <div className="group/summary relative overflow-hidden rounded-[1.8rem] border border-[#4f2224]/60 bg-[linear-gradient(160deg,#1b080a,#0c0304_75%)] shadow-[0_20px_60px_rgba(8,3,4,0.4)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_25px_80px_rgba(206,74,96,0.06)]">
            <div className="pointer-events-none absolute -inset-1 rounded-[1.8rem] bg-gradient-to-br from-[#ce4a60]/5 via-transparent to-transparent opacity-30" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#ce4a60]/8 blur-[50px] animate-pulse-glow" />
            <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] bg-gradient-to-br from-[#ce4a60]/2 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/summary:opacity-100" />

            <div className="relative p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.6),rgba(15,6,8,0.7))] transition-all duration-300">
                  <HiOutlineShoppingBag className="text-lg text-[#ce4a60] animate-float" />
                </div>
                <p className="font-cormorant text-3xl text-white">{t("delivery.orderSummary")}</p>
              </div>

              {/* Bouquet Info */}
              <div className="group/bouquet relative mt-5 overflow-hidden rounded-2xl border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(28,10,13,0.5),rgba(15,6,8,0.5))] p-4 transition-all duration-300 hover:border-[#6d3a3e]/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                <div className="flex items-start gap-4">
                  {primaryItem.bouquet.image && (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#4f2224]/30 transition-all duration-300 group-hover/bouquet:border-[#ce4a60]/30 group-hover/bouquet:shadow-[0_0_16px_rgba(206,74,96,0.1)]">
                      <img
                        src={getBouquetImageForSize(primaryItem.bouquet, selectedSizeOption?.key)}
                        alt={primaryItem.bouquet.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/bouquet:scale-110"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-[#f3d8cf]">{primaryItem.bouquet.name}</p>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#d1b0a8]">{t("delivery.size")}</span>
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
                            } animate-pulse-glow`}
                          />
                          {selectedSizeOption?.label ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#d1b0a8]">{t("delivery.quantity")}</span>
                        <span className="text-white">× {quantity}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#d1b0a8]">{t("delivery.addonsLabel")}</span>
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
                            <span className="text-[#a8857e]">{t("delivery.noAddons")}</span>
                          )}
                        </span>
                      </div>
                      {selectedAddonOptions.length ? (
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          {selectedAddonOptions.map((addon) => (
                            <div key={addon.id} className="group/addon overflow-hidden rounded-xl border border-[#4f2224]/50 bg-[#140608] transition-all duration-300 hover:border-[#6d3a3e]/50">
                              <img
                                src={addon.image}
                                alt={addon.name}
                                className="h-16 w-full object-cover transition-transform duration-300 group-hover/addon:scale-110"
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
              <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#8a303f]/50 bg-[linear-gradient(135deg,rgba(37,9,15,0.95),rgba(25,6,10,0.95))] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-[#ce4a60]/40">
                <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#ce4a60]/5 to-transparent opacity-30" />
                <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-[#ce4a60]/10 blur-[40px] animate-pulse-glow" />

                <p className="text-sm text-[#ff7d8d]">{t("delivery.expressDelivery")}</p>
                <p className="mt-1 text-sm text-[#d8b2aa]">{t("delivery.orderWithin")}</p>

                <div className="relative mt-3">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#a06a72]">{t("delivery.totalLabel")}</p>
                  <p className="mt-0.5 text-4xl font-bold text-white transition-all duration-300 hover:text-[#ffd5dc]">{formatPrice(String(finalPrice))}</p>

                  <div className="mt-3 flex items-center justify-center gap-3 text-xs text-[#a06a72]">
                    <span>{t("delivery.unit")}: {formatPrice(String(unitPriceWithoutAddons))}</span>
                    <span className="h-3 w-px bg-[#4f2224]/50" />
                    <span>{t("delivery.addonsLabel")}: {formatPrice(String(addonsTotal))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Preview Card */}
          <div className="group/preview overflow-hidden rounded-[1.8rem] border border-[#4f2224]/60 bg-[linear-gradient(160deg,#19080a,#0c0304_75%)] shadow-[0_20px_60px_rgba(8,3,4,0.4)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_25px_80px_rgba(206,74,96,0.06)]">
            {/* Header */}
            <div className="relative border-b border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(216,78,101,0.18),transparent_58%)] p-6 transition-all duration-300">
              <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-[#ce4a60]/8 blur-[40px] animate-float" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#4f2224]/50 bg-[linear-gradient(135deg,rgba(25,9,11,0.5),rgba(13,5,7,0.6))]">
                    <HiOutlineMapPin className="text-sm text-[#d8b2aa]" />
                  </div>
                  <div>
                    <p className="font-cormorant text-2xl text-white">{t("delivery.deliveryPreview")}</p>
                    <p className="text-sm text-[#d5b0a8]">{t("delivery.deliveryPreviewDesc")}</p>
                  </div>
                </div>
                {(selectedSavedAddress?.title ?? preferredAddress?.title) ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#355740]/40 bg-[linear-gradient(135deg,#10261a,#0b1f13)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#b4f1cb] shadow-[0_2px_10px_rgba(16,38,26,0.3)] animate-slide-right">
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
                <div className="group/map relative overflow-hidden rounded-2xl border border-[#4b2326]/50 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-[#6d3a3e]/60 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                  <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-white/[0.03]" />
                  <iframe
                    title={t("delivery.mapPreviewTitle")}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedCoords[1] - 0.01}%2C${selectedCoords[0] - 0.01}%2C${selectedCoords[1] + 0.01}%2C${selectedCoords[0] + 0.01}&layer=mapnik&marker=${selectedCoords[0]}%2C${selectedCoords[1]}`}
                    className="h-48 w-full transition-all duration-500 group-hover/map:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 z-10 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
                    {t("delivery.pinLocation")}
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-dashed border-[#5c2c31]/50 bg-[linear-gradient(135deg,#130709,#1a0b0e)] px-6 py-10 text-center transition-all duration-300 hover:border-[#7f4a4e]/40 hover:bg-[linear-gradient(135deg,#17080b,#1f0c0f)]">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#5c2c31]/40 bg-[linear-gradient(135deg,#1d0c0f,#14080a)] transition-all duration-300 group-hover/preview:border-[#7f4a4e]/50">
                    <HiOutlineMapPin className="text-xl text-[#c39c95]" />
                  </div>
                  <p className="text-sm text-[#c39c95]">
                    {t("delivery.mapPinNotSet")}
                  </p>
                </div>
              )}

              {/* Address Info */}
              <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#4b2326]/50 bg-[linear-gradient(135deg,#120607,#1a0a0d)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 hover:border-[#6d3a3e]/50">
                <div className="pointer-events-none absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-[#4b2326]/20 blur-[30px]" />

                <div className="relative">
                  <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#b88d86]">
                    <HiCheckCircle className="text-xs text-[#72d79d]" />
                    {t("delivery.selectedAddress")}
                  </p>
                  <p className="mt-2 text-lg leading-7 text-white">{address || t("delivery.noAddress")}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSavedAddress?.is_primary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#3a1d0f,#4a2515)] px-2.5 py-1 text-xs text-[#ffd59a] shadow-[0_2px_8px_rgba(58,29,15,0.3)]">
                        <HiCheckCircle className="text-[10px]" />
                        {t("delivery.primaryAddress")}
                      </span>
                    ) : null}
                    {selectedCoords ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#4b2326]/30 bg-[linear-gradient(135deg,#1f1012,#2d1619)] px-2.5 py-1 text-xs text-[#ddb8b0]">
                        📌 {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                      </span>
                    ) : null}
                  </div>

                  {notes?.trim() ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#4b2326]/30 bg-[#0d0406]/50 px-3 py-2.5 transition-all duration-300 hover:border-[#6d3a3e]/40">
                      <HiOutlinePencilSquare className="mt-0.5 shrink-0 text-xs text-[#b88d86]" />
                      <p className="text-sm leading-6 text-[#cda79f]">{notes.trim()}</p>
                    </div>
                  ) : null}

                  {giftMessage?.trim() ? <GiftMessageCard message={giftMessage} className="mt-3 step-enter" compact /> : null}
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
                  <p className="font-cormorant text-2xl text-white">{t("delivery.locationPicker")}</p>
                  <p className="text-sm text-[#cfafa8]">{t("delivery.locationPickerDesc")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#714243]/40 text-[#f6d6ce] transition-all duration-200 hover:border-[#ce4a60]/40 hover:bg-[#ce4a60]/10 hover:text-[#ce4a60] hover:rotate-90"
              >
                <HiXMark className="text-lg" />
              </button>
            </div>

            <div className="border-b border-[#643335]/30 px-5 py-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <label className="group/search relative block">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <HiOutlineMagnifyingGlass className="text-[#b08d86] transition-colors duration-200 group-focus-within/search:text-[#ce4a60]" />
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
                    placeholder={t("delivery.searchAddressPlaceholder")}
                    className="h-12 w-full rounded-2xl border border-[#6b3a3c] bg-[#180709] pl-11 pr-4 text-white outline-none placeholder:text-[#8c6666] transition-all duration-200 focus:border-[#ce4a60]/50 focus:shadow-[0_0_0_3px_rgba(206,74,96,0.1)] hover:border-[#8c4651]"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleLocationSearch()}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] transition-all duration-200 hover:border-[#ce4a60]/50 hover:bg-[#3a151b] hover:text-white hover:shadow-[0_4px_16px_rgba(206,74,96,0.1)] active:scale-95"
                  >
                    {isSearchingLocation ? t("delivery.searching") : t("delivery.search")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUseCurrentLocation()}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] transition-all duration-200 hover:border-[#ce4a60]/50 hover:bg-[#3a151b] hover:text-white hover:shadow-[0_4px_16px_rgba(206,74,96,0.1)] active:scale-95"
                  >
                    {isLocatingUser ? t("delivery.locating") : t("delivery.myLocation")}
                  </button>
                </div>
              </div>

              {locationResults.length ? (
                <div className="mt-3 max-h-40 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#5c2c31]/50">
                  {locationResults.map((result) => (
                    <button
                      key={`${result.lat}-${result.lon}`}
                      type="button"
                      onClick={() => {
                        const coords: [number, number] = [Number(result.lat), Number(result.lon)];
                        leafletMapRef.current?.setView(coords, DETAIL_MAP_ZOOM);
                        ensureLeafletMarker(coords);
                        leafletMarkerRef.current?.setLatLng(coords);
                        void applyLocationSelection(coords[0], coords[1], result.display_name);
                        setLocationResults([]);
                        setLocationQuery(result.display_name);
                      }}
                      className="block w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-left text-sm text-[#f3dbd6] transition-all duration-200 hover:border-[#ce4a60]/40 hover:bg-[#221014] hover:-translate-y-0.5 active:translate-y-0"
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
              <span>{t("delivery.mapClickHint")}</span>
              {isResolvingAddress ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("delivery.resolvingAddress")}
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