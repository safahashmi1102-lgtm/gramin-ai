import type { HouseRecord } from "./naksha-types";

const CLUSTER_METRES = 8;

function metresToLat(m: number): number {
  return m / 111_320;
}

function metresToLng(m: number, lat: number): number {
  return m / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/** Visual-only offsets so clustered houses remain tappable; true coords stored on record. */
export function displayPositions(
  markers: HouseRecord[],
  denseMode: boolean,
): Map<string, { lat: number; lng: number }> {
  const out = new Map<string, { lat: number; lng: number }>();
  if (!denseMode) {
    for (const m of markers) out.set(m.uid, { lat: m.lat, lng: m.lng });
    return out;
  }

  const used: { lat: number; lng: number }[] = [];
  const sorted = [...markers].sort((a, b) => a.createdAt - b.createdAt);

  for (const m of sorted) {
    let lat = m.lat;
    let lng = m.lng;
    let ring = 0;
    const latStep = metresToLat(3);
    const lngStep = metresToLng(3, m.lat);

    while (
      used.some(
        (u) =>
          Math.hypot((u.lat - lat) / latStep, (u.lng - lng) / lngStep) <
          CLUSTER_METRES / 3,
      )
    ) {
      ring++;
      const angle = (ring * 137.5 * Math.PI) / 180;
      lat = m.lat + Math.sin(angle) * latStep * ring * 0.35;
      lng = m.lng + Math.cos(angle) * lngStep * ring * 0.35;
      if (ring > 12) break;
    }
    used.push({ lat, lng });
    out.set(m.uid, { lat, lng });
  }
  return out;
}
