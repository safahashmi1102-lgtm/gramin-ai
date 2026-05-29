import L from "leaflet";
import type { MarkerStatus } from "@/lib/naksha-types";

const statusColor: Record<MarkerStatus, string> = {
  done: "#38a169",
  pending: "#f59e0b",
  ai: "#f97316",
};

export function createHouseIcon(status: MarkerStatus, houseNumber: string, highlight = false) {
  const bg = statusColor[status];
  return L.divIcon({
    className: "naksha-house-marker",
    html: `
      <div class="naksha-pin-wrap">
        <div class="naksha-pin ${highlight ? "naksha-pin-highlight" : ""}" style="background:${bg}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <span class="naksha-pin-label">${houseNumber}</span>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
}

export function createUserLocationIcon(heading: number | null) {
  const deg = heading == null ? 0 : heading;
  return L.divIcon({
    className: "naksha-user-marker",
    html: `
      <div class="naksha-user-wrap">
        <div class="naksha-user-ring"></div>
        <div class="naksha-user-dot"></div>
        <div class="naksha-user-arrow" style="transform: rotate(${deg}deg)"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}
