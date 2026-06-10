import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import shopApplicationHero from "../../assets/image.png";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowUpTray,
  HiOutlineBuildingStorefront,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
  HiOutlineRocketLaunch,
  HiOutlineGlobeAlt,
  HiOutlineHeart,
  HiOutlineStar,
  HiOutlineFlag,
  HiOutlineDocumentText
} from "react-icons/hi2";
import useContextPro from "../../hooks/useContextPro";
import { useCreateShopApplication, useMyLatestShopApplication, useUploadImage } from "../../hooks/useCatalog";
import {
  CITY_MAP_ZOOM,
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
import { getPrimaryRole } from "../../utils/roles";
import { normalizeInstagramValue, normalizeTelegramValue } from "../../utils/social";

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

type ShopApplicationFormValues = {
  shop_name: string;
  owner_full_name: string;
  phone: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  instagram: string;
  telegram: string;
  description: string;
  logo: string;
  banner: string;
};

const statusTone = {
  pending:
    "border-[#9c7c4a]/60 bg-[linear-gradient(135deg,rgba(60,35,15,0.95),rgba(40,22,8,0.98))] text-[#f5d99b] shadow-[0_0_20px_rgba(245,217,155,0.06)]",
  approved:
    "border-[#3d8a6a]/50 bg-[linear-gradient(135deg,rgba(18,50,35,0.95),rgba(10,32,22,0.98))] text-[#a3f0c9] shadow-[0_0_20px_rgba(163,240,201,0.06)]",
  rejected:
    "border-[#a04a56]/60 bg-[linear-gradient(135deg,rgba(55,20,25,0.95),rgba(35,12,16,0.98))] text-[#f5b5c0] shadow-[0_0_20px_rgba(245,181,192,0.06)]",
} as const;

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

function ShopApplicationPage() {
  const { t } = useTranslation();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const leafletMarkerRef = useRef<LeafletMarker | null>(null);
  const [uploadingField, setUploadingField] = useState<"logo" | "banner" | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<SearchLocationResult[]>([]);
  const {
    state: { user },
    refreshUser,
  } = useContextPro();
  const latestApplicationQuery = useMyLatestShopApplication();
  const createApplicationMutation = useCreateShopApplication();
  const uploadImageMutation = useUploadImage();
  const form = useForm<ShopApplicationFormValues>({
    defaultValues: {
      shop_name: "",
      owner_full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
      city: "",
      address: "",
      latitude: null,
      longitude: null,
      instagram: "",
      telegram: "",
      description: "",
      logo: "",
      banner: "",
    },
  });

  const logo = form.watch("logo");
  const banner = form.watch("banner");
  const address = form.watch("address");
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const latestApplication = latestApplicationQuery.data;
  const primaryRole = getPrimaryRole(user);
  const isOwner = primaryRole === "owner";
  const canSubmitApplication = primaryRole === "customer";
  const shellCardClass =
    "relative overflow-hidden rounded-[2.4rem] border border-[#5d232a]/55 bg-[linear-gradient(180deg,rgba(28,8,10,0.92),rgba(13,4,6,0.98))] shadow-[0_30px_100px_rgba(0,0,0,0.34)]";
  const formCardClass =
    "relative overflow-hidden rounded-[2.4rem] border border-[#4b1e24]/70 bg-[linear-gradient(180deg,rgba(24,7,9,0.96),rgba(12,4,6,0.99))] shadow-[0_30px_100px_rgba(0,0,0,0.42)]";
  const innerSectionClass =
    "rounded-[1.75rem] border border-[#5a252c]/70 bg-[linear-gradient(180deg,rgba(24,8,11,0.95),rgba(14,5,7,0.98))] p-4 sm:p-5";
  const inputClass =
    "mt-2 h-12 w-full rounded-2xl border border-[#5c2a30] bg-[rgba(17,5,7,0.72)] px-4 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-all duration-300 placeholder:text-[#8f6d66] focus:border-[#ff8fa3]/60 focus:bg-[rgba(25,8,10,0.9)] focus:shadow-[0_0_0_4px_rgba(255,143,163,0.08)]";
  const softLabelClass = "mb-1.5 block text-xs text-[#e8cac4] sm:mb-2 sm:text-sm";
  const subtleActionClass =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#8c4651] bg-[#2a1015] px-4 text-xs font-semibold text-[#f3c4cb] transition-all duration-300 hover:border-[#ff8fa3]/40 hover:bg-[#311115] hover:text-white active:scale-95 sm:h-11 sm:gap-2 sm:px-5 sm:text-sm";

  const whyJoinItems = [
    {
      title: t("profile.shopApplication.whyJoin.reachTitle"),
      description: t("profile.shopApplication.whyJoin.reachDesc"),
      icon: HiOutlineSparkles,
    },
    {
      title: t("profile.shopApplication.whyJoin.trustedTitle"),
      description: t("profile.shopApplication.whyJoin.trustedDesc"),
      icon: HiOutlineCheckBadge,
    },
    {
      title: t("profile.shopApplication.whyJoin.manageTitle"),
      description: t("profile.shopApplication.whyJoin.manageDesc"),
      icon: HiOutlineBuildingStorefront,
    },
    {
      title: t("profile.shopApplication.whyJoin.growTitle"),
      description: t("profile.shopApplication.whyJoin.growDesc"),
      icon: HiOutlineClock,
    },
  ];

  const processSteps = [
    {
      number: "01",
      title: t("profile.shopApplication.process.submitTitle"),
      description: t("profile.shopApplication.process.submitDesc"),
    },
    {
      number: "02",
      title: t("profile.shopApplication.process.reviewTitle"),
      description: t("profile.shopApplication.process.reviewDesc"),
    },
    {
      number: "03",
      title: t("profile.shopApplication.process.approvalTitle"),
      description: t("profile.shopApplication.process.approvalDesc"),
    },
    {
      number: "04",
      title: t("profile.shopApplication.process.launchTitle"),
      description: t("profile.shopApplication.process.launchDesc"),
    },
  ];

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
    ensureLeafletMarker(coords);
    form.setValue("latitude", coords[0], { shouldDirty: true });
    form.setValue("longitude", coords[1], { shouldDirty: true });
    setIsResolvingAddress(true);

    try {
      const data = await reverseGeocode(coords[0], coords[1]);
      form.setValue("address", data.displayName || fallbackAddress || `${coords[0]}, ${coords[1]}`, { shouldDirty: true, shouldValidate: true });
      const city = data.city;
      if (city) {
        form.setValue("city", city, { shouldDirty: true });
      }
    } catch {
      form.setValue("address", fallbackAddress || `${coords[0]}, ${coords[1]}`, { shouldDirty: true, shouldValidate: true });
      toast.error(t("profile.shopApplication.toasts.addressResolveError"));
    } finally {
      setIsResolvingAddress(false);
    }
  }, [ensureLeafletMarker, form, t]);

  useEffect(() => {
    if (!mapOpen || !mapHostRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    void injectLeafletAssets()
      .then(() => {
        if (cancelled || !window.L || !mapHostRef.current) return;

        const hasSelectedCoordinates = latitude !== null && longitude !== null;
        const initial: [number, number] = hasSelectedCoordinates
          ? [latitude, longitude]
          : DEFAULT_MAP_CENTER;

        const map = window.L.map(mapHostRef.current).setView(initial, hasSelectedCoordinates ? CITY_MAP_ZOOM : DEFAULT_MAP_ZOOM);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        leafletMapRef.current = map;
        leafletMarkerRef.current = hasSelectedCoordinates
          ? window.L.marker(initial, {
            icon: window.L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            }),
          }).addTo(map)
          : null;

        requestAnimationFrame(() => {
          map.invalidateSize({ pan: false, animate: false });
        });

        if ("ResizeObserver" in window) {
          resizeObserver = new ResizeObserver(() => {
            map.invalidateSize({ pan: false, animate: false });
          });
          resizeObserver.observe(mapHostRef.current);
        }

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
      })
      .catch(() => {
        toast.error("Mapni yuklab bo'lmadi");
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      leafletMarkerRef.current?.remove?.();
      leafletMarkerRef.current = null;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [applyLocationSelection, latitude, longitude, mapOpen]);

  useEffect(() => {
    if (!mapOpen || latitude === null || longitude === null) return;

    const coords: [number, number] = [latitude, longitude];
    leafletMapRef.current?.setView(coords, DETAIL_MAP_ZOOM);
    if (!leafletMarkerRef.current && leafletMapRef.current && window.L) {
      leafletMarkerRef.current = window.L.marker(coords, {
        icon: window.L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        }),
      }).addTo(leafletMapRef.current);
      return;
    }

    leafletMarkerRef.current?.setLatLng(coords);
  }, [latitude, longitude, mapOpen]);

  const handleImageUpload = async (field: "logo" | "banner", event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadImageMutation.isPending) return;

    try {
      setUploadingField(field);
      const uploaded = await uploadImageMutation.mutateAsync(file);
      form.setValue(field, uploaded.url, { shouldDirty: true });
      toast.success(
        field === "logo"
          ? t("profile.shopApplication.toasts.logoUploaded")
          : t("profile.shopApplication.toasts.bannerUploaded"),
      );
    } catch {
      toast.error(t("profile.shopApplication.toasts.imageUploadError"));
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (createApplicationMutation.isPending) return;
    if (!values.address.trim()) {
      toast.error(t("profile.shopApplication.toasts.pickAddressFromMap"));
      return;
    }

    try {
      await createApplicationMutation.mutateAsync({
        shop_name: values.shop_name.trim(),
        owner_full_name: values.owner_full_name.trim(),
        phone: values.phone.trim(),
        city: values.city.trim() || undefined,
        address: values.address.trim(),
        latitude: values.latitude !== null ? String(values.latitude) : null,
        longitude: values.longitude !== null ? String(values.longitude) : null,
        instagram: values.instagram.trim() ? normalizeInstagramValue(values.instagram) : undefined,
        telegram: values.telegram.trim() ? normalizeTelegramValue(values.telegram) : undefined,
        description: values.description.trim() || undefined,
        logo: values.logo.trim() || undefined,
        banner: values.banner.trim() || undefined,
      });
      await refreshUser();
      toast.success(t("profile.shopApplication.toasts.applicationSubmitted"));
      await latestApplicationQuery.refetch();
    } catch {
      toast.error(t("profile.shopApplication.toasts.applicationSubmitError"));
    }
  });

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) {
      toast.error(t("profile.shopApplication.toasts.searchAddressRequired"));
      return;
    }

    try {
      setIsSearchingLocation(true);
      const data = await searchLocations(locationQuery.trim());
      setLocationResults(data);
      if (!data.length) {
        toast.error(t("profile.shopApplication.toasts.locationNotFound"));
      }
    } catch {
      toast.error(t("profile.shopApplication.toasts.locationSearchError"));
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t("profile.shopApplication.toasts.geolocationUnsupported"));
      return;
    }

    try {
      setIsLocatingUser(true);
      const coords = await getCurrentUserCoordinates();
      leafletMapRef.current?.setView(coords, DETAIL_MAP_ZOOM);
      ensureLeafletMarker(coords);
      leafletMarkerRef.current?.setLatLng(coords);
      await applyLocationSelection(coords[0], coords[1], "Current location");
    } catch (error) {
      const reason = getGeolocationErrorReason(error);
      if (reason === "permission_denied") {
        toast.error(t("profile.shopApplication.toasts.geolocationPermissionDenied"));
      } else if (reason === "timeout") {
        toast.error(t("profile.shopApplication.toasts.geolocationTimeout"));
      } else if (reason === "position_unavailable") {
        toast.error(t("profile.shopApplication.toasts.geolocationUnavailable"));
      } else {
        toast.error(t("profile.shopApplication.toasts.currentLocationError"));
      }
    } finally {
      setIsLocatingUser(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050102] px-3 pb-20 pt-32 text-[#fff6f4] sm:px-5 sm:pt-36 lg:px-8 lg:pt-40 xl:px-10">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 top-28 h-80 w-80 animate-pulse rounded-full bg-[#cb5c57]/10 blur-[120px]" />
        <div className="absolute -right-28 top-12 h-72 w-72 animate-pulse rounded-full bg-[#ff9b88]/8 blur-[110px]" style={{ animationDelay: "1.2s" }} />
        <div className="absolute bottom-0 left-1/2 h-96 w-[48rem] -translate-x-1/2 animate-pulse rounded-full bg-[#5a1d28]/10 blur-[140px]" style={{ animationDelay: "0.6s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:84px_84px] opacity-[0.06]" />
        {/* Floating decorative particles */}
        <div className="absolute left-[12%] top-[20%] h-1.5 w-1.5 rounded-full bg-[#ff9b88]/20 blur-sm" />
        <div className="absolute right-[18%] top-[35%] h-2 w-2 rounded-full bg-[#cb5c57]/15 blur-sm" />
        <div className="absolute left-[25%] bottom-[30%] h-1 w-1 rounded-full bg-[#f2be7f]/20 blur-sm" />
        <div className="absolute right-[30%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-[#ff8fa3]/15 blur-sm" />
      </div>

      <div className="relative mx-auto max-w-[1600px]">
        {/* Page Header - Elegant Title Section */}
        <div className="mb-8 mt-2 animate-[fadeIn_0.6s_ease-out] text-center sm:mb-10 sm:mt-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#9a4a54]/30 bg-[#1f0c0e]/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#eab8b0] backdrop-blur-xl sm:px-5 sm:text-xs">
            <HiOutlineSparkles className="text-[#f2be7f]" />
            {t("profile.shopApplication.featuredVisual")}
          </p>
          <h1 className="mt-4 bg-gradient-to-r from-[#fff8f4] via-[#ffd7cc] to-[#f2be7f] bg-clip-text font-cormorant text-5xl leading-[0.95] text-transparent sm:text-6xl lg:text-7xl">
            {t("profile.shopApplication.leftTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#d4b4ab] sm:text-base sm:leading-8">
            {t("profile.shopApplication.leftDescription")}
          </p>
        </div>

        {/* Steps badge row */}
        <div className="mb-10 flex animate-[fadeIn_0.8s_ease-out] flex-wrap items-center justify-center gap-3">
          {[
            { icon: HiOutlineDocumentText, title: t("profile.shopApplication.steps.apply.title") },
            { icon: HiOutlineClock, title: t("profile.shopApplication.steps.review.title") },
            { icon: HiOutlineRocketLaunch, title: t("profile.shopApplication.steps.launch.title") },
          ].map((step) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.title}
                className="group flex items-center gap-3 rounded-2xl border border-[#a0505a]/30 bg-[linear-gradient(135deg,rgba(30,10,13,0.85),rgba(18,6,8,0.92))] px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-[#ff8fa3]/30 hover:shadow-[0_8px_32px_rgba(203,92,87,0.12)] sm:px-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b05a65]/30 bg-[#2a0f12] text-[#f2be7f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 group-hover:bg-[#391116] group-hover:text-[#ffd59e]">
                  <StepIcon className="text-sm sm:text-base" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#f5ddd6]">{step.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-[0.82fr_minmax(0,1.16fr)_0.76fr] xl:items-start xl:gap-5">

          {/* Left Hero Column */}
          <section className={`${shellCardClass} group xl:sticky xl:top-24 xl:min-h-[calc(100vh-7rem)]`}>
            <img
              src={shopApplicationHero}
              alt={t("profile.shopApplication.heroAlt")}
              className="absolute inset-0 h-full w-full object-cover object-left transition-all duration-700 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_30%),linear-gradient(180deg,rgba(6,1,2,0.18),rgba(6,1,2,0.72))]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050102] via-transparent to-transparent opacity-70" />
            <div className="relative z-10 flex h-full min-h-[30rem] flex-col justify-between px-5 pb-5 pt-24 sm:px-7 sm:pb-7 sm:pt-28 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 pr-3">
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#fff0ea] shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:text-xs">
                    <HiOutlineBuildingStorefront className="text-[#f2be7f]" />
                    {t("profile.shopApplication.becomeSeller")}
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-medium text-[#f8e4da] shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:bg-black/45 hover:text-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
                >
                  <HiOutlineArrowLeft className="text-sm" />
                  {t("profile.shopApplication.backToHome")}
                </Link>
              </div>
              <div className="max-w-[32rem] rounded-[2rem] border border-white/10 bg-black/30 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-7 lg:mt-0">
                <h2 className="font-cormorant text-4xl leading-[0.92] text-white sm:text-5xl lg:text-[4rem]">
                  {t("profile.shopApplication.leftTitle")}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#f2d2c8] sm:text-base">
                  {t("profile.shopApplication.leftDescription")}
                </p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: HiOutlineDocumentText, label: t("profile.shopApplication.steps.apply.title") },
                  { icon: HiOutlineCheckBadge, label: t("profile.shopApplication.steps.review.title") },
                  { icon: HiOutlineRocketLaunch, label: t("profile.shopApplication.steps.launch.title") },
                ].map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.label} className="group/step rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:border-[#ff8fa3]/30 hover:bg-black/40">
                      <StepIcon className="mb-1.5 text-sm text-[#f2be7f] transition-all duration-300 group-hover/step:scale-110" />
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[#cda89f] transition-all duration-300 group-hover/step:text-[#f2be7f]">{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Form Column */}
          <section className={`${formCardClass} p-4 sm:p-6 lg:p-7`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(203,92,87,0.09),transparent_28%)]" />
            <div className="relative flex h-full flex-col">
              {/* Form Header */}
              <div className="flex flex-col items-center gap-4 border-b border-[#5b2529]/55 pb-6 pt-1 sm:pb-7 sm:pt-0 lg:flex-row lg:justify-between">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 self-start rounded-full border border-[#6e2f37]/60 bg-[#1c0a0c]/82 px-4 py-2 text-sm font-semibold text-[#f0c2bb] backdrop-blur-md transition-all duration-300 hover:border-[#ff8fa3]/40 hover:bg-[#2b0f12] hover:text-white"
                >
                  <HiOutlineArrowLeft className="text-sm" />
                  {t("profile.shopApplication.backToHome")}
                </Link>
                <div className="text-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#d9b0a8] sm:text-xs">
                    {t("profile.shopApplication.pageEyebrow")}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <HiOutlineSparkles className="text-lg text-[#f2be7f]" />
                    <h2 className="font-cormorant text-3xl text-white sm:text-4xl">
                      {t("profile.shopApplication.pageTitle")}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#c7a69d]">
                    {t("profile.shopApplication.pageSubtitle")}
                  </p>
                </div>
                <Link
                  to={user ? "/profile" : "/login"}
                  className="inline-flex items-center gap-2 self-end rounded-full border border-[#6e2f37]/60 bg-[#1c0a0c]/82 px-4 py-2 text-sm font-semibold text-[#f0c2bb] backdrop-blur-md transition-all duration-300 hover:border-[#ff8fa3]/40 hover:bg-[#2b0f12] hover:text-white"
                >
                  <HiOutlineUserCircle className="text-base" />
                  {user ? t("profile.shopApplication.myAccount") : t("profile.shopApplication.loginToAccount")}
                </Link>
              </div>

              {/* Role Restriction Notice */}
              {!canSubmitApplication ? (
                <div className="mt-5 animate-[slideUp_0.4s_ease-out] rounded-[1.5rem] border border-[#2f6d55]/70 bg-[linear-gradient(135deg,rgba(16,39,30,0.96),rgba(9,24,18,0.98))] p-5 text-[#dff8eb] shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ffffff1a] bg-[#0d2c1f]">
                      <HiOutlineCheckBadge className="text-xl text-[#91e2b9]" />
                    </span>
                    <div>
                      <p className="font-semibold">
                        {isOwner ? t("profile.shopApplication.alreadyOwnerTitle") : t("profile.shopApplication.customerOnlyTitle")}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[#c5ecd8]">
                        {isOwner
                          ? t("profile.shopApplication.alreadyOwnerDesc")
                          : primaryRole === "admin"
                            ? t("profile.shopApplication.adminCannotApply")
                            : t("profile.shopApplication.customerOnlyDesc")}
                      </p>
                    </div>
                  </div>
                  {isOwner ? (
                    <Link
                      to="/owner/dashboard"
                      className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-white to-[#f5f0ec] px-6 text-sm font-semibold text-[#163223] shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.18)]"
                    >
                      <HiOutlineBuildingStorefront />
                      {t("profile.shopApplication.openDashboard")}
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {/* Form */}
            <form className="mt-6 space-y-5" onSubmit={onSubmit}>
                {/* Section 1: Shop Information */}
                <section className={`${innerSectionClass} animate-[slideUp_0.4s_ease-out]`}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#6e2f37]/60 bg-[linear-gradient(135deg,#1b0b0d,#231013)] text-[#f2be7f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <HiOutlineBuildingStorefront className="text-base sm:text-lg" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9b0a8] sm:text-xs">
                        {t("profile.shopApplication.shopInformationTitle")}
                      </p>
                      <p className="text-xs text-[#b88d86] sm:text-sm">{t("profile.shopApplication.shopInformationDesc")}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={softLabelClass}>{t("profile.shopApplication.shopName")}</span>
                      <input
                        {...form.register("shop_name", { required: true })}
                        className={`${inputClass} transition-all duration-300 hover:border-[#c06873]/70`}
                        placeholder={t("profile.shopApplication.placeholders.shopName")}
                      />
                    </label>
                    <label className="block">
                      <span className={softLabelClass}>{t("profile.shopApplication.city")}</span>
                      <input
                        {...form.register("city")}
                        className={`${inputClass} transition-all duration-300 hover:border-[#c06873]/70`}
                        placeholder={t("profile.shopApplication.placeholders.city")}
                      />
                    </label>
                    <label className="block">
                      <span className={softLabelClass}>{t("profile.shopApplication.phone")}</span>
                      <input
                        {...form.register("phone", { required: true })}
                        className={`${inputClass} transition-all duration-300 hover:border-[#c06873]/70`}
                        placeholder={t("profile.shopApplication.placeholders.phone")}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={softLabelClass}>{t("profile.shopApplication.address")}</span>
                      <div className="space-y-3">
                        <div className="rounded-[1.5rem] border border-[#5a262c]/70 bg-[linear-gradient(135deg,rgba(24,8,11,0.95),rgba(14,5,7,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          <div className="flex items-center gap-2">
                            <HiOutlineMapPin className="text-[#f2be7f] max-sm:hidden" />
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#b88d86] sm:text-xs">
                              {t("profile.shopApplication.selectedAddress")}
                            </p>
                          </div>
                          <div className="mt-2 flex items-start gap-2">
                            <p className="min-h-[2rem] flex-1 text-sm leading-5 text-white sm:min-h-10 sm:text-base">
                              {address || (
                                <span className="italic text-[#9a726a]">
                                  {t("profile.shopApplication.noAddressSelected")}
                                </span>
                              )}
                            </p>
                            {latitude !== null && longitude !== null ? (
                              <span className="hidden shrink-0 rounded-lg border border-[#5a262c]/60 bg-[#0f0507] px-2 py-0.5 text-[10px] font-mono text-[#caa39b] sm:block">
                                {latitude.toFixed(6)}, {longitude.toFixed(6)}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button type="button" onClick={() => setMapOpen(true)} className={subtleActionClass}>
                              <HiOutlineMapPin />
                              {latitude !== null && longitude !== null ? t("profile.shopApplication.changeOnMap") : t("profile.shopApplication.pickFromMap")}
                            </button>
                            {latitude !== null && longitude !== null ? (
                              <span className="text-[10px] font-mono text-[#caa39b] sm:hidden">
                                {latitude.toFixed(6)}, {longitude.toFixed(6)}
                              </span>
                            ) : null}
                            {isResolvingAddress ? (
                              <span className="flex items-center gap-1.5 text-[10px] text-[#f2be7f] sm:text-xs">
                                <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-[#f2be7f]" />
                                {t("profile.shopApplication.resolvingAddress")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <input
                          {...form.register("address", { required: true })}
                          readOnly
                          className="h-11 w-full rounded-2xl border border-[#5c2a30] bg-[rgba(14,5,7,0.82)] px-4 text-xs text-[#d5b7b0] outline-none transition-all duration-300 placeholder:text-[#7f605a] focus:border-[#ff8fa3]/50 focus:shadow-[0_0_0_4px_rgba(255,143,163,0.06)] sm:h-12 sm:text-sm"
                          placeholder={t("profile.shopApplication.placeholders.addressFromMap")}
                        />
                      </div>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={softLabelClass}>{t("profile.shopApplication.description")}</span>
                      <textarea
                        {...form.register("description")}
                        rows={4}
                        className="w-full rounded-2xl border border-[#5c2a30] bg-[rgba(17,5,7,0.72)] px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-all duration-300 placeholder:text-[#8f6d66] hover:border-[#c06873]/70 focus:border-[#ff8fa3]/60 focus:bg-[rgba(25,8,10,0.9)] focus:shadow-[0_0_0_4px_rgba(255,143,163,0.08)] sm:text-base"
                        placeholder={t("profile.shopApplication.placeholders.description")}
                      />
                    </label>
                  </div>
                </section>

                {/* Section 2: Owner Information */}
                <section className={`${innerSectionClass} animate-[slideUp_0.5s_ease-out]`}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#6e2f37]/60 bg-[linear-gradient(135deg,#1b0b0d,#231013)] text-[#f2be7f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <HiOutlineUserCircle className="text-base sm:text-lg" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9b0a8] sm:text-xs">{t("profile.shopApplication.ownerInformationTitle")}</p>
                      <p className="text-xs text-[#b88d86] sm:text-sm">{t("profile.shopApplication.ownerInformationDesc")}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={softLabelClass}>{t("profile.shopApplication.ownerFullName")}</span>
                      <input
                        {...form.register("owner_full_name", { required: true })}
                        className={`${inputClass} transition-all duration-300 hover:border-[#c06873]/70`}
                        placeholder={t("profile.shopApplication.placeholders.ownerFullName")}
                      />
                    </label>
                    <label className="block">
                      <span className={softLabelClass}>{t("profile.shopApplication.instagram")}</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b88d86] text-sm">@</span>
                        <input
                          {...form.register("instagram")}
                          className={`${inputClass} pl-8 transition-all duration-300 hover:border-[#c06873]/70`}
                          placeholder={t("profile.shopApplication.placeholders.instagram")}
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className={softLabelClass}>{t("profile.shopApplication.telegram")}</span>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b88d86] text-sm">@</span>
                        <input
                          {...form.register("telegram")}
                          className={`${inputClass} pl-8 transition-all duration-300 hover:border-[#c06873]/70`}
                          placeholder={t("profile.shopApplication.placeholders.telegram")}
                        />
                      </div>
                    </label>
                  </div>
                </section>

                {/* Section 3: Business Details / Media */}
                <section className={`${innerSectionClass} animate-[slideUp_0.6s_ease-out]`}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#6e2f37]/60 bg-[linear-gradient(135deg,#1b0b0d,#231013)] text-[#f2be7f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <HiOutlinePhoto className="text-base sm:text-lg" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9b0a8] sm:text-xs">{t("profile.shopApplication.businessDetailsTitle")}</p>
                      <p className="text-xs text-[#b88d86] sm:text-sm">{t("profile.shopApplication.businessDetailsDesc")}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { key: "logo", label: t("profile.shopApplication.logoUpload"), value: logo, inputRef: logoInputRef, icon: HiOutlineStar },
                      { key: "banner", label: t("profile.shopApplication.bannerUpload"), value: banner, inputRef: bannerInputRef, icon: HiOutlineFlag },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div key={item.key} className="group/upload rounded-[1.6rem] border border-[#5a262c]/70 bg-[linear-gradient(135deg,rgba(24,8,11,0.95),rgba(14,5,7,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-[#6a3f45]/80">
                          <div className="flex items-center gap-2 text-[#f2be7f]">
                            <ItemIcon className="text-sm sm:text-base" />
                            <p className="text-xs font-semibold text-[#f7dfd8] transition-all duration-300 group-hover/upload:text-white sm:text-sm">{item.label}</p>
                          </div>
                          <div className="mt-4 flex h-28 items-center justify-center overflow-hidden rounded-[1.25rem] border border-dashed border-[#6a3138] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_38%),#120607] transition-all duration-300 group-hover/upload:border-[#ff8fa3]/40 sm:mt-4 sm:h-36">
                            {item.value ? (
                              <img loading="lazy" decoding="async" src={item.value} alt={item.label} className="h-full w-full object-cover transition-all duration-300 group-hover/upload:scale-[1.04]" />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-center text-xs text-[#c6a09a] sm:gap-2 sm:text-sm">
                                <HiOutlinePhoto className="text-lg text-[#9c6e67] sm:text-xl" />
                                <p className="text-[10px] sm:text-xs">{t("profile.shopApplication.shopBrandingPreview")}</p>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => item.inputRef.current?.click()}
                            disabled={uploadImageMutation.isPending}
                            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#8c4651] bg-[#2a1015] px-4 text-xs font-semibold text-[#f3c4cb] transition-all duration-300 hover:border-[#ff8fa3]/40 hover:bg-[#341316] hover:text-white hover:shadow-[0_8px_24px_rgba(203,92,87,0.15)] disabled:opacity-60 sm:h-11 sm:text-sm"
                          >
                            <HiOutlineArrowUpTray className={uploadingField === item.key ? "animate-bounce" : ""} />
                            {uploadingField === item.key
                              ? t("profile.shopApplication.toasts.uploading")
                              : item.key === "logo"
                                ? t("profile.shopApplication.uploadLogoButton")
                                : t("profile.shopApplication.uploadBannerButton")}
                          </button>
                          <input
                            ref={item.inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleImageUpload(item.key as "logo" | "banner", event)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Status notices */}
                {latestApplication?.status === "pending" ? (
                  <div className="animate-[slideUp_0.3s_ease-out] rounded-2xl border border-[#9c7c4a]/60 bg-[linear-gradient(135deg,rgba(60,35,15,0.95),rgba(40,22,8,0.98))] px-5 py-4 text-sm text-[#f5d99b] shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ffffff1a] bg-[#7a5d30]/30">
                        <HiOutlineClock className="text-lg" />
                      </span>
                      <span className="font-medium">{t("profile.shopApplication.pendingNotice")}</span>
                    </div>
                  </div>
                ) : latestApplication?.status === "approved" ? (
                  <div className="animate-[slideUp_0.3s_ease-out] rounded-2xl border border-[#3d8a6a]/50 bg-[linear-gradient(135deg,rgba(18,50,35,0.95),rgba(10,32,22,0.98))] px-5 py-4 text-sm text-[#a3f0c9] shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ffffff1a] bg-[#1e4d35]/30">
                        <HiOutlineCheckBadge className="text-lg" />
                      </span>
                      <span className="font-medium">{t("profile.shopApplication.approvedNotice")}</span>
                    </div>
                    {latestApplication.admin_comment ? (
                      <div className="mt-3 border-t border-[#ffffff1a] pt-3 text-sm text-[#dff8eb]">
                        <p><span className="font-semibold">{t("profile.shopApplication.adminNote")}</span> {latestApplication.admin_comment}</p>
                      </div>
                    ) : null}
                  </div>
                ) : latestApplication?.status === "rejected" ? (
                  <div className="animate-[slideUp_0.3s_ease-out] rounded-2xl border border-[#a04a56]/60 bg-[linear-gradient(135deg,rgba(55,20,25,0.95),rgba(35,12,16,0.98))] px-5 py-4 text-sm text-[#f5b5c0] shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ffffff1a] bg-[#7d303d]/30">
                        <HiOutlineXCircle className="text-lg" />
                      </span>
                      <span className="font-medium">{t("profile.shopApplication.rejectedNotice")}</span>
                    </div>
                    {latestApplication.admin_comment ? (
                      <div className="mt-3 border-t border-[#ffffff1a] pt-3 text-sm text-[#ffe0e5]">
                        <p><span className="font-semibold">{t("profile.shopApplication.adminNote")}</span> {latestApplication.admin_comment}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={createApplicationMutation.isPending || latestApplication?.status === "pending" || !canSubmitApplication}
                  className="group/btn relative inline-flex h-13 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-6 text-base font-semibold text-white shadow-[0_18px_32px_rgba(175,35,56,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_40px_rgba(175,35,56,0.38)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#bb2435] via-[#cf2c3e] to-[#dd3a4b] opacity-0 transition-all duration-300 group-hover/btn:opacity-100" />
                  <span className="relative flex items-center gap-2">
                    {createApplicationMutation.isPending ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t("profile.shopApplication.submitting")}
                      </>
                    ) : (
                      <>
                        <HiOutlineRocketLaunch className="text-lg transition-all duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                        {latestApplication?.status === "rejected"
                          ? t("profile.shopApplication.resubmitApplication")
                          : t("profile.shopApplication.submitApplication")}
                      </>
                    )}
                  </span>
                </button>

                {/* Footer note */}
                <p className="flex items-center justify-center gap-1.5 text-center text-xs leading-6 text-[#bfa098]">
                  <HiOutlineShieldCheck className="text-sm" />
                  {t("profile.shopApplication.pageNote")}
                </p>
              </form>
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="flex animate-[fadeIn_1s_ease-out] flex-col gap-4 lg:sticky lg:top-24">
            {/* Why Join */}
            <div className={`${shellCardClass} p-5 transition-all duration-300 hover:border-[#6e2f37]/70`}>
              <h3 className="flex items-center gap-2 font-cormorant text-2xl font-semibold text-white">
                <HiOutlineHeart className="text-[#f2be7f]" />
                {t("profile.shopApplication.whyJoinTitle")}
              </h3>
              <div className="mt-5 space-y-5">
                {whyJoinItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="group/why flex gap-3 transition-all duration-300">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#6e2f37]/60 bg-[#1c0a0c] text-[#f2be7f] transition-all duration-300 group-hover/why:border-[#ff8fa3]/30 group-hover/why:bg-[#2b1014] group-hover/why:text-[#ffcf9c]">
                        <Icon className="text-base" />
                      </div>
                      <div>
                        <p className="font-medium text-[#fff0ea]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#c9a39b]">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Process Steps */}
            <div className={`${shellCardClass} p-5 transition-all duration-300 hover:border-[#6e2f37]/70`}>
              <h3 className="flex items-center gap-2 font-cormorant text-2xl font-semibold text-white">
                <HiOutlineGlobeAlt className="text-[#f2be7f]" />
                {t("profile.shopApplication.processTitle")}
              </h3>
              <div className="mt-5 space-y-5">
                {processSteps.map((step, index) => (
                  <div key={step.number} className="group/step relative flex gap-4">
                    {index < processSteps.length - 1 ? (
                      <span className="absolute left-5 top-11 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-[#6e2f37] to-transparent" />
                    ) : null}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#6e2f37]/60 bg-[#1c0a0c] text-sm font-semibold text-[#f2be7f] transition-all duration-300 group-hover/step:border-[#ff8fa3]/40 group-hover/step:bg-[#2f1318] group-hover/step:text-[#ffcf9c]">
                      {step.number}
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-[#fff0ea] transition-all duration-300 group-hover/step:text-white">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#c9a39b]">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Application Card */}
            {latestApplication ? (
              <div className={`${shellCardClass} animate-[slideUp_0.5s_ease-out] p-5 transition-all duration-300 hover:border-[#6e2f37]/70`}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a39b] sm:text-xs">{t("profile.shopApplication.latestApplication")}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <h4 className="font-cormorant text-2xl text-white">{latestApplication.shop_name}</h4>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-md ${statusTone[latestApplication.status]}`}>
                    {latestApplication.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#c9a39b]">{latestApplication.address}</p>
                {latestApplication.status === "approved" || isOwner ? (
                  <Link
                    to="/owner/dashboard"
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(175,35,56,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(175,35,56,0.35)]"
                  >
                    <HiOutlineBuildingStorefront />
                    {t("profile.shopApplication.openOwnerDashboard")}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {/* Map Modal - Significantly Improved */}
      {mapOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050102]/85 p-2 backdrop-blur-lg sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMapOpen(false);
          }}
        >
          <div className="mx-auto w-full max-w-4xl animate-[scaleIn_0.3s_ease-out] rounded-[2.4rem] border border-[#5a252c]/80 bg-[linear-gradient(170deg,rgba(26,8,10,0.98),rgba(11,3,5,0.99))] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.55)] sm:p-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#d2a9a2] sm:text-xs">{t("profile.shopApplication.mapPicker")}</p>
                <h3 className="mt-1 font-cormorant text-2xl text-white sm:mt-2 sm:text-3xl">{t("profile.shopApplication.markExactLocation")}</h3>
                <p className="mt-1 text-xs leading-5 text-[#d8b7b0] sm:text-sm sm:leading-6">{t("profile.shopApplication.mapHint")}</p>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#6b3a3c] bg-[#180709] text-[#f0d7d1] transition-all duration-200 hover:border-[#ff8fa3]/40 hover:bg-[#2b1014] hover:text-white sm:h-11 sm:w-11"
              >
                <HiOutlineXMark className="text-lg sm:text-xl" />
              </button>
            </div>

            {/* Search & Controls */}
            <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative flex-1">
                <HiOutlineMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b88d86] text-base" />
                <input
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleLocationSearch();
                    }
                  }}
                  placeholder={t("profile.shopApplication.placeholders.searchAddress")}
                  className="h-12 w-full rounded-2xl border border-[#6b3a3c] bg-[#180709] pl-11 pr-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-[#9a726a] focus:border-[#ff8fa3]/50 focus:shadow-[0_0_0_4px_rgba(255,143,163,0.08)]"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => void handleLocationSearch()}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-xs font-semibold text-[#f3c4cb] transition-all duration-200 hover:border-[#ff8fa3]/40 hover:bg-[#341316] hover:text-white sm:flex-none sm:text-sm"
                >
                  {isSearchingLocation ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("profile.shopApplication.searching")}
                    </span>
                  ) : (
                    t("profile.shopApplication.search")
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleUseCurrentLocation()}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-xs font-semibold text-[#f3c4cb] transition-all duration-200 hover:border-[#ff8fa3]/40 hover:bg-[#341316] hover:text-white sm:flex-none sm:text-sm"
                >
                  {isLocatingUser ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("profile.shopApplication.locating")}
                    </span>
                  ) : (
                    t("profile.shopApplication.myLocation")
                  )}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {locationResults.length ? (
              <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto rounded-2xl border border-[#4a1d22]/60 bg-[#120608] p-2">
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
                    className="block w-full rounded-xl border border-transparent bg-[#1f0b0e] px-4 py-3 text-left text-xs text-[#f3dbd6] transition-all duration-200 hover:border-[#ff8fa3]/20 hover:bg-[#2a1015] sm:text-sm"
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Map Container */}
            <div ref={mapHostRef} className="mt-3 h-[280px] w-full overflow-hidden rounded-[1.5rem] border border-[#6b3a3c] shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:mt-4 sm:h-[400px]" />

            {/* Map Footer */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#cfafa8] sm:mt-4 sm:gap-3 sm:text-sm">
              <span className="flex items-center gap-1.5">
                <HiOutlineInformationCircle className="text-sm" />
                {t("profile.shopApplication.mapClickHint")}
              </span>
              {latitude !== null && longitude !== null ? (
                <span className="rounded-lg border border-[#5a262c]/60 bg-[#0f0507] px-3 py-1 font-mono text-[11px]">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
              ) : null}
            </div>

            {/* Done Button */}
            <div className="mt-4 flex justify-end sm:mt-5">
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8f1220] via-[#aa1828] to-[#bb2435] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(175,35,56,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(175,35,56,0.35)] sm:h-12 sm:px-8"
              >
                <HiOutlineCheckBadge />
                {t("common.done")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Inject keyframes for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}

export default ShopApplicationPage;
