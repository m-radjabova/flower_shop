export type Coordinates = [number, number];

export type SearchLocationResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export type GeolocationErrorReason =
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unsupported"
  | "unknown";

export class GeolocationError extends Error {
  reason: GeolocationErrorReason;

  constructor(reason: GeolocationErrorReason, message?: string) {
    super(message ?? reason);
    this.name = "GeolocationError";
    this.reason = reason;
  }
}

type ReverseGeocodeResponse = {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
};

const DEFAULT_LANGUAGE = "en";

export const DEFAULT_MAP_CENTER: Coordinates = [41.316667, 64.65];
export const DEFAULT_MAP_ZOOM = 6;
export const DETAIL_MAP_ZOOM = 15;
export const CITY_MAP_ZOOM = 13;
export const UZBEKISTAN_VIEWBOX = "55.996627,45.590118,73.1479,37.172257";

function getPreferredLanguage() {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang?.trim();
    if (lang) return lang;
  }

  if (typeof navigator !== "undefined") {
    return navigator.language || DEFAULT_LANGUAGE;
  }

  return DEFAULT_LANGUAGE;
}

export function normalizeCoordinates(latitude: number, longitude: number): Coordinates {
  return [Number(latitude.toFixed(6)), Number(longitude.toFixed(6))];
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    "accept-language": getPreferredLanguage(),
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const data = (await response.json()) as ReverseGeocodeResponse;

  return {
    displayName: data.display_name,
    city: data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.state ?? "",
  };
}

export async function searchLocations(query: string) {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query.trim(),
    limit: "5",
    countrycodes: "uz",
    bounded: "1",
    viewbox: UZBEKISTAN_VIEWBOX,
    "accept-language": getPreferredLanguage(),
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const data = (await response.json()) as SearchLocationResult[];

  return Array.from(
    new Map(data.map((item) => [`${item.lat}:${item.lon}:${item.display_name}`, item])).values(),
  );
}

function getCurrentPosition(options: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function normalizeGeolocationError(error: unknown) {
  if (error instanceof GeolocationError) {
    return error;
  }

  if (typeof GeolocationPositionError !== "undefined" && error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new GeolocationError("permission_denied", error.message);
      case error.POSITION_UNAVAILABLE:
        return new GeolocationError("position_unavailable", error.message);
      case error.TIMEOUT:
        return new GeolocationError("timeout", error.message);
      default:
        return new GeolocationError("unknown", error.message);
    }
  }

  if (error instanceof Error) {
    return new GeolocationError("unknown", error.message);
  }

  return new GeolocationError("unknown");
}

export function getGeolocationErrorReason(error: unknown): GeolocationErrorReason {
  return normalizeGeolocationError(error).reason;
}

export async function getCurrentUserCoordinates() {
  try {
    const precisePosition = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return normalizeCoordinates(precisePosition.coords.latitude, precisePosition.coords.longitude);
  } catch (preciseError) {
    const normalizedPreciseError = normalizeGeolocationError(preciseError);
    if (normalizedPreciseError.reason === "permission_denied") {
      throw normalizedPreciseError;
    }

    try {
      const fallbackPosition = await getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 300000,
      });

      return normalizeCoordinates(fallbackPosition.coords.latitude, fallbackPosition.coords.longitude);
    } catch (fallbackError) {
      throw normalizeGeolocationError(fallbackError);
    }
  }
}
