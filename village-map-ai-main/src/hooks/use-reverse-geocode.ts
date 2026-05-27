import { useEffect, useRef, useState } from "react";

export type PlaceInfo = {
  district: string;
  city: string;
  state: string;
  displayLine: string;
};

const cache = new Map<string, PlaceInfo>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function parseNominatim(data: Record<string, unknown>): PlaceInfo {
  const addr = (data.address ?? {}) as Record<string, string>;
  const district =
    addr.state_district ??
    addr.district ??
    addr.county ??
    addr.city_district ??
    "";
  const city =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.suburb ??
    addr.hamlet ??
    addr.locality ??
    "";
  const state = addr.state ?? addr.region ?? "";
  const displayLine = [district, city, state].filter(Boolean).join(" · ") || "Locating…";
  return { district: district || "—", city: city || "—", state: state || "—", displayLine };
}

export function useReverseGeocode(lat: number | null, lng: number | null) {
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const lastFetch = useRef(0);

  useEffect(() => {
    if (lat == null || lng == null) return;

    const key = cacheKey(lat, lng);
    const cached = cache.get(key);
    if (cached) {
      setPlace(cached);
      return;
    }

    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      const now = Date.now();
      if (now - lastFetch.current < 1100) return;
      lastFetch.current = now;
      setLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/reverse");
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lon", String(lng));
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("accept-language", "en");

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { "User-Agent": "NakshaAI-Census/1.0 (field-survey)" },
        });
        if (!res.ok) throw new Error("Geocode failed");
        const data = (await res.json()) as Record<string, unknown>;
        const info = parseNominatim(data);
        cache.set(key, info);
        setPlace(info);
      } catch {
        if (!controller.signal.aborted) {
          setPlace({
            district: "—",
            city: "—",
            state: "—",
            displayLine: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
          });
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [lat, lng]);

  return { place, loading };
}
