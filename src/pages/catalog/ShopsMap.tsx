import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HiArrowRight } from "react-icons/hi2";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Shop } from "../../types/catalog";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1400&q=80";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapBoundsController({ shops }: { shops: Shop[] }) {
  const map = useMap();
  useEffect(() => {
    if (!shops.length) return;
    const bounds = L.latLngBounds(shops.map((s) => [Number(s.latitude), Number(s.longitude)] as [number, number]));
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.15), { animate: false });
  }, [map, shops]);
  return null;
}

function MapPopupContent({ shop }: { shop: Shop }) {
  const { t } = useTranslation();
  return (
    <div className="w-56 font-sans">
      <div className="-mx-0 -mt-0 mb-3 h-24 overflow-hidden rounded-t-xl">
        <img src={shop.banner ?? shop.logo ?? FALLBACK_BANNER} alt={shop.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <h3 className="text-sm font-bold text-gray-900">{shop.name}</h3>
      <p className="mt-1 text-xs text-gray-600">{shop.address}</p>
      {shop.working_hours && <p className="mt-1 text-xs text-gray-600">{shop.working_hours}</p>}
      <Link
        to={`/shops/${shop.slug}`}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#971725] to-[#c22d3d] px-3 py-2 text-xs font-semibold text-white transition hover:shadow-lg hover:shadow-[#971725]/30"
      >
        {t("shopsPage.openShop")} <HiArrowRight size={12} />
      </Link>
    </div>
  );
}

export default function ShopsMap({ shops, center }: { shops: Shop[]; center: [number, number] }) {
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
      <MapBoundsController shops={shops} />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {shops.map((shop) => (
        <Marker key={shop.id} position={[Number(shop.latitude), Number(shop.longitude)]} icon={customIcon}>
          <Popup>
            <MapPopupContent shop={shop} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}