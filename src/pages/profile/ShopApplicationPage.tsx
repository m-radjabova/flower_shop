import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  HiOutlineArrowUpTray,
  HiOutlineBuildingStorefront,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineXCircle,
  HiOutlineXMark,
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
  pending: "border-[#7f5a3b] bg-[#2a160b] text-[#f2c98d]",
  approved: "border-[#2f6d55] bg-[#0f241c] text-[#91e2b9]",
  rejected: "border-[#7d3943] bg-[#2b1217] text-[#f1a2af]",
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
  const navigate = useNavigate();
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
      toast.error("Addressni aniqlab bo'lmadi");
    } finally {
      setIsResolvingAddress(false);
    }
  }, [ensureLeafletMarker, form]);

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
      toast.success(`${field === "logo" ? "Logo" : "Banner"} yuklandi`);
    } catch {
      toast.error("Rasmni yuklab bo'lmadi");
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (createApplicationMutation.isPending) return;
    if (!values.address.trim()) {
      toast.error("Addressni mapdan tanlang");
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
      toast.success("Arizangiz yuborildi. Tez orada ko'rib chiqamiz.");
      await latestApplicationQuery.refetch();
    } catch {
      toast.error("Arizani yuborib bo'lmadi");
    }
  });

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) {
      toast.error("Qidirish uchun address yozing");
      return;
    }

    try {
      setIsSearchingLocation(true);
      const data = await searchLocations(locationQuery.trim());
      setLocationResults(data);
      if (!data.length) {
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
      const coords = await getCurrentUserCoordinates();
      leafletMapRef.current?.setView(coords, DETAIL_MAP_ZOOM);
      ensureLeafletMarker(coords);
      leafletMarkerRef.current?.setLatLng(coords);
      await applyLocationSelection(coords[0], coords[1], "Current location");
    } catch (error) {
      const reason = getGeolocationErrorReason(error);
      if (reason === "permission_denied") {
        toast.error("Joylashuv uchun ruxsat berilmagan");
      } else if (reason === "timeout") {
        toast.error("Joylashuvni aniqlash vaqti tugadi. Internet yoki GPS signalni tekshiring");
      } else if (reason === "position_unavailable") {
        toast.error("Joylashuv hozircha aniqlanmadi. GPS yoki tarmoq signalini tekshiring");
      } else {
        toast.error("Hozirgi joylashuvni olib bo'lmadi");
      }
    } finally {
      setIsLocatingUser(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent px-4 pb-16 pt-28 text-[#fff6f4] sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(31,8,11,0.92),rgba(14,4,6,0.98))] p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[#d8aea6]">Become a Seller</p>
          <h1 className="mt-3 font-cormorant text-5xl leading-none text-white sm:text-6xl">Open Your Flower Shop</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#e6c6c0]">
            Sell your bouquets on Muslima Boutique, reach more customers, and manage your orders from one elegant owner space.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Apply", text: "Do'koningiz haqida asosiy ma'lumotlarni yuboring." },
              { title: "Review", text: "Admin jamoa arizangizni tekshiradi va izoh qoldiradi." },
              { title: "Launch", text: "Tasdiqdan keyin shop avtomatik ochiladi va owner panel faollashadi." },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.5rem] border border-[#4a1d22] bg-[#180709] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#f2be7f]">{item.title}</p>
                <p className="mt-3 text-sm leading-6 text-[#e9d0cb]">{item.text}</p>
              </div>
            ))}
          </div>

          {latestApplication ? (
            <div className="mt-8 rounded-[1.7rem] border border-[#4a1d22] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_28%),#140608] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#c9a39b]">Latest Application</p>
                  <h2 className="mt-2 font-cormorant text-3xl text-white">{latestApplication.shop_name}</h2>
                  <p className="mt-2 text-sm text-[#e8cbc5]">{latestApplication.address}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusTone[latestApplication.status]}`}>
                  {latestApplication.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#dbbbb5]">
                {latestApplication.status === "pending"
                  ? "Your application is under review. We'll notify you after admin approval."
                  : latestApplication.status === "approved"
                    ? "Ariza tasdiqlandi. Endi owner dashboard orqali shop faoliyatini boshqarishingiz mumkin."
                    : "Ariza rad etilgan. Admin izohini ko'rib, yangilangan ma'lumot bilan qayta yuborishingiz mumkin."}
              </p>
              {latestApplication.admin_comment ? (
                <div className={`mt-5 rounded-[1.4rem] border px-4 py-4 text-sm ${
                  latestApplication.status === "approved"
                    ? "border-[#2f6d55] bg-[#0f241c] text-[#dff8eb]"
                    : "border-[#7d3943] bg-[#2b1217] text-[#ffe0e5]"
                }`}>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-current/70">Admin Note</p>
                  <p className="mt-3 leading-6 text-current">{latestApplication.admin_comment}</p>
                </div>
              ) : null}
              {latestApplication.status === "approved" || isOwner ? (
                <div className="mt-5">
                  <Link
                    to="/owner/dashboard"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-5 text-sm font-semibold text-white"
                  >
                    Open Owner Dashboard
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#251007] text-2xl text-[#f2be7f]">
              <HiOutlineBuildingStorefront />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#cfa29b]">Seller Application</p>
              <h2 className="font-cormorant text-4xl text-white">Start Selling</h2>
            </div>
          </div>

          {!canSubmitApplication ? (
            <div className="mt-6 rounded-[1.5rem] border border-[#2f6d55] bg-[#0f241c] p-5 text-[#dff8eb]">
              <div className="flex items-center gap-3">
                <HiOutlineCheckBadge className="text-2xl text-[#91e2b9]" />
                <div>
                  <p className="font-semibold">
                    {isOwner ? "Siz allaqachon owner hisobidasiz" : "Bu sahifa customer arizalari uchun"}
                  </p>
                  <p className="mt-1 text-sm text-[#c5ecd8]">
                    {isOwner
                      ? "Shopni boshqarish uchun owner dashboardga o‘ting."
                      : primaryRole === "admin"
                        ? "Admin sifatida ariza yuborilmaydi. Arizalar admin panelda ko'rinadi."
                        : "Faqat customer roli orqali yangi shop uchun ariza yuborish mumkin."}
                  </p>
                </div>
              </div>
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => navigate("/owner/dashboard")}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#163223]"
                >
                  Open Dashboard
                </button>
              ) : null}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">Shop Name</span>
                <input
                  {...form.register("shop_name", { required: true })}
                  className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                  placeholder="Bloom House"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">Owner Full Name</span>
                <input
                  {...form.register("owner_full_name", { required: true })}
                  className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                  placeholder="Muslima Owner"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">Phone</span>
                <input
                  {...form.register("phone", { required: true })}
                  className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                  placeholder="+998 90 123 45 67"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">City</span>
                <input
                  {...form.register("city")}
                  className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                  placeholder="City"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">Address</span>
              <div className="space-y-3">
                <div className="rounded-[1.5rem] border border-[#4a1d22] bg-[#180709] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#b88d86]">Selected address</p>
                  <p className="mt-2 min-h-12 text-base leading-6 text-white">{address || "Hali address tanlanmagan"}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMapOpen(true)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb]"
                    >
                      <HiOutlineMapPin />
                      {latitude !== null && longitude !== null ? "Change on map" : "Pick from map"}
                    </button>
                    {latitude !== null && longitude !== null ? (
                      <span className="text-xs text-[#caa39b]">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </span>
                    ) : null}
                    {isResolvingAddress ? <span className="text-xs text-[#f2be7f]">Address aniqlanmoqda...</span> : null}
                  </div>
                </div>
                <input
                  {...form.register("address", { required: true })}
                  readOnly
                  className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#140608] px-4 text-[#d5b7b0] outline-none"
                  placeholder="Mapdan tanlangan address shu yerda chiqadi"
                />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">Instagram</span>
                <input
                  {...form.register("instagram")}
                  className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                  placeholder="@yourshop"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#e8cac4]">Telegram</span>
                <input
                  {...form.register("telegram")}
                  className="h-12 w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 text-white outline-none"
                  placeholder="@yourshop_support"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[#e8cac4]">Shop Description</span>
              <textarea
                {...form.register("description")}
                rows={4}
                className="w-full rounded-2xl border border-[#4a1d22] bg-[#180709] px-4 py-3 text-white outline-none"
                placeholder="Tell us about your floral style, delivery zones, and what makes your bouquets special."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "logo", label: "Logo Upload", value: logo, inputRef: logoInputRef },
                { key: "banner", label: "Banner Upload", value: banner, inputRef: bannerInputRef },
              ].map((item) => (
                <div key={item.key} className="rounded-[1.5rem] border border-[#4a1d22] bg-[#180709] p-4">
                  <div className="flex items-center gap-2 text-[#f2be7f]">
                    <HiOutlinePhoto />
                    <p className="text-sm font-semibold text-[#f7dfd8]">{item.label}</p>
                  </div>
                  <div className="mt-4 flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#6a3138] bg-[#120607]">
                    {item.value ? (
                      <img src={item.value} alt={item.label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center text-sm text-[#c6a09a]">
                        <HiOutlineSparkles className="text-xl text-[#f2be7f]" />
                        <p>Shop branding preview</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => item.inputRef.current?.click()}
                    disabled={uploadImageMutation.isPending}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#8c4651] bg-[#2a1015] px-5 text-sm font-semibold text-[#f3c4cb] disabled:opacity-60"
                  >
                    <HiOutlineArrowUpTray />
                    {uploadingField === item.key ? "Uploading..." : `Upload ${item.label.split(" ")[0]}`}
                  </button>
                  <input
                    ref={item.inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageUpload(item.key as "logo" | "banner", event)}
                  />
                </div>
              ))}
            </div>

            {latestApplication?.status === "pending" ? (
              <div className="rounded-2xl border border-[#7f5a3b] bg-[#2a160b] px-4 py-3 text-sm text-[#f2c98d]">
                <div className="flex items-center gap-2">
                  <HiOutlineClock />
                  <span>Your current application is under review. New submission vaqtincha yopiq.</span>
                </div>
              </div>
            ) : latestApplication?.status === "approved" ? (
              <div className="rounded-2xl border border-[#2f6d55] bg-[#0f241c] px-4 py-3 text-sm text-[#91e2b9]">
                <div className="flex items-center gap-2">
                  <HiOutlineCheckBadge />
                  <span>Arizangiz tasdiqlangan. Endi owner dashboard orqali shopingizni boshqaring.</span>
                </div>
                {latestApplication.admin_comment ? (
                  <p className="mt-3 border-t border-white/10 pt-3 text-[#dff8eb]">
                    Admin note: {latestApplication.admin_comment}
                  </p>
                ) : null}
              </div>
            ) : latestApplication?.status === "rejected" ? (
              <div className="rounded-2xl border border-[#7d3943] bg-[#2b1217] px-4 py-3 text-sm text-[#f1a2af]">
                <div className="flex items-center gap-2">
                  <HiOutlineXCircle />
                  <span>Oldingi ariza rad etilgan. Maydonlarni to‘g‘rilab, qayta yuborishingiz mumkin.</span>
                </div>
                {latestApplication.admin_comment ? (
                  <p className="mt-3 border-t border-white/10 pt-3 text-[#ffe0e5]">
                    Admin note: {latestApplication.admin_comment}
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={createApplicationMutation.isPending || latestApplication?.status === "pending" || !canSubmitApplication}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-6 text-base font-semibold text-white shadow-[0_18px_32px_rgba(175,35,56,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createApplicationMutation.isPending ? "Submitting..." : latestApplication?.status === "rejected" ? "Resubmit Application" : "Submit Application"}
            </button>
          </form>
        </section>
      </div>

      {mapOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050102]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[2rem] border border-[#5a252c] bg-[linear-gradient(180deg,rgba(26,8,10,0.98),rgba(11,3,5,0.99))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#d2a9a2]">Map Picker</p>
                <h3 className="mt-2 font-cormorant text-4xl text-white">Mark exact shop location</h3>
                <p className="mt-2 text-sm leading-6 text-[#d8b7b0]">Xaritada nuqtani bosing. Address va city avtomatik to'ldiriladi.</p>
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
                placeholder="Address yoki joy nomini qidiring"
                className="h-12 rounded-2xl border border-[#6b3a3c] bg-[#180709] px-4 text-white outline-none"
              />
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
                      leafletMapRef.current?.setView(coords, DETAIL_MAP_ZOOM);
                      ensureLeafletMarker(coords);
                      leafletMarkerRef.current?.setLatLng(coords);
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
              <span>Xaritada bosib shop joylashuvini belgilang.</span>
              {latitude !== null && longitude !== null ? <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span> : null}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-6 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default ShopApplicationPage;
