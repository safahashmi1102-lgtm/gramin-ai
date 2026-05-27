import { useCallback, useEffect, useRef, useState } from "react";
import type { GpsPosition } from "@/lib/naksha-types";

const MIN_MOVE_METRES = 3;
const MAX_INTERVAL_MS = 3000;
const SMOOTHING = 0.12;
const MAX_JUMP_METRES = 100; // ignore fixes that jump unrealistically far
const JUMP_TIME_THRESHOLD = 5000; // ms

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function useGeolocation(enabled = true) {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const watchId = useRef<number | null>(null);
  const smooth = useRef<{ lat: number; lng: number } | null>(null);
  const lastEmit = useRef(0);
  const lastEmitted = useRef<GpsPosition | null>(null);

  const processFix = useCallback((pos: GeolocationPosition) => {
    const raw: GpsPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
      heading: pos.coords.heading != null && pos.coords.heading >= 0 ? pos.coords.heading : null,
      timestamp: pos.timestamp,
    };

    const now = Date.now();

    if (!smooth.current) {
      smooth.current = { lat: raw.lat, lng: raw.lng };
    } else {
      // basic exponential smoothing to reduce jitter
      smooth.current = {
        lat: smooth.current.lat + (raw.lat - smooth.current.lat) * SMOOTHING,
        lng: smooth.current.lng + (raw.lng - smooth.current.lng) * SMOOTHING,
      };
    }

    const candidate: GpsPosition = {
      ...raw,
      lat: smooth.current.lat,
      lng: smooth.current.lng,
    };

    const prev = lastEmitted.current;
    const elapsed = now - lastEmit.current;
    let shouldEmit = !prev || elapsed >= MAX_INTERVAL_MS;

    if (prev) {
      const moved = haversineM(prev.lat, prev.lng, candidate.lat, candidate.lng);
      // ignore tiny drift under threshold unless enough time has passed
      if (moved >= MIN_MOVE_METRES) shouldEmit = true;
      if (moved < MIN_MOVE_METRES && elapsed < MAX_INTERVAL_MS) shouldEmit = false;

      // detect unrealistic sudden jumps: if raw (unsmoothed) moved a very large distance
      const rawMoved = haversineM(prev.lat, prev.lng, raw.lat, raw.lng);
      if (
        rawMoved > MAX_JUMP_METRES &&
        raw.accuracy != null &&
        raw.accuracy > 30 &&
        now - (prev.timestamp ?? 0) < JUMP_TIME_THRESHOLD
      ) {
        // discard this noisy fix
        return;
      }
    }

    if (shouldEmit) {
      lastEmit.current = now;
      lastEmitted.current = candidate;
      setPosition(candidate);
      setWatching(true);
      setError(null);
    } else if (raw.heading != null && lastEmitted.current) {
      setPosition({ ...lastEmitted.current, heading: raw.heading, timestamp: raw.timestamp });
    }
  }, []);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      if (!navigator.geolocation) setError("Geolocation not supported");
      return;
    }

    const onError = (err: GeolocationPositionError) => {
      setError(err.message);
      setWatching(false);
    };

    navigator.geolocation.getCurrentPosition(processFix, onError, {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0,
    });

    watchId.current = navigator.geolocation.watchPosition(processFix, onError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 30000,
    });

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [enabled, processFix]);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) return;
    smooth.current = null;
    lastEmit.current = 0;
    lastEmitted.current = null;
    navigator.geolocation.getCurrentPosition(processFix, (err) => setError(err.message), {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    });
  }, [processFix]);

  const label = position
    ? `${Math.abs(position.lat).toFixed(5)}°${position.lat >= 0 ? "N" : "S"}, ${Math.abs(position.lng).toFixed(5)}°${position.lng >= 0 ? "E" : "W"}`
    : "Waiting for GPS…";

  const accuracyLabel =
    position?.accuracy != null ? `${Math.max(position.accuracy, 0).toFixed(0)}m` : "—";

  return { position, error, watching, label, accuracyLabel, refresh };
}
