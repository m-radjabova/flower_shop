import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowUpTray,
  HiOutlineBuildingStorefront,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineSparkles,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useMyLatestShopApplication, useMyShops, useUpdateShop, useUploadImage } from "../../hooks/useCatalog";
import type { Shop } from "../../types/catalog";
import { isRecentAdminNote } from "../../utils/adminNote";
import { normalizeInstagramValue, normalizeTelegramValue } from "../../utils/social";
import bow from "../../assets/bow.png";
import { useTranslation } from "react-i18next";

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

type SearchLocationResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type ShopFormValues = {
  name: string;
  description: string;
  phone: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  instagram: string;
  telegram: string;
  working_hours: string;
  logo: string;
  banner: string;
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

function OwnerShop() {
  const { t } = useTranslation();
  const { data: shops = [], isLoading } = useMyShops();
  const { data: latestApplication } = useMyLatestShopApplication();
  const updateShopMutation = useUpdateShop();
  const uploadImageMutation = useUploadImage();
  const [selectedShopId, setSelectedShopId] = useState("");
  const [showAdminNote, setShowAdminNote] = useState(false);
  const [uploadingField, setUploadingField] = useState<"logo" | "banner" | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<SearchLocationResult[]>([]);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const selectedShop = useMemo<Shop | undefined>(
    () => shops.find((shop) => shop.id === (selectedShopId || shops[0]?.id)),
    [selectedShopId, shops],
  );
  const form = useForm<ShopFormValues>({
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      city: "",
      address: "",
      latitude: null,
      longitude: null,
      instagram: "",
      telegram: "",
      working_hours: "",
      logo: "",
      banner: "",
    },
  });
  const { isDirty, dirtyFields } = form.formState;

  const logo = form.watch("logo");
  const banner = form.watch("banner");
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const formatShopStatus = (status?: string | null) => {
    switch (status) {
      case "active":
        return t("owner.activeStatus");
      case "inactive":
        return t("owner.inactiveStatus");
      case "pending":
        return t("owner.pending");
      default:
        return status ?? t("owner.none");
    }
  };
  const formatApplicationStatus = (status?: string | null) => {
    switch (status) {
      case "approved":
        return t("owner.approved");
      case "rejected":
        return t("owner.rejected");
      case "pending":
        return t("owner.pending");
      default:
        return status ?? t("owner.none");
    }
  };
  const adminNoteTone = latestApplication?.status === "approved"
    ? "border-[#2f6d55] bg-[linear-gradient(180deg,rgba(15,36,28,0.96),rgba(9,22,17,0.98))] text-[#dff8eb]"
    : "border-[#7d3943] bg-[linear-gradient(180deg,rgba(43,18,23,0.96),rgba(28,10,14,0.98))] text-[#ffe0e5]";
  const changedFieldsCount = Object.keys(dirtyFields).length;
  const isRecentNote = isRecentAdminNote(latestApplication?.updated_at);

  const applyLocationSelection = useCallback(async (nextLatitude: number, nextLongitude: number, fallbackAddress?: string) => {
    const coords: [number, number] = [Number(nextLatitude.toFixed(6)), Number(nextLongitude.toFixed(6))];
    form.setValue("latitude", coords[0], { shouldDirty: true });
    form.setValue("longitude", coords[1], { shouldDirty: true });
    setIsResolvingAddress(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}`);
      const data = (await res.json()) as { display_name?: string; address?: { city?: string; town?: string; village?: string } };
      form.setValue("address", data.display_name || fallbackAddress || `${coords[0]}, ${coords[1]}`, { shouldDirty: true, shouldValidate: true });
      const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? "";
      if (city) {
        form.setValue("city", city, { shouldDirty: true });
      }
    } catch {
      form.setValue("address", fallbackAddress || `${coords[0]}, ${coords[1]}`, { shouldDirty: true, shouldValidate: true });
      toast.error(t("owner.addressResolveError"));
    } finally {
      setIsResolvingAddress(false);
    }
  }, [form, t]);

  useEffect(() => {
    if (!selectedShop) return;
    form.reset({
      name: selectedShop.name ?? "",
      description: selectedShop.description ?? "",
      phone: selectedShop.phone ?? "",
      city: selectedShop.city ?? "",
      address: selectedShop.address ?? "",
      latitude: selectedShop.latitude ? Number(selectedShop.latitude) : null,
      longitude: selectedShop.longitude ? Number(selectedShop.longitude) : null,
      instagram: selectedShop.instagram ?? "",
      telegram: selectedShop.telegram ?? "",
      working_hours: selectedShop.working_hours ?? "",
      logo: selectedShop.logo ?? "",
      banner: selectedShop.banner ?? "",
    });
  }, [form, selectedShop]);

  useEffect(() => {
    setShowAdminNote(isRecentNote);
  }, [isRecentNote, latestApplication?.id]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!mapOpen || !mapHostRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    void injectLeafletAssets()
      .then(() => {
        if (cancelled || !window.L || !mapHostRef.current) return;

        const initial: [number, number] = [
          latitude ?? TASHKENT_COORDS[0],
          longitude ?? TASHKENT_COORDS[1],
        ];

        const map = window.L.map(mapHostRef.current).setView(initial, 13);
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
          const coords: [number, number] = [Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6))];
          marker.setLatLng(coords);
          map.setView(coords, 15);
          void applyLocationSelection(coords[0], coords[1]);
        });
      })
      .catch(() => {
        toast.error(t("owner.mapLoadError"));
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [applyLocationSelection, latitude, longitude, mapOpen, t]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedShop || updateShopMutation.isPending) return;
    if (!values.address.trim()) {
      toast.error(t("owner.addressRequired"));
      return;
    }
    try {
      await updateShopMutation.mutateAsync({
        shopId: selectedShop.id,
        payload: {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          phone: values.phone.trim(),
          city: values.city.trim() || null,
          address: values.address.trim(),
          latitude: values.latitude !== null ? String(values.latitude) : null,
          longitude: values.longitude !== null ? String(values.longitude) : null,
          instagram: values.instagram.trim() ? normalizeInstagramValue(values.instagram) : null,
          telegram: values.telegram.trim() ? normalizeTelegramValue(values.telegram) : null,
          working_hours: values.working_hours.trim() || null,
          logo: values.logo.trim() || undefined,
          banner: values.banner.trim() || undefined,
        },
      });
      toast.success(t("owner.shopUpdated"));
    } catch {
      toast.error(t("owner.shopUpdateError"));
    }
  });

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) {
      toast.error(t("owner.searchAddressRequired"));
      return;
    }

    try {
      setIsSearchingLocation(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(locationQuery.trim())}&limit=5`);
      const data = (await res.json()) as SearchLocationResult[];
      setLocationResults(data);
      if (!data.length) {
        toast.error(t("owner.noLocationResults"));
      }
    } catch {
      toast.error(t("owner.searchLocationError"));
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t("owner.geolocationError"));
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
      await applyLocationSelection(coords[0], coords[1], t("owner.myLocation"));
    } catch {
      toast.error(t("owner.currentLocationError"));
    } finally {
      setIsLocatingUser(false);
    }
  };

  const handleUpload = async (field: "logo" | "banner", event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadImageMutation.isPending) return;
    try {
      setUploadingField(field);
      const uploaded = await uploadImageMutation.mutateAsync(file);
      form.setValue(field, uploaded.url, { shouldDirty: true });
      toast.success(t("owner.imageUploaded"));
    } catch {
      toast.error(t("owner.imageUploadError"));
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  if (isLoading) {
    return <div className="h-80 animate-pulse rounded-[1.8rem] border border-[#3d171c] bg-[#160709]" />;
  }

  if (!selectedShop) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-[#4a1d22] bg-[#180709] px-5 py-16 text-center text-[#cfaaa2]">
        {t("owner.shopNotFound")}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#44191f] bg-[linear-gradient(180deg,rgba(31,8,11,0.92),rgba(17,4,6,0.96))] p-6 sm:p-8">
        <img
          src={bow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1 hidden w-45 rotate-35 opacity-35 lg:block"
        />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-[#d6a89d]">{t("owner.ownerPanel")}</p>
            <h1 className="mt-3 font-great-vibes text-[4rem] leading-[0.9] text-[#ff8ea3] sm:text-[5rem]">{t("owner.shopControl")}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#d8b7b0]">{t("owner.shopControlDesc")}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
            <div className="rounded-[1.5rem] border border-[#4a1d22] bg-[#180709]/92 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.storeStatus")}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatShopStatus(selectedShop.status)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[#4a1d22] bg-[#180709]/92 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.rating")}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{selectedShop.rating}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[#4a1d22] bg-[#180709]/92 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c79f97]">{t("owner.reviews")}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{selectedShop.reviews_count}</p>
            </div>
          </div>
        </div>

        {shops.length > 1 ? (
          <select
            value={selectedShop.id}
            onChange={(event) => setSelectedShopId(event.target.value)}
            className="relative mt-6 h-12 rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        ) : null}
      </section>

      {latestApplication?.admin_comment ? (
        <section className={`rounded-[1.8rem] border p-5 sm:p-6 ${adminNoteTone}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/95 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                  <HiOutlineChatBubbleLeftRight className="text-2xl" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-current/70">{t("owner.adminNote")}</p>
                  <h2 className="mt-1 font-cormorant text-4xl text-white">
                    {latestApplication.status === "approved" ? t("owner.approvalMessage") : t("owner.applicationFeedback")}
                  </h2>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-current/70">
                  {isRecentNote ? t("owner.freshNote") : t("owner.archivedNote")}
                </span>
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-current/70">
                  {t("owner.privateMessage")}
                </span>
              </div>

              {showAdminNote ? (
                <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-current/60">{t("owner.adminNote")}</p>
                  <p className="mt-3 text-base leading-7 text-current">{latestApplication.admin_comment}</p>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/10 bg-black/10 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm uppercase tracking-[0.2em] text-current/60">{t("owner.adminNote")}</p>
                    <p className="truncate text-sm text-current/85">{latestApplication.admin_comment}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminNote(true)}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <HiOutlineEye />
                    {t("owner.open")}
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
              <div className="rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-current/70">{t("owner.application")}</p>
                <p className="mt-2 text-lg font-semibold text-white">{latestApplication.shop_name}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-current/70">{t("owner.decision")}</p>
                <p className="mt-2 text-lg font-semibold text-white capitalize">{formatApplicationStatus(latestApplication.status)}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] shadow-[0_26px_60px_rgba(0,0,0,0.24)]">
            <div className="relative h-72 bg-[#140608]">
            {banner ? <img src={banner} alt={selectedShop.name} className="h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,2,4,0.02),rgba(8,1,2,0.92))]" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#f5d8d1] backdrop-blur">
              <HiOutlineSparkles className="text-[#f2be7f]" />
              {t("owner.signatureStorefront")}
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.8rem] border border-[#7a4747] bg-[#1d0a0d] shadow-[0_14px_30px_rgba(0,0,0,0.24)]">
                {logo ? <img src={logo} alt={`${selectedShop.name} logo`} className="h-full w-full object-cover" /> : <HiOutlineBuildingStorefront className="text-4xl text-[#f2be7f]" />}
              </div>
                <div>
                  <p className="font-cormorant text-4xl text-white sm:text-5xl">{selectedShop.name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-[#2f6d55] bg-[#0f241c] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#91e2b9]">
                      {formatShopStatus(selectedShop.status)}
                    </span>
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f4ddd8]">
                      {t("owner.readyForCustomers")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-3 text-right backdrop-blur sm:block">
                <p className="text-xs uppercase tracking-[0.2em] text-[#d8b7b0]">{t("owner.profileHealth")}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{t("owner.strong")}</p>
              </div>
            </div>
          </div>
            <div className="grid gap-4 p-5 text-sm text-[#ead7d2] sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[#4a1d22] bg-[#140608] p-4">
              <div className="flex items-center gap-2 text-[#f2be7f]"><HiOutlineMapPin /> {t("owner.address")}</div>
              <p className="mt-3 leading-6 text-[#f2dfda]">{selectedShop.address}</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#4a1d22] bg-[#140608] p-4">
                <div className="flex items-center gap-2 text-[#f2be7f]"><HiOutlinePhone /> {t("owner.phone")}</div>
                <p className="mt-3 leading-6 text-[#f2dfda]">{selectedShop.phone}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#4a1d22] bg-[#140608] p-4">
                <div className="flex items-center gap-2 text-[#f2be7f]"><HiOutlineClock /> {t("owner.workingHours")}</div>
                <p className="mt-3 leading-6 text-[#f2dfda]">{selectedShop.working_hours ?? t("owner.scheduleNotSet")}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#4a1d22] bg-[#140608] p-4">
                <div className="flex items-center gap-2 text-[#f2be7f]"><HiOutlineArrowTrendingUp /> {t("owner.cityLabel")}</div>
                <p className="mt-3 leading-6 text-[#f2dfda]">{selectedShop.city ?? t("owner.cityNotSet")}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#251007] text-2xl text-[#f2be7f]">
                <HiOutlineSparkles />
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[#d2a9a2]">{t("owner.storeStory")}</p>
                <h2 className="mt-1 font-cormorant text-4xl text-white">{t("owner.publicDescription")}</h2>
              </div>
            </div>
            <p className="mt-5 text-base leading-8 text-[#d7b7b1]">
              {selectedShop.description ?? t("owner.noDescription")}
            </p>
          </article>
        </div>

        <form onSubmit={onSubmit} className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6 shadow-[0_26px_60px_rgba(0,0,0,0.22)] space-y-4">
          <div className="mb-2">
            <p className="text-sm uppercase tracking-[0.22em] text-[#d2a9a2]">{t("owner.editingStudio")}</p>
            <h2 className="mt-2 font-cormorant text-4xl text-white">{t("owner.refinePresence")}</h2>
            <p className="mt-2 text-sm leading-6 text-[#cda8a1]">{t("owner.editHint")}</p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.shopName")}</span>
            <input {...form.register("name", { required: true })} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.phone")}</span>
            <input {...form.register("phone", { required: true })} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.cityLabel")}</span>
              <input {...form.register("city")} className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.workingHours")}</span>
              <input {...form.register("working_hours")} placeholder="09:00 - 21:00" className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none" />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.address")}</span>
            <div className="space-y-3">
              <div className="rounded-[1.4rem] border border-[#4a1d22] bg-[#180709] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#b88d86]">{t("owner.selectedAddress")}</p>
                <p className="mt-2 min-h-12 text-base leading-6 text-white">
                  {form.watch("address") || t("owner.selectedAddressDisplay")}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb]"
                  >
                    <HiOutlineMapPin />
                    {latitude !== null && longitude !== null ? t("owner.changeOnMap") : t("owner.pickFromMap")}
                  </button>
                  {latitude !== null && longitude !== null ? (
                    <span className="text-xs text-[#caa39b]">
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </span>
                  ) : null}
                  {isResolvingAddress ? <span className="text-xs text-[#f2be7f]">{t("owner.addressResolving")}</span> : null}
                </div>
              </div>
              <input
                {...form.register("address", { required: true })}
                readOnly
                className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#140608] px-4 text-[#d5b7b0] outline-none"
                placeholder={t("owner.selectedAddressDisplay")}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.description")}</span>
            <textarea {...form.register("description")} rows={4} className="w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-white outline-none" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.instagram")}</span>
              <input
                {...form.register("instagram")}
                placeholder={t("owner.instagramPlaceholder")}
                className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">{t("owner.telegram")}</span>
              <input
                {...form.register("telegram")}
                placeholder={t("owner.telegramPlaceholder")}
                className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "logo", label: t("owner.logo"), accept: "image/*", helper: t("owner.logoHelper") },
              { key: "banner", label: t("owner.banner"), accept: "image/*", helper: t("owner.bannerHelper") },
            ].map((item) => (
              <label key={item.key} className="rounded-[1.4rem] border border-[#4a1d22] bg-[#180709] p-4">
                <span className="block text-sm font-semibold text-[#f0d7d1]">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[#b9968f]">{item.helper}</span>
                <button
                  type="button"
                  onClick={() => document.getElementById(`shop-${item.key}-input`)?.click()}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb]"
                >
                  <HiOutlineArrowUpTray />
                  {uploadingField === item.key ? t("owner.uploading") : item.key === "logo" ? t("owner.uploadLogo") : t("owner.uploadBanner")}
                </button>
                <input id={`shop-${item.key}-input`} type="file" accept={item.accept} className="hidden" onChange={(event) => handleUpload(item.key as "logo" | "banner", event)} />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={updateShopMutation.isPending}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#8f1220] via-[#b81f35] to-[#d93f57] px-6 text-base font-semibold text-white shadow-[0_18px_34px_rgba(185,32,54,0.32)] disabled:opacity-60"
          >
            {updateShopMutation.isPending ? t("owner.saving") : t("owner.saveChanges")}
          </button>
        </form>
      </section>

      <div className={`sticky bottom-5 z-20 transition-all duration-300 ${isDirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-[1.6rem] border border-[#6d3740] bg-[linear-gradient(135deg,rgba(33,10,14,0.98),rgba(20,6,8,0.96))] px-5 py-4 shadow-[0_24px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#d2a9a2]">{t("owner.unsavedChanges")}</p>
            <p className="mt-1 text-sm text-[#f3dbd6]">
              {changedFieldsCount} {t("owner.unsavedChangesText")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!selectedShop) return;
                form.reset({
                  name: selectedShop.name ?? "",
                  description: selectedShop.description ?? "",
                  phone: selectedShop.phone ?? "",
                  city: selectedShop.city ?? "",
                  address: selectedShop.address ?? "",
                  latitude: selectedShop.latitude ? Number(selectedShop.latitude) : null,
                  longitude: selectedShop.longitude ? Number(selectedShop.longitude) : null,
                  instagram: selectedShop.instagram ?? "",
                  telegram: selectedShop.telegram ?? "",
                  working_hours: selectedShop.working_hours ?? "",
                  logo: selectedShop.logo ?? "",
                  banner: selectedShop.banner ?? "",
                });
              }}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#6b3a3c] px-5 text-sm font-semibold text-[#f1d5cb]"
            >
              {t("owner.reset")}
            </button>
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={updateShopMutation.isPending}
              className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#8f1220] via-[#b81f35] to-[#d93f57] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {updateShopMutation.isPending ? t("owner.saving") : t("owner.saveNow")}
            </button>
          </div>
        </div>
      </div>

      {mapOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050102]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[2rem] border border-[#5a252c] bg-[linear-gradient(180deg,rgba(26,8,10,0.98),rgba(11,3,5,0.99))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#d2a9a2]">{t("owner.mapPicker")}</p>
                <h3 className="mt-2 font-cormorant text-4xl text-white">{t("owner.markLocation")}</h3>
                <p className="mt-2 text-sm leading-6 text-[#d8b7b0]">{t("owner.mapHint")}</p>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#6b3a3c] bg-[#180709] text-[#f0d7d1]"
              >
                <HiOutlineXMark className="text-xl" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
              <input
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleLocationSearch();
                  }
                }}
                placeholder={t("owner.searchAddress")}
                className="h-12 rounded-2xl border border-[#6b3a3c] bg-[#180709] px-4 text-white outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleLocationSearch()}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb]"
                >
                  {isSearchingLocation ? t("owner.searching") : t("owner.search")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleUseCurrentLocation()}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb]"
                >
                  {isLocatingUser ? t("owner.locating") : t("owner.myLocation")}
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
                      void applyLocationSelection(coords[0], coords[1], result.display_name);
                      setLocationResults([]);
                      setLocationQuery(result.display_name);
                    }}
                    className="block w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-left text-sm text-[#f3dbd6]"
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={mapHostRef} className="mt-5 h-[420px] w-full overflow-hidden rounded-[1.5rem] border border-[#6b3a3c]" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[#cfafa8]">
              <span>{t("owner.tapMapHint")}</span>
              {latitude !== null && longitude !== null ? <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span> : null}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#8f1220] via-[#b81f35] to-[#d93f57] px-6 text-sm font-semibold text-white"
              >
                {t("owner.done")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OwnerShop;
